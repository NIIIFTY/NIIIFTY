import * as Name from 'w3name';

/**
 * Generates a new IPNS name keypair natively using the w3name package.
 * @returns {Promise<Name.WritableName>} A new WritableName instance representing the private key.
 */
export async function generateName(): Promise<Name.WritableName> {
  // Create a new IPNS name
  const name = await Name.create();
  return name;
}
