import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '@/lib/db/departments';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    let departments = await getDepartments(workspaceId);

    // Compute live member count dynamically from users collection if available
    try {
      const db = await getDb();
      if (db) {
        const users = await db.collection('users').find({
          $or: [{ workspaceIds: workspaceId }, { activeWorkspaceId: workspaceId }],
        }).toArray();

        departments = departments.map((d) => {
          const count = users.filter((u: any) => u.department === d.name || u.departmentId === d.id).length;
          return {
            ...d,
            membersCount: count || d.membersCount || 0,
            memberCount: count || d.memberCount || 0,
          };
        });
      }
    } catch {}

    if (query) {
      departments = departments.filter((d) =>
        d.name.toLowerCase().includes(query) ||
        (d.description && d.description.toLowerCase().includes(query)) ||
        (d.lead && d.lead.toLowerCase().includes(query)) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    return apiSuccess({ departments, total: departments.length });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve departments', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    // RBAC: Only owner and admin can create departments
    const allowedRoles = ['owner', 'admin'];
    if (!allowedRoles.includes(authUser.role)) {
      return apiError('Forbidden: Only workspace owners and admins can create departments.', 403);
    }

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const name = (body.name || '').trim();
    if (!name) {
      return apiError('Validation Error: Department name is required.', 400);
    }

    // Check for duplicate department name in this workspace
    const existing = await getDepartments(workspaceId);
    if (existing.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      return apiError(`Validation Error: A department named "${name}" already exists in this workspace.`, 409);
    }

    const dept = await createDepartment(workspaceId, {
      name,
      description: body.description,
      lead: body.lead || authUser.displayName,
      head: body.head || body.lead || authUser.displayName,
      budget: body.budget,
      color: body.color || '#0f4cff',
      tags: Array.isArray(body.tags) ? body.tags : ['Core Team'],
    });

    return apiSuccess({ department: dept, message: 'Department created successfully' }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create department', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    // RBAC: Only owner and admin can update departments
    const allowedRoles = ['owner', 'admin'];
    if (!allowedRoles.includes(authUser.role)) {
      return apiError('Forbidden: Only workspace owners and admins can edit departments.', 403);
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id || body.departmentId;
    if (!id) {
      return apiError('Department ID is required for update.', 400);
    }

    const updates: any = {};
    if (body.name) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.lead !== undefined) {
      updates.lead = body.lead;
      updates.head = body.lead;
    }
    if (body.budget !== undefined) updates.budget = body.budget;
    if (body.color !== undefined) updates.color = body.color;
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : [];

    const updated = await updateDepartment(id, updates);
    return apiSuccess({ department: updated, message: 'Department updated successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update department', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    // RBAC: Only owner and admin can delete departments
    const allowedRoles = ['owner', 'admin'];
    if (!allowedRoles.includes(authUser.role)) {
      return apiError('Forbidden: Only workspace owners and admins can delete departments.', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiError('Department ID is required for deletion.', 400);
    }

    // Safety Validation: Check if members are assigned
    const db = await getDb();
    if (db) {
      const assignedCount = await db.collection('users').countDocuments({
        $or: [{ departmentId: id }, { department: id }],
      });
      if (assignedCount > 0) {
        return apiError(
          `Cannot delete department: ${assignedCount} workspace member(s) are currently assigned to this department. Please reassign them first.`,
          400
        );
      }
    }

    const deleted = await deleteDepartment(id);
    return apiSuccess({ message: 'Department deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete department', 500);
  }
}
