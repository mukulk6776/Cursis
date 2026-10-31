import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getWorkspaceMetricSummary, getWorkspaceTeamCapacity } from '@/lib/db/dashboards';
import { MAX_TEAM_MEMBERS } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const [stats, capacity] = await Promise.all([
      getWorkspaceMetricSummary(wsAuth.workspaceId),
      getWorkspaceTeamCapacity(wsAuth.workspaceId),
    ]);

    return apiSuccess(
      {
        stats,
        capacity,
        memberLimit: MAX_TEAM_MEMBERS,
      },
      200,
      { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    );
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve workspace metrics', 500);
  }
}
