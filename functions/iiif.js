import sharp from "sharp";
// import unzip from "unzip-stream";
import path from "path";
import fs from "fs";
import { createDir, deleteFile } from "./fs.js";
import extract from "extract-zip";

// returns iiif manifest json for a given file
export function getIIIFManifestJson(path, metadata) {
  const id = `${path}/iiif`;
  const manifestId = `${id}/index.json`;
  const canvasId = `${manifestId}/canvas/0`;
  const annotationPageId = `${manifestId}/canvas/0/annotationpage/0`;
  const annotationId = `${manifestId}/canvas/0/annotation/0`;
  const { type, title, license, width, height } = metadata;

  let canvas, label, body, thumbnail;

  label = {
    "@none": [title],
  };

  thumbnail = [
    {
      id: `${path}/thumb.jpg`,
      type: "Image",
    },
  ];

  switch (type) {
    case "image/png":
    case "image/jpeg":
    case "image/tif":
    case "image/tiff": {
      body = {
        id: `${path}/optimized.jpg`,
        type: "Image",
        format: "image/jpeg",
        label,
        width,
        height,
        service: [
          {
            id,
            profile: "level0",
            type: "ImageService3",
          },
        ],
      };
      break;
    }
    case "model/gltf-binary": {
      body = {
        id: `${path}/optimized.glb`,
        type: "Model",
        format: "model/gltf-binary",
        label,
      };

      break;
    }
    case "audio/mpeg": {
      body = {
        id: `${path}/optimized.mp3`,
        type: "Audio",
        format: "audio/mp3",
        label,
      };

      break;
    }
    case "video/mp4": {
      body = {
        id: `${path}/optimized.mp4`,
        type: "Video",
        format: "video/mp4",
        label,
      };

      break;
    }
  }

  canvas = {
    id: canvasId,
    type: "Canvas",
    items: [
      {
        id: annotationPageId,
        type: "AnnotationPage",
        items: [
          {
            id: annotationId,
            type: "Annotation",
            motivation: "painting",
            body,
            target: canvasId,
          },
        ],
      },
    ],
    label,
    thumbnail,
  };

  if (metadata.duration !== undefined) {
    canvas.duration = metadata.duration;
  }

  const manifest = {
    "@context": [
      "http://www.w3.org/ns/anno.jsonld",
      "http://iiif.io/api/presentation/3/context.json",
    ],
    id: manifestId,
    type: "Manifest",
    items: [canvas],
    label,
  };

  // metadata
  const kvp = [
    ...(metadata.title ? [["Title", title]] : []),
    ...(metadata.license ? [["License", license]] : []),
  ];

  manifest.metadata = kvp.map((x) => {
    return {
      label: {
        "@none": [x[0]],
      },
      value: {
        "@none": [x[1]],
      },
    };
  });

  // requiredStatement
  if (metadata.attribution) {
    manifest.requiredStatement = {
      label: { en: ["Attribution"] },
      value: { en: [metadata.attribution] },
    };
  }

  // rights
  manifest.rights = license;

  return manifest;
}

export async function createIIIFManifest(dir, metadata) {
  const { fileId } = metadata;

  console.log(`creating IIIF manifest for ${fileId}`);

  const id = `${metadata.baseURL}/${fileId}`;

  console.log(`creating iiif manifest with id "${id}"`);

  const iiifManifestJSON = getIIIFManifestJson(`${id}`, metadata);

  const jsonPath = path.join(dir, "index.json");

  console.log("jsonPath", jsonPath);

  console.log(`writing iiif manifest to ${jsonPath}`);

  fs.writeFileSync(jsonPath, JSON.stringify(iiifManifestJSON, null, 2));

  console.log(`finished creating IIIF manifest for ${fileId}`);

  return id;
}

function createIIIFDir(filePath) {
  const tempDir = path.dirname(filePath);
  const iiifDir = path.join(tempDir, "iiif");
  createDir(iiifDir);
  return iiifDir;
}

export async function createImageIIIFDerivatives(imageFilePath, metadata) {
  const tempDir = path.dirname(imageFilePath);
  const iiifDir = createIIIFDir(imageFilePath);
  const zipFile = path.join(iiifDir, "iiif.zip");

  // get image height and width
  const imgMetadata = await sharp(imageFilePath).metadata();
  // console.log("imgMetadata", imgMetadata);

  const id = await createIIIFManifest(iiifDir, {
    ...metadata,
    ...imgMetadata,
  });

  // generate iiif image tiles
  console.log(`generating iiif image tiles`);

  const readStream = fs.createReadStream(imageFilePath);
  const writeStream = fs.createWriteStream(zipFile);

  // Create Sharp pipeline for tiling the image
  const pipeline = sharp();

  pipeline
    .tile({
      layout: "iiif3",
      basename: "iiif",
      id,
    })
    .pipe(writeStream);

  readStream.pipe(pipeline);

  return new Promise((resolve, reject) =>
    writeStream
      .on("finish", async () => {
        // unzip iiif.zip
        console.log(`unzipping iiif.zip`);
        await extract(zipFile, { dir: tempDir });

        // delete iiif.zip
        console.log(`deleting iiif.zip`);
        deleteFile(zipFile);

        resolve(imgMetadata);
      })
      .on("error", reject)
  );
}

// creates iiif manifest for a given glb
export async function createGLBIIIFDerivatives(glbFilePath, metadata) {
  const iiifDir = createIIIFDir(glbFilePath);
  await createIIIFManifest(iiifDir, metadata);
}

// creates iiif manifest for a given mp4
export async function createMP4IIIFDerivatives(mp4FilePath, metadata) {
  const iiifDir = createIIIFDir(mp4FilePath);
  await createIIIFManifest(iiifDir, metadata);
}
