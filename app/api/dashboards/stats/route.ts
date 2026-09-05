import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getWorkspaceMetricSummary } from '@/lib/db/dashboards';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const stats = await getWorkspaceMetricSummary(workspaceId);
    return apiSuccess({ stats });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve workspace metrics', 500);
  }
}
