"use strict";

// todo: upgrade to functions v2 when out of beta
// https://firebase.google.com/docs/functions/beta/get-started
import functions from "firebase-functions";
import path from "path";
import { gcsBucket, uploadFilesToGCS, deleteGCSFiles } from "./gcs.js";
import processImage from "./image.js";
import processGLB from "./glb.js";
import processMP4 from "./mp4.js";
import { createTempDir, deleteDir } from "./fs.js";
import { uploadTempFilesToWeb3Storage } from "./web3Storage.js";
import updateMetadataDerivatives from "./update.js";
import { GCS_URL } from "./constants.js";

// when a file is created in firestore,
// generate derivatives, and replicate to web3.storage
export const fileCreated = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 540, // max
    memory: "2GB",
  })
  .firestore.document("files/{fileId}")
  .onCreate(async (snap, context) => {
    const fileId = context.params.fileId;
    // get a reference to the uploaded original.[png, jpg, tif, tiff, mp3, mp4, glb] file
    const [files] = await gcsBucket.getFiles({ prefix: `${fileId}/original` });

    let processedProps;

    if (files.length) {
      const originalFile = files[0];

      const metadata = {
        fileId,
        baseURL: GCS_URL,
        ...snap.data(),
      };

      console.log(
        `--- started processing ${originalFile.name} (${metadata.type})---`
      );

      const tempDir = createTempDir();
      const tempFilePath = path.join(tempDir, path.basename(originalFile.name));
      await originalFile.download({ destination: tempFilePath });

      console.log(`${originalFile.name} downloaded to ${tempFilePath}`);

      switch (metadata.type) {
        case "image/png":
        case "image/jpeg":
        case "image/tif":
        case "image/tiff": {
          processedProps = await processImage(tempFilePath, metadata);
          break;
        }
        case "video/mp4": {
          processedProps = await processMP4(tempFilePath, metadata);
          break;
        }
        case "model/gltf-binary": {
          processedProps = await processGLB(tempFilePath, metadata);
          break;
        }
      }

      // upload the generated files to GCS
      await uploadFilesToGCS(tempDir, fileId);

      // upload the generated files to web3.storage
      const cid = await uploadTempFilesToWeb3Storage(tempDir);

      console.log("cid", cid);

      // delete the original file as it's no longer needed
      await originalFile.delete();

      // delete the temp directory as it's no longer needed
      deleteDir(tempDir);

      console.log(
        `--- finished processing ${originalFile.name} (${metadata.type})---`
      );

      // update associated firestore record
      return snap.ref.set(
        {
          ...processedProps,
          cid,
          processed: true,
        },
        { merge: true }
      );
    }
  });

// when a file is updated in firestore
export const fileUpdated = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .firestore.document("files/{fileId}")
  .onUpdate(async (change, context) => {
    const previousValue = change.before.data();
    const fileId = context.params.fileId;
    // Get an object representing the document
    const metadata = change.after.data();

    // console.log("previous value", previousValue);
    // console.log("new value", metadata);

    // if the file has not been processed, ignore
    if (!metadata.processed) {
      console.log("file has not been processed, skipping");
      return;
    }

    // if the processed flag has changed, ignore
    if (previousValue.processed !== metadata.processed) {
      console.log("processed flag has changed, skipping");
      return;
    }

    // the original uploaded file cannot be changed, only the metadata associated with it.
    // update any derivatives (like iiif manifests) that include the metadata
    await updateMetadataDerivatives(fileId, metadata);
  });

// when a file is deleted in firestore
export const fileDeleted = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .firestore.document("files/{fileId}")
  .onDelete(async (_snap, context) => {
    const fileId = context.params.fileId;

    // Get a list of all the files in the folder
    const [files] = await gcsBucket.getFiles({
      prefix: `${fileId}/`,
    });

    console.log(`Found ${files.length} files in ${fileId}/`);

    await deleteGCSFiles(files);

    console.log(`Finished deleting ${files.length} files in ${fileId}/`);
  });
