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
import { uploadTempFilesToWeb3Storage } from './web3Storage.js';
import updateMetadataDerivatives from './update.js';
import { GCS_URL } from './constants.js';
import { generateName, createNameRevision, publishRevision, getProxyUrl } from './ipns/index.js';
import { authenticateAgent, publishIIIFRecord } from './atproto/index.js';
import * as Name from 'w3name';

// when a file is created in firestore,
// generate derivatives, and replicate to web3.storage
export const fileCreated = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540, // max
    memory: '2GB',
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

      // NIIIFTY 2: generate stable IPNS identifier for this new project
      const name = await generateName();
      const ipnsName = name.toString();
      const ipnsKeyRaw = Buffer.from(name.key.raw).toString('base64');

      // Instruct the IIIF generator to use the stable IPNS path via the Next.js proxy
      metadata.manifestId = getProxyUrl(ipnsName);

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

      // upload the generated files to web3.storage
      const cid = await uploadTempFilesToWeb3Storage(tempDir);

      // NIIIFTY 2: publish the initial IPNS revision pointing to the new Storacha/Web3Storage CID
      console.log(`Publishing initial IPNS revision to ${ipnsName} pointing to /ipfs/${cid}`);
      const revision = await createNameRevision(name, `/ipfs/${cid}`);
      await publishRevision(revision, name.key);
      const ipnsRevisionRaw = Buffer.from(Name.Revision.encode(revision)).toString('base64');

      // NIIIFTY 2: Broadcast the newly minted project to ATProtocol (if env variables configure the agent)
      if (process.env.ATPROTO_SERVICE && process.env.ATPROTO_IDENTIFIER && process.env.ATPROTO_PASSWORD) {
        try {
          const agent = await authenticateAgent(
            process.env.ATPROTO_SERVICE,
            process.env.ATPROTO_IDENTIFIER,
            process.env.ATPROTO_PASSWORD,
          );
          await publishIIIFRecord(agent, {
            id: getProxyUrl(ipnsName, 'index.json'),
            thumbnail: getProxyUrl(ipnsName, 'thumb.jpg'),
            cid: cid,
            label: metadata.label,
            summary: metadata.summary,
            provider: metadata.provider,
            rights: metadata.rights,
            tags: metadata.tags,
            metadata: metadata.metadata,
          });
          console.log(`Successfully broadcasted ${ipnsName} to AT Protocol`);
        } catch (e) {
          console.error(`Failed to broadcast to AT Protocol:`, e);
        }
      }

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
          ipnsName,
          ipnsKeyRaw,
          ipnsRevisionRaw,
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
    if (
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

    // the original uploaded file cannot be changed, only the metadata associated with it.
    // update any derivatives (like iiif manifests) that include the metadata
    const updatedProps = await updateMetadataDerivatives(fileId, metadata);

    // NIIIFTY 2: Broadcast the updated project to ATProtocol
    if (
      metadata.ipnsName &&
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
        await publishIIIFRecord(agent, {
          id: getProxyUrl(metadata.ipnsName, 'index.json'),
          thumbnail: getProxyUrl(metadata.ipnsName, 'thumb.jpg'),
          cid: metadata.cid,
          label: metadata.label,
          summary: metadata.summary,
          provider: metadata.provider,
          rights: metadata.rights,
          tags: metadata.tags,
          metadata: metadata.metadata,
        });
        console.log(`Successfully broadcasted update for ${metadata.ipnsName} to AT Protocol`);
      } catch (e) {
        console.error(`Failed to broadcast update to AT Protocol:`, e);
      }
    }

    if (updatedProps) {
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
