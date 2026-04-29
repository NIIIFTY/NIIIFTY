import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || 'niiifty-bd2e2';
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
    console.log(`Generating embedding for query: "${query}" using model text-embedding-004...`);
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: query,
    });
    
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      console.error('AI response missing embedding values:', JSON.stringify(response));
      throw new Error('Failed to generate embedding: empty response from AI');
    }
    
    console.log(`Generated embedding (length: ${embedding.length}). Performing vector search in matadisco_index...`);
    
    // 2. Perform vector search on Firestore
    // Note: ensure matadisco_index collection has a vector index on 'embedding'
    const snapshot = await db.collection('matadisco_index')
      .findNearest('embedding', FieldValue.vector(embedding), {
        limit: Math.min(limit, 50),
        distanceMeasure: 'COSINE'
      })
      .get();
      
    console.log(`Search returned ${snapshot.size} results.`);
      
    // 3. Return results
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        atUri: data.uri || '',
        label: data.label || 'Untitled',
        summary: data.summary || '',
        type: data.type || 'unknown',
        author: data.did || 'unknown',
        thumbnailUrl: data.thumbnailUrl || null,
        ...data 
      };
    });
    
    return { results };
  } catch (error: any) {
    console.error('Vector search error detail:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw new HttpsError('internal', `Search operation failed: ${error.message || 'Unknown error'}`);
  }
});

export const getRecord = onCall({ region: 'europe-west1' }, async (request) => {
  const { uri } = request.data;

  if (!uri || typeof uri !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with one argument "uri".');
  }

  try {
    const docRef = db.collection('matadisco_index').doc(encodeURIComponent(uri));
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Record not found.');
    }

    const data = doc.data()!;
    return {
      record: {
        id: doc.id,
        atUri: data.uri || '',
        label: data.label || 'Untitled',
        summary: data.summary || '',
        type: data.type || 'unknown',
        author: data.did || 'unknown',
        thumbnailUrl: data.thumbnailUrl || null,
        ...data
      }
    };
  } catch (error: any) {
    console.error('Get record error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to retrieve record: ${error.message || 'Unknown error'}`);
  }
});
