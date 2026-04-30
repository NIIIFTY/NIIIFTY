import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const project = process.env.GCLOUD_PROJECT || 'niiifty-bd2e2';
const location = 'global';

const ai = new GoogleGenAI({ 
  project, 
  location, 
  vertexai: true 
});

export interface FileAIResult {
  summary: string;
  metadata: Record<string, string>;
  tags: string[];
}

const responseSchema = {
  type: 'object',
  properties: {
    summary: { 
      type: 'string',
      description: 'A concise natural language description of the item.'
    },
    metadata: {
      type: 'object',
      description: 'Standard metadata aligned with Dublin Core concepts.',
      properties: {
        subject: { type: 'string' },
        type: { type: 'string' },
        date: { type: 'string' },
        creator: { type: 'string' },
        format: { type: 'string' },
        coverage: { type: 'string' }
      },
      additionalProperties: { type: 'string' }
    },
    tags: {
      type: 'array',
      description: 'A list of 3-5 descriptive tags or keywords for search indexing.',
      items: { type: 'string' }
    }
  },
  required: ['summary', 'metadata', 'tags']
};

export async function generateFileSummary(filePath: string, mimeType: string): Promise<FileAIResult | null> {
  try {
    console.log(`[AI] Generating enriched summary and tags for ${filePath} (${mimeType})...`);

    // Only process images for now
    if (!mimeType.startsWith('image/')) {
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Content = fileBuffer.toString('base64');

    const prompt = 'Analyze this item for an archival search index. Provide a concise natural language summary, a set of relevant metadata pairs, and a few descriptive tags. Focus on visual facts, subject matter, and style. Use standard terminology for metadata keys (e.g., subject, type, date, creator, format). Omit any keys or tags if the value is "unknown" or uncertain.';

    const startTime = Date.now();
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        thinkingConfig: {
          thinkingLevel: 'low'
        }
      } as any
    });
    const duration = Date.now() - startTime;

    const output = result.text;

    if (output) {
      const parsed = JSON.parse(output) as FileAIResult;
      console.log(`[AI] Generated summary in ${duration}ms: ${parsed.summary}`);
      console.log(`[AI] Generated metadata: ${JSON.stringify(parsed.metadata)}`);
      console.log(`[AI] Generated tags: ${JSON.stringify(parsed.tags)}`);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('[AI] Error generating summary:', error);
    return null;
  }
}
