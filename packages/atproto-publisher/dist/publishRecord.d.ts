import { AtpAgent } from '@atproto/api';
export interface IIIFRecordPayload {
    id: string;
    thumbnail?: string;
    provider?: string;
    rights?: string;
    label?: string;
    summary?: string;
    type?: string;
    tags?: string[];
    metadata?: Record<string, string>;
    cid?: string;
}
/**
 * Publishes a record to the AT Protocol representing a IIIF Manifest.
 * Utilizes the Matadisco lexicon for semantic publishing.
 *
 * @param {AtpAgent} agent - The authenticated AtpAgent instance.
 * @param {string} rkey - The deterministic record key (e.g., the fileId).
 * @param {IIIFRecordPayload} payload - The metadata for the IIIF content.
 * @returns {Promise<{ uri: string, cid: string }>} The AT URI and CID of the published record.
 */
export declare function publishIIIFRecord(agent: AtpAgent, rkey: string, payload: IIIFRecordPayload): Promise<{
    uri: string;
    cid: string;
}>;
/**
 * Deletes a record from the AT Protocol representing a IIIF Manifest.
 *
 * @param {AtpAgent} agent - The authenticated AtpAgent instance.
 * @param {string} rkey - The deterministic record key (e.g., the fileId).
 * @param {string} repo - The DID of the repository (defaults to agent's session DID).
 * @returns {Promise<void>}
 */
export declare function deleteIIIFRecord(agent: AtpAgent, rkey: string, repo?: string): Promise<void>;
