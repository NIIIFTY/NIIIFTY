import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'functions/.env') });

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

async function triggerReEmbed() {
  console.log('Fetching documents from matadisco_index...');
  const snapshot = await db.collection('matadisco_index').get();
  
  if (snapshot.empty) {
    console.log('No documents found in matadisco_index');
    return;
  }

  console.log(`Found ${snapshot.size} documents. Triggering re-embed...`);
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    // We update the searchText field with its own exact value.
    // This "touch" will trick the Firebase Extension into generating a new embedding
    // because it listens to onWrite events for the configured field.
    const currentSearchText = doc.data().searchText || '';
    batch.update(doc.ref, { searchText: currentSearchText });
  });

  await batch.commit();
  console.log('Successfully touched all documents! The extension should be processing them now.');
}

triggerReEmbed().catch(console.error);
