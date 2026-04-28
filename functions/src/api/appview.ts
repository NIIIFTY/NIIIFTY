import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || 'niiifty';
const location = 'europe-west1';

// In Cloud Functions, ADC (Application Default Credentials) will be used automatically
// as long as the environment supports it (which Cloud Functions does).
const ai = new GoogleGenAI({ vertexai: true, project, location });

export const searchAppView = onCall({ region: 'europe-west1' }, async (request) => {
  const { query, limit = 10 } = request.data;

  if (!query || typeof query !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with one argument "query" containing the search text.');
  }

  try {
    // 1. Generate embedding for the query
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: query,
    });
    
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    
    // 2. Perform vector search on Firestore
    const snapshot = await db.collection('matadisco_index')
      .findNearest('embedding', FieldValue.vector(embedding), {
        limit: Math.min(limit, 50),
        distanceMeasure: 'COSINE'
      })
      .get();
      
    // 3. Return results
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { results };
  } catch (error) {
    console.error('Vector search error:', error);
    throw new HttpsError('internal', 'An error occurred during the search operation.');
  }
});
