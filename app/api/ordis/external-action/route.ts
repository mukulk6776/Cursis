import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    if (!body.actionType) {
      return apiError('actionType is required (e.g. send_invoice, sync_salesforce_crm, send_docusign_contract, book_calendar_slot)', 400);
    }

    const result = await OrdisEngine.dispatchOutsideAction(
      wsAuth.workspaceId,
      body.actionType,
      body.payload || {}
    );

    return apiSuccess({ ...result });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
