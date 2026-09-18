import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Require authentication — this endpoint exposes internal infrastructure details
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Only owners can view DB status
  if (authUser.role !== 'owner' && authUser.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { success: false, error: 'MONGODB_URI environment variable is not defined' },
      { status: 500 }
    );
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
    });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'cursis');
    await db.command({ ping: 1 });
    const cols = await db.listCollections().toArray();

    return NextResponse.json({
      success: true,
      mongoConnected: true,
      collections: cols.map((c) => c.name),
      // Redact credentials from cluster hostname
      cluster: uri.split('@')[1]?.split('/')[0] || 'configured',
      dbName: db.databaseName,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        mongoConnected: false,
        errorName: err.name,
        errorMessage: err.message,
        errorCode: err.code,
      },
      { status: 503 }
    );
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}
