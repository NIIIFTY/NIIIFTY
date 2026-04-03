import * as Name from 'w3name';

/**
 * Publishes an IPNS name revision to the w3name service/DHT.
 *
 * @param {Name.Revision} revision - The signed revision to publish.
 * @param {any} key - The private key of the WritableName (from name.key).
 * @returns {Promise<void>} Resolves when the revision is published successfully.
 */
export async function publishRevision(revision: Name.Revision, key: any): Promise<void> {
  // Name.publish takes the revision and the signing key
  await Name.publish(revision, key);
}
