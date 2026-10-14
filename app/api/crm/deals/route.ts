import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getDeals, createDeal } from '@/lib/db/crm';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const deals = await getDeals(wsAuth.workspaceId);
    return apiSuccess({ deals });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve deals', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const title = body.title?.trim();
    const company = (body.company || body.client)?.trim();

    if (!title || !company) {
      return apiError('Deal title and company or client are required', 400);
    }

    const deal = await createDeal(wsAuth.workspaceId, {
      ...body,
      title,
      company,
      ownerId: authUser.uid,
    });

    return apiSuccess({ deal }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create deal', 500);
  }
}
