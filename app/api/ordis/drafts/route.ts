import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { getLeads } from '@/lib/db/crm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const leads = await getLeads(wsAuth.workspaceId);
    const drafts = leads.flatMap((l) =>
      ((l as any).drafts || []).map((d: any) => ({
        ...d,
        leadId: l.id,
        company: l.company,
        email: l.email,
        contact: l.name,
      }))
    );

    return apiSuccess({ drafts, total: drafts.length });
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
