import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import { UserRole, Workspace, WorkspaceMembership, WorkspaceTeamMember, UserProfile } from '@/lib/db/types';
import { getAuthenticatedUser, AuthenticatedUser } from '@/lib/auth/session';
import { isFounderEmail } from '@/lib/auth/founder';
import { apiError } from '@/lib/api/response';
import { NextResponse } from 'next/server';

/**
 * Resolves the effective workspace-specific role for a user.
 * Returns 'owner' | 'admin' | 'manager' | 'member' | 'guest' | 'client' | null (if not a member).
 */
export async function getUserWorkspaceRole(userId: string, workspaceId: string, email?: string): Promise<UserRole | null> {
  const cleanUid = (userId || '').trim();
  const cleanWsId = (workspaceId || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanUid) return null;

  // Sovereign Founder is ALWAYS Owner
  if (cleanEmail && isFounderEmail(cleanEmail)) {
    return 'owner';
  }

  // 1. Direct personal or default workspace matching
  if (cleanWsId === `ws_${cleanUid}` || !cleanWsId || cleanWsId === 'ws_default' || cleanWsId === 'ws_public') {
    return 'owner';
  }

  // 2. Check MongoDB workspaces collection for ownership
  try {
    const wsCol = await getCollection<Workspace>('workspaces');
    if (wsCol) {
      const wsDoc = await wsCol.findOne({ id: cleanWsId });
      if (wsDoc) {
        if (wsDoc.ownerId === cleanUid || (cleanEmail && (wsDoc as any).ownerEmail?.toLowerCase() === cleanEmail)) {
          return 'owner';
        }
      }
    }
  } catch (e) {
    console.warn('[RBAC] workspaces query warning:', e);
  }

  // 3. Check MongoDB workspace_memberships collection
  try {
    const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');
    if (memCol) {
      const memDoc = await memCol.findOne({ workspaceId: cleanWsId, userId: cleanUid });
      if (memDoc && memDoc.role) {
        return memDoc.role as UserRole;
      }
    }
  } catch (e) {
    console.warn('[RBAC] workspace_memberships query warning:', e);
  }

  // 4. Check MongoDB workspace_teams collection
  try {
    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    if (teamCol) {
      const teamDoc = await teamCol.findOne({
        workspaceId: cleanWsId,
        $or: [{ userId: cleanUid }, { id: cleanUid }],
      });
      if (teamDoc && teamDoc.role) {
        return teamDoc.role as UserRole;
      }
    }
  } catch (e) {
    console.warn('[RBAC] workspace_teams query warning:', e);
  }

  // 5. In-Memory Store checks
  const memWs = inMemoryStore.workspaces.get(cleanWsId);
  if (memWs && (memWs.ownerId === cleanUid || (cleanEmail && (memWs as any).ownerEmail?.toLowerCase() === cleanEmail))) {
    return 'owner';
  }

  const memUser = inMemoryStore.users.get(cleanUid);
  if (memUser) {
    if (isFounderEmail(memUser.email)) return 'owner';
    if (memUser.role === 'owner') return 'owner';
    if (Array.isArray(memUser.workspaceIds) && memUser.workspaceIds.includes(cleanWsId)) {
      return (memUser.role as UserRole) || 'member';
    }
  }

  // 6. Check MongoDB users collection
  try {
    const userCol = await getCollection<UserProfile>('users');
    if (userCol) {
      const uDoc = await userCol.findOne({ $or: [{ id: cleanUid }, { uid: cleanUid }] });
      if (uDoc) {
        if (isFounderEmail(uDoc.email)) return 'owner';
        if (uDoc.role === 'owner') return 'owner';
        if (Array.isArray(uDoc.workspaceIds) && uDoc.workspaceIds.includes(cleanWsId)) {
          return (uDoc.role as UserRole) || 'member';
        }
      }
    }
  } catch {}

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
  errorResponse: null;
}

export interface WorkspaceAuthError {
  user: null;
  role: null;
  errorResponse: NextResponse;
}

/**
 * Server-side guard to authenticate the user and verify their membership and role in the target workspace.
 */
export async function authorizeWorkspaceAccess(
  request: Request,
  workspaceId: string,
  requiredRoles?: UserRole[]
): Promise<WorkspaceAuthResult | WorkspaceAuthError> {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return {
      user: null,
      role: null,
      errorResponse: apiError('Unauthorized: A valid session or token is required.', 401),
    };
  }

  // Sovereign Founder is ALWAYS Owner with full access
  if (isFounderEmail(authUser.email)) {
    return {
      user: authUser,
      role: 'owner',
      errorResponse: null,
    };
  }

  const cleanWsId = (workspaceId || '').trim();
  const effectiveWsId =
    cleanWsId && cleanWsId !== 'ws_default' && cleanWsId !== 'ws_public'
      ? cleanWsId
      : authUser.workspaceId || `ws_${authUser.uid}`;

  let role = await getUserWorkspaceRole(authUser.uid, effectiveWsId, authUser.email);
  if (!role && authUser.role === 'owner') {
    role = 'owner';
  }

  if (!role) {
    return {
      user: null,
      role: null,
      errorResponse: apiError('Forbidden: You are not a member of this workspace.', 403),
    };
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    return {
      user: null,
      role: null,
      errorResponse: apiError(
        `Forbidden: Insufficient permissions in this workspace. Required: ${requiredRoles.join(' or ')}.`,
        403
      ),
    };
  }

  return {
    user: authUser,
    role,
    errorResponse: null,
  };
}
