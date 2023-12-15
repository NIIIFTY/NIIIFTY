import { WEB3_STORAGE_KEY, WEB3_STORAGE_PROOF } from "./constants.js";
import { getAllFiles } from "./fs.js";
import { CarReader } from "@ipld/car";
import * as Delegation from "@ucanto/core/delegation";
import * as Signer from "@ucanto/principal/ed25519";
import * as Client from "@web3-storage/w3up-client";
import { filesFromPaths } from "files-from-path";

// const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY });

/** @param {string} data Base64 encoded CAR file */
async function parseProof(data) {
  const blocks = [];
  const reader = await CarReader.fromBytes(Buffer.from(data, "base64"));
  for await (const block of reader.blocks()) {
    blocks.push(block);
  }
  return Delegation.importDAG(blocks);
}

export async function uploadTempFilesToWeb3Storage(tempDirPath) {
  let files = getAllFiles(tempDirPath);

  files = await filesFromPaths(files);

  const principal = Signer.parse(WEB3_STORAGE_KEY);
  const client = await Client.create({ principal });
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await parseProof(WEB3_STORAGE_PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  const cid = await client.uploadDirectory(files);

  return cid.toString();
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
