import { NextResponse } from 'next/server';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { reassignOrPairHelper, getTaskById } from '@/lib/db/tasks';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!body.taskId) {
      return apiError('taskId is required', 400);
    }

    // Look up the task first to get its workspaceId for auth
    const task = await getTaskById(body.taskId);
    if (!task) {
      return apiError('Task not found', 404);
    }

    // Enforce workspace membership — only managers/admins/owners can reassign
    const auth = await authorizeWorkspaceAccess(request, task.workspaceId, ['owner', 'admin', 'manager']);
    if (auth.errorResponse) return auth.errorResponse;

    if (!body.newAssigneeId) {
      return apiError('newAssigneeId is required', 400);
    }

    const updatedTask = await reassignOrPairHelper(body.taskId, body.newAssigneeId, body.helperId);
    if (!updatedTask) {
      return apiError('Task not found', 404);
    }

    return apiSuccess({ task: updatedTask });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
