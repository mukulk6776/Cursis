import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({
      success: false,
      error: 'MONGODB_URI environment variable is not defined',
    });
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
      cluster: uri.split('@')[1]?.split('/')[0],
      dbName: db.databaseName,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      mongoConnected: false,
      errorName: err.name,
      errorMessage: err.message,
      errorCode: err.code,
      errorCause: err.cause ? (err.cause.message || String(err.cause)) : null,
      cluster: uri.split('@')[1]?.split('/')[0],
    });
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}
