import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiError, apiSuccess } from '@/lib/api/response';
import { executeWork, workSnapshot, workCommand, WorkError, workCollections, validChannel } from '@/lib/db/work-hub';
import { readAppBody } from '@/lib/engagement/http';
import { PrivacyError } from '@/lib/privacy/core';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const auth = await authorizeWorkspaceAccess(request, params.get('workspaceId') || undefined);
    if (auth.errorResponse) return auth.errorResponse;
    const channelId = params.get('channelId');
    if (channelId) {
      await validChannel(channelId, auth.workspaceId);
      const { messages } = await workCollections();
      const before = params.get('before');
      const after = params.get('after');
      if (before && after) return apiError('Choose one message cursor.', 400);
      const result = await messages.find({ workspaceId: auth.workspaceId, channelId,
        ...(before ? { id: { $lt: before.slice(0, 180) } } : after ? { id: { $gt: after.slice(0, 180) } } : {}),
      }, { projection: { _id: 0 } }).sort({ id: after ? 1 : -1 }).limit(51).toArray();
      const page = result.slice(0, 50);
      return apiSuccess({ messages: after ? page : page.reverse(), hasMore: result.length > 50 }, 200, { 'Cache-Control': 'no-store' });
    }
    return apiSuccess(await workSnapshot(auth, params.get('date') || ''), 200, { 'Cache-Control': 'no-store' });
  } catch (error) { return apiError(error instanceof Error ? error.message : 'Workspace unavailable', error instanceof WorkError ? error.status : 500); }
}
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length')) > 40000) return apiError('Request too large.', 413);
    const body = await readAppBody(request, 40000);
    if (!body || typeof body !== 'object' || typeof body.workspaceId !== 'string') return apiError('Workspace is required.', 400);
    const auth = await authorizeWorkspaceAccess(request, body.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const parsed = workCommand.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid action.', 400);
    return apiSuccess(await executeWork(auth, parsed.data));
  } catch (error) { return apiError(error instanceof Error ? error.message : 'Action failed', error instanceof WorkError || error instanceof PrivacyError ? error.status : 500); }
}
