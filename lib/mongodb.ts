import { MongoClient, Db, Collection, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cursis';

// Extract database name from URI or environment variable
function resolveDbName(): string {
 if (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) {
 return process.env.MONGODB_DB_NAME.trim();
 }
 try {
 const url = new URL(MONGODB_URI.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
 const pathname = url.pathname.replace(/^\//, '').split('?')[0];
 if (pathname) return pathname;
 } catch {}
 return 'cursis';
}

const DB_NAME = resolveDbName();

// Connection options optimized for both MongoDB Atlas Cloud Clusters and local instances
const isAtlasCluster = MONGODB_URI.startsWith('mongodb+srv://');

const options = {
 maxPoolSize: 10,
 minPoolSize: 2,
 serverSelectionTimeoutMS: 5000,
 socketTimeoutMS: 45000,
 appName: 'CursisWorkspace',
 ...(isAtlasCluster ? { retryWrites: true, w: 'majority' as const } : {}),
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
 var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// In both development and Vercel serverless production environments,
// reuse the client promise cached on the global object to prevent connection leaks
// across hot-reloads and warm serverless lambda invocations.
if (!global._mongoClientPromise) {
 client = new MongoClient(MONGODB_URI, options);
 global._mongoClientPromise = client.connect().then((c) => {
 console.log(` MongoDB Connected successfully to: ${isAtlasCluster ? 'MongoDB Atlas Cloud Cluster' : 'Local MongoDB Instance'} (DB: ${DB_NAME})`);
 return c;
 }).catch((err) => {
 console.warn('Notice: MongoDB connection attempt:', err.message || err);
 return client;
 });
}
clientPromise = global._mongoClientPromise;

export default clientPromise;

/**
 * Get MongoDB Database instance
 */
export async function getDb(): Promise<Db | null> {
 try {
 const mongoClient = await clientPromise;
 return mongoClient.db(DB_NAME);
 } catch (error) {
 console.warn('MongoDB getDb error:', error);
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
