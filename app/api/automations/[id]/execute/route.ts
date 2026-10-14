import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getAutomationById, executeAutomationRule } from '@/lib/db/automations';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const rule = await getAutomationById(id);
    if (!rule) {
      return apiError('Automation rule not found', 404);
    }

    const wsAuth = await authorizeWorkspaceAccess(request, rule.workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const result = await executeAutomationRule(id, body);
    return apiSuccess({ result });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
