import crypto from 'crypto';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getDb } from '@/lib/mongodb';
import { sendWorkspaceReports } from '@/lib/engagement/send-reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  if (!secret || secret.length < 32 || expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return apiError('Unauthorized', 401);
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return apiError('Progress email is not configured.', 503);
  try {
    const db = await getDb();
    if (!db) return apiError('Report storage unavailable.', 503);
    const result = await sendWorkspaceReports(db);
    return apiSuccess(result, result.failed || result.review ? 503 : 200);
  } catch { return apiError('Reports could not be processed.', 503); }
}
