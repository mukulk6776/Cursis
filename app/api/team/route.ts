import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import {
  getWorkspaceTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
  sendTeamInvitation,
  getWorkspaceInvitations,
  revokeTeamInvitation,
  acceptTeamInvitation,
} from '@/lib/db/team';
import { createNotification } from '@/lib/db/notifications';

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

    // Check action type: direct add vs invitation vs accept
    const action = body.action || 'add';

    if ((action === 'accept' || action === 'accept_invitation') && body.token) {
      const member = await acceptTeamInvitation(body.token);
      if (!member) {
        return apiError('Invalid or expired invitation token', 400);
      }
      return apiSuccess({ member, message: 'Invitation accepted successfully' });
    }

    if (action === 'invite' || action === 'send_invitation') {
      const email = body.email?.trim()?.toLowerCase();
      if (!email) {
        return apiError('Recipient email is required to send invitation', 400);
      }

      const invitation = await sendTeamInvitation(workspaceId, {
        email,
        name: body.name?.trim(),
        roleTitle: body.roleTitle?.trim() || 'Team Member',
        workspaceRole: body.workspaceRole || body.role || 'member',
        department: body.department || 'Engineering',
        team: body.team || null,
        note: body.note?.trim(),
        invitedBy: authUser.uid || 'u1',
        planTier: body.planTier || 'standard',
      });

      // Dispatch notification to recipient
      await createNotification({
        userEmail: email,
        workspaceId,
        type: 'team',
        text: `<strong>${authUser.displayName || 'Workspace Admin'}</strong> invited you to join the team as <strong>${body.roleTitle || 'Team Member'}</strong>.`,
        icon: 'mail',
      });

      return apiSuccess({ invitation, message: `Invitation sent to ${email}` }, 201);
    }

    // Default: Direct Provision Member
    const displayName = (body.displayName || body.name)?.trim();
    if (!displayName) {
      return apiError('Display name is required', 400);
    }

    // Fallback to internal email if no email provided
    const email = body.email?.trim()?.toLowerCase() || `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@cursis.io`;

    const member = await addTeamMember(workspaceId, {
      email,
      displayName,
      role: body.role || 'member',
      department: body.department || 'Engineering',
      title: body.title || body.roleTitle || 'Team Member',
      skills: Array.isArray(body.skills) ? body.skills : (body.skills ? [body.skills] : ['General']),
      photoURL: body.photoURL,
      presence: body.presence || 'online',
      planTier: body.planTier || 'standard',
    });

    // Dispatch persistent notifications
    await createNotification({
      userEmail: email,
      workspaceId,
      type: 'team',
      text: `<strong>${authUser.displayName || 'Workspace Admin'}</strong> added you to the workspace as <strong>${member.title}</strong> in <strong>${member.department}</strong>.`,
      icon: 'team',
    });

    await createNotification({
      userEmail: authUser.email,
      workspaceId,
      type: 'team',
      text: `Added <strong>${member.displayName}</strong> (${email}) to team as <strong>${member.title}</strong>.`,
      icon: 'check',
    });

    return apiSuccess({ member, message: `Added ${member.displayName} to team` }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to process team action', 500);
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
    const invitationId = searchParams.get('invitationId');
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    if (invitationId) {
      await revokeTeamInvitation(invitationId);
      return apiSuccess({ message: 'Invitation revoked' });
    }

    if (userId) {
      const removed = await removeTeamMember(workspaceId, userId);
      return apiSuccess({ removed, message: 'Team member removed from workspace' });
    }

    return apiError('User ID or Invitation ID is required', 400);
  } catch (error: any) {
    return apiError(error.message || 'Failed to remove member or invitation', 500);
  }
}
