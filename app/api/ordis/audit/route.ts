import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { getAuditLogs } from '@/lib/db/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const auditLogs = await getAuditLogs(wsAuth.workspaceId);
    return apiSuccess({ auditLogs, totalLogs: auditLogs.length });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

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
