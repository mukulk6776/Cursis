import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getMeetings, createMeeting } from '@/lib/db/meetings';

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
