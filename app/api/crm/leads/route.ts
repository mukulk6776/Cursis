import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getLeads, getLeadById, createLead, updateLead } from '@/lib/db/crm';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';
    const status = (searchParams.get('status') as any) || undefined;

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const leads = await getLeads(wsAuth.workspaceId, status);
    return apiSuccess({ leads });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve leads', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    if (!body.name || !body.company || !body.email) {
      return apiError('Lead name, company, and email are required', 400);
    }

    const lead = await createLead(wsAuth.workspaceId, body);
    return apiSuccess({ lead }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create lead', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    if (!body.id) {
      return apiError('Lead id is required', 400);
    }

    const existing = await getLeadById(body.id);
    if (!existing) {
      return apiError('Lead not found', 404);
    }

    const wsAuth = await authorizeWorkspaceAccess(request, existing.workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const updated = await updateLead(body.id, body);
    if (!updated) {
      return apiError('Lead not found', 404);
    }

    return apiSuccess({ lead: updated });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update lead', 500);
  }
}
