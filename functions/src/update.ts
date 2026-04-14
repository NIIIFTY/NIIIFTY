import { gcsBucket } from './gcs.js';
import { getIIIFManifestJson } from './iiif.js';
import path from 'path';
import { uploadTempFilesToFilebase } from './filebase.js';
import { createTempDir, createDir, deleteDir } from './fs.js';
import { getProxyUrl } from './ipns/index.js';
import fs from 'fs';

export default async function updateMetadataDerivatives(fileId, metadata) {
  console.log(`updating derivatives for ${fileId}`);

  // Use the __CID__ placeholder for manifest links; the IPFS proxy will rewrite this to the actual CID.
  const id = getProxyUrl('__CID__', '', 'ipfs');

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

  // 5. Re-Upload entire tempDir (with updated manifest) to Storacha to generate a new CID
  const newCid = await uploadTempFilesToFilebase(tempDir);

  // 6. CID-based manifests don't require IPNS publishing. 
  // The manifestId in Firestore already points to the pinning proxy.
  console.log(`Updated exhibit pointing to /ipfs/${newCid}`);

  // 7. Cleanup
  deleteDir(tempDir);

  console.log(`finished updating derivatives and IPNS for ${fileId}`);

  // Return the new properties to be saved back to firestore in onUpdate
  return {
    cid: newCid,
  };
}
