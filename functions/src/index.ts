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
import { uploadTempFilesToFilebase } from './filebase.js';
import updateMetadataDerivatives from './update.js';
import { GCS_URL } from './constants.js';
import { getProxyUrl } from './proxy.js';
import { authenticateAgent, publishIIIFRecord } from './atproto/index.js';
import { triggerRevalidation } from './revalidate.js';
// Removed createIIIFManifest as it is now dynamic


// when a file is created in firestore,
// generate derivatives, and replicate to filebase
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
    // get a reference to the uploaded original.[png, jpg, tif, tiff, mp3, mp4, glb] file
    const [files] = await gcsBucket.getFiles({ prefix: `${fileId}/original` });

    let processedProps;

    if (files.length) {
      const originalFile = files[0];

      const metadata: any = {
        fileId,
        baseURL: GCS_URL,
        ...snap.data(),
      };

      console.log(`--- started processing ${originalFile.name} (${metadata.type})---`);

      // Use the local GCS proxy for the cloud bucket manifest
      metadata.manifestId = getProxyUrl(fileId, '', 'gcs');

      const tempDir = createTempDir();
      const tempFilePath = path.join(tempDir, path.basename(originalFile.name));
      await originalFile.download({ destination: tempFilePath });

      console.log(`${originalFile.name} downloaded to ${tempFilePath}`);

      switch (metadata.type) {
        case 'image/png':
        case 'image/jpeg':
        case 'image/tif':
        case 'image/tiff': {
          processedProps = await processImage(tempFilePath, metadata);
          break;
        }
        case 'video/mp4': {
          processedProps = await processMP4(tempFilePath, metadata);
          break;
        }
        case 'model/gltf-binary': {
          processedProps = await processGLB(tempFilePath, metadata);
          break;
        }
      }

      // upload the generated files to GCS
      await uploadFilesToGCS(tempDir, fileId);

      // upload the generated files to filebase
      // Note: We no longer generate a static manifest here. 
      // The proxies will generate it on-the-fly using the CID returned below.
      const cid = await uploadTempFilesToFilebase(tempDir);
      console.log(`Successfully uploaded IIIF manifest to IPFS with CID: ${cid}`);

      // delete the original file as it's no longer needed
      await originalFile.delete();

      // delete the temp directory as it's no longer needed
      deleteDir(tempDir);

      console.log(`--- finished processing ${originalFile.name} (${metadata.type})---`);

      // update associated firestore record
      await snap.ref.set(
        {
          ...processedProps,
          cid,
          processed: true,
        },
        { merge: true },
      );
      return null;
    }
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
    const metadata = change.after.data();

    // console.log("previous value", previousValue);
    // console.log("new value", metadata);

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
      !metadata.atprotoPublishRequested &&
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
    if (
      metadata.atprotoPublishRequested &&
      metadata.cid &&
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
        updatedProps.atprotoPublishRequested = false;
        
        console.log(`Successfully manual-broadcasted ${fileId} to AT Protocol`);
      } catch (e) {
        console.error(`Failed to manual-broadcast to AT Protocol:`, e);
        // Reset the flag even on failure to prevent infinite loops, or handle error state
        updatedProps.atprotoPublishRequested = false;
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
  })
  .firestore.document('files/{fileId}')
  .onDelete(async (_snap, context) => {
    const fileId = context.params.fileId;

    // Get a list of all the files in the folder
    const [files] = await gcsBucket.getFiles({
      prefix: `${fileId}/`,
    });

    console.log(`Found ${files.length} files in ${fileId}/`);

    await deleteGCSFiles(files);

    console.log(`Finished deleting ${files.length} files in ${fileId}/`);
    return null;
  });

