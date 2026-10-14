import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const report = await OrdisEngine.auditBusiness(wsAuth.workspaceId, body.prompt);
    return apiSuccess({ report });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
