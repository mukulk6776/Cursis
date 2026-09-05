import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getTasks, createTask } from '@/lib/db/tasks';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;
    const projectId = searchParams.get('projectId') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const isAtRisk = searchParams.get('isAtRisk') !== null ? searchParams.get('isAtRisk') === 'true' : undefined;

    const tasks = await getTasks(workspaceId, { projectId, assigneeId, status, priority, isAtRisk });
    return apiSuccess({ tasks });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve tasks', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const title = body.title || body.name;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('Task title is required', 400);
    }

    const task = await createTask(workspaceId, {
      ...body,
      title: title.trim(),
      creatorId: authUser.uid,
    });

    return apiSuccess({ task }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create task', 500);
  }
}
