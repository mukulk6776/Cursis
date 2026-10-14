import { authorizeWorkspaceAccess, isWorkspaceMember } from '@/lib/auth/rbac';
import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import {
  getWorkspaceTeam,
  removeTeamMember,
  updateTeamMember,
  MAX_TEAM_MEMBERS,
} from '@/lib/db/team';
import {
  createTeamInvitation,
  getWorkspaceInvitations,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
} from '@/lib/db/invitations';

function resolveWorkspaceId(raw: string | null, fallback: string): string {
  return raw && raw !== 'ws_public' && raw !== 'ws_default' ? raw : fallback;
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = resolveWorkspaceId(
      searchParams.get('workspaceId'),
      authUser.workspaceId || `ws_${authUser.uid}`
    );

    // Verify the caller is a member of the workspace they're requesting
    const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const [team, invitations] = await Promise.all([
      getWorkspaceTeam(workspaceId),
      getWorkspaceInvitations(workspaceId),
    ]);

    return apiSuccess({ team, invitations, memberLimit: MAX_TEAM_MEMBERS });
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
    const workspaceId = resolveWorkspaceId(
      body.workspaceId,
      authUser.workspaceId || `ws_${authUser.uid}`
    );

    const action = body.action || 'invite';

    if (action === 'accept' || action === 'accept_invitation') {
      const invId = body.invitationId || body.token || body.id;
      if (!invId) return apiError('Invitation ID or token is required', 400);
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
      if (!invId) return apiError('Invitation ID or token is required', 400);
      const result = await declineWorkspaceInvitation(invId, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role,
      });
      return apiSuccess({ ...result, message: 'Invitation declined successfully' });
    }

    if (action === 'invite' || action === 'send_invitation') {
      // Only admins/owners can invite
      const wsAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
      if (wsAuth.errorResponse) return wsAuth.errorResponse;

      const email = body.email?.trim()?.toLowerCase();
      if (!email) return apiError('Recipient email is required to send invitation', 400);

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
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || body.id;
    if (!userId) return apiError('User ID is required for update', 400);

    const workspaceId = resolveWorkspaceId(
      body.workspaceId,
      authUser.workspaceId || `ws_${authUser.uid}`
    );

    const rawUpdates = body.updates && typeof body.updates === 'object' ? body.updates : body;
    const isSelf = userId === authUser.uid;
    const isModifyingRole = rawUpdates.role !== undefined;

    // Modifying roles requires owner or admin permissions
    if (isModifyingRole) {
      const roleAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
      if (roleAuth.errorResponse) return roleAuth.errorResponse;
    }

    // Only admins/owners can update other members; members can update themselves
    if (!isSelf) {
      const wsAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
      if (wsAuth.errorResponse) return wsAuth.errorResponse;

      const isTargetMember = await isWorkspaceMember(userId, workspaceId);
      if (!isTargetMember) {
        return apiError('Target user is not a member of this workspace', 404);
      }
    } else {
      const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
      if (wsAuth.errorResponse) return wsAuth.errorResponse;
    }

    // Construct allowlisted update object
    const allowedKeys = ['displayName', 'title', 'department', 'skills', 'photoURL', 'presence'] as const;
    const sanitizedUpdates: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (rawUpdates[key] !== undefined) {
        sanitizedUpdates[key] = rawUpdates[key];
      }
    }
    if (isModifyingRole && !isSelf) {
      sanitizedUpdates.role = rawUpdates.role;
    }

    const updated = await updateTeamMember(userId, sanitizedUpdates);
    if (!updated) return apiError('Team member not found', 404);

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
    const workspaceId = resolveWorkspaceId(
      searchParams.get('workspaceId'),
      authUser.workspaceId || `ws_${authUser.uid}`
    );

    if (invitationId) {
      // Only admins/owners can revoke invitations
      const wsAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
      if (wsAuth.errorResponse) return wsAuth.errorResponse;

      await revokeWorkspaceInvitation(workspaceId, invitationId, {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role,
      });
      return apiSuccess({ message: 'Invitation revoked' });
    }

    if (userId || email) {
      // Safe self-leave check: if both userId and email are supplied, BOTH must match authUser.
      // If only one is supplied, that one must match authUser.
      const isSelfLeave =
        (!userId || userId === authUser.uid) &&
        (!email || email.toLowerCase() === authUser.email.toLowerCase());

      if (!isSelfLeave) {
        // Only owners can remove other members — use workspace-scoped role check
        const wsAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner']);
        if (wsAuth.errorResponse) return wsAuth.errorResponse;
      } else {
        // Self-leave: just verify they are a member
        const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
        if (wsAuth.errorResponse) return wsAuth.errorResponse;
      }

      const removed = await removeTeamMember(workspaceId, userId || '', email || undefined);
      return apiSuccess({ removed, message: 'Team member removed from workspace' });
    }

    return apiError('User ID, Email, or Invitation ID is required', 400);
  } catch (error: any) {
    return apiError(error.message || 'Failed to remove member or invitation', 500);
  }
}
