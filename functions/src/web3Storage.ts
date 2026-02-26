import { STORACHA_KEY, STORACHA_PROOF } from './constants.js';
import { getAllFiles } from './fs.js';
import { CarReader } from '@ipld/car';
import * as Delegation from '@ucanto/core/delegation';
import * as Signer from '@ucanto/principal/ed25519';
import * as Client from '@storacha/client';
import { filesFromPaths } from 'files-from-path';

// const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY });

/** @param {string} data Base64 encoded CAR file */
async function parseProof(data) {
  const blocks = [];
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
  for await (const block of reader.blocks()) {
    blocks.push(block);
  }
  return Delegation.importDAG(blocks);
}

export async function uploadTempFilesToWeb3Storage(tempDirPath) {
  let files = getAllFiles(tempDirPath);

  const web3Files = await filesFromPaths(files);

  const principal = Signer.parse(STORACHA_KEY);
  const client = await Client.create({ principal });

  try {
    const proof = await parseProof(STORACHA_PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const cid = await client.uploadDirectory(web3Files);

    return cid.toString();
  } catch (err: any) {
    console.error('WEB3STORAGE UPLOAD ERROR:', err.message);
    if (err.cause) {
      console.error('CAUSE DETAILS:', err.cause);
      console.error('CAUSE MESSAGE:', err.cause.message);
      console.error('CAUSE NAME:', err.cause.name);
    }
    throw err;
  }
}

// add a google cloud storage file to web3.storage
// export async function addFileToWeb3Storage(file) {
//   const cid = await web3Storage.put([
//     {
//       name: file.name.split("/").pop(),
//       stream: () => gcsBucket.file(file.name).createReadStream(),
//     },
//   ]);

//   return cid;
// }
