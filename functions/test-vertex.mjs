import { VertexAI } from '@google-cloud/vertexai';
const ai = new VertexAI({ project: 'niiifty', location: 'us-central1' });
// Wait, the vertex SDK might not support text-embedding-004 directly via getGenerativeModel
const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
console.log(typeof model.embedContent);
