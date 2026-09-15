import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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

console.log('Testing Gemini API key:', apiKey ? (apiKey.substring(0, 8) + '...' + apiKey.slice(-4)) : 'NONE FOUND');

async function testGemini() {
  if (!apiKey) {
    console.error('No GEMINI_API_KEY in .env.local');
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Hello! Respond with: "Ordis online and ready for commands."'
    });
    console.log('SUCCESS! Gemini response:');
    console.log(response.text);
  } catch (err) {
    console.error('Gemini call failed:', err.message || err);
  }
}

testGemini();
