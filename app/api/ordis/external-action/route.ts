import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { requirePlanFeature } from '@/lib/plans-server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    // Restrict external action dispatching to workspace owner or admin
    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const planBlock = await requirePlanFeature(wsAuth.workspaceId, 'ordis', wsAuth.user.email);
    if (planBlock) return planBlock;

    if (!body.actionType || typeof body.actionType !== 'string' || !body.actionType.trim()) {
      return apiError('actionType is required (e.g. send_invoice, sync_salesforce_crm, send_docusign_contract, book_calendar_slot)', 400);
    }

    const payload = body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload) ? body.payload : {};

    const result = await OrdisEngine.dispatchOutsideAction(
      wsAuth.workspaceId,
      body.actionType.trim(),
      payload
    );

    return apiSuccess({ ...result });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to dispatch external action', 500);
  }
}
