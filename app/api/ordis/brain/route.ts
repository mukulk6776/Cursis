import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { requirePlanFeature } from '@/lib/plans-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const planBlock = await requirePlanFeature(wsAuth.workspaceId, 'ordis', wsAuth.user.email);
    if (planBlock) return planBlock;

    const memories = await OrdisEngine.getCompanyBrain(wsAuth.workspaceId);
    return apiSuccess({ memories });
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
    const planBlock = await requirePlanFeature(wsAuth.workspaceId, 'ordis', wsAuth.user.email);
    if (planBlock) return planBlock;

    if (!body.category || !body.key || !body.value) {
      return apiError('category, key, and value are required', 400);
    }

    const memory = await OrdisEngine.addCompanyBrainKnowledge(wsAuth.workspaceId, {
      category: body.category,
      key: body.key,
      value: body.value,
      confidence: body.confidence,
    });

    return apiSuccess({ memory }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
