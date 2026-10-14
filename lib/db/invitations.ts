import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from './store';
import {
  WorkspaceInvitation,
  WorkspaceMembership,
  WorkspaceTeamMember,
  UserProfile,
  DbNotification,
  UserRole,
  Workspace,
  MAX_TEAM_MEMBERS,
} from './types';
import { isFounderEmail } from '@/lib/auth/founder';
import { ensureWorkspaceExists } from './workspaces';
import { getWorkspaceTeam } from './team';
import { sendWorkspaceInvitationEmail } from '@/lib/email/notifications';

// In-memory fallback map for invitations
export const inMemoryInvitations = new Map<string, WorkspaceInvitation>();
export const inMemoryMemberships = new Map<string, WorkspaceMembership>();

export interface ActingUser {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
}

/**
 * Checks if a user is an Owner or Admin of a given workspace.
 */
export async function isWorkspaceAdminOrOwner(workspaceId: string, user: ActingUser): Promise<boolean> {
  const cleanEmail = (user.email || '').toLowerCase().trim();
  if (isFounderEmail(cleanEmail)) return true;

  // Check workspace owner
  try {
    const wsCol = await getCollection<Workspace>('workspaces');
    if (wsCol) {
      const ws = await wsCol.findOne({ id: workspaceId });
      if (ws && (ws.ownerId === user.uid || (ws as any).ownerEmail?.toLowerCase() === cleanEmail)) {
        return true;
      }
    }
  } catch {}

  const memWs = inMemoryStore.workspaces.get(workspaceId);
  if (memWs && memWs.ownerId === user.uid) return true;

  // Check user role in workspace memberships
  try {
    const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');
    if (memCol) {
      const mem = await memCol.findOne({ workspaceId, userId: user.uid });
      if (mem && (mem.role === 'owner' || mem.role === 'admin')) {
        return true;
      }
    }
  } catch {}

  // Check in-memory memberships
  const memMem = inMemoryMemberships.get(`${workspaceId}_${user.uid}`);
  if (memMem && (memMem.role === 'owner' || memMem.role === 'admin')) {
    return true;
  }

  // Do not allow global user.role to bypass workspace-specific membership
  return false;
}

/**
 * Sends a clean, email-only invitation to a registered user.
 */
export async function createTeamInvitation(params: {
  workspaceId: string;
  inviterUser: ActingUser;
  inviteeEmail: string;
  role?: UserRole | string;
  department?: string;
  team?: string | null;
  note?: string;
  reqHost?: string;
}): Promise<WorkspaceInvitation> {
  const { inviterUser, department, team, note, reqHost } = params;
  let workspaceId = (params.workspaceId || '').trim();
  if (!workspaceId || workspaceId === 'ws_default' || workspaceId === 'ws_public') {
    workspaceId = (inviterUser as any).workspaceId || ('ws_' + inviterUser.uid);
  }
  const cleanInviteEmail = (params.inviteeEmail || '').toLowerCase().trim();
  const assignedRole: UserRole = params.role === 'admin' ? 'admin' : 'member';

  if (!cleanInviteEmail || !cleanInviteEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  // Ensure workspace exists
  try {
    await ensureWorkspaceExists(workspaceId, inviterUser.uid);
  } catch {}

  // 1. Authorization check: Inviter must be Owner or Admin
  const isAuthorized = await isWorkspaceAdminOrOwner(workspaceId, inviterUser);
  if (!isAuthorized) {
    const err: any = new Error('Forbidden: Only Workspace Owners or Admins can send invitations.');
    err.statusCode = 403;
    throw err;
  }

  // 1b. Check team capacity limit (max 10 members)
  const currentTeam = await getWorkspaceTeam(workspaceId);
  if (currentTeam.length >= MAX_TEAM_MEMBERS) {
    const err: any = new Error(
      `Workspace has reached the maximum team limit of ${MAX_TEAM_MEMBERS} members. You cannot send more invitations.`
    );
    err.statusCode = 400;
    throw err;
  }

  const pendingInvitations = await getWorkspaceInvitations(workspaceId);
  if (currentTeam.length + pendingInvitations.length >= MAX_TEAM_MEMBERS) {
    const err: any = new Error(
      `Workspace team capacity limit reached (max ${MAX_TEAM_MEMBERS} members). Currently there are ${currentTeam.length} active member${currentTeam.length === 1 ? '' : 's'} and ${pendingInvitations.length} pending invitation${pendingInvitations.length === 1 ? '' : 's'}. Revoke a pending invitation or remove a member to invite more.`
    );
    err.statusCode = 400;
    throw err;
  }

  // 2. Lookup recipient in MongoDB users collection
  let registeredUser: UserProfile | null = null;
  try {
    const userCol = await getCollection<UserProfile>('users');
    if (userCol) {
      registeredUser = await userCol.findOne({ email: cleanInviteEmail });
    }
  } catch (e) {
    console.warn('MongoDB lookup invitee error:', e);
  }

  if (!registeredUser) {
    registeredUser = Array.from(inMemoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === cleanInviteEmail
    ) || null;
  }

  if (!registeredUser) {
    const err: any = new Error(
      `No registered user account found for "${cleanInviteEmail}". Users must create an account on Cursis before receiving a workspace invite.`
    );
    err.statusCode = 404;
    throw err;
  }

  const inviteeUserId = registeredUser.uid || registeredUser.id;

  // 3. Prevent self-invitation
  if (inviteeUserId === inviterUser.uid || cleanInviteEmail === inviterUser.email.toLowerCase()) {
    const err: any = new Error('You cannot invite yourself to your own workspace.');
    err.statusCode = 400;
    throw err;
  }

  // 4. Check if invitee is already an active member of the workspace
  const isAlreadyMember =
    (registeredUser.workspaceIds && registeredUser.workspaceIds.includes(workspaceId)) ||
    registeredUser.activeWorkspaceId === workspaceId;

  if (isAlreadyMember) {
    const err: any = new Error(`User "${cleanInviteEmail}" is already an active member of this workspace.`);
    err.statusCode = 400;
    throw err;
  }

  // Check workspace_memberships collection
  try {
    const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');
    if (memCol) {
      const existingMembership = await memCol.findOne({ workspaceId, userId: inviteeUserId });
      if (existingMembership) {
        const err: any = new Error(`User "${cleanInviteEmail}" is already a member of this workspace.`);
        err.statusCode = 400;
        throw err;
      }
    }
  } catch (e) {
    if ((e as any).statusCode) throw e;
  }

  // 5. Check if an active pending invitation already exists for this email & workspace
  let existingPendingInv: WorkspaceInvitation | null = null;
  let mongoChecked = false;
  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      mongoChecked = true;
      existingPendingInv = await invCol.findOne({
        workspaceId,
        email: cleanInviteEmail,
        status: 'pending',
      });
    }
  } catch {}

  if (!mongoChecked && !existingPendingInv) {
    existingPendingInv =
      Array.from(inMemoryInvitations.values()).find(
        (i) => i.workspaceId === workspaceId && i.email === cleanInviteEmail && i.status === 'pending'
      ) || null;
  }

  if (existingPendingInv) {
    const isExpired = new Date() > new Date(existingPendingInv.expiresAt);
    if (!isExpired) {
      const err: any = new Error(`An active pending invitation has already been sent to ${cleanInviteEmail}.`);
      err.statusCode = 400;
      throw err;
    }
  }

  // 6. Get workspace display name
  let wsName = 'Workspace';
  try {
    const wsCol = await getCollection<Workspace>('workspaces');
    if (wsCol) {
      const ws = await wsCol.findOne({ id: workspaceId });
      if (ws) wsName = ws.name || wsName;
    }
  } catch {}
  if (wsName === 'Workspace') {
    const memWs = inMemoryStore.workspaces.get(workspaceId);
    if (memWs) wsName = memWs.name || wsName;
  }

  // 7. Create invitation entity
  const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const token = 'tok_' + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  const invitation: WorkspaceInvitation = {
    id: invId,
    workspaceId,
    inviterUserId: inviterUser.uid,
    inviteeUserId,
    email: cleanInviteEmail,
    name: registeredUser.displayName || cleanInviteEmail.split('@')[0],
    roleTitle: assignedRole === 'admin' ? 'Workspace Admin' : 'Team Member',
    workspaceRole: assignedRole,
    department: department || 'Engineering',
    team: team || null,
    note,
    status: 'pending',
    token,
    createdAt: now,
    sentAt: now,
    expiresAt,
    invitedBy: inviterUser.uid,
    planTier: 'standard',
  };

  // Commit to DB
  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      await invCol.insertOne(invitation);
    }
  } catch (e) {
    console.warn('MongoDB insert invitation error:', e);
  }
  inMemoryInvitations.set(invId, invitation);

  // 8. Create notification for invitee in notifications collection
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notif: DbNotification = {
    id: notifId,
    userId: inviteeUserId,
    userEmail: cleanInviteEmail,
    workspaceId,
    type: 'workspace_invite',
    referenceId: invId,
    text: `<strong>${inviterUser.displayName || 'Workspace Admin'}</strong> invited you to join <strong>${wsName}</strong> as <strong>${assignedRole === 'admin' ? 'Admin' : 'Member'}</strong>.`,
    read: false,
    icon: 'mail',
    createdAt: now,
    invitationData: {
      workspaceId,
      workspaceName: wsName,
      inviterName: inviterUser.displayName || 'Workspace Admin',
      role: assignedRole,
      status: 'pending',
    },
  };

  try {
    const notifCol = await getCollection<DbNotification>('notifications');
    if (notifCol) {
      await notifCol.insertOne(notif);
    }
  } catch (e) {
    console.warn('MongoDB insert notification error:', e);
  }

  // 9. Dispatch Email if Resend configured
  sendWorkspaceInvitationEmail({
    to: cleanInviteEmail,
    workspaceName: wsName,
    recipientName: registeredUser.displayName,
    inviterName: inviterUser.displayName,
    assignedRole,
    reqHost,
  }).catch((err) => {
    console.warn('Workspace invitation email dispatch exception:', err);
  });

  return invitation;
}

/**
 * Gets all pending invitations for a given workspace (powers Pending Invites tab).
 */
export async function getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const nowIso = new Date().toISOString();
  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      const docs = await invCol
        .find({ workspaceId, status: 'pending', expiresAt: { $gt: nowIso } })
        .sort({ createdAt: -1 })
        .toArray();
      docs.forEach((inv) => inMemoryInvitations.set(inv.id, inv));
      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getWorkspaceInvitations notice:', e);
  }

  const now = new Date();
  return Array.from(inMemoryInvitations.values()).filter(
    (inv) => inv.workspaceId === workspaceId && inv.status === 'pending' && new Date(inv.expiresAt) > now
  );
}

/**
 * Revokes a pending invitation (Owner/Admin only).
 */
export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
  actingUser: ActingUser
): Promise<boolean> {
  const isAuthorized = await isWorkspaceAdminOrOwner(workspaceId, actingUser);
  if (!isAuthorized) {
    const err: any = new Error('Forbidden: Only Workspace Owners or Admins can revoke invitations.');
    err.statusCode = 403;
    throw err;
  }

  const now = new Date().toISOString();

  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      await invCol.updateOne(
        { id: invitationId, workspaceId },
        { $set: { status: 'revoked', respondedAt: now } }
      );
    }
  } catch (e) {
    console.warn('MongoDB revoke invitation error:', e);
  }

  // Update notification if one exists
  try {
    const notifCol = await getCollection<DbNotification>('notifications');
    if (notifCol) {
      await notifCol.updateMany(
        { referenceId: invitationId },
        { $set: { read: true, 'invitationData.status': 'revoked' } }
      );
    }
  } catch {}

  const memInv = inMemoryInvitations.get(invitationId);
  if (memInv && memInv.workspaceId === workspaceId) {
    memInv.status = 'revoked';
    memInv.respondedAt = now;
  }

  return true;
}

/**
 * Accepts an invitation (Invitee only).
 * Creates WorkspaceMembership, appends workspace to user profile, updates invitation and notification.
 */
export async function acceptWorkspaceInvitation(
  invitationId: string,
  actingUser: ActingUser
): Promise<{ success: boolean; workspaceId: string; role: UserRole }> {
  const now = new Date().toISOString();
  let invitation: WorkspaceInvitation | null = null;
  let mongoAvailable = false;

  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      mongoAvailable = true;
      const claimed = await invCol.findOneAndUpdate(
        {
          id: invitationId,
          status: 'pending',
          expiresAt: { $gt: now },
        },
        { $set: { status: 'accepted', respondedAt: now } },
        { returnDocument: 'before' }
      );
      if (claimed) {
        invitation = claimed;
      }
    }
  } catch (e) {
    console.warn('MongoDB atomic claim invitation error:', e);
  }

  // If MongoDB was available, an empty claim result is authoritative.
  // Never fall back to stale in-memory invitation when MongoDB returned null.
  if (!invitation && !mongoAvailable) {
    const memInv = inMemoryInvitations.get(invitationId);
    if (memInv) {
      if (memInv.status !== 'pending' || new Date() > new Date(memInv.expiresAt)) {
        const err: any = new Error('Invitation not found, expired, or already accepted.');
        err.statusCode = 400;
        throw err;
      }

      // Check recipient before claiming in memory
      const matchesUid = memInv.inviteeUserId === actingUser.uid;
      const matchesEmail = memInv.email.toLowerCase() === actingUser.email.toLowerCase();
      if (!matchesUid && !matchesEmail) {
        const err: any = new Error('Forbidden: Only the invited recipient can accept this invitation.');
        err.statusCode = 403;
        throw err;
      }

      // Check capacity before claiming in memory
      const currentTeam = await getWorkspaceTeam(memInv.workspaceId);
      const isAlreadyMember = currentTeam.some(
        (m) => m.id === actingUser.uid || m.uid === actingUser.uid || (m.email && m.email.toLowerCase() === actingUser.email.toLowerCase())
      );
      if (!isAlreadyMember && currentTeam.length >= MAX_TEAM_MEMBERS) {
        const err: any = new Error(
          `This workspace has reached its maximum capacity of ${MAX_TEAM_MEMBERS} members. Please contact the workspace owner.`
        );
        err.statusCode = 400;
        throw err;
      }

      memInv.status = 'accepted';
      memInv.respondedAt = now;
      invitation = memInv;
    }
  }

  if (!invitation) {
    const err: any = new Error('Invitation not found, expired, or already accepted.');
    err.statusCode = 400;
    throw err;
  }

  // STRICT AUTHORIZATION: For MongoDB-claimed invitations, verify recipient and capacity; revert Mongo if invalid
  const matchesUid = invitation.inviteeUserId === actingUser.uid;
  const matchesEmail = invitation.email.toLowerCase() === actingUser.email.toLowerCase();

  if (!matchesUid && !matchesEmail) {
    // Revert atomic claim
    try {
      const invCol = await getCollection<WorkspaceInvitation>('invitations');
      if (invCol) {
        await invCol.updateOne({ id: invitationId }, { $set: { status: 'pending' }, $unset: { respondedAt: '' } });
      }
    } catch {}
    const err: any = new Error('Forbidden: Only the invited recipient can accept this invitation.');
    err.statusCode = 403;
    throw err;
  }

  const workspaceId = invitation.workspaceId;

  // Check team member limit before accepting
  const currentTeam = await getWorkspaceTeam(workspaceId);
  const isAlreadyMember = currentTeam.some(
    (m) => m.id === actingUser.uid || m.uid === actingUser.uid || (m.email && m.email.toLowerCase() === actingUser.email.toLowerCase())
  );
  if (!isAlreadyMember && currentTeam.length >= MAX_TEAM_MEMBERS) {
    // Revert atomic claim
    try {
      const invCol = await getCollection<WorkspaceInvitation>('invitations');
      if (invCol) {
        await invCol.updateOne({ id: invitationId }, { $set: { status: 'pending' }, $unset: { respondedAt: '' } });
      }
    } catch {}
    const err: any = new Error(
      `This workspace has reached its maximum capacity of ${MAX_TEAM_MEMBERS} members. Please contact the workspace owner.`
    );
    err.statusCode = 400;
    throw err;
  }

  const role: UserRole = (invitation.workspaceRole as UserRole) || 'member';
  const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Ensure workspace document exists in workspaces collection
  let wsDoc: Workspace | null = null;
  try {
    wsDoc = await ensureWorkspaceExists(workspaceId, invitation.inviterUserId);
  } catch {}

  // 1. Create WorkspaceMembership
  const membership: WorkspaceMembership = {
    id: membershipId,
    workspaceId,
    userId: actingUser.uid,
    role,
    createdAt: now,
  };

  try {
    const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');
    if (memCol) {
      await memCol.updateOne(
        { workspaceId, userId: actingUser.uid },
        { $set: membership },
        { upsert: true }
      );
    }
  } catch (e) {
    console.warn('MongoDB insert membership error:', e);
  }
  inMemoryMemberships.set(`${workspaceId}_${actingUser.uid}`, membership);

  // 1b. Create/Upsert record in dedicated workspace_teams collection with workspaceName
  try {
    const wsCol = await getCollection<Workspace>('workspaces');
    const ws = wsCol ? await wsCol.findOne({ id: workspaceId }) : null;
    const wsName = ws?.name || 'Workspace';

    const userCol = await getCollection<UserProfile>('users');
    const userProfile = userCol
      ? await userCol.findOne({ $or: [{ uid: actingUser.uid }, { id: actingUser.uid }, { email: actingUser.email.toLowerCase() }] })
      : null;

    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    if (teamCol) {
      const teamMemberDoc: WorkspaceTeamMember = {
        id: `wtm_${workspaceId}_${actingUser.uid}`,
        workspaceId,
        workspaceName: wsName,
        userId: actingUser.uid,
        name: actingUser.displayName || userProfile?.displayName || actingUser.email.split('@')[0],
        email: actingUser.email.toLowerCase(),
        role,
        title: userProfile?.title || (role === 'admin' ? 'Workspace Admin' : 'Team Member'),
        department: invitation.department || userProfile?.department || 'Engineering',
        skills: userProfile?.skills || ['General'],
        photoURL: userProfile?.photoURL,
        presence: userProfile?.presence || 'online',
        joinedAt: now,
        updatedAt: now,
      };
      await teamCol.updateOne(
        { workspaceId, userId: actingUser.uid },
        { $set: teamMemberDoc },
        { upsert: true }
      );
    }
  } catch (e) {
    console.warn('MongoDB workspace_teams upsert error on accept:', e);
  }

  // 2. Append workspaceId to user's workspaceIds array in users collection
  try {
    const userCol = await getCollection<UserProfile>('users');
    if (userCol) {
      await userCol.updateOne(
        { $or: [{ uid: actingUser.uid }, { id: actingUser.uid }, { email: actingUser.email.toLowerCase() }] },
        {
          $addToSet: { workspaceIds: workspaceId },
          $set: { activeWorkspaceId: workspaceId, lastActiveAt: now },
        }
      );
    }
  } catch (e) {
    console.warn('MongoDB update user workspaceIds error:', e);
  }

  // Update in-memory user
  const memUser = inMemoryStore.users.get(actingUser.uid);
  if (memUser) {
    memUser.workspaceIds = Array.from(new Set([...(memUser.workspaceIds || []), workspaceId]));
    memUser.activeWorkspaceId = workspaceId;
  }

  // 3. Increment workspace memberCount
  try {
    const wsCol = await getCollection<Workspace>('workspaces');
    if (wsCol) {
      await wsCol.updateOne({ id: workspaceId }, { $inc: { memberCount: 1 } });
    }
  } catch {}

  const memWs = inMemoryStore.workspaces.get(workspaceId);
  if (memWs) {
    memWs.memberCount = (memWs.memberCount || 1) + 1;
  }

  // 4. Update invitation status to accepted
  invitation.status = 'accepted';
  invitation.respondedAt = now;

  const memInvAccept = inMemoryInvitations.get(invitationId);
  if (memInvAccept) {
    memInvAccept.status = 'accepted';
    memInvAccept.respondedAt = now;
  }

  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      await invCol.updateOne(
        { id: invitationId },
        { $set: { status: 'accepted', respondedAt: now } }
      );
    }
  } catch {}

  // 5. Update notification
  try {
    const notifCol = await getCollection<DbNotification>('notifications');
    if (notifCol) {
      await notifCol.updateMany(
        { referenceId: invitationId },
        { $set: { read: true, 'invitationData.status': 'accepted' } }
      );
    }
  } catch {}

  // 6. Send notification to inviter that the invitee has joined
  try {
    if (invitation.inviterUserId && invitation.inviterUserId !== actingUser.uid) {
      const inviterNotif: DbNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: invitation.inviterUserId,
        workspaceId,
        type: 'team',
        text: `<strong>${actingUser.displayName || actingUser.email}</strong> accepted your invitation and joined <strong>${wsDoc?.name || 'Workspace'}</strong>.`,
        read: false,
        icon: 'user-check',
        createdAt: now,
      };
      const notifCol = await getCollection<DbNotification>('notifications');
      if (notifCol) {
        await notifCol.insertOne(inviterNotif);
      }
    }
  } catch {}

  return { success: true, workspaceId, role };
}

/**
 * Declines an invitation (Invitee only).
 */
export async function declineWorkspaceInvitation(
  invitationId: string,
  actingUser: ActingUser
): Promise<{ success: boolean; message: string }> {
  let invitation: WorkspaceInvitation | null = null;

  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      invitation = await invCol.findOne({ id: invitationId });
    }
  } catch (e) {
    console.warn('MongoDB find invitation error:', e);
  }

  if (!invitation) {
    invitation = inMemoryInvitations.get(invitationId) || null;
  }

  if (!invitation) {
    const err: any = new Error('Invitation not found.');
    err.statusCode = 404;
    throw err;
  }

  if (invitation.status !== 'pending') {
    const err: any = new Error(`Invitation is no longer pending (current status: ${invitation.status}).`);
    err.statusCode = 400;
    throw err;
  }

  // STRICT AUTHORIZATION: Only the invited recipient can decline!
  const matchesUid = invitation.inviteeUserId === actingUser.uid;
  const matchesEmail = invitation.email.toLowerCase() === actingUser.email.toLowerCase();

  if (!matchesUid && !matchesEmail) {
    const err: any = new Error('Forbidden: Only the invited recipient can decline this invitation.');
    err.statusCode = 403;
    throw err;
  }

  const now = new Date().toISOString();
  invitation.status = 'declined';
  invitation.respondedAt = now;

  const memInvDecline = inMemoryInvitations.get(invitationId);
  if (memInvDecline) {
    memInvDecline.status = 'declined';
    memInvDecline.respondedAt = now;
  }

  try {
    const invCol = await getCollection<WorkspaceInvitation>('invitations');
    if (invCol) {
      await invCol.updateOne(
        { id: invitationId },
        { $set: { status: 'declined', respondedAt: now } }
      );
    }
  } catch {}

  // Update notification
  try {
    const notifCol = await getCollection<DbNotification>('notifications');
    if (notifCol) {
      await notifCol.updateMany(
        { referenceId: invitationId },
        { $set: { read: true, 'invitationData.status': 'declined' } }
      );
    }
  } catch {}

  return { success: true, message: 'Invitation declined successfully' };
}
