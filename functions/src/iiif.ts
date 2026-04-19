import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { createDir, deleteFile } from './fs.js';
import extract from 'extract-zip';

/**
 * Helper to create a consistent iiif directory structure in temp space
 */
function createIIIFDir(filePath) {
  const tempDir = path.dirname(filePath);
  const iiifDir = path.join(tempDir, 'iiif');
  createDir(iiifDir);
  return iiifDir;
}

/**
 * Generates IIIF image tiles using Sharp.
 * The manifest and metadata are now handled dynamically by the API proxies.
 */
export async function createImageIIIFDerivatives(imageFilePath, metadata) {
  const tempDir = path.dirname(imageFilePath);
  const iiifDir = createIIIFDir(imageFilePath);
  const zipFile = path.join(iiifDir, 'iiif.zip');

  // get image metadata for width/height
  const imgMetadata = await sharp(imageFilePath).metadata();

  // The ID here is used for the @id inside info.json for the image tiles.
  // We use the baseURL passed from the coordinate logic.
  const id = metadata.manifestId || `${metadata.baseURL}/${metadata.fileId}`;

  console.log(`generating iiif image tiles for service id: ${id}`);

  const readStream = fs.createReadStream(imageFilePath);
  const writeStream = fs.createWriteStream(zipFile);

  const pipeline = sharp();

  pipeline
    .tile({
      layout: 'iiif3',
      basename: 'iiif',
      id, // This ensures the tile info.json has the correct base URL
    })
    .pipe(writeStream);

  readStream.pipe(pipeline);

  return new Promise((resolve, reject) =>
    writeStream
      .on('finish', async () => {
        console.log(`unzipping iiif image tiles`);
        await extract(zipFile, { dir: tempDir });
        deleteFile(zipFile);
        resolve(imgMetadata);
      })
      .on('error', reject),
  );
}
