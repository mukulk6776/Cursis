import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getMeetings, createMeeting, deleteMeeting, updateMeeting } from '@/lib/db/meetings';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const resolvedWsId = workspaceId || auth.user.workspaceId;
    const meetings = await getMeetings(resolvedWsId);
    return apiSuccess({ meetings });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve meetings', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const resolvedWsId = workspaceId || authUser.workspaceId;
    const title = body.title || body.name;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('Meeting title is required', 400);
    }

    const meeting = await createMeeting(resolvedWsId, {
      title: title.trim(),
      date: body.date,
      time: body.time,
      platform: body.platform,
      agenda: body.agenda,
      attendees: body.attendeeIds || body.attendees || [],
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
    const body = await request.json().catch(() => ({}));
    const { id, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return apiError('Meeting ID is required for update', 400);
    }

    // Import getMeetingById to check workspace
    const { getMeetingById } = await import('@/lib/db/meetings');
    const existing = await getMeetingById(id);
    if (!existing) return apiError('Meeting not found', 404);

    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const meeting = await updateMeeting(id, updates);
    return apiSuccess({ meeting, message: 'Meeting updated successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update meeting', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return apiError('Meeting ID is required for deletion', 400);

    const { getMeetingById } = await import('@/lib/db/meetings');
    const existing = await getMeetingById(id);
    if (!existing) return apiError('Meeting not found', 404);

    // Only owner/admin/manager can delete meetings
    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId, ['owner', 'admin', 'manager']);
    if (auth.errorResponse) return auth.errorResponse;

    const success = await deleteMeeting(id);
    return apiSuccess({ success, message: 'Meeting deleted successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete meeting', 500);
  }
}
