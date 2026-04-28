import { createServer } from 'node:http';
import { JetstreamSubscription } from '@atcute/jetstream';
import admin from 'firebase-admin';
import { CxVmxMatadisco, IoIiifMetadata } from './atproto/index.js'; // Generated types

// Satisfy Cloud Run's health check
const port = process.env.PORT || 8080;
createServer((req, res) => {
  res.writeHead(200);
  res.end('Consumer is healthy');
}).listen(port);

// Initialize Firebase Admin (uses application default credentials in GCP)
admin.initializeApp();
const db = admin.firestore();

const CURSOR_DOC = '_system/firehose_cursor';

async function getCursor(): Promise<number | undefined> {
  const doc = await db.doc(CURSOR_DOC).get();
  if (doc.exists) {
    const data = doc.data();
    if (data && typeof data.cursor === 'number') {
      return data.cursor;
    }
  }
  return undefined;
}

async function saveCursor(cursor: number) {
  await db.doc(CURSOR_DOC).set({ cursor }, { merge: true });
}

async function main() {
  console.log('Starting NIIIFTY AppView consumer...');
  const cursor = await getCursor();
  if (cursor) {
    console.log(`Resuming from cursor: ${cursor}`);
  } else {
    console.log('No cursor found, starting from live edge.');
  }

  const jetstream = new JetstreamSubscription({
    url: 'wss://jetstream1.us-east.bsky.network/subscribe',
    wantedCollections: ['cx.vmx.matadisco'],
    cursor,
  });

  console.log('AppView consumer running. Listening for events...');

  for await (const event of jetstream) {
    if (event.kind !== 'commit') continue;

    const { commit, did, time_us } = event;
    const { collection, rkey, operation } = commit;

    if (collection !== 'cx.vmx.matadisco') continue;

    const uri = `at://${did}/${collection}/${rkey}`;
    const docRef = db.collection('matadisco_index').doc(encodeURIComponent(uri));

    if (operation === 'create' || operation === 'update') {
      const record = commit.record as CxVmxMatadisco.Main;

      // Extract IIIF extension
      const iiif = record.iiif as IoIiifMetadata.Main | undefined;
      
      // If the record has no IIIF block, we skip indexing it
      if (!iiif) continue;

      const metadataToSave = {
        uri,
        did,
        rkey,
        cid: commit.cid,
        publishedAt: record.publishedAt,
        tags: record.tags || [],
        
        // Extracted IIIF
        provider: iiif.provider || null,
        rights: iiif.rights || null,
        label: iiif.label || null,
        summary: iiif.summary || null,
        searchText: `${iiif.label || ''} ${iiif.summary || ''}`.trim(),
        type: iiif.type || null,
        metadata: iiif.metadata || {},
      };

      try {
        await docRef.set(metadataToSave, { merge: true });
        console.log(`[INDEXED] ${uri}`);
        
        if (time_us) {
          await saveCursor(time_us);
        }
      } catch (err) {
        console.error(`Error indexing ${uri}:`, err);
      }
    } else if (operation === 'delete') {
      try {
        await docRef.delete();
        console.log(`[DELETED] ${uri}`);
        if (time_us) {
          await saveCursor(time_us);
        }
      } catch (err) {
        console.error(`Error deleting ${uri}:`, err);
      }
    }
  }
}

main().catch(console.error);
