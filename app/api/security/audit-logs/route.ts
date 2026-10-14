import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getAuditLogs, logAuditEvent } from '@/lib/db/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const auditLogs = await getAuditLogs(wsAuth.workspaceId);
    return apiSuccess({ auditLogs });
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
    const authUser = wsAuth.user;

    const action = String(body.action || 'unknown');
    const target = String(body.target || '');
    const details = body.details || '';

    const entry = await logAuditEvent(wsAuth.workspaceId, {
      actorType: 'user',
      actorId: authUser.uid || authUser.email,
      actorName: authUser.displayName || authUser.email,
      action,
      targetType: target || 'settings',
      targetId: target || 'workspace',
      details: typeof details === 'string' ? { summary: details } : details,
      isRollbackable: false,
    });

    return apiSuccess({
      auditLog: {
        id: entry.id,
        actor: entry.actorName,
        action: entry.action,
        target: entry.targetType,
        details: typeof entry.details === 'object' ? (entry.details.summary || JSON.stringify(entry.details)) : String(entry.details),
        timestamp: entry.createdAt,
      },
    }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
