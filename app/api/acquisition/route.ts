import { z } from 'zod';
import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getDb } from '@/lib/mongodb';
import { readAppBody, engagementFailure } from '@/lib/engagement/http';

const input = z.object({ source: z.literal('ordis-demo'), consent: z.literal(true) }).strict();
export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const parsed = input.safeParse(await readAppBody(request));
    if (!parsed.success) return apiError('A supported source and analytics consent are required.', 400);
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    const result = await db.collection('users').updateOne({
      $or: [{ uid: auth.user.uid }, { id: auth.user.uid }],
      createdAt: { $gte: new Date(Date.now() - 7 * 86400000).toISOString() },
      signupSource: { $exists: false },
    }, { $set: { signupSource: parsed.data.source, signupSourceConsentAt: new Date() } });
    return apiSuccess({ recorded: result.modifiedCount === 1 });
  } catch (error) { return engagementFailure(error); }
}
