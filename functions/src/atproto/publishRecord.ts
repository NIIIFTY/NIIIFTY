import { BskyAgent } from '@atproto/api';

export interface IIIFRecordPayload {
  manifestId: string; // The stable IPNS URL resolving to the manifest
  title?: string;
  description?: string;
  thumbnailUrl?: string; // Optional thumbnail IPFS/HTTP URL
}

/**
 * Publishes a record to the AT Protocol representing a IIIF Manifest.
 * Currently uses the standard 'app.bsky.feed.post' for broad discoverability,
 * but can be extended to use custom standard lexicons (e.g., Matadisco) once stabilized.
 *
 * @param {BskyAgent} agent - The authenticated BskyAgent instance.
 * @param {IIIFRecordPayload} payload - The metadata for the IIIF content.
 * @returns {Promise<{ uri: string, cid: string }>} The AT URI and CID of the published record.
 */
export async function publishIIIFRecord(
  agent: BskyAgent,
  payload: IIIFRecordPayload,
): Promise<{ uri: string; cid: string }> {
  let text = `New IIIF Manifest Published: ${payload.manifestId}`;
  if (payload.title) text += `\nTitle: ${payload.title}`;
  if (payload.description) text += `\n\n${payload.description}`;

  // Use a simple post for Firehose discoverability
  // Later this can be wrapped in a custom repository record (e.g., com.matadisco...)
  const record: any = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
    facets: [
      {
        index: {
          byteStart: text.indexOf(payload.manifestId),
          byteEnd: text.indexOf(payload.manifestId) + payload.manifestId.length, // Rough byte approx for ASCII URLs
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: payload.manifestId, // Ensure it's treated as a clickable link if applicable, or just a raw string
          },
        ],
      },
    ],
  };

  const response = await agent.post(record);
  return { uri: response.uri, cid: response.cid };
}
