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
    return apiSuccess({ owner: auth.role === 'owner', weekly: preferences?.weekly !== false, daily: preferences?.daily === true, capacityHours: preferences?.capacityHours ?? null,
      paused: reportsPaused(unsubscribe?.unsubscribedAt, preferences?.consentAt) });
  } catch (error) { return engagementFailure(error); }
}

export async function PATCH(request: Request) {
  try {
    const parsed = z.object({ workspaceId: z.string().min(1).max(128), weekly: z.boolean().optional(), daily: z.boolean(), capacityHours: z.number().min(1).max(168).nullable().optional(), resume: z.boolean() }).strict().safeParse(await readAppBody(request));
    if (!parsed.success) return apiError('Invalid email preferences.', 400);
    const auth = await authorizeWorkspaceAccess(request, parsed.data.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    if (auth.role !== 'owner' && (parsed.data.weekly !== undefined || parsed.data.capacityHours !== undefined)) return apiError('Only the workspace owner can manage weekly reports and workload limits.', 403);
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    const { weekly, daily, capacityHours, resume } = parsed.data;
    await db.collection<{ _id: string; workspaceId: string; userId: string; weekly?: boolean; daily: boolean; capacityHours?: number | null; consentAt?: string }>('workspace_email_preferences').updateOne(
      { _id: `${auth.workspaceId}:${auth.user.uid}` }, { $set: { workspaceId: auth.workspaceId, userId: auth.user.uid, daily,
        ...(weekly !== undefined ? { weekly } : {}), ...(capacityHours !== undefined ? { capacityHours } : {}), ...(resume ? { consentAt: new Date().toISOString() } : {}) } }, { upsert: true },
    );
    return apiSuccess({ saved: true });
  } catch (error) { return engagementFailure(error); }
}
