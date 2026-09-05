import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getMeetingById, updateMeeting, deleteMeeting } from '@/lib/db/meetings';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const meeting = await getMeetingById(id);
    if (!meeting) {
      return apiError('Meeting not found', 404);
    }

    return apiSuccess({ meeting });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve meeting', 500);
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
    const existing = await getMeetingById(id);
    if (!existing) {
      return apiError('Meeting not found', 404);
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updateMeeting(id, body);

    return apiSuccess({ meeting: updated });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update meeting', 500);
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
    const existing = await getMeetingById(id);
    if (!existing) {
      return apiError('Meeting not found', 404);
    }

    await deleteMeeting(id);
    return apiSuccess({ message: 'Meeting deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete meeting', 500);
  }
}
