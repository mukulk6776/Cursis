import { apiSuccess, apiError } from '@/lib/api/response';
import { getTasks, createTask, getTaskById, updateTask, deleteTask } from '@/lib/db/tasks';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const { searchParams } = new URL(request.url);
    const paramWs = searchParams.get('workspaceId');
    const workspaceId = (paramWs && paramWs !== 'ws_default' && paramWs !== 'ws_public')
      ? paramWs.trim()
      : (authUser.workspaceId || `ws_${authUser.uid}`);

    // Authorize that requesting user is a member of this workspace
    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const projectId = searchParams.get('projectId') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const isAtRisk = searchParams.get('isAtRisk') !== null ? searchParams.get('isAtRisk') === 'true' : undefined;

    const tasks = await getTasks(workspaceId, { projectId, assigneeId, departmentId, status, priority, isAtRisk });
    return apiSuccess({ tasks });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve tasks', 500);
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const body = await request.json().catch(() => ({}));
    const rawWs = body.workspaceId;
    const workspaceId = (rawWs && rawWs !== 'ws_default' && rawWs !== 'ws_public')
      ? String(rawWs).trim()
      : (authUser.workspaceId || `ws_${authUser.uid}`);

    // Authorize workspace access
    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const title = body.title || body.name;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('Task title is required.', 400);
    }

    try {
      const task = await createTask(workspaceId, {
        ...body,
        title: title.trim(),
        creatorId: authUser.uid,
        createdBy: authUser.displayName || authUser.email,
      });

      return apiSuccess({ task }, 201);
    } catch (validationErr: any) {
      return apiError(validationErr.message || 'Validation failed for task creation.', 400);
    }
  } catch (error: any) {
    return apiError(error.message || 'Failed to create task', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id || body.taskId;

    if (!id) {
      return apiError('Task ID is required for update.', 400);
    }

    const existing = await getTaskById(id);
    if (!existing) {
      return apiError('Task not found.', 404);
    }

    // Authorize against existing task's workspace
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    try {
      const updated = await updateTask(id, body, existing.workspaceId);
      if (!updated) {
        return apiError('Task not found or update failed.', 404);
      }
      return apiSuccess({ task: updated });
    } catch (valErr: any) {
      return apiError(valErr.message || 'Validation failed for task update.', 400);
    }
  } catch (error: any) {
    return apiError(error.message || 'Failed to update task', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('Task ID is required for deletion.', 400);
    }

    const existing = await getTaskById(id);
    if (!existing) {
      return apiError('Task not found.', 404);
    }

    // Authorize workspace access
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    // RBAC: Only owner, admin, manager or task creator can delete
    const isOwnerOrAdmin = ['owner', 'admin', 'manager'].includes(auth.role);
    const isCreator = existing.creatorId === authUser.uid;
    if (!isOwnerOrAdmin && !isCreator) {
      return apiError('Forbidden: Only workspace admins or the task creator can delete this task.', 403);
    }

    const success = await deleteTask(id, existing.workspaceId);
    return apiSuccess({ success, message: 'Task deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete task', 500);
  }
}
