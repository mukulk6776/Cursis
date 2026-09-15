import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('GEMINI_API_KEY=')) {
      apiKey = trimmed.replace('GEMINI_API_KEY=', '').replace(/^["']|["']$/g, '').trim();
      break;
    }
  }
}

async function testTools() {
  const ai = new GoogleGenAI({ apiKey });
  const toolDeclarations = [
    {
      name: 'create_task',
      description: 'Create a new task in the workspace.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Task title' },
          priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
        },
        required: ['title'],
      },
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Please create a high priority task titled "Refactor Authentication Flow"',
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    console.log('Function calls received:', JSON.stringify(response.functionCalls, null, 2));
    console.log('Text response:', response.text);
  } catch (err) {
    console.error('Tool test failed:', err);
  }
}

testTools();
