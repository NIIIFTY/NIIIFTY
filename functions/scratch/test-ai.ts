import { GoogleGenAI } from '@google/genai';

async function test() {
  const project = 'niiifty-bd2e2';
  const location = 'europe-west1';
  
  try {
    console.log('Initializing AI...');
    const ai = new GoogleGenAI({ vertexai: true, project, location });
    
    console.log('Generating embedding...');
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'test query',
    });
    
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
