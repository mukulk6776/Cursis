import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getWorkspaceMetricSummary } from '@/lib/db/dashboards';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const stats = await getWorkspaceMetricSummary(wsAuth.workspaceId);
    return apiSuccess({ stats });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve workspace metrics', 500);
  }
}
