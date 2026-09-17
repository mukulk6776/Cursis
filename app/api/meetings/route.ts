import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getMeetings, createMeeting, deleteMeeting, updateMeeting } from '@/lib/db/meetings';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const meetings = await getMeetings(workspaceId);
    return apiSuccess({ meetings });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve meetings', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const title = body.title || body.name;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('Meeting title is required', 400);
    }

    const meeting = await createMeeting(workspaceId, {
      ...body,
      title: title.trim(),
      hostId: authUser.uid,
      hostName: authUser.displayName,
    });

    return apiSuccess({ meeting }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create meeting', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const { id, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return apiError('Meeting ID is required for update', 400);
    }

    const meeting = await updateMeeting(id, updates);
    if (!meeting) {
      return apiError('Meeting not found', 404);
    }

    return apiSuccess({ meeting, message: 'Meeting updated successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update meeting', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('Meeting ID is required for deletion', 400);
    }

    const success = await deleteMeeting(id);
    return apiSuccess({ success, message: 'Meeting deleted successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete meeting', 500);
  }
}
