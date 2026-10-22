import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/mongodb';
import { engagementFailure, readAppBody } from '@/lib/engagement/http';

export async function GET(request: Request) {
  const auth = await authorizeWorkspaceAccess(request, new URL(request.url).searchParams.get('workspaceId') || undefined);
  if (auth.errorResponse) return auth.errorResponse;
  try {
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    const workspace = await db.collection('workspaces').findOne({ id: auth.workspaceId });
    const age = Date.now() - Date.parse(workspace?.createdAt);
    if (!['owner', 'admin'].includes(auth.role) || !Number.isFinite(age) || age < 0 || age >= 7 * 86400000) return apiSuccess({ visible: false });
    const scope = { workspaceId: auth.workspaceId };
    const [dismissed, project, invitation, conversation] = await Promise.all([
      db.collection('workspace_activation').findOne({ workspaceId: auth.workspaceId, userId: auth.user.uid }),
      db.collection('projects').findOne(scope, { projection: { id: 1 } }),
      db.collection('invitations').findOne({ ...scope, inviterUserId: auth.user.uid, status: { $in: ['pending', 'accepted'] } }, { projection: { id: 1 } }),
      db.collection('ordis_conversations').findOne({ ...scope, userId: auth.user.uid, messages: { $elemMatch: { role: 'user', text: { $regex: '\\S' } } } }, { projection: { id: 1 } }),
    ]);
    const steps = [Boolean(project), Boolean(invitation), Boolean(conversation)];
    return apiSuccess({ visible: !dismissed && !steps.every(Boolean), steps });
  } catch (error) { return engagementFailure(error); }
}

export async function PATCH(request: Request) {
  try {
    const parsed = z.object({ workspaceId: z.string().min(1).max(128), dismissed: z.literal(true) }).strict().safeParse(await readAppBody(request));
    if (!parsed.success) return apiError('Invalid checklist request.', 400);
    const auth = await authorizeWorkspaceAccess(request, parsed.data.workspaceId, ['owner', 'admin']);
    if (auth.errorResponse) return auth.errorResponse;
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    await db.collection<{ _id: string; workspaceId: string; userId: string; dismissedAt: Date }>('workspace_activation').updateOne(
      { _id: `${auth.workspaceId}:${auth.user.uid}` },
      { $set: { workspaceId: auth.workspaceId, userId: auth.user.uid, dismissedAt: new Date() } }, { upsert: true },
    );
    return apiSuccess({ dismissed: true });
  } catch (error) { return engagementFailure(error); }
}
