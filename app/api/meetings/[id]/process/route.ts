import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { processMeetingWithOrdis } from '@/lib/db/meetings';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const result = await processMeetingWithOrdis(id, workspaceId);
    return apiSuccess({ ...result });
  } catch (error: any) {
    return apiError(error.message || 'Failed to process meeting with Ordis', 500);
  }
}
