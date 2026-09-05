import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getTaskById, updateTask, deleteTask } from '@/lib/db/tasks';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return apiError('Task not found', 404);
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
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const existing = await getTaskById(id);
    if (!existing) {
      return apiError('Task not found', 404);
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updateTask(id, body);

    return apiSuccess({ task: updated });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update task', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const existing = await getTaskById(id);
    if (!existing) {
      return apiError('Task not found', 404);
    }

    await deleteTask(id);
    return apiSuccess({ message: 'Task deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete task', 500);
  }
}
