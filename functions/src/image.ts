import resizeImage from './resizeImage.js';
import { createImageIIIFDerivatives } from './iiif.js';
import createThumbnails from './thumbnails.js';
import path from 'path';

export default async function processImage(imageFilePath, metadata) {
  // optimise image
  await resizeImage(imageFilePath, 'optimized', null, null);

  await createThumbnails(imageFilePath);

  // generate IIIF manifest and image tiles
  const { width, height } = (await createImageIIIFDerivatives(imageFilePath, metadata)) as any;

  // We do not delete the original image here anymore; processAsset handles cleanup after AI.

  const optimizedPath = path.join(path.dirname(imageFilePath), 'optimized.jpg');

  return { 
    width, 
    height,
    aiInput: { path: optimizedPath, mimeType: 'image/jpeg' }
  };
}
