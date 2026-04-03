import { AtpAgent } from '@atproto/api';

export interface IIIFRecordPayload {
  id: string; // The stable IPNS URL resolving to the manifest (aligns with IIIF 'id', maps to Matadisco 'resource')
  thumbnail?: string; // Optional thumbnail IPFS/HTTP URL (aligns with IIIF 'thumbnail', maps to Matadisco 'preview.url')
  provider?: string; // The publishing institution/provider (aligns with IIIF 'provider')
  rights?: string; // The license or rights URI (aligns with IIIF 'rights', e.g., 'https://creativecommons.org/licenses/by/4.0/')
  label?: string; // The title or name of the resource
  summary?: string; // A short descriptive text (crucial for Vertex AI embeddings)
  type?: string; // The IIIF resource type (e.g., 'Manifest', 'Collection')
  tags?: string[]; // Custom tags/subjects for indexing
  metadata?: Record<string, string>; // Flattened IIIF key-value pairs for precise AppView filtering
  cid?: string; // Optional immutable CID for IPFS verifiability
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
    resource: payload.id,
    cid: payload.cid || '', // Promote CID to root for global verifiability
    created: new Date().toISOString(),
  };

  // Ensure 'iiif' is always present in our tags for core network filtering
  recordPayload.tags = Array.from(new Set(['iiif', ...(payload.tags || [])]));

  // Append our custom IIIF schema extension
  const iiifExtension: Record<string, any> = {
    $type: 'io.iiif.metadata',
  };
  if (payload.provider) iiifExtension.provider = payload.provider;
  if (payload.rights) iiifExtension.rights = payload.rights;
  if (payload.label) iiifExtension.label = payload.label;
  if (payload.summary) iiifExtension.summary = payload.summary;
  if (payload.type) iiifExtension.type = payload.type;
  if (payload.metadata) iiifExtension.metadata = payload.metadata;
  
  // Attach it to the payload root
  recordPayload.iiif = iiifExtension;

  if (payload.thumbnail) {
    recordPayload.preview = {
      url: payload.thumbnail,
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
