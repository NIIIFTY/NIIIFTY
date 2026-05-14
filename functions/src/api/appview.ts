import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

import { defineSecret } from 'firebase-functions/params';

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const geminiApiKey = defineSecret('firestore-vector-search-GEMINI_API_KEY-j01j');

function cosineDistance(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 1;
  return 1 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
}

export const searchAppView = onCall({ 
  region: 'europe-west1',
  secrets: [geminiApiKey]
}, async (request) => {
  const { query, limit = 10 } = request.data;

  if (!query || typeof query !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with one argument "query" containing the search text.');
  }

  try {
    let snapshot;
    let queryEmbedding: number[] | null = null;
    
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
      console.log(`[EMULATOR] Bypassing Vertex AI vector search. Performing local text search for "${query}"...`);
      snapshot = await db.collection('matadisco_index').get();
      // Filter in memory for local emulation
      const lowerQuery = query.toLowerCase();
      const filteredDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return (data.label && data.label.toLowerCase().includes(lowerQuery)) ||
               (data.summary && data.summary.toLowerCase().includes(lowerQuery)) ||
               (data.tags && data.tags.some((t: string) => t.toLowerCase().includes(lowerQuery)));
      }).slice(0, Math.min(limit, 50));
      
      console.log(`[EMULATOR] Local text search returned ${filteredDocs.length} results.`);
      // Re-map to match snapshot structure expected below
      snapshot = { size: filteredDocs.length, docs: filteredDocs } as any;
    } else {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
      
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: query,
        config: {
          outputDimensionality: 768
        }
      });
      
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) {
        console.error('AI response missing embedding values:', JSON.stringify(response));
        throw new Error('Failed to generate embedding: empty response from AI');
      }
      
      queryEmbedding = embedding;
      console.log(`Generated embedding (length: ${embedding.length}). Performing vector search in matadisco_index...`);
      
      // 2. Perform vector search on Firestore
      // Note: ensure matadisco_index collection has a vector index on 'embedding'
      snapshot = await db.collection('matadisco_index')
        .findNearest('embedding', FieldValue.vector(embedding), {
          limit: Math.min(limit, 50),
          distanceMeasure: 'COSINE'
        } as any)
        .get();
        
      console.log(`Search returned ${snapshot.size} results.`);
    }
      
    // 3. Return results
    let results = snapshot.docs.map(doc => {
      const data = doc.data();
      
      let distance: number | undefined = undefined;
      if (queryEmbedding && data.embedding) {
         const docEmb = typeof data.embedding.toArray === 'function' ? data.embedding.toArray() : data.embedding;
         if (Array.isArray(docEmb)) {
           distance = cosineDistance(queryEmbedding, docEmb);
         }
      }

      return { 
        ...data,
        id: doc.id, 
        atUri: data.uri || '',
        label: data.label || 'Untitled',
        summary: data.summary || '',
        type: data.type || '',
        author: data.did || 'unknown',
        handle: data.handle || null,
        thumbnailUrl: data.thumbnailUrl || null,
        distance
      };
    });
    
    // Manually filter out results that are too far semantically if running against vector search
    if (process.env.FUNCTIONS_EMULATOR !== 'true') {
      console.log(`Raw distances before filter: ${results.map(r => r.distance).join(', ')}`);
      results = results.filter(r => r.distance === undefined || r.distance <= 0.45);
      console.log(`Filtered down to ${results.length} relevant results based on distance.`);
    }
    
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
        ...data,
        id: doc.id,
        atUri: data.uri || '',
        label: data.label || 'Untitled',
        summary: data.summary || '',
        type: data.type || '',
        author: data.did || 'unknown',
        handle: data.handle || null,
        thumbnailUrl: data.thumbnailUrl || null,
      }
    };
  } catch (error: any) {
    console.error('Get record error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to retrieve record: ${error.message || 'Unknown error'}`);
  }
});
