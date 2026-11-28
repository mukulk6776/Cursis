import { MongoClient, Db, Collection, Document, MongoServerSelectionError } from 'mongodb';
import fs from 'fs';
import path from 'path';

function cleanMongoEnv(value?: string): string {
  return String(value || '').trim().replace(/^["']|["']$/g, '').trim();
}

function getMongoUri(): { uri: string; isConfigured: boolean } {
  for (const raw of [process.env.MONGODB_URI, process.env.MONGODB_URL, process.env.MONGO_URI]) {
    const cleaned = cleanMongoEnv(raw);
    if (cleaned && !cleaned.includes('127.0.0.1') && !cleaned.includes('localhost')) {
      return { uri: cleaned, isConfigured: true };
    }
  }
  // Try reading .env.local if on server/Node runtime
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('MONGODB_URI=')) {
          const uri = cleanMongoEnv(trimmed.slice('MONGODB_URI='.length));
          if (uri) {
            process.env.MONGODB_URI = uri;
            return { uri, isConfigured: true };
          }
        }
      }
    }
  } catch {}

  const fallbackRaw = cleanMongoEnv(process.env.MONGODB_URI);
  if (fallbackRaw) {
    return { uri: fallbackRaw, isConfigured: true };
  }
  const isProdRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProdRuntime) {
    return { uri: '', isConfigured: false };
  }
  return { uri: 'mongodb://127.0.0.1:27017/cursis', isConfigured: true };
}

// Extract database name from URI or environment variable
function resolveDbName(): string {
  const configuredName = cleanMongoEnv(process.env.MONGODB_DB_NAME);
  if (configuredName) {
    return configuredName;
  }
  try {
    const { uri } = getMongoUri();
    if (!uri) return 'cursis';
    const url = new URL(uri.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    const pathname = url.pathname.replace(/^\//, '').split('?')[0];
    if (pathname) return pathname;
  } catch {}
  return 'cursis';
}

function getClientOptions(uri: string) {
  const isAtlas = uri.startsWith('mongodb+srv://');
  const isLocal = /^mongodb(\+srv)?:\/\/(127\.0\.0\.1|localhost)/i.test(uri);
  const hasExplicitTlsDisable = /(?:tls|ssl)=false/i.test(uri);
  return {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 12000,
    connectTimeoutMS: 12000,
    socketTimeoutMS: 45000,
    appName: 'CursisWorkspace',
    ...(!isLocal && !isAtlas && !hasExplicitTlsDisable ? { tls: true } : {}),
    ...(isAtlas ? { retryWrites: true, w: 'majority' as const } : {}),
  };
}

declare global {
  var _mongoClientPromise: Promise<MongoClient | null> | undefined;
  var _mongoIsConnected: boolean | undefined;
  var _mongoRetryAt: number | undefined;
  var _mongoLastIssue: string | undefined;
}

function classifyMongoError(error: unknown): string {
  if (!(error instanceof Error)) return 'connection_failed';
  const name = error.name || '';
  const code = 'code' in error && error.code !== undefined ? String(error.code) : '';
  const msg = error.message || '';
  if (msg === 'MongoDB connection timed out' || code === 'ETIMEDOUT') return 'timeout';
  if (/ENOTFOUND|EAI_AGAIN|querySrv|queryTxt/i.test(msg) || code === 'ENOTFOUND') return 'dns_failed';
  if (/auth|Authentication failed|SCRAM/i.test(msg) || code === '18' || code === '8000') return 'auth_failed';
  if (error instanceof MongoServerSelectionError || name === 'MongoServerSelectionError') return 'server_selection';
  if (/Invalid scheme|URI/i.test(msg)) return 'invalid_uri';
  return code || name || 'connection_failed';
}

export function getMongoDiagnosticCode(): string {
  return global._mongoLastIssue || 'connection_failed';
}

async function initClient(): Promise<MongoClient | null> {
  const { uri, isConfigured } = getMongoUri();
  if (!isConfigured || !uri) {
    global._mongoIsConnected = false;
    global._mongoLastIssue = 'missing_uri';
    global._mongoRetryAt = Date.now() + 2_000;
    console.warn('[MongoDB] Connection unavailable (missing_uri). Ensure MONGODB_URI is configured in environment variables.');
    return null;
  }

  let candidate: MongoClient | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    candidate = new MongoClient(uri, getClientOptions(uri));
    // Guard against hanging SRV/TXT lookups on cold serverless starts.
    const connected = await Promise.race([
      candidate.connect(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('MongoDB connection timed out')), 13_500); }),
    ]);
    global._mongoIsConnected = true;
    global._mongoRetryAt = 0;
    global._mongoLastIssue = undefined;
    return connected;
  } catch (error) {
    const issueCode = classifyMongoError(error);
    global._mongoIsConnected = false;
    global._mongoLastIssue = issueCode;
    global._mongoRetryAt = Date.now() + 2_000;
    global._mongoClientPromise = undefined;
    // Closing may wait for DNS too; keep cleanup outside the request's timeout.
    void candidate?.close().catch(() => {});
    console.warn('[MongoDB] Connection unavailable; retrying after 2 seconds.', { issue: issueCode });
    if (error instanceof MongoServerSelectionError && error.reason) {
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

function ensureMongoClient(): Promise<MongoClient | null> {
  if (!global._mongoClientPromise || (global._mongoRetryAt && Date.now() >= global._mongoRetryAt)) {
    global._mongoRetryAt = 0;
    global._mongoClientPromise = initClient();
  }
  return global._mongoClientPromise;
}

const lazyClientPromise: Promise<MongoClient | null> = {
  then: (onFulfilled, onRejected) => ensureMongoClient().then(onFulfilled, onRejected),
  catch: (onRejected) => ensureMongoClient().catch(onRejected),
  finally: (onFinally) => ensureMongoClient().finally(onFinally),
  [Symbol.toStringTag]: 'Promise',
};

export default lazyClientPromise;

/** Share a single connection attempt, including retries after a transient outage. */
export async function getDb(): Promise<Db | null> {
  try {
    const mongoClient = await ensureMongoClient();
    if (!mongoClient) {
      global._mongoClientPromise = undefined;
      return null;
    }
    return mongoClient.db(resolveDbName());
  } catch {
    global._mongoClientPromise = undefined;
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
 db.collection('admin_audit_log').createIndex({ timestamp: -1 }),
 db.collection('admin_audit_log').createIndex({ targetUserId: 1, timestamp: -1 }),
 db.collection('email_verifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
 db.collection('settings').createIndex({ workspaceId: 1 }, { unique: true }),
 ]);
 } catch (error) {
 console.warn('Notice: Index creation skipped or deferred:', error);
 }
}
