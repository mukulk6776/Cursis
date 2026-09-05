import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getProjectById, updateProject, deleteProject } from '@/lib/db/projects';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return apiError('Project not found', 404);
    }

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
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const existing = await getProjectById(id);
    if (!existing) {
      return apiError('Project not found', 404);
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updateProject(id, body);

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
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const existing = await getProjectById(id);
    if (!existing) {
      return apiError('Project not found', 404);
    }

    await deleteProject(id);
    return apiSuccess({ message: 'Project deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete project', 500);
  }
}
