import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';

const project = process.env.GCLOUD_PROJECT || 'niiifty-bd2e2';
const location = 'europe-west1';

const vertex_ai = new VertexAI({ project, location });
const model = 'gemini-1.5-flash-002';

// Instantiate the generative model
const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 256,
    temperature: 0.4,
  },
});

export async function generateFileSummary(filePath: string, mimeType: string): Promise<string | null> {
  try {
    console.log(`[AI] Generating summary for ${filePath} (${mimeType})...`);

    // Only process images and videos for now
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Content = fileBuffer.toString('base64');

    const prompt = 'Describe this item for an archival search index in one or two concise sentences. Focus on visual facts, subject matter, and style. Do not use phrases like "This image shows" or "In this photo".';

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Content,
                mimeType: mimeType,
              },
            },
          ] as any[],
        },
      ],
    };

    const result = await generativeModel.generateContent(request);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      console.log(`[AI] Generated: ${text.trim()}`);
      return text.trim();
    }

    return null;
  } catch (error) {
    console.error('[AI] Error generating summary:', error);
    return null;
  }
}
