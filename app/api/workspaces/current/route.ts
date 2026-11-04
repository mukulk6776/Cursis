export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getWorkspace } from '@/lib/db/workspaces';
import { getUserWorkspaceRole } from '@/lib/auth/rbac';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const workspaceId = authUser.workspaceId || `ws_${authUser.uid}`;
    const workspace = await getWorkspace(workspaceId);
    const role = (await getUserWorkspaceRole(authUser.uid, workspaceId, authUser.email)) || authUser.role;

    return apiSuccess({
      workspaceId,
      workspace: workspace || { id: workspaceId, name: 'Workspace', ownerId: authUser.uid },
      role,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve current workspace', 500);
  }
}
