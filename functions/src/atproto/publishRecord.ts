import { AtpAgent } from '@atproto/api';

export interface IIIFRecordPayload {
  manifestUrl: string; // The stable IPNS URL resolving to the manifest (mapped to resource)
  thumbnailUrl?: string; // Optional thumbnail IPFS/HTTP URL (mapped to preview.url)
}

/**
 * Publishes a record to the AT Protocol representing a IIIF Manifest.
 * Utilizes the Matadisco lexicon for semantic publishing.
 *
 * @param {AtpAgent} agent - The authenticated AtpAgent instance.
 * @param {IIIFRecordPayload} payload - The metadata for the IIIF content.
 * @returns {Promise<{ uri: string, cid: string }>} The AT URI and CID of the published record.
 */
export async function publishIIIFRecord(
  agent: AtpAgent,
  payload: IIIFRecordPayload,
): Promise<{ uri: string; cid: string }> {
  if (!agent.session?.did) {
    throw new Error('AT Protocol Agent lacks an active session DID. Authentication failed.');
  }

  const recordPayload: Record<string, any> = {
    $type: 'cx.vmx.matadisco',
    resource: payload.manifestUrl,
    created: new Date().toISOString(),
  };

  if (payload.thumbnailUrl) {
    recordPayload.preview = {
      url: payload.thumbnailUrl,
      // If we are hardcoding to jpeg, we could use that, but 'image/jpeg'
      // or 'image/png' depend on the thumbnail. Hardcoding 'image/jpeg' as placeholder
      // until we implement actual mimeType extraction or passing it in.
      mimeType: 'image/jpeg',
    };
  }

  const response = await agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'cx.vmx.matadisco',
    record: recordPayload,
  });

  return { uri: response.data.uri, cid: response.data.cid };
}
