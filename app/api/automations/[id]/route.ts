import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getAutomationById, updateAutomation } from '@/lib/db/automations';
import { inMemoryStore } from '@/lib/db/store';
import { getCollection } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const rule = await getAutomationById(id);
    if (!rule) return apiError('Automation rule not found', 404);

    const wsAuth = await authorizeWorkspaceAccess(request, rule.workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    return apiSuccess({ automation: rule });
  } catch (error: any) {
    return apiError(error?.message || 'Internal Server Error', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const rule = await getAutomationById(id);
    if (!rule) return apiError('Automation rule not found', 404);

    const wsAuth = await authorizeWorkspaceAccess(request, rule.workspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const updated = await updateAutomation(id, body);
    return apiSuccess({ automation: updated });
  } catch (error: any) {
    return apiError(error?.message || 'Internal Server Error', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const rule = await getAutomationById(id);
    if (!rule) return apiError('Automation rule not found', 404);

    const wsAuth = await authorizeWorkspaceAccess(request, rule.workspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    inMemoryStore.automations.delete(id);
    try {
      const col = await getCollection('automations');
      if (col) await col.deleteOne({ id });
    } catch {}

    return apiSuccess({ success: true, message: 'Automation deleted' });
  } catch (error: any) {
    return apiError(error?.message || 'Internal Server Error', 500);
  }
}
