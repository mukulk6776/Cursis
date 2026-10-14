import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getCustomBuildRequests } from '@/lib/db/agency';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const requests = await getCustomBuildRequests(wsAuth.workspaceId);
    return apiSuccess({ requests });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
