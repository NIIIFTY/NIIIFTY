import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import http from 'http';

// Point firebase-admin to the local emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'niiifty-bd2e2';

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 2000;

function checkEmulatorReady() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8080/', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function seedData() {
  initializeApp({ projectId: 'niiifty-bd2e2' });
  const db = getFirestore();

  console.log('Seeding dummy data into local Firestore emulator...');

  const dummyRecords = [
    {
      id: 'local-test-1',
      uri: 'at://did:plc:mock1/app.bsky.feed.post/12345',
      label: 'Cyberpunk Helmet 3D',
      summary: 'A futuristic 3D model of a cyberpunk helmet, rigged and ready for VR.',
      type: 'model/gltf-binary',
      metadata: { format: 'model/gltf-binary' },
      did: 'did:plc:mock1',
      tags: ['3d', 'cyberpunk', 'helmet'],
      thumbnailUrl: 'https://placehold.co/600x400/111111/FFFFFF/png?text=Cyberpunk+Helmet',
      cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      resource: 'https://example.com/iiif/1/manifest.json',
      handle: 'cyberpunk.bsky.social',
    },
    {
      id: 'local-test-2',
      uri: 'at://did:plc:mock2/app.bsky.feed.post/67890',
      label: 'Vintage Camera Photography',
      summary: 'High resolution scan of a vintage 1970s film camera.',
      type: 'image/jpeg',
      metadata: { format: 'image/jpeg' },
      did: 'did:plc:mock2',
      tags: ['photography', 'vintage', 'camera'],
      thumbnailUrl: 'https://placehold.co/600x400/111111/FFFFFF/png?text=Vintage+Camera',
      cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      resource: 'https://example.com/iiif/2/manifest.json',
      handle: 'vintage.collector',
    },
    {
      id: 'local-test-3',
      uri: 'at://did:plc:mock3/app.bsky.feed.post/11111',
      label: 'Neon Cityscape Loop',
      summary: 'A seamless looping video of a neon lit city skyline at night.',
      type: 'video/mp4',
      metadata: { format: 'video/mp4' },
      did: 'did:plc:mock3',
      tags: ['video', 'loop', 'cityscape', 'neon'],
      thumbnailUrl: 'https://placehold.co/600x400/111111/FFFFFF/png?text=Neon+Cityscape',
      cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      resource: 'https://example.com/iiif/3/manifest.json',
      handle: 'neon.vibes.bsky.social',
    }
  ];

  const batch = db.batch();

  for (const record of dummyRecords) {
    // 1. Seed matadisco_index collection
    const indexRef = db.collection('matadisco_index').doc(encodeURIComponent(record.uri));
    batch.set(indexRef, {
      ...record,
      embedding: Array(768).fill(0.01) // mock embedding if needed
    });

    // 2. Seed files collection
    const fileRef = db.collection('files').doc(record.id);
    batch.set(fileRef, {
      label: record.label,
      summary: record.summary,
      type: record.type,
      tags: record.tags,
      cid: record.cid,
      processed: true,
      ownerId: 'local-admin-user',
      atDid: record.did, // Simulate that it was already published
    });
  }

  await batch.commit();
  console.log('Successfully seeded 3 dummy records into matadisco_index and files!');
  process.exit(0);
}

async function run() {
  console.log('Waiting for local Firestore emulator to start on port 8080...');
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const isReady = await checkEmulatorReady();
    if (isReady) {
      console.log('Firestore emulator is ready!');
      await seedData();
      return;
    }
    console.log(`Retry ${i + 1}/${MAX_RETRIES}... waiting 2 seconds.`);
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
  }
  
  console.error('Failed to connect to Firestore emulator after 40 seconds. Seed script aborting.');
  process.exit(1);
}

run();
