import crypto from 'crypto';
import { eraseActiveData } from '@/lib/privacy/data';
import { privacyDb, privacyFailure, privacyJSON } from '@/lib/privacy/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Schedule POST daily with Authorization: Bearer <PRIVACY_CRON_SECRET>. Never public GET.
export async function POST(request: Request) {
  const configured = process.env.PRIVACY_CRON_SECRET;
  const expected = Buffer.from(`Bearer ${configured || ''}`);
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  if (!configured || configured.length < 32 || expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return privacyJSON({ error: 'Unauthorized' }, 401);
  try {
    const db = await privacyDb();
    await db.collection('privacy_nominees').createIndex({ uid: 1 }, { unique: true });
    await db.collection('privacy_erasures').createIndex({ id: 1 }, { unique: true });
    for (const name of ['privacy_consents', 'privacy_requests']) await db.collection(name).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    // Legal retention is assessed before deletion. An operator must record approval and evidence.
    // Lease expires after a crash; the eraser is idempotent. Provider tasks are never auto-closed.
    const now = new Date();
    const job = await db.collection('privacy_erasures').findOneAndUpdate({
      status: { $in: ['pending', 'retry', 'processing'] }, 'legalReview.approved': true,
      $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lt: now } }],
    }, { $set: { status: 'processing', leaseUntil: new Date(+now + 10 * 60000) } }, { returnDocument: 'after' });
    if (job) {
      try {
        const result = await eraseActiveData(db, job.uid, job.email);
        await db.collection('privacy_erasures').updateOne({ id: job.id }, { $set: {
          status: 'awaiting_external_review', activeDataErasedAt: new Date(), result,
        }, $unset: { leaseUntil: '' } });
      } catch {
        await db.collection('privacy_erasures').updateOne({ id: job.id }, { $set: { status: 'retry', lastFailureAt: new Date() }, $unset: { leaseUntil: '' } });
      }
    }
    const overdueRequests = await db.collection('privacy_requests').countDocuments({ status: { $ne: 'resolved' }, resolveBy: { $lt: now } });
    const overdueErasures = await db.collection('privacy_erasures').countDocuments({ status: { $ne: 'completed' }, dueAt: { $lt: now } });
    const awaitingRetentionReview = await db.collection('privacy_erasures').countDocuments({ status: 'pending', 'legalReview.approved': { $ne: true } });
    // Monitoring must alert on HTTP 503 or nonzero review queue; no false success on missed SLA.
    return privacyJSON({ processed: !!job, overdueRequests, overdueErasures, awaitingRetentionReview }, overdueRequests || overdueErasures ? 503 : 200);
  } catch (error) { return privacyFailure(error); }
}
