import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import { UserRole, Workspace, WorkspaceMembership } from '@/lib/db/types';
import { getAuthenticatedUser, AuthenticatedUser } from '@/lib/auth/session';
import { inMemoryMemberships, invitationRole } from '@/lib/db/memberships';
import { apiError } from '@/lib/api/response';
import { NextResponse } from 'next/server';

/**
 * Resolves the effective workspace-specific role for a user.
 * Returns 'owner' | 'admin' | 'manager' | 'member' | 'guest' | 'client' | null (if not a member).
 */
export async function getUserWorkspaceRole(userId: string, workspaceId: string, email?: string): Promise<UserRole | null> {
  const cleanUid = (userId || '').trim();
  const cleanWsId = (workspaceId || '').trim();
  if (!cleanUid || !cleanWsId) return null;
  // The workspace ownerId alone grants ownership; never use profile roles or email.
  const wsCol = await getCollection<Workspace>('workspaces');
  const workspace = wsCol ? await wsCol.findOne({ id: cleanWsId }) : inMemoryStore.workspaces.get(cleanWsId);
  if (!workspace) return null;
  if (workspace.ownerId === cleanUid) return 'owner';
  const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');
  const membership = memCol
    ? await memCol.findOne({ workspaceId: cleanWsId, userId: cleanUid })
    : inMemoryMemberships.get(`${cleanWsId}_${cleanUid}`);
  if (membership) return invitationRole(membership.role);

  return null;
}

/**
 * Checks whether a user is an active member of the specified workspace.
 */
export async function isWorkspaceMember(userId: string, workspaceId: string, email?: string): Promise<boolean> {
  const role = await getUserWorkspaceRole(userId, workspaceId, email);
  return role !== null;
}

export interface WorkspaceAuthResult {
  user: AuthenticatedUser;
  role: UserRole;
  workspaceId: string;
  errorResponse: null;
}

export interface WorkspaceAuthError {
  user: null;
  role: null;
  workspaceId: null;
  errorResponse: NextResponse;
}

/**
 * Server-side guard to authenticate the user and verify their membership and role in the target workspace.
 */
export async function authorizeWorkspaceAccess(
  request: Request,
  workspaceId?: string,
  requiredRoles?: UserRole[]
): Promise<WorkspaceAuthResult | WorkspaceAuthError> {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return {
      user: null,
      role: null,
      workspaceId: null,
      errorResponse: apiError('Unauthorized: A valid session or token is required.', 401),
    };
  }

  const cleanWsId = (workspaceId || '').trim();
  const effectiveWsId =
    cleanWsId && cleanWsId !== 'ws_default' && cleanWsId !== 'ws_public'
      ? cleanWsId
      : authUser.workspaceId || `ws_${authUser.uid}`;

  const role = await getUserWorkspaceRole(authUser.uid, effectiveWsId, authUser.email);

  if (!role) {
    return {
      user: null,
      role: null,
      workspaceId: null,
      errorResponse: apiError('Forbidden: You are not a member of this workspace.', 403),
    };
  }

  if (role === 'viewer' && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { user: null, role: null, workspaceId: null, errorResponse: apiError('Forbidden: Viewers have read-only access.', 403) };
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    return {
      user: null,
      role: null,
      workspaceId: null,
      errorResponse: apiError(
        `Forbidden: Insufficient permissions in this workspace. Required: ${requiredRoles.join(' or ')}.`,
        403
      ),
    };
  }

  return {
    user: authUser,
    role,
    workspaceId: effectiveWsId,
    errorResponse: null,
  };
}
