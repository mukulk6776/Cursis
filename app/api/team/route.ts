import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getWorkspaceTeam, addTeamMember } from '@/lib/db/team';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const team = await getWorkspaceTeam(workspaceId);
    return apiSuccess({ team });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve team members', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const email = body.email?.trim();
    const displayName = (body.displayName || body.name)?.trim();

    if (!email || !displayName) {
      return apiError('Email and display name are required', 400);
    }

    const member = await addTeamMember(workspaceId, {
      email,
      displayName,
      role: body.role || 'member',
      department: body.department || 'Engineering',
      title: body.title || 'Team Member',
      skills: body.skills || ['General'],
    });

    return apiSuccess({ member }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to add team member', 500);
  }
}
