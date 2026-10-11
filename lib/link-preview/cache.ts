import { getDb } from '@/lib/mongodb';
import { LinkPreviewData } from './fetcher';

interface CachedLinkPreview extends LinkPreviewData {
  cachedAt: Date;
  expiresAt: Date;
}

const CACHE_COLLECTION = 'link_previews';
const SUCCESS_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FAILURE_TTL = 60 * 60 * 1000; // 1 hour

export async function getCachedLinkPreview(url: string): Promise<LinkPreviewData | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const collection = db.collection<CachedLinkPreview>(CACHE_COLLECTION);

    const cached = await collection.findOne({
      url,
      expiresAt: { $gt: new Date() },
    });

    if (!cached) return null;

    // Return without internal cache fields
    const { _id, cachedAt, expiresAt, ...preview } = cached as any;
    return preview;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function cacheLinkPreview(url: string, preview: LinkPreviewData): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const collection = db.collection<CachedLinkPreview>(CACHE_COLLECTION);

    const now = new Date();
    // Cache failures (empty title/description) for shorter time
    const isFailure = !preview.title || preview.title === new URL(url).hostname;
    const ttl = isFailure ? FAILURE_TTL : SUCCESS_TTL;

    await collection.updateOne(
      { url },
      {
        $set: {
          ...preview,
          cachedAt: now,
          expiresAt: new Date(now.getTime() + ttl),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Cache write error:', error);
    // Non-critical, continue without caching
  }
}

// Cleanup expired cache entries (call periodically)
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const collection = db.collection(CACHE_COLLECTION);

    await collection.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}
