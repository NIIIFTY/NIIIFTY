import { AtpAgent } from '@atproto/api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from functions/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../functions/.env') });

const {
  ATPROTO_SERVICE,
  ATPROTO_IDENTIFIER,
  ATPROTO_PASSWORD,
} = process.env;

async function run() {
  const rkey = process.argv[2];

  if (!rkey) {
    console.error('Usage: node scripts/delete-atproto-record.mjs <rkey>');
    console.error('Example: node scripts/delete-atproto-record.mjs N7oLcZyp61yRYiXkPg7C');
    process.exit(1);
  }

  if (!ATPROTO_SERVICE || !ATPROTO_IDENTIFIER || !ATPROTO_PASSWORD) {
    console.error('Missing AT Protocol credentials in functions/.env');
    process.exit(1);
  }

  console.log(`Authenticating with ${ATPROTO_SERVICE} as ${ATPROTO_IDENTIFIER}...`);
  
  try {
    const agent = new AtpAgent({ service: ATPROTO_SERVICE });
    await agent.login({
      identifier: ATPROTO_IDENTIFIER,
      password: ATPROTO_PASSWORD,
    });

    const did = agent.session.did;
    console.log(`Authenticated as ${did}`);
    console.log(`Deleting record: collection=cx.vmx.matadisco, rkey=${rkey}...`);

    await agent.com.atproto.repo.deleteRecord({
      repo: did,
      collection: 'cx.vmx.matadisco',
      rkey: rkey,
    });

    console.log('Successfully deleted the record.');
  } catch (error) {
    console.error('Failed to delete the record:', error.message);
    process.exit(1);
  }
}

run();
