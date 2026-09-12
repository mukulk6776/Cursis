import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import {
  getWorkspaceTeam,
  removeTeamMember,
  updateTeamMember,
} from '@/lib/db/team';
import {
  createTeamInvitation,
  getWorkspaceInvitations,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
} from '@/lib/db/invitations';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    const [team, invitations] = await Promise.all([
      getWorkspaceTeam(workspaceId),
      getWorkspaceInvitations(workspaceId),
    ]);

    return apiSuccess({ team, invitations });
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
    const workspaceId = body.workspaceId || authUser.workspaceId || 'ws_public';

    // Check action type: only invitation and accept/decline actions are supported
    const action = body.action || 'invite';

    if (action === 'accept' || action === 'accept_invitation') {
      const invId = body.invitationId || body.token || body.id;
      if (!invId) {
        return apiError('Invitation ID or token is required', 400);
      }
      const result = await acceptWorkspaceInvitation(invId, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role,
      });
      return apiSuccess({ ...result, message: 'Invitation accepted successfully' });
    }

    if (action === 'decline' || action === 'decline_invitation') {
      const invId = body.invitationId || body.token || body.id;
      if (!invId) {
        return apiError('Invitation ID or token is required', 400);
      }
      const result = await declineWorkspaceInvitation(invId, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role,
      });
      return apiSuccess({ ...result, message: 'Invitation declined successfully' });
    }

    if (action === 'invite' || action === 'send_invitation') {
      const email = body.email?.trim()?.toLowerCase();
      if (!email) {
        return apiError('Recipient email is required to send invitation', 400);
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
        role: body.workspaceRole || body.role || 'member',
        department: body.department,
        team: body.team,
        note: body.note?.trim(),
        reqHost: host,
      });

      return apiSuccess({ invitation, message: `Invitation sent to ${email}` }, 201);
    }

    return apiError('Direct addition of team members is disabled. Please send an email invitation.', 400);
  } catch (error: any) {
    const status = error.statusCode || (error.message?.includes('No registered user account found') ? 404 : 400);
    return apiError(error.message || 'Failed to process team action', status);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || body.id;

    if (!userId) {
      return apiError('User ID is required for update', 400);
    }

    const updated = await updateTeamMember(userId, body.updates || body);
    if (!updated) {
      return apiError('Team member not found', 404);
    }

    return apiSuccess({ member: updated, message: 'Team member updated' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update team member', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const invitationId = searchParams.get('invitationId');
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    if (invitationId) {
      await revokeWorkspaceInvitation(workspaceId, invitationId, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role,
      });
      return apiSuccess({ message: 'Invitation revoked' });
    }

    if (userId || email) {
      // Authorization Guard: Only Owners/Admins can remove OTHER members
      const isSelfLeave = (userId && userId === authUser.uid) || (email && email.toLowerCase() === authUser.email.toLowerCase());
      if (!isSelfLeave && authUser.role !== 'owner' && (authUser as any).workspaceRole !== 'owner') {
        return apiError('Forbidden: Only Workspace Owners can remove other members.', 403);
      }

      const removed = await removeTeamMember(workspaceId, userId || '', email || undefined);
      return apiSuccess({ removed, message: 'Team member removed from workspace' });
    }

    return apiError('User ID, Email, or Invitation ID is required', 400);
  } catch (error: any) {
    return apiError(error.message || 'Failed to remove member or invitation', 500);
  }
}
