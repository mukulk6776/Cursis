import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getUserWorkspaces, createWorkspace } from '@/lib/db/workspaces';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const workspaces = await getUserWorkspaces(authUser.uid);
    return apiSuccess({ workspaces });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve workspaces', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return apiError('Workspace name is required', 400);
    }

    const workspaceId = await createWorkspace(authUser.uid, {
      ...body,
      name: body.name.trim(),
    });

    return apiSuccess({ workspaceId }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create workspace', 500);
  }
}
