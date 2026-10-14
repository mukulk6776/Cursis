import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    if (!body.name || !body.company || !body.email) {
      return apiError('Lead name, company, and email are required', 400);
    }

    const result = await OrdisEngine.prepareInboundLeadWork(wsAuth.workspaceId, {
      name: body.name,
      company: body.company,
      email: body.email,
      budget: body.budget,
      requirements: body.requirements,
    });

    return apiSuccess({ ...result });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
