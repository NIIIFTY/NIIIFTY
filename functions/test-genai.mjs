import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ vertexai: { project: 'niiifty', location: 'us-central1' } });
async function test() {
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: 'hello world',
  });
  console.log(response.embeddings[0].values.length);
}
test().catch(console.error);
