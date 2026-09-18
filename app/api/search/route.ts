import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiSuccess, apiError } from '@/lib/api/response';
import { universalSearch } from '@/lib/db/search';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const resolvedWsId = workspaceId || auth.user.workspaceId;
    const query = searchParams.get('q') || searchParams.get('query') || '';

    if (!query.trim()) {
      return apiSuccess({ query, count: 0, results: [] });
    }

    const results = await universalSearch(resolvedWsId, query);
    return apiSuccess({ query, count: results.length, results });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
