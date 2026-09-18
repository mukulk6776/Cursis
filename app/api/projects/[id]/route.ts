import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getProjectById, updateProject, deleteProject } from '@/lib/db/projects';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) return apiError('Project not found', 404);

    const auth = await authorizeWorkspaceAccess(request, project.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    return apiSuccess({ project });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve project', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getProjectById(id);
    if (!existing) return apiError('Project not found', 404);

    // Only managers+ can update projects
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId, ['owner', 'admin', 'manager']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    // Whitelist updatable fields — prevent workspaceId/ownerId injection
    const { name, description, clientName, deadline, budget, health, healthReason,
            progressPercent, teamMemberIds, milestones, linkedDocIds, linkedMeetingIds } = body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (clientName !== undefined) updates.clientName = clientName;
    if (deadline !== undefined) updates.deadline = deadline;
    if (budget !== undefined) updates.budget = budget;
    if (health !== undefined) updates.health = health;
    if (healthReason !== undefined) updates.healthReason = healthReason;
    if (progressPercent !== undefined) updates.progressPercent = progressPercent;
    if (teamMemberIds !== undefined) updates.teamMemberIds = teamMemberIds;
    if (milestones !== undefined) updates.milestones = milestones;
    if (linkedDocIds !== undefined) updates.linkedDocIds = linkedDocIds;
    if (linkedMeetingIds !== undefined) updates.linkedMeetingIds = linkedMeetingIds;

    const updated = await updateProject(id, updates);
    return apiSuccess({ project: updated });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update project', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getProjectById(id);
    if (!existing) return apiError('Project not found', 404);

    // Only owner/admin can delete projects
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId, ['owner', 'admin']);
    if (auth.errorResponse) return auth.errorResponse;

    await deleteProject(id);
    return apiSuccess({ message: 'Project deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete project', 500);
  }
}
