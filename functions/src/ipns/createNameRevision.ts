import * as Name from 'w3name';

/**
 * Creates a new IPNS name revision pointing to the given IPFS CID value.
 * If this is the first revision, pass undefined for previousRevision.
 *
 * @param {Name.WritableName} name - The signing key pair generated via generateName().
 * @param {string} value - The IPFS CID or path (e.g., '/ipfs/bafy...') to point the name to.
 * @param {Name.Revision | undefined} previousRevision - The previous revision if updating an existing record, or undefined if creating the initial record.
 * @returns {Promise<Name.Revision>} The signed revision ready to be published.
 */
export async function createNameRevision(
  name: Name.WritableName,
  value: string,
  previousRevision?: Name.Revision,
): Promise<Name.Revision> {
  if (!previousRevision) {
    // Initial revision (sequence = 0)
    return await Name.v0(name, value);
  } else {
    // Update existing revision (increments sequence)
    return await Name.increment(previousRevision, value);
  }
}
