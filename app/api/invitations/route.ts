export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import {
  createTeamInvitation,
  getWorkspaceInvitations,
} from '@/lib/db/invitations';
import { getWorkspaceTeam, MAX_TEAM_MEMBERS } from '@/lib/db/team';
import { getWorkspace } from '@/lib/db/workspaces';
import { withWorkspaceLock } from '@/lib/db/workspace-lock';

function resolveWorkspaceId(raw: string | null | undefined, fallback: string): string {
  return raw && raw !== 'ws_public' && raw !== 'ws_default' ? raw.trim() : fallback;
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

    const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const invitations = await getWorkspaceInvitations(workspaceId);
    return apiSuccess({ invitations, count: invitations.length });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve workspace invitations', 500);
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

    // Only owners and admins can issue invitations
    const wsAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+[a-zA-Z0-9]$/;
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      return apiError('A valid email address is required to send an invitation', 400);
    }

    return await withWorkspaceLock(workspaceId, async () => {
      // Enforce team capacity limit (MAX_TEAM_MEMBERS = 4)
      const currentTeam = await getWorkspaceTeam(workspaceId);
      const ws = await getWorkspace(workspaceId);
      const activeCount = Math.max(currentTeam.length, ws?.memberCount || 0);
      const pendingInvitations = await getWorkspaceInvitations(workspaceId);

      if (activeCount >= MAX_TEAM_MEMBERS) {
        return apiError(
          `Workspace has reached the maximum team limit of ${MAX_TEAM_MEMBERS} members. You cannot send more invitations.`,
          400
        );
      }

      if (activeCount + pendingInvitations.length >= MAX_TEAM_MEMBERS) {
        return apiError(
          `Workspace team capacity limit reached (max ${MAX_TEAM_MEMBERS} members). Currently there are ${activeCount} active member${activeCount === 1 ? '' : 's'} and ${pendingInvitations.length} pending invitation${pendingInvitations.length === 1 ? '' : 's'}. Revoke a pending invitation or remove a member to invite more.`,
          400
        );
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
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return apiError(error.message || 'Failed to create workspace invitation', status);
  }
}
