'use strict';

// todo: upgrade to functions v2 when out of beta
// https://firebase.google.com/docs/functions/beta/get-started
import * as functions from 'firebase-functions/v1';
import path from 'path';
import { gcsBucket, uploadFilesToGCS, deleteGCSFiles } from './gcs.js';
import processImage from './image.js';
import processGLB from './glb.js';
import processMP4 from './mp4.js';
import { createTempDir, deleteDir } from './fs.js';
import { uploadTempFilesToFilebase, deleteFilebaseFiles } from './filebase.js';
import updateMetadataDerivatives from './update.js';
import { GCS_URL } from './constants.js';
import { getProxyUrl } from './proxy.js';
import { authenticateAgent, publishIIIFRecord, deleteIIIFRecord } from './atproto/index.js';
import { triggerRevalidation } from './revalidate.js';
import { generateFileSummary } from './ai.js';
// Removed createIIIFManifest as it is now dynamic

export * as appview from './api/appview.js';

// when a file is created in firestore,
// generate derivatives, and replicate to filebase
async function processAsset(fileId: string, metadata: any, docRef: FirebaseFirestore.DocumentReference) {
  // get a reference to the uploaded original.[png, jpg, tif, tiff, mp3, mp4, glb] file
  const [files] = await gcsBucket.getFiles({ prefix: `${fileId}/original` });

  if (files.length) {
    const originalFile = files[0];

    console.log(`--- started processing ${originalFile.name} (${metadata.type})---`);

    // Use the local GCS proxy for the cloud bucket manifest
    metadata.manifestId = getProxyUrl(fileId, '', 'gcs');

    const tempDir = createTempDir();
    const tempFilePath = path.join(tempDir, path.basename(originalFile.name));
    await originalFile.download({ destination: tempFilePath });

    console.log(`${originalFile.name} downloaded to ${tempFilePath}`);

    let processedProps: any = {};

    // NIIIFTY AI: Automatically generate an enriched summary if none exists
    if (!metadata.summary) {
      const aiResult = await generateFileSummary(tempFilePath, metadata.type);
      if (aiResult) {
        processedProps.summary = aiResult.summary;
        // Merge AI-generated metadata, filtering out "unknown"
        const mergedMetadata = {
          ...(metadata.metadata || {}),
          ...aiResult.metadata
        };
        processedProps.metadata = Object.fromEntries(
          Object.entries(mergedMetadata).filter(([_, v]) => v && String(v).toLowerCase() !== 'unknown')
        );

        // Merge AI-generated tags, filtering out "unknown"
        processedProps.tags = Array.from(new Set([
          ...(metadata.tags || []),
          ...(aiResult.tags || [])
        ])).filter(t => t && String(t).toLowerCase() !== 'unknown');
        // Also flag it so the UI can show it was AI-generated
        processedProps.aiGenerated = true;
      }
    }

    switch (metadata.type) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/tif':
      case 'image/tiff': {
        const imageProps = await processImage(tempFilePath, metadata);
        processedProps = { ...processedProps, ...imageProps };
        break;
      }
      case 'video/mp4': {
        const videoProps = await processMP4(tempFilePath, metadata);
        processedProps = { ...processedProps, ...videoProps };
        break;
      }
      case 'model/gltf-binary': {
        const modelProps = await processGLB(tempFilePath, metadata);
        processedProps = { ...processedProps, ...modelProps };
        break;
      }
    }

    // upload the generated files to GCS
    await uploadFilesToGCS(tempDir, fileId);

    // upload the generated files to filebase
    // Note: We no longer generate a static manifest here. 
    // The proxies will generate it on-the-fly using the CID returned below.
    const cid = await uploadTempFilesToFilebase(tempDir, fileId);
    console.log(`Successfully uploaded IIIF manifest to IPFS with CID: ${cid}`);

    // delete the original file as it's no longer needed
    await originalFile.delete();

    // delete the temp directory as it's no longer needed
    deleteDir(tempDir);

    console.log(`--- finished processing ${originalFile.name} (${metadata.type})---`);

    // update associated firestore record
    await docRef.set(
      {
        ...processedProps,
        cid,
        processed: true,
      },
      { merge: true },
    );
  } else {
    console.error(`No original file found in GCS for ${fileId}/original!`);
  }
}

export const fileCreated = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540, // max
    memory: '2GB',
    secrets: [
      'ATPROTO_SERVICE',
      'ATPROTO_IDENTIFIER',
      'ATPROTO_PASSWORD',
      'FILEBASE_ACCESS_TOKEN',
      'FILEBASE_SECRET_KEY',
      'NIIIFTY_REVALIDATE_SECRET'
    ],
  })
  .firestore.document('files/{fileId}')
  .onCreate(async (snap, context) => {
    const fileId = context.params.fileId;
    const metadata: any = {
      fileId,
      baseURL: GCS_URL,
      ...snap.data(),
    };

    if (metadata.status === 'uploading') {
      console.log('File is still uploading to GCS, delaying processing until status is complete');
      return null;
    }

    await processAsset(fileId, metadata, snap.ref);
    return null;
  });

// when a file is updated in firestore
export const fileUpdated = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
    secrets: [
      'ATPROTO_SERVICE',
      'ATPROTO_IDENTIFIER',
      'ATPROTO_PASSWORD',
      'FILEBASE_ACCESS_TOKEN',
      'FILEBASE_SECRET_KEY',
      'NIIIFTY_REVALIDATE_SECRET'
    ],
  })
  .firestore.document('files/{fileId}')
  .onUpdate(async (change, context) => {
    const previousValue = change.before.data();
    const fileId = context.params.fileId;
    // Get an object representing the document
    const metadata: any = {
      fileId,
      baseURL: GCS_URL,
      ...change.after.data(),
    };

    // if the file just finished uploading to GCS, process it!
    if (previousValue.status === 'uploading' && metadata.status === 'complete') {
      console.log('File upload to GCS complete, starting processing...');
      await processAsset(fileId, metadata, change.after.ref);
      return null;
    }

    // if the file has not been processed, ignore
    if (!metadata.processed) {
      console.log('file has not been processed, skipping');
      return null;
    }

    // if the processed flag has changed, ignore
    if (previousValue.processed !== metadata.processed) {
      console.log('processed flag has changed, skipping');
      return null;
    }

    // if the only things that changed were backend properties (like cid), ignore to prevent infinite loops
    // UNLESS a manual AT Protocol publish was requested
    if (
      !metadata.broadcasting &&
      previousValue.label === metadata.label &&
      previousValue.summary === metadata.summary &&
      previousValue.rights === metadata.rights &&
      previousValue.provider === metadata.provider &&
      JSON.stringify(previousValue.tags) === JSON.stringify(metadata.tags) &&
      JSON.stringify(previousValue.metadata) === JSON.stringify(metadata.metadata)
    ) {
      console.log('metadata unchanged, skipping to prevent infinite loops');
      return null;
    }

    // update any derivatives (like iiif manifests) that include the metadata
    const updatedProps: any = (await updateMetadataDerivatives(fileId, metadata)) || {};

    // Dynamic Manifest Architecture: Trigger cache revalidation in the proxies
    await triggerRevalidation('ipfs'); // Purge all IPFS manifests (can be refined to specific CID)
    await triggerRevalidation('gcs');  // Purge all GCS manifests
    if (metadata.cid) await triggerRevalidation(metadata.cid);
    await triggerRevalidation(fileId);

    // NIIIFTY 3: Manual Broadcast to ATProtocol
    if (metadata.broadcasting && metadata.cid) {
      if (process.env.FUNCTIONS_EMULATOR === 'true') {
        console.log(`[EMULATOR] Bypassing AT Protocol network. Mocking successful broadcast for ${fileId}...`);
        updatedProps.atDid = `did:plc:local-emulator-mock-${Date.now()}`;
        updatedProps.broadcasting = false;
      } else if (
        process.env.ATPROTO_SERVICE &&
        process.env.ATPROTO_IDENTIFIER &&
        process.env.ATPROTO_PASSWORD
      ) {
        try {
          const agent = await authenticateAgent(
            process.env.ATPROTO_SERVICE,
            process.env.ATPROTO_IDENTIFIER,
            process.env.ATPROTO_PASSWORD,
          );
          
          // Use deterministic pinning URL for the AT Protocol resource
          const pinnedUrl = getProxyUrl(metadata.cid, 'iiif/index.json');

          await publishIIIFRecord(agent, fileId, {
            id: pinnedUrl,
            thumbnail: getProxyUrl(metadata.cid, 'thumb.jpg'),
            cid: metadata.cid,
            label: metadata.label,
            summary: metadata.summary,
            provider: metadata.provider,
            rights: metadata.rights,
            tags: metadata.tags,
            metadata: metadata.metadata,
          });

          updatedProps.atDid = agent.session.did;
          updatedProps.broadcasting = false;
          
          console.log(`Successfully manual-broadcasted ${fileId} to AT Protocol`);
        } catch (e) {
          console.error(`Failed to manual-broadcast to AT Protocol:`, e);
          // Reset the flag even on failure to prevent infinite loops, or handle error state
          updatedProps.broadcasting = false;
        }
      }
    }

    if (Object.keys(updatedProps).length > 0) {
      return change.after.ref.set(updatedProps, { merge: true });
    }

    return null;
  });

// when a file is deleted in firestore
export const fileDeleted = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
    secrets: [
      'ATPROTO_SERVICE',
      'ATPROTO_IDENTIFIER',
      'ATPROTO_PASSWORD',
      'FILEBASE_ACCESS_TOKEN',
      'FILEBASE_SECRET_KEY',
    ],
  })
  .firestore.document('files/{fileId}')
  .onDelete(async (snap, context) => {
    const fileId = context.params.fileId;
    const metadata = snap.data();

    if (metadata.atDid) {
      try {
        console.log(`Attempting to delete AT Protocol record for ${fileId}...`);
        if (process.env.ATPROTO_SERVICE && process.env.ATPROTO_IDENTIFIER && process.env.ATPROTO_PASSWORD) {
          const agent = await authenticateAgent(
            process.env.ATPROTO_SERVICE,
            process.env.ATPROTO_IDENTIFIER,
            process.env.ATPROTO_PASSWORD,
          );
          await deleteIIIFRecord(agent, fileId, metadata.atDid);
          console.log(`Successfully deleted AT Protocol record for ${fileId}`);
        } else {
          console.error('AT Protocol secrets missing. Cannot delete record.');
        }
      } catch (e) {
        console.error(`Failed to delete AT Protocol record for ${fileId}:`, e);
      }
    }

    if (metadata.cid) {
      try {
        console.log(`Attempting to delete Filebase record for ${fileId}...`);
        await deleteFilebaseFiles(fileId);
      } catch (e) {
        console.error(`Failed to delete Filebase record for ${fileId}:`, e);
      }
    }

    // Get a list of all the files in the folder
    const [files] = await gcsBucket.getFiles({
      prefix: `${fileId}/`,
    });

    console.log(`Found ${files.length} files in ${fileId}/`);

    await deleteGCSFiles(files);

    console.log(`Finished deleting ${files.length} files in ${fileId}/`);
    return null;
  });

