import { NiiiftyFile } from '@/types/file';

/**
 * Generates a IIIF Presentation v3 Manifest for a given NIIIFTY asset.
 * 
 * @param basePath The base URL for the manifest (e.g., http://.../api/ipfs/CID)
 * @param metadata The NiiiftyFile object containing asset metadata
 * @returns A IIIF Manifest object
 */
export function generateIIIFManifest(basePath: string, metadata: NiiiftyFile) {
  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  
  // Canonical IDs
  const manifestId = `${cleanBase}/iiif/index.json`;
  const canvasId = `${manifestId}/canvas/0`;
  const annotationPageId = `${manifestId}/canvas/0/annotationpage/0`;
  const annotationId = `${manifestId}/canvas/0/annotation/0`;
  
  // Labels
  const manifestLabel = metadata.dashboardLabel || metadata.label || metadata.fileId;
  const iiifLabel = {
    en: [manifestLabel],
  };

  const { type, width, height, duration, summary, provider, rights, attribution, tags, metadata: customMetadata } = metadata;

  let body: any;
  const serviceId = `${cleanBase}/iiif`;

  switch (type) {
    case 'image/png':
    case 'image/jpeg':
    case 'image/tif':
    case 'image/tiff': {
      body = {
        id: `${cleanBase}/optimized.jpg`,
        type: 'Image',
        format: 'image/jpeg',
        label: iiifLabel,
        width,
        height,
        service: [
          {
            id: serviceId,
            profile: 'level0',
            type: 'ImageService3',
          },
        ],
      };
      break;
    }
    case 'model/gltf-binary': {
      body = {
        id: `${cleanBase}/optimized.glb`,
        type: 'Model',
        format: 'model/gltf-binary',
        label: iiifLabel,
      };
      break;
    }
    case 'audio/mpeg': {
      body = {
        id: `${cleanBase}/optimized.mp3`,
        type: 'Audio',
        format: 'audio/mp3',
        label: iiifLabel,
      };
      break;
    }
    case 'video/mp4': {
      body = {
        id: `${cleanBase}/optimized.mp4`,
        type: 'Video',
        format: 'video/mp4',
        label: iiifLabel,
      };
      break;
    }
    default: {
      // Fallback for unknown types (Generic file)
      body = {
        id: `${cleanBase}/original`,
        type: 'Dataset',
        label: iiifLabel,
      };
    }
  }

  const canvas: any = {
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
    thumbnail: [
      {
        id: `${cleanBase}/thumb.jpg`,
        type: 'Image',
      },
    ],
  };

  if (width) canvas.width = width;
  if (height) canvas.height = height;
  if (duration !== undefined) canvas.duration = duration;

  const manifest: any = {
    '@context': [
      'http://www.w3.org/ns/anno.jsonld',
      'http://iiif.io/api/presentation/3/context.json',
    ],
    id: manifestId,
    type: 'Manifest',
    items: [canvas],
    label: iiifLabel,
  };

  // Summary
  if (summary) {
    manifest.summary = {
      en: [summary],
    };
  }

  // Provider
  const manifestProvider = provider || 'NIIIFTY';
  manifest.provider = [
    {
      id: 'https://niiifty.com',
      type: 'Agent',
      label: { en: [manifestProvider] },
    },
  ];

  // Metadata building
  const iiifMetadata: any[] = [];

  if (rights) {
    iiifMetadata.push({ label: { en: ['Rights'] }, value: { en: [rights] } });
  }

  if (tags && Array.isArray(tags)) {
    iiifMetadata.push({ label: { en: ['Tags'] }, value: { en: [tags.join(', ')] } });
  }

  // Add custom metadata
  if (customMetadata) {
    if (Array.isArray(customMetadata)) {
      // Handle legacy array format [{label, value}]
      customMetadata.forEach((item) => {
        if (item.label && item.value) {
          iiifMetadata.push({
            label: { en: [item.label] },
            value: { en: [item.value] },
          });
        }
      });
    } else if (typeof customMetadata === 'object') {
      // Handle current dictionary format {key: value}
      Object.entries(customMetadata).forEach(([key, value]) => {
        if (key && value) {
          iiifMetadata.push({
            label: { en: [key] },
            value: { en: [String(value)] },
          });
        }
      });
    }
  }

  if (iiifMetadata.length > 0) {
    manifest.metadata = iiifMetadata;
  }

  // Attribution
  if (attribution) {
    manifest.requiredStatement = {
      label: { en: ['Attribution'] },
      value: { en: [attribution] },
    };
  }

  // Rights
  if (rights) {
    manifest.rights = rights;
  }

  return manifest;
}
