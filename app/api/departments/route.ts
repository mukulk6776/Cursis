import { apiSuccess, apiError } from '@/lib/api/response';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/lib/db/departments';
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

    // Verify workspace membership
    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const query = (searchParams.get('q') || '').toLowerCase().trim();
    let departments = await getDepartments(workspaceId);

    if (query) {
      departments = departments.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          (d.description && d.description.toLowerCase().includes(query)) ||
          (d.lead && d.lead.toLowerCase().includes(query))
      );
    }

    return apiSuccess({ departments, total: departments.length });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve departments', 500);
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

    // RBAC: Only workspace Owner or Admin can create departments
    const auth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const name = (body.name || '').trim();
    if (!name) {
      return apiError('Department name is required.', 400);
    }

    try {
      const dept = await createDepartment(workspaceId, {
        name,
        description: body.description,
        lead: body.lead || authUser.displayName || 'Lead',
        head: body.head || body.lead || authUser.displayName || 'Lead',
        createdBy: authUser.uid,
        color: body.color || '#0f4cff',
        tags: Array.isArray(body.tags) ? body.tags : [],
      });

      return apiSuccess({ department: dept, message: 'Department created successfully' }, 201);
    } catch (valErr: any) {
      return apiError(valErr.message || 'Failed to create department.', 400);
    }
  } catch (error: any) {
    return apiError(error.message || 'Failed to create department', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized: Session or token required.', 401);
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id || body.departmentId;
    if (!id) {
      return apiError('Department ID is required for update.', 400);
    }

    const existing = await getDepartmentById(id);
    if (!existing) {
      return apiError('Department not found.', 404);
    }

    // RBAC: Only workspace Owner or Admin can edit departments
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId, ['owner', 'admin']);
    if (auth.errorResponse) return auth.errorResponse;

    try {
      const updated = await updateDepartment(id, existing.workspaceId, {
        name: body.name,
        description: body.description,
        lead: body.lead,
        head: body.head,
        color: body.color,
        tags: body.tags,
      });

      return apiSuccess({ department: updated, message: 'Department updated successfully' });
    } catch (valErr: any) {
      return apiError(valErr.message || 'Department update failed.', 400);
    }
  } catch (error: any) {
    return apiError(error.message || 'Failed to update department', 500);
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
    const taskAction = searchParams.get('taskAction') as 'reassign' | 'unassign' | null;
    const targetDepartmentId = searchParams.get('targetDepartmentId') || undefined;

    if (!id) {
      return apiError('Department ID is required for deletion.', 400);
    }

    const existing = await getDepartmentById(id);
    if (!existing) {
      return apiError('Department not found.', 404);
    }

    // RBAC: Only workspace Owner or Admin can delete departments
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId, ['owner', 'admin']);
    if (auth.errorResponse) return auth.errorResponse;

    try {
      const result = await deleteDepartment(id, existing.workspaceId, {
        taskAction: taskAction || undefined,
        targetDepartmentId,
      });

      return apiSuccess({
        message: 'Department deleted successfully.',
        id,
        activeTasksHandled: result.activeTasksHandled,
      });
    } catch (safeErr: any) {
      if (safeErr.code === 'ACTIVE_TASKS_EXIST') {
        return apiError(safeErr.message, 400, {
          code: 'ACTIVE_TASKS_EXIST',
          activeTaskCount: safeErr.activeTaskCount,
          departmentName: safeErr.departmentName,
        });
      }
      return apiError(safeErr.message || 'Failed to delete department.', 400);
    }
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete department', 500);
  }
}
