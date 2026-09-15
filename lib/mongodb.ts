import { MongoClient, Db, Collection, Document } from 'mongodb';
import fs from 'fs';
import path from 'path';

function getMongoUri(): string {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() && !process.env.MONGODB_URI.includes('127.0.0.1')) {
    return process.env.MONGODB_URI.trim();
  }
  // Try reading .env.local if on server/Node runtime
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('MONGODB_URI=')) {
          const uri = trimmed.replace('MONGODB_URI=', '').replace(/^["']|["']$/g, '').trim();
          if (uri) {
            process.env.MONGODB_URI = uri;
            return uri;
          }
        }
      }
    }
  } catch {}

  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cursis';
}

// Extract database name from URI or environment variable
function resolveDbName(): string {
  if (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) {
    return process.env.MONGODB_DB_NAME.trim();
  }
  try {
    const uri = getMongoUri();
    const url = new URL(uri.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    const pathname = url.pathname.replace(/^\//, '').split('?')[0];
    if (pathname) return pathname;
  } catch {}
  return 'cursis';
}

function getClientOptions(uri: string) {
  const isAtlas = uri.startsWith('mongodb+srv://');
  return {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 6000,
    socketTimeoutMS: 45000,
    appName: 'CursisWorkspace',
    ...(isAtlas ? { retryWrites: true, w: 'majority' as const } : {}),
  };
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient | null>;
let isConnected = false;

declare global {
  var _mongoClientPromise: Promise<MongoClient | null> | undefined;
  var _mongoIsConnected: boolean | undefined;
}

function initClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  const opts = getClientOptions(uri);
  const isAtlas = uri.startsWith('mongodb+srv://');
  const dbName = resolveDbName();

  try {
    client = new MongoClient(uri, opts);
    return client.connect().then((c) => {
      isConnected = true;
      global._mongoIsConnected = true;
      console.log(`[MongoDB] Connected successfully to: ${isAtlas ? 'MongoDB Atlas Cloud Cluster' : 'Local MongoDB Instance'} (DB: ${dbName})`);
      return c;
    }).catch((err) => {
      isConnected = false;
      global._mongoIsConnected = false;
      console.warn('Notice: MongoDB connection attempt (falling back to memory store):', err.message || err);
      return null;
    });
  } catch (err) {
    return Promise.resolve(null);
  }
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = initClient();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;

/**
 * Get MongoDB Database instance (re-attempts connection if disconnected)
 */
export async function getDb(): Promise<Db | null> {
  try {
    let mongoClient = await clientPromise;
    if (!mongoClient || !global._mongoIsConnected) {
      const uri = getMongoUri();
      const opts = getClientOptions(uri);
      const freshClient = new MongoClient(uri, opts);
      mongoClient = await freshClient.connect();
      global._mongoClientPromise = Promise.resolve(mongoClient);
      clientPromise = global._mongoClientPromise;
      global._mongoIsConnected = true;
      isConnected = true;
    }
    return mongoClient.db(resolveDbName());
  } catch (error) {
    return null;
  }
}

/**
 * Get typed MongoDB collection
 */
export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T> | null> {
 try {
 const db = await getDb();
 if (!db) return null;
 return db.collection<T>(collectionName);
 } catch (error) {
 console.warn(`MongoDB getCollection error for ${collectionName}:`, error);
 return null;
 }
}

/**
 * Check if MongoDB connection is active
 */
export async function isMongoConnected(): Promise<boolean> {
 try {
 const db = await getDb();
 if (!db) return false;
 await db.command({ ping: 1 });
 return true;
 } catch {
 return false;
 }
}

/**
 * Initialize essential collection indexes
 */
export async function initMongoIndexes(): Promise<void> {
 try {
 const db = await getDb();
 if (!db) return;

 await Promise.allSettled([
 db.collection('workspaces').createIndex({ id: 1 }, { unique: true }),
 db.collection('workspaces').createIndex({ ownerId: 1 }),
 db.collection('users').createIndex({ uid: 1 }, { unique: true }),
 db.collection('users').createIndex({ email: 1 }),
 db.collection('tasks').createIndex({ workspaceId: 1, status: 1 }),
 db.collection('tasks').createIndex({ id: 1 }, { unique: true }),
 db.collection('projects').createIndex({ workspaceId: 1 }),
 db.collection('projects').createIndex({ id: 1 }, { unique: true }),
 db.collection('meetings').createIndex({ workspaceId: 1, date: 1 }),
 db.collection('documents').createIndex({ workspaceId: 1, type: 1 }),
 db.collection('automations').createIndex({ workspaceId: 1 }),
 db.collection('crm_deals').createIndex({ workspaceId: 1, stage: 1 }),
 db.collection('crm_leads').createIndex({ workspaceId: 1 }),
 db.collection('messages').createIndex({ workspaceId: 1, channelId: 1 }),
 db.collection('audit_logs').createIndex({ workspaceId: 1, timestamp: -1 }),
 db.collection('settings').createIndex({ workspaceId: 1 }, { unique: true }),
 ]);
 } catch (error) {
 console.warn('Notice: Index creation skipped or deferred:', error);
 }
}
