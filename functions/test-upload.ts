import 'dotenv/config';
import { STORACHA_KEY, STORACHA_PROOF } from './src/constants.js';
import * as Client from '@storacha/client';
import * as Signer from '@ucanto/principal/ed25519';
import { CarReader } from '@ipld/car';
import * as Delegation from '@ucanto/core/delegation';

async function parseProof(data) {
  const blocks = [];
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
  for await (const block of reader.blocks()) {
    blocks.push(block);
  }
  return Delegation.importDAG(blocks);
}

async function main() {
  console.log('Loading principal...');
  const principal = Signer.parse(STORACHA_KEY);
  const client = await Client.create({ principal });

  console.log('Adding space from proof...');
  const proof = await parseProof(STORACHA_PROOF);
  console.log(
    'Proof delegates:',
    proof.capabilities.map((c) => c.can),
  );

  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  console.log('Current space set:', space.did());

  try {
    console.log('Uploading blob...');
    const blob = new Blob(['hello world from NIIIFTY!'], { type: 'text/plain' });
    const cid = await client.uploadFile(blob);
    console.log('UPLOAD SUCCESS!', cid.toString());
  } catch (err) {
    console.error('UPLOAD FAILED!');
    console.error('Error:', err.message);
    if (err.cause) {
      console.error('CAUSE DETAILS:', err.cause);
      console.error('CAUSE MESSAGE:', err.cause.message);
      console.error('CAUSE NAME:', err.cause.name);
    }
  }
}

main().catch(console.error);
