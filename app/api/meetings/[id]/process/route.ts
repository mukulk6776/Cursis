import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getMeetingById, processMeetingWithOrdis } from '@/lib/db/meetings';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const existing = await getMeetingById(id);
    if (!existing) {
      return apiError('Meeting not found', 404);
    }

    const wsAuth = await authorizeWorkspaceAccess(request, existing.workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const result = await processMeetingWithOrdis(id, existing.workspaceId);
    return apiSuccess({ ...result });
  } catch (error: any) {
    return apiError(error.message || 'Failed to process meeting with Ordis', 500);
  }
}
