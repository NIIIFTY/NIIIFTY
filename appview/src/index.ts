import { createServer } from 'node:http';
import { JetstreamSubscription } from '@atcute/jetstream';
import admin from 'firebase-admin';

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
  let count = 0;
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

  try {
    for await (const event of jetstream) {
      console.log(`[DEBUG] Received event: ${event.kind} (total events seen: ${++count})`);
      if (event.kind !== 'commit') continue;

      const { commit, did, time_us } = event;
      const { collection, rkey, operation } = commit;

      // Log every event from our test DID or matching our lexicon
      if (did === 'did:plc:2jh3cgm7lljlxuvss65wq7nc' || collection === 'cx.vmx.matadisco') {
        console.log(`[EVENT] ${operation} on ${collection} by ${did}`);
      }

      if (collection !== 'cx.vmx.matadisco') continue;

      const uri = `at://${did}/${collection}/${rkey}`;
      const docRef = db.collection('matadisco_index').doc(encodeURIComponent(uri));

      if (operation === 'create' || operation === 'update') {
        const record = commit.record as any;

        // Extract IIIF extension
        const iiif = record.iiif as any;

        // If the record has no IIIF block, we skip indexing it
        if (!iiif) {
          console.log(`[SKIPPED] ${uri} - No IIIF metadata found in record.`);
          continue;
        }

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
          thumbnailUrl: record.preview?.url || null,
        };

        try {
          await docRef.set(metadataToSave, { merge: true });
          console.log(`[INDEXED] ${uri}`);

          if (time_us) {
            await saveCursor(time_us);
          }
        } catch (err) {
          console.error(`[ERROR] Indexing ${uri}:`, err);
        }
      } else if (operation === 'delete') {
        try {
          await docRef.delete();
          console.log(`[DELETED] ${uri}`);
          if (time_us) {
            await saveCursor(time_us);
          }
        } catch (err) {
          console.error(`[ERROR] Deleting ${uri}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[FATAL] Jetstream loop error:', err);
  }
}

main().catch(console.error);
