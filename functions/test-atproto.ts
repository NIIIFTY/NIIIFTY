import 'dotenv/config';
import { authenticateAgent } from './src/atproto/auth.js';
import { publishIIIFRecord, IIIFRecordPayload } from './src/atproto/publishRecord.js';

async function main() {
  const service = process.env.ATPROTO_SERVICE || 'https://bsky.social';
  const identifier = process.env.ATPROTO_IDENTIFIER;
  const password = process.env.ATPROTO_PASSWORD;

  if (!identifier || !password) {
    console.error('Missing ATPROTO_IDENTIFIER or ATPROTO_PASSWORD in functions/.env');
    process.exit(1);
  }

  console.log(`Authenticating with ${service} as ${identifier}...`);
  const agent = await authenticateAgent(service, identifier, password);
  console.log('Authentication successful. DID:', agent.session?.did);

  const payload: IIIFRecordPayload = {
    id: `https://niiifty.app/manifest/${Date.now()}`,
    label: 'Integration Test Manifest',
    summary: 'A manifest created by the NIIIFTY integration test harness.',
    tags: ['test', 'integration'],
    provider: 'NIIIFTY Test Suite'
  };

  console.log('Publishing record to Matadisco lexicon...');
  const { uri, cid } = await publishIIIFRecord(agent, payload);

  console.log('PUBLISH SUCCESS!');
  console.log('AT URI:', uri);
  console.log('Record CID:', cid);

  console.log('Verifying record via read-back...');
  const [repo, collection, rkey] = uri.replace('at://', '').split('/');
  const recordResponse = await agent.com.atproto.repo.getRecord({
    repo,
    collection,
    rkey
  });

  if (recordResponse.success) {
    console.log('READ-BACK SUCCESS!');
    console.log('Record details:', JSON.stringify(recordResponse.data.value, null, 2));
  } else {
    console.error('READ-BACK FAILED!');
  }
}

main().catch((err) => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
