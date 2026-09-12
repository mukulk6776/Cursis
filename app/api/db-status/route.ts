import { NextResponse } from 'next/server';
import { getDb, isMongoConnected } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  let mongoConnected = false;
  let dbError = null;
  let dbCollections: string[] = [];
  let counts: Record<string, number> = {};

  try {
    mongoConnected = await isMongoConnected();
    const db = await getDb();
    if (db) {
      const cols = await db.listCollections().toArray();
      dbCollections = cols.map((c) => c.name);
      for (const name of ['users', 'invitations', 'notifications', 'workspace_teams', 'workspaces']) {
        if (dbCollections.includes(name)) {
          counts[name] = await db.collection(name).countDocuments();
        }
      }
    }
  } catch (err: any) {
    dbError = err?.message || String(err);
  }

  return NextResponse.json({
    mongoConnected,
    dbError,
    dbCollections,
    counts,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    mongoUriHost: process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1]?.split('/')[0] : null,
  });
}
