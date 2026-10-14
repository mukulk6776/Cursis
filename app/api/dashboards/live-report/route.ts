import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { generateExecutiveReport } from '@/lib/db/dashboards';

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const report = await generateExecutiveReport(wsAuth.workspaceId, body.prompt);
    return apiSuccess({ report });
  } catch (error: any) {
    return apiError(error.message || 'Failed to generate executive report', 500);
  }
}
