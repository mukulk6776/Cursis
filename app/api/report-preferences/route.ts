import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/mongodb';
import { engagementFailure, readAppBody } from '@/lib/engagement/http';
import { reportsPaused } from '@/lib/engagement/reports';

export async function GET(request: Request) {
  const auth = await authorizeWorkspaceAccess(request, new URL(request.url).searchParams.get('workspaceId') || undefined);
  if (auth.errorResponse) return auth.errorResponse;
  try {
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    const [preferences, unsubscribe] = await Promise.all([
      db.collection('workspace_email_preferences').findOne({ workspaceId: auth.workspaceId, userId: auth.user.uid }),
      db.collection('unsubscribes').findOne({ email: auth.user.email.trim().toLowerCase() }),
    ]);
    return apiSuccess({ owner: auth.role === 'owner', weekly: preferences?.weekly !== false, capacityHours: preferences?.capacityHours ?? null,
      paused: reportsPaused(unsubscribe?.unsubscribedAt, preferences?.consentAt) });
  } catch (error) { return engagementFailure(error); }
}

export async function PATCH(request: Request) {
  try {
    const parsed = z.object({ workspaceId: z.string().min(1).max(128), weekly: z.boolean(), capacityHours: z.number().min(1).max(168).nullable(), resume: z.boolean() }).strict().safeParse(await readAppBody(request));
    if (!parsed.success) return apiError('Invalid email preferences.', 400);
    const auth = await authorizeWorkspaceAccess(request, parsed.data.workspaceId, ['owner']);
    if (auth.errorResponse) return auth.errorResponse;
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    const { weekly, capacityHours, resume } = parsed.data;
    await db.collection<{ _id: string; workspaceId: string; userId: string; weekly: boolean; capacityHours: number | null; consentAt?: string }>('workspace_email_preferences').updateOne(
      { _id: `${auth.workspaceId}:${auth.user.uid}` }, { $set: { workspaceId: auth.workspaceId, userId: auth.user.uid, weekly, capacityHours, ...(resume ? { consentAt: new Date().toISOString() } : {}) } }, { upsert: true },
    );
    return apiSuccess({ saved: true });
  } catch (error) { return engagementFailure(error); }
}
