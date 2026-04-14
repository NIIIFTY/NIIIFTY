import sharp from 'sharp';
// import unzip from "unzip-stream";
import path from 'path';
import fs from 'fs';
import { createDir, deleteFile } from './fs.js';
import extract from 'extract-zip';

// returns iiif manifest json for a given file
export function getIIIFManifestJson(path, metadata) {
  const id = `${path}/iiif`;
  const manifestId = `${id}/index.json`;
  const canvasId = `${manifestId}/canvas/0`;
  const annotationPageId = `${manifestId}/canvas/0/annotationpage/0`;
  const annotationId = `${manifestId}/canvas/0/annotation/0`;
  const { fileId, type, label: dashboardLabel, summary, tags, metadata: customMetadata, provider, rights, attribution, width, height } = metadata;
  const manifestLabel = dashboardLabel || fileId;

  let canvas, iiifLabel, body, thumbnail;

  iiifLabel = {
    en: [manifestLabel],
  };

  thumbnail = [
    {
      id: `${path}/thumb.jpg`,
      type: 'Image',
    },
  ];

  switch (type) {
    case 'image/png':
    case 'image/jpeg':
    case 'image/tif':
    case 'image/tiff': {
      body = {
        id: `${path}/optimized.jpg`,
        type: 'Image',
        format: 'image/jpeg',
        label: iiifLabel,
        width,
        height,
        service: [
          {
            id,
            profile: 'level0',
            type: 'ImageService3',
          },
        ],
      };
      break;
    }
    case 'model/gltf-binary': {
      body = {
        id: `${path}/optimized.glb`,
        type: 'Model',
        format: 'model/gltf-binary',
        label: iiifLabel,
      };

      break;
    }
    case 'audio/mpeg': {
      body = {
        id: `${path}/optimized.mp3`,
        type: 'Audio',
        format: 'audio/mp3',
        label: iiifLabel,
      };

      break;
    }
    case 'video/mp4': {
      body = {
        id: `${path}/optimized.mp4`,
        type: 'Video',
        format: 'video/mp4',
        label: iiifLabel,
      };

      break;
    }
  }

  canvas = {
    id: canvasId,
    type: 'Canvas',
    items: [
      {
        id: annotationPageId,
        type: 'AnnotationPage',
        items: [
          {
            id: annotationId,
            type: 'Annotation',
            motivation: 'painting',
            body,
            target: canvasId,
          },
        ],
      },
    ],
    label: iiifLabel,
    thumbnail,
  };

  if (metadata.duration !== undefined) {
    canvas.duration = metadata.duration;
  }

  const manifest: any = {
    '@context': ['http://www.w3.org/ns/anno.jsonld', 'http://iiif.io/api/presentation/3/context.json'],
    id: manifestId,
    type: 'Manifest',
    items: [canvas],
    label: iiifLabel,
  };

  // summary
  if (summary) {
    manifest.summary = {
      en: [summary],
    };
  }

  // provider (IIIF v3)
  const manifestProvider = provider || 'NIIIFTY';
  manifest.provider = [
    {
      id: 'https://niiifty.com',
      type: 'Agent',
      label: { en: [manifestProvider] },
    },
  ];

  // metadata building
  const iiifMetadata = [];

  if (rights) {
    iiifMetadata.push({ label: { en: ['Rights'] }, value: { en: [rights] } });
  }

  if (tags && Array.isArray(tags)) {
    iiifMetadata.push({ label: { en: ['Tags'] }, value: { en: [tags.join(', ')] } });
  }

  // Add custom metadata from dashboard
  if (customMetadata && Array.isArray(customMetadata)) {
    customMetadata.forEach((item) => {
      if (item.label && item.value) {
        iiifMetadata.push({
          label: { en: [item.label] },
          value: { en: [item.value] },
        });
      }
    });
  }

  manifest.metadata = iiifMetadata;

  // requiredStatement
  if (attribution) {
    manifest.requiredStatement = {
      label: { en: ['Attribution'] },
      value: { en: [attribution] },
    };
  }

  // rights (stable string or URI)
  if (rights) {
    manifest.rights = rights;
  }

  return manifest;
}

export async function createIIIFManifest(dir, metadata) {
  const { fileId } = metadata;

  console.log(`creating IIIF manifest for ${fileId}`);

  const id = metadata.manifestId || `${metadata.baseURL}/${fileId}`;

  console.log(`creating iiif manifest with id "${id}"`);

  const iiifManifestJSON = getIIIFManifestJson(`${id}`, metadata);

  const jsonPath = path.join(dir, 'index.json');

  console.log('jsonPath', jsonPath);

  console.log(`writing iiif manifest to ${jsonPath}`);

  fs.writeFileSync(jsonPath, JSON.stringify(iiifManifestJSON, null, 2));

  console.log(`finished creating IIIF manifest for ${fileId}`);

  return id;
}

function createIIIFDir(filePath) {
  const tempDir = path.dirname(filePath);
  const iiifDir = path.join(tempDir, 'iiif');
  createDir(iiifDir);
  return iiifDir;
}

export async function createImageIIIFDerivatives(imageFilePath, metadata) {
  const tempDir = path.dirname(imageFilePath);
  const iiifDir = createIIIFDir(imageFilePath);
  const zipFile = path.join(iiifDir, 'iiif.zip');

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
      layout: 'iiif3',
      basename: 'iiif',
      id,
    })
    .pipe(writeStream);

  readStream.pipe(pipeline);

  return new Promise((resolve, reject) =>
    writeStream
      .on('finish', async () => {
        // unzip iiif.zip
        console.log(`unzipping iiif.zip`);
        await extract(zipFile, { dir: tempDir });

        // delete iiif.zip
        console.log(`deleting iiif.zip`);
        deleteFile(zipFile);

        resolve(imgMetadata);
      })
      .on('error', reject),
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
