import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getWorkspace, updateWorkspace } from '@/lib/db/workspaces';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Valid session or token required.', 401);
    }

    const { id } = await params;
    const auth = await authorizeWorkspaceAccess(request, id);
    if (auth.errorResponse) return auth.errorResponse;

    const workspace = await getWorkspace(id);
    if (!workspace) {
      return apiError('Workspace not found.', 404);
    }

    return apiSuccess({ workspace });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Valid session or token required.', 401);
    }

    const { id } = await params;
    // Only owner or admin can update workspace configuration
    const auth = await authorizeWorkspaceAccess(request, id, ['owner', 'admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const updated = await updateWorkspace(id, body);

    if (!updated) {
      return apiError('Workspace not found or update failed.', 404);
    }

    return apiSuccess({ workspace: updated, message: 'Workspace updated successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
