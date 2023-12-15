// import { Web3Storage } from "web3.storage";
import { WEB3_STORAGE_KEY, WEB3_STORAGE_PROOF } from "./constants.js";
import { getAllFiles } from "./fs.js";
import { CarReader } from "@ipld/car";
// import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@ucanto/core/delegation";
import * as Signer from "@ucanto/principal/ed25519";
import * as Client from "@web3-storage/w3up-client";
import { filesFromPaths } from "files-from-path";
import fs from "fs";

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

  // file.replace(/^\/tmp\/\d+\//, "/");

  files = await filesFromPaths(files);
  // console.log("files", files);

  //   const files = await filesFromPaths(['path/to/file.txt', 'path/to/dir'])
  // console.log(files)

  // files = files.map((file) => {
  //   return {
  //     name: file.replace(/^\/tmp\/\d+\//, "/"),
  //     stream: () => fs.createReadStream(file),
  //   };
  // });

  // console.log("adding files to web3.storage", files);

  // const cid = await web3Storage.put(files);

  const principal = Signer.parse(WEB3_STORAGE_KEY);
  const client = await Client.create({ principal });
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await parseProof(WEB3_STORAGE_PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  // await client.setCurrentSpace(`did:key:${WEB3_STORAGE_API_KEY}`);

  const cid = await client.uploadDirectory(files);

  console.log("cid", cid.toString());

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
