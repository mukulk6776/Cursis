import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getWorkspace, updateWorkspace } from '@/lib/db/workspaces';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';

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
    const cleanId = (id || '').trim();
    const targetId = (cleanId === 'ws_default' || cleanId === 'ws_public')
      ? (authUser.workspaceId || `ws_${authUser.uid}`)
      : cleanId;

    // Only owner, admin, or manager can update workspace settings
    const auth = await authorizeWorkspaceAccess(request, targetId, ['owner', 'admin', 'manager']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));

    // Build workspace update object
    const workspaceUpdate: any = {};

    if (body.name) workspaceUpdate.name = body.name.trim();
    if (body.tagline) workspaceUpdate.slug = body.tagline.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (body.industry) workspaceUpdate.industry = body.industry;
    if (body.teamSize) workspaceUpdate.teamSize = body.teamSize;

    // Merge settings
    if (body.settings || body.timezone || body.dateFormat || body.companyTone) {
      const currentWorkspace = await getWorkspace(targetId);
      workspaceUpdate.settings = {
        ...(currentWorkspace?.settings || {}),
        ...(body.settings || {}),
      };

      if (body.timezone) workspaceUpdate.settings.timezone = body.timezone;
      if (body.dateFormat) workspaceUpdate.settings.dateFormat = body.dateFormat;
      if (body.companyTone) workspaceUpdate.settings.companyTone = body.companyTone;
    }

    const updated = await updateWorkspace(targetId, workspaceUpdate);

    if (!updated) {
      return apiError('Workspace not found or update failed.', 404);
    }

    return apiSuccess({ workspace: updated, message: 'Workspace settings updated successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
