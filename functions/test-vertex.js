const { VertexAI } = require('@google-cloud/vertexai');
const ai = new VertexAI({ project: 'niiifty', location: 'us-central1' });
const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
console.log(typeof model.embedContent);
