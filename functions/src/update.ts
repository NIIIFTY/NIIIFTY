import { gcsBucket } from './gcs.js';
import { getIIIFManifestJson } from './iiif.js';
import path from 'path';
import { uploadTempFilesToWeb3Storage } from './web3Storage.js';
import { createTempDir, createDir, deleteDir } from './fs.js';
import { createNameRevision, publishRevision, getProxyUrl } from './ipns/index.js';
import * as Name from 'w3name';
import fs from 'fs';

export default async function updateMetadataDerivatives(fileId, metadata) {
  console.log(`updating derivatives for ${fileId}`);

  // e.g. https://niiifty-bd2e2.appspot.com.storage.googleapis.com/EoLsdWm2MHekqS5eANuJ
  const ipnsName = metadata.ipnsName;
  const id = getProxyUrl(ipnsName);

  // 1. Download all current derivative files from GCS to a temp directory
  const tempDir = createTempDir();
  const [files] = await gcsBucket.getFiles({ prefix: `${fileId}/` });

  await Promise.all(
    files.map(async (file) => {
      if (file.name.includes('/original/')) return; // Ignore original big files if they still exist

      const relativePath = file.name.replace(`${fileId}/`, '');
      const tempFilePath = path.join(tempDir, relativePath);
      createDir(path.dirname(tempFilePath));
      await file.download({ destination: tempFilePath });
    }),
  );

  // 2. Generate new iiif manifest JSON based on updated metadata
  const iiifManifestJSON = getIIIFManifestJson(id, metadata);

  // 3. Write it to tempDir/iiif/index.json, overwriting the old one locally
  const localIndexJson = path.join(tempDir, 'iiif/index.json');
  if (fs.existsSync(localIndexJson)) {
    fs.writeFileSync(localIndexJson, JSON.stringify(iiifManifestJSON, null, 2));
  }

  // 4. Write updated iiif manifest to bucket (keep GCS in sync)
  const iiifManifestFile = gcsBucket.file(path.join(fileId, 'iiif/index.json'));
  const cacheControlSeconds = 60;
  await iiifManifestFile.save(JSON.stringify(iiifManifestJSON, null, 2), {
    metadata: {
      contentType: 'application/json',
      cacheControl: `public, max-age=${cacheControlSeconds}`,
    },
  });

  // 5. Re-Upload entire tempDir (with updated manifest) to Web3.Storage to generate a new CID
  const newCid = await uploadTempFilesToWeb3Storage(tempDir);

  // 6. Generate new IPNS Revision and Publish
  console.log(`Publishing IPNS revision to ${ipnsName} pointing to /ipfs/${newCid}`);

  const name = await Name.from(new Uint8Array(Buffer.from(metadata.ipnsKeyRaw, 'base64')));
  const previousRevision = Name.Revision.decode(new Uint8Array(Buffer.from(metadata.ipnsRevisionRaw, 'base64')));

  const revision = await createNameRevision(name, `/ipfs/${newCid}`, previousRevision);
  await publishRevision(revision, name.key);

  const newRevisionRaw = Buffer.from(Name.Revision.encode(revision)).toString('base64');

  // 7. Cleanup
  deleteDir(tempDir);

  console.log(`finished updating derivatives and IPNS for ${fileId}`);

  // Return the new properties to be saved back to firestore in onUpdate
  return {
    cid: newCid,
    ipnsRevisionRaw: newRevisionRaw,
  };
}
