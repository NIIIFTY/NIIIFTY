/**
 * Publishes a record to the AT Protocol representing a IIIF Manifest.
 * Utilizes the Matadisco lexicon for semantic publishing.
 *
 * @param {AtpAgent} agent - The authenticated AtpAgent instance.
 * @param {string} rkey - The deterministic record key (e.g., the fileId).
 * @param {IIIFRecordPayload} payload - The metadata for the IIIF content.
 * @returns {Promise<{ uri: string, cid: string }>} The AT URI and CID of the published record.
 */
export async function publishIIIFRecord(agent, rkey, payload) {
    if (!agent.session?.did) {
        throw new Error('AT Protocol Agent lacks an active session DID. Authentication failed.');
    }
    const recordPayload = {
        $type: 'cx.vmx.matadisco',
        resource: payload.id,
        cid: payload.cid || '', // Promote CID to root for global verifiability
        publishedAt: new Date().toISOString(),
    };
    // Ensure 'iiif' is always present in our tags for core network filtering
    recordPayload.tags = Array.from(new Set(['iiif', ...(payload.tags || [])]));
    // Append our custom IIIF schema extension
    const iiifExtension = {
        $type: 'io.iiif.metadata',
    };
    if (payload.provider)
        iiifExtension.provider = payload.provider;
    if (payload.rights)
        iiifExtension.rights = payload.rights;
    if (payload.label)
        iiifExtension.label = payload.label;
    if (payload.summary)
        iiifExtension.summary = payload.summary;
    if (payload.type)
        iiifExtension.type = payload.type;
    if (payload.metadata)
        iiifExtension.metadata = payload.metadata;
    // Attach it to the payload root
    recordPayload.iiif = iiifExtension;
    if (payload.thumbnail) {
        recordPayload.preview = {
            url: payload.thumbnail,
            mimeType: 'image/jpeg',
        };
    }
    const response = await agent.com.atproto.repo.putRecord({
        repo: agent.session.did,
        collection: 'cx.vmx.matadisco',
        rkey: rkey,
        record: recordPayload,
    });
    return { uri: response.data.uri, cid: response.data.cid };
}
/**
 * Deletes a record from the AT Protocol representing a IIIF Manifest.
 *
 * @param {AtpAgent} agent - The authenticated AtpAgent instance.
 * @param {string} rkey - The deterministic record key (e.g., the fileId).
 * @param {string} repo - The DID of the repository (defaults to agent's session DID).
 * @returns {Promise<void>}
 */
export async function deleteIIIFRecord(agent, rkey, repo) {
    const targetRepo = repo || agent.session?.did;
    if (!targetRepo) {
        throw new Error('AT Protocol Agent lacks an active session DID and no repo DID was provided. Authentication failed.');
    }
    await agent.com.atproto.repo.deleteRecord({
        repo: targetRepo,
        collection: 'cx.vmx.matadisco',
        rkey: rkey,
    });
}
