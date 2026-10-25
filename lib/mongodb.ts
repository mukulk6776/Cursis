import { MongoClient, Db, Collection, Document, MongoServerSelectionError } from 'mongodb';
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
    maxPoolSize: 20, // Leave capacity for writes while live change streams wait for events.
    minPoolSize: 1,
    serverSelectionTimeoutMS: 6000,
    socketTimeoutMS: 45000,
    appName: 'CursisWorkspace',
    ...(isAtlas ? { retryWrites: true, w: 'majority' as const } : {}),
  };
}

declare global {
  var _mongoClientPromise: Promise<MongoClient | null> | undefined;
  var _mongoIsConnected: boolean | undefined;
  var _mongoRetryAt: number | undefined;
}

async function initClient(): Promise<MongoClient | null> {
  let candidate: MongoClient | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const uri = getMongoUri();
    candidate = new MongoClient(uri, getClientOptions(uri));
    // Driver selection timeouts do not include Atlas SRV/TXT DNS lookups.
    const connected = await Promise.race([
      candidate.connect(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('MongoDB connection timed out')), 6000); }),
    ]);
    global._mongoIsConnected = true;
    global._mongoRetryAt = 0;
    return connected;
  } catch (error) {
    global._mongoIsConnected = false;
    global._mongoRetryAt = Date.now() + 30_000;
    // Closing may wait for DNS too; keep cleanup outside the request's timeout.
    void candidate?.close().catch(() => {});
    console.warn('[MongoDB] Connection unavailable; retrying after 30 seconds.', error instanceof Error ? error.message : 'Connection failed');
    if (error instanceof MongoServerSelectionError) {
      // Log only diagnostic codes; nested error messages can contain connection credentials.
      console.warn('[MongoDB] Server selection details:', {
        topology: error.reason.type,
        servers: Array.from(error.reason.servers.values(), ({ error: serverError }) => ({
          type: serverError?.name,
          code: serverError?.code,
          causeCode: serverError?.cause && 'code' in serverError.cause ? serverError.cause.code : undefined,
        })),
      });
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

if (!global._mongoClientPromise) global._mongoClientPromise = initClient();
export default global._mongoClientPromise;

/** Share a single connection attempt, including retries after an outage. */
export async function getDb(): Promise<Db | null> {
  try {
    if (global._mongoRetryAt && Date.now() >= global._mongoRetryAt) {
      global._mongoRetryAt = 0;
      global._mongoClientPromise = initClient();
    }
    const mongoClient = await global._mongoClientPromise;
    return mongoClient ? mongoClient.db(resolveDbName()) : null;
  } catch {
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
