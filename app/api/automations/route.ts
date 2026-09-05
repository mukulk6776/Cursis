import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getAutomations, createAutomation } from '@/lib/db/automations';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const automations = await getAutomations(workspaceId);
    return apiSuccess({ automations });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve automations', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.name || !body.trigger || !body.actions) {
      return apiError('Automation name, trigger, and actions are required', 400);
    }

    const automation = await createAutomation(workspaceId, body);
    return apiSuccess({ automation }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create automation', 500);
  }
}
