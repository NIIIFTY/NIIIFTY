import resizeImage from "./resizeImage.js";
import { createImageIIIFDerivatives } from "./iiif.js";
import createThumbnails from "./thumbnails.js";
import { deleteFile } from "./fs.js";

export default async function processImage(imageFilePath, metadata) {
  // optimise image
  await resizeImage(imageFilePath, "optimized", null, null);

  await createThumbnails(imageFilePath);

  // generate IIIF manifest and image tiles
  const { width, height } = await createImageIIIFDerivatives(
    imageFilePath,
    metadata
  );

  // delete the original image as it's already on GCS and will otherwise be uploaded again
  deleteFile(imageFilePath);

  return { width, height };
}
