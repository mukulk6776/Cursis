import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
let mongodbUri = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI=')) {
      mongodbUri = trimmed.replace('MONGODB_URI=', '').replace(/^["']|["']$/g, '').trim();
      break;
    }
  }
}

if (!mongodbUri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Mask password for display
const maskedUri = mongodbUri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$3');
console.log(`\n🔍 Testing MongoDB connection...`);
console.log(`📡 URI: ${maskedUri}\n`);

async function testConnection() {
  const client = new MongoClient(mongodbUri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    console.log('✅ SUCCESS: Connected to MongoDB Atlas cluster!');
    
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    console.log('📂 Available Databases:', dbs.databases.map(d => d.name).join(', '));
    
    const db = client.db('cursis');
    const cols = await db.listCollections().toArray();
    console.log('📑 Collections in "cursis":', cols.length > 0 ? cols.map(c => c.name).join(', ') : '(No collections yet - will be created on first save)');
    
    console.log('\n🎉 Your database configuration is working perfectly!\n');
  } catch (err) {
    console.error('\n❌ Connection Failed:', err.message);
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.log('\n👉 Reason: The password in .env.local does not match the database user in MongoDB Atlas.');
      console.log('👉 Solution:');
      console.log('   1. Go to https://cloud.mongodb.com -> "Database Access"');
      console.log('   2. Click "Edit" on your user, select "Edit Password", and enter a new password.');
      console.log('   3. Put that exact password in .env.local inside MONGODB_URI.');
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('Server selection timed out')) {
      console.log('\n👉 Reason: IP address blocked or network timeout.');
      console.log('👉 Solution: In MongoDB Atlas -> "Network Access", add 0.0.0.0/0 (Allow access from anywhere).');
    }
  } finally {
    await client.close();
  }
}

testConnection();
