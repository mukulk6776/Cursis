import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { scanClientRenewals } from '@/lib/db/crm';

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const renewalInsights = await scanClientRenewals(wsAuth.workspaceId);
    return apiSuccess({ count: renewalInsights.length, renewals: renewalInsights });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
