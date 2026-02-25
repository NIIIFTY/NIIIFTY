import { GCS_URL } from "./constants.js";
import { gcsBucket } from "./gcs.js";
import { getIIIFManifestJson } from "./iiif.js";
import path from "path";

export default async function updateMetadataDerivatives(fileId, metadata) {
  console.log(`updating derivatives for ${fileId}`);

  // e.g. https://niiifty-bd2e2.appspot.com.storage.googleapis.com/EoLsdWm2MHekqS5eANuJ
  const id = `${GCS_URL}/${fileId}`;

  const iiifManifestJSON = getIIIFManifestJson(`${id}`, metadata);
  const iiifManifestFile = gcsBucket.file(path.join(fileId, "iiif/index.json"));

  // cache for 1 minute
  const cacheControlSeconds = 60;

  // write updated iiif manifest to bucket
  await iiifManifestFile.save(JSON.stringify(iiifManifestJSON, null, 2), {
    metadata: {
      contentType: "application/json",
      cacheControl: `public, max-age=${cacheControlSeconds}`,
    },
  });

  console.log(`finished updating derivatives for ${fileId}`);
}
