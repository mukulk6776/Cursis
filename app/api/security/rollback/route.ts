import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { rollbackAction } from '@/lib/db/audit';
import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import { AuditLogEntry } from '@/lib/db/types';

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    if (!body.auditId) {
      return apiError('auditId is required', 400);
    }

    // Find audit entry to check workspace
    let entry: AuditLogEntry | null = null;
    try {
      const col = await getCollection<AuditLogEntry>('audit_logs');
      if (col) {
        entry = (await col.findOne({ id: body.auditId })) as AuditLogEntry | null;
      }
    } catch {}
    if (!entry) {
      entry = inMemoryStore.auditLogs.get(body.auditId) || null;
    }

    if (!entry) {
      return apiError('Audit entry not found', 404);
    }

    // Only owners and admins can trigger rollbacks in the workspace
    const wsAuth = await authorizeWorkspaceAccess(request, entry.workspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const result = await rollbackAction(body.auditId, authUser.uid);
    if (!result.success) {
      return apiError(result.message, 400);
    }

    return apiSuccess({ message: result.message });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
