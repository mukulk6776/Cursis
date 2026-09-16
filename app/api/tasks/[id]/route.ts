import { apiSuccess, apiError } from '@/lib/api/response';
import { getTaskById, updateTask, deleteTask } from '@/lib/db/tasks';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return apiError('Task not found', 404);
    }

    // Verify requesting user is an active member of this task's workspace
    const auth = await authorizeWorkspaceAccess(request, task.workspaceId);
    if (auth.errorResponse) {
      return apiError('Task not found or access denied.', 404);
    }

    return apiSuccess({ task });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve task', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return apiError('Task not found', 404);
    }

    // Verify workspace access
    const auth = await authorizeWorkspaceAccess(request, task.workspaceId);
    if (auth.errorResponse) {
      return apiError('Task not found or access denied.', 404);
    }

    const body = await request.json().catch(() => ({}));
    try {
      const updated = await updateTask(id, body, task.workspaceId);
      if (!updated) {
        return apiError('Task update failed.', 404);
      }
      return apiSuccess({ task: updated });
    } catch (valErr: any) {
      return apiError(valErr.message || 'Task update validation failed.', 400);
    }
  } catch (error: any) {
    return apiError(error.message || 'Failed to update task', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return apiError('Task not found', 404);
    }

    // Verify workspace access
    const auth = await authorizeWorkspaceAccess(request, task.workspaceId);
    if (auth.errorResponse) {
      return apiError('Task not found or access denied.', 404);
    }

    const isOwnerOrAdmin = ['owner', 'admin', 'manager'].includes(auth.role);
    const isCreator = task.creatorId === authUser.uid;
    if (!isOwnerOrAdmin && !isCreator) {
      return apiError('Forbidden: Only workspace admins or the task creator can delete this task.', 403);
    }

    await deleteTask(id, task.workspaceId);
    return apiSuccess({ message: 'Task deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete task', 500);
  }
}
