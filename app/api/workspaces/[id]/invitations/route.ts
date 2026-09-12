export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import {
  createTeamInvitation,
  getWorkspaceInvitations,
  revokeWorkspaceInvitation,
  isWorkspaceAdminOrOwner,
} from '@/lib/db/invitations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { id: rawWorkspaceId } = await params;
    const workspaceId =
      rawWorkspaceId && rawWorkspaceId !== 'ws_default' && rawWorkspaceId !== 'ws_public'
        ? rawWorkspaceId
        : authUser.workspaceId || ('ws_' + authUser.uid);

    // Authorization check: Only Owner or Admin can view pending invitations
    const isAuth = await isWorkspaceAdminOrOwner(workspaceId, {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      role: authUser.role,
    });

    if (!isAuth) {
      return apiError('Forbidden: Only Workspace Owners or Admins can view invitations.', 403);
    }

    const invitations = await getWorkspaceInvitations(workspaceId);
    return apiSuccess({ invitations });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve invitations', error.statusCode || 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { id: rawWorkspaceId } = await params;
    const workspaceId =
      rawWorkspaceId && rawWorkspaceId !== 'ws_default' && rawWorkspaceId !== 'ws_public'
        ? rawWorkspaceId
        : authUser.workspaceId || ('ws_' + authUser.uid);

    const body = await request.json().catch(() => ({}));
    const email = body.email?.trim()?.toLowerCase();

    if (!email) {
      return apiError('Recipient email is required', 400);
    }

    const host = request.headers.get('host') || undefined;

    const invitation = await createTeamInvitation({
      workspaceId,
      inviterUser: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role,
      },
      inviteeEmail: email,
      role: body.role || body.workspaceRole || 'member',
      department: body.department,
      team: body.team,
      note: body.note,
      reqHost: host,
    });

    return apiSuccess({ invitation, message: `Invitation sent to ${email}` }, 201);
  } catch (error: any) {
    const status = error.statusCode || (error.message?.includes('No registered user account found') ? 404 : 400);
    return apiError(error.message || 'Failed to send invitation', status);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { id: rawWorkspaceId } = await params;
    const workspaceId =
      rawWorkspaceId && rawWorkspaceId !== 'ws_default' && rawWorkspaceId !== 'ws_public'
        ? rawWorkspaceId
        : authUser.workspaceId || ('ws_' + authUser.uid);
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId') || searchParams.get('id');

    if (!invitationId) {
      return apiError('invitationId is required', 400);
    }

    await revokeWorkspaceInvitation(workspaceId, invitationId, {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      role: authUser.role,
    });

    return apiSuccess({ message: 'Invitation revoked successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to revoke invitation', error.statusCode || 500);
  }
}
