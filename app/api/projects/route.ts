import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getProjects, createProject } from '@/lib/db/projects';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const resolvedWsId = workspaceId || authUser.workspaceId;
    const projects = await getProjects(resolvedWsId);
    return apiSuccess({ projects });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve projects', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const resolvedWsId = workspaceId || authUser.workspaceId;

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return apiError('Project name is required', 400);
    }

    const project = await createProject(resolvedWsId, {
      name: body.name.trim(),
      description: body.description,
      clientName: body.clientName,
      deadline: body.deadline,
      budget: body.budget,
      ownerId: authUser.uid,
    });

    return apiSuccess({ project }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create project', 500);
  }
}
