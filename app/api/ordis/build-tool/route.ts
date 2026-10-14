import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { inMemoryStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const tools = Array.from(inMemoryStore.dynamicTools.values()).filter((t) => t.workspaceId === wsAuth.workspaceId);
    return apiSuccess({ tools });
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

    if (!body.prompt) {
      return apiError('Prompt is required', 400);
    }

    const tool = await OrdisEngine.buildDynamicTool(wsAuth.workspaceId, body.prompt);
    return apiSuccess({ tool }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
