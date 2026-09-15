import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Read API key from .env.local
function getKey() {
  const envPath = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t.startsWith('GEMINI_API_KEY=')) {
      return t.replace('GEMINI_API_KEY=', '').replace(/^["']|["']$/g, '').trim();
    }
  }
  return '';
}

const apiKey = getKey();
console.log('API Key:', apiKey.substring(0, 8) + '...');

const ai = new GoogleGenAI({ apiKey });

// Simulate EXACTLY what the chat route does
const systemInstruction = `You are ORDIS, the intelligent AI Workspace Copilot inside Cursis.
Talk naturally like ChatGPT. When greeted, converse naturally.
You have tools to create tasks, schedule meetings, etc.`;

const contents = [
  { role: 'user', parts: [{ text: 'Hello, how are you?' }] },
];

const toolDeclarations = [
  {
    name: 'create_task',
    description: 'Create a new task in the workspace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Task title' },
      },
      required: ['title'],
    },
  },
];

async function test() {
  console.log('\n--- Test 1: With tools (like Ordis chat route) ---');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    console.log('response.functionCalls:', response.functionCalls);
    
    // This is the line that might throw!
    try {
      const text = response.text;
      console.log('response.text:', text);
    } catch (textErr) {
      console.log('response.text THREW:', textErr.message);
      // Try getting text from candidates instead
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const textParts = parts.filter(p => p.text).map(p => p.text).join('');
      console.log('Text from parts:', textParts);
    }
    
    console.log('\nFull response candidates:', JSON.stringify(response.candidates?.[0]?.content, null, 2));
  } catch (err) {
    console.log('OUTER ERROR:', err.message);
  }

  console.log('\n--- Test 2: Without tools ---');
  try {
    const response2 = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    console.log('response.text:', response2.text?.substring(0, 200));
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
