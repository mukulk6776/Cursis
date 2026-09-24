import { inMemoryStore } from './store';
import { UserProfile, UserRole, Workspace, WorkspaceMembership, WorkspaceTeamMember, MAX_TEAM_MEMBERS } from './types';
export { MAX_TEAM_MEMBERS };
import { getCollection } from '@/lib/mongodb';
import { isFounderEmail, getAuthorizedTitle, getAuthorizedRole, getAuthorizedDepartment } from '@/lib/auth/founder';

function sanitizeTeamUser(u: UserProfile): UserProfile {
  const isFounder = isFounderEmail(u.email);
  if (isFounder) {
    u.role = 'owner';
    u.title = 'Founder & CEO';
    u.department = 'Leadership';
  } else {
    if (u.role === 'owner') u.role = 'member';
    if (u.title && (u.title.toLowerCase().includes('founder') || u.title.toLowerCase().includes('ceo') || u.title.toLowerCase().includes('owner'))) {
      u.title = 'User';
    }
  }
  return u;
}

import { ensureWorkspaceExists } from './workspaces';

export async function getWorkspaceTeam(workspaceId: string): Promise<UserProfile[]> {
  const targetWsId = (workspaceId || '').trim();
  if (!targetWsId || targetWsId === 'ws_public') {
    return [];
  }

  try {
    // 1. Ensure workspace exists in DB
    try {
      await ensureWorkspaceExists(targetWsId);
    } catch {}

    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    const usersCol = await getCollection<UserProfile>('users');
    const wsCol = await getCollection<Workspace>('workspaces');
    const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');

    // 2. Fetch workspace document to know the owner
    const ws = wsCol ? await wsCol.findOne({ id: targetWsId }) : null;
    const ownerId = ws?.ownerId || (targetWsId.startsWith('ws_usr_') ? targetWsId.replace(/^ws_/, '') : '');

    // 3. Collect all user IDs associated with this workspace:
    // - Members currently recorded in workspace_teams
    // - Members with accepted records in workspace_memberships
    // - The workspace owner
    // - Users who have this targetWsId in their workspaceIds or activeWorkspaceId
    const teamDocs = teamCol ? await teamCol.find({ workspaceId: targetWsId }).toArray() : [];
    const membershipDocs = memCol ? await memCol.find({ workspaceId: targetWsId }).toArray() : [];

    const memberUidMap = new Map<string, { role?: UserRole; title?: string; department?: string; joinedAt?: string }>();

    // Owner
    if (ownerId) {
      memberUidMap.set(ownerId, { role: 'owner' });
    }

    // Existing workspace_teams docs
    teamDocs.forEach((t) => {
      if (t.userId) {
        memberUidMap.set(t.userId, {
          role: t.role,
          title: t.title,
          department: t.department,
          joinedAt: t.joinedAt,
        });
      }
    });

    // Accepted workspace memberships
    membershipDocs.forEach((m) => {
      if (m.userId) {
        const existing = memberUidMap.get(m.userId);
        memberUidMap.set(m.userId, {
          ...existing,
          role: m.role || existing?.role || 'member',
          joinedAt: m.createdAt || existing?.joinedAt,
        });
      }
    });

    // Users with workspaceId in users collection
    if (usersCol) {
      const searchUids = Array.from(memberUidMap.keys());
      const orConditions: any[] = [
        { workspaceIds: targetWsId },
      ];
      if (searchUids.length > 0) {
        orConditions.push({ uid: { $in: searchUids } });
        orConditions.push({ id: { $in: searchUids } });
      }

      const relatedUsers = await usersCol.find({ $or: orConditions }).toArray();

      relatedUsers.forEach((u) => {
        const uid = u.uid || u.id;
        if (uid && !memberUidMap.has(uid)) {
          memberUidMap.set(uid, {
            role: (u.role === 'owner' || uid === ownerId) ? 'owner' : 'member',
            title: u.title,
            department: u.department,
            joinedAt: u.createdAt,
          });
        }
      });

      // Query complete user profiles for all collected IDs
      const allUids = Array.from(memberUidMap.keys());
      if (allUids.length > 0) {
        const liveUsers = await usersCol
          .find({
            $or: [{ uid: { $in: allUids } }, { id: { $in: allUids } }],
          })
          .toArray();

        const liveUserMap = new Map(liveUsers.map((u) => [u.uid || u.id, u]));

        const results: UserProfile[] = [];
        const now = new Date().toISOString();

        for (const [uid, meta] of memberUidMap.entries()) {
          const live = liveUserMap.get(uid) || inMemoryStore.users.get(uid);
          const cleanEmail = (live?.email || '').trim().toLowerCase();
          const isFounder = isFounderEmail(cleanEmail);
          const isOwner = isFounder || uid === ownerId || meta.role === 'owner';
          const assignedRole: UserRole = isOwner ? 'owner' : (meta.role || live?.role || 'member');
          const displayName = live?.displayName || (cleanEmail ? cleanEmail.split('@')[0] : 'Team Member');
          const title = isFounder ? 'Founder & CEO' : (live?.title || meta.title || (isOwner ? 'Workspace Owner' : 'Team Member'));
          const department = isFounder ? 'Leadership' : (live?.department || meta.department || (isOwner ? 'Leadership' : 'Engineering'));
          const joinedAt = meta.joinedAt || live?.createdAt || ws?.createdAt || now;

          // Dynamic presence detection: user is online if active within last 2 minutes and not explicitly offline
          const lastActiveIso = live?.lastActiveAt;
          const lastActiveMs = lastActiveIso ? new Date(lastActiveIso).getTime() : 0;
          const isRecentlyActive = lastActiveMs > 0 && (Date.now() - lastActiveMs) < 120000;
          const resolvedPresence: 'online' | 'busy' | 'away' | 'offline' = 
            (!isRecentlyActive || live?.presence === 'offline')
              ? 'offline'
              : (live?.presence || 'online');

          const teamMemberDoc: WorkspaceTeamMember = {
            id: `wtm_${targetWsId}_${uid}`,
            workspaceId: targetWsId,
            workspaceName: ws?.name || 'Workspace',
            userId: uid,
            name: displayName,
            email: cleanEmail,
            role: assignedRole,
            title,
            department,
            skills: live?.skills || (isOwner ? ['Leadership', 'Strategy'] : ['General']),
            photoURL: live?.photoURL,
            presence: resolvedPresence,
            joinedAt,
            updatedAt: now,
          };

          // Upsert into workspace_teams so it remains synchronized
          if (teamCol) {
            teamCol
              .updateOne(
                { workspaceId: targetWsId, userId: uid },
                { $set: teamMemberDoc },
                { upsert: true }
              )
              .catch(() => {});
          }

          const userObj: UserProfile = {
            id: uid,
            uid,
            email: cleanEmail,
            displayName,
            role: assignedRole,
            title,
            department,
            skills: teamMemberDoc.skills || [],
            photoURL: live?.photoURL,
            workspaceIds: [targetWsId],
            activeWorkspaceId: targetWsId,
            presence: resolvedPresence,
            lastActiveAt: lastActiveIso || joinedAt,
            createdAt: joinedAt,
            onboardingStatus: 'completed',
            onboardingChecklist: [],
          };

          results.push(sanitizeTeamUser(userObj));
        }

        results.forEach((u) => {
          if (u.id) inMemoryStore.users.set(u.id, u);
          if (u.uid) inMemoryStore.users.set(u.uid, u);
        });

        if (results.length > 0) {
          return results;
        }
      }
    }
  } catch (e) {
    console.warn('MongoDB getWorkspaceTeam notice:', e);
  }

  return Array.from(inMemoryStore.users.values())
    .filter((u) => u.workspaceIds?.includes(targetWsId) || u.activeWorkspaceId === targetWsId)
    .map((u) => {
      const lastActiveMs = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
      const isRecentlyActive = lastActiveMs > 0 && (Date.now() - lastActiveMs) < 120000;
      if (!isRecentlyActive || u.presence === 'offline') {
        u.presence = 'offline';
      }
      return sanitizeTeamUser(u);
    });
}


export async function addTeamMember(
  workspaceId: string,
  memberData: {
    email: string;
    displayName: string;
    role: UserRole;
    department?: string;
    title?: string;
    skills?: string[];
    photoURL?: string;
    presence?: 'online' | 'busy' | 'away' | 'offline';
    planTier?: 'standard';
  }
): Promise<UserProfile> {
  const cleanEmail = memberData.email.toLowerCase().trim();
  const isFounder = isFounderEmail(cleanEmail);
  const assignedRole: UserRole = isFounder ? 'owner' : (memberData.role !== 'owner' ? memberData.role : 'member');
  const assignedTitle = isFounder ? 'Founder & CEO' : getAuthorizedTitle(cleanEmail, memberData.title || 'Team Member');
  const assignedDept = isFounder ? 'Leadership' : getAuthorizedDepartment(cleanEmail, memberData.department || 'Engineering');
  const assignedSkills = isFounder ? ['Founder & CEO', 'Strategy', 'Architecture'] : (memberData.skills || ['General']);
  const effectiveWsIds = Array.from(new Set([workspaceId]));

  // Check MongoDB first for existing user by email to prevent duplicate accounts
  let existingMem: UserProfile | null = null;
  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      existingMem = await col.findOne({ email: cleanEmail });
    }
  } catch (e) {
    console.warn('MongoDB find existing team member notice:', e);
  }

  if (!existingMem) {
    existingMem = Array.from(inMemoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === cleanEmail
    ) || null;
  }

  const isAlreadyInWs = Boolean(
    existingMem && (
      (existingMem.workspaceIds && existingMem.workspaceIds.includes(workspaceId)) ||
      existingMem.activeWorkspaceId === workspaceId
    )
  );

  if (!isAlreadyInWs) {
    const currentTeam = await getWorkspaceTeam(workspaceId);
    if (currentTeam.length >= MAX_TEAM_MEMBERS) {
      const err: any = new Error(`Workspace has reached the maximum team limit of ${MAX_TEAM_MEMBERS} members.`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (existingMem) {
    existingMem.workspaceIds = Array.from(new Set([...(existingMem.workspaceIds || []), ...effectiveWsIds]));
    existingMem.activeWorkspaceId = workspaceId;
    existingMem.displayName = memberData.displayName || existingMem.displayName;
    existingMem.role = assignedRole;
    existingMem.department = assignedDept;
    existingMem.title = assignedTitle;
    if (memberData.planTier) {
      existingMem.planTier = memberData.planTier;
    }
    existingMem.skills = Array.from(new Set([...(existingMem.skills || []), ...assignedSkills]));
    existingMem.lastActiveAt = new Date().toISOString();
    sanitizeTeamUser(existingMem);

    try {
      const col = await getCollection<UserProfile>('users');
      if (col) {
        await col.updateOne(
          { $or: [{ id: existingMem.id }, { uid: existingMem.uid }, { email: cleanEmail }] },
          { $set: existingMem },
          { upsert: true }
        );
      }
    } catch (e) {
      console.warn('MongoDB updateTeamMember notice:', e);
    }

    inMemoryStore.users.set(existingMem.id, existingMem);
    return existingMem;
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newMember: UserProfile = sanitizeTeamUser({
    id,
    uid: id,
    email: cleanEmail,
    displayName: memberData.displayName,
    photoURL: memberData.photoURL,
    role: assignedRole,
    department: assignedDept,
    title: assignedTitle,
    skills: assignedSkills,
    workspaceIds: effectiveWsIds,
    activeWorkspaceId: workspaceId,
    planTier: memberData.planTier || 'standard',
    onboardingStatus: 'in_progress',
    onboardingChecklist: [
      { id: 'ob_1', title: 'Complete account setup & profile photo', completed: false },
      { id: 'ob_2', title: 'Join department channels', completed: false },
      { id: 'ob_3', title: 'Review Ordis proactive guidance', completed: false },
      { id: 'ob_4', title: 'Connect calendar and notifications', completed: false },
    ],
    presence: memberData.presence || 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  inMemoryStore.users.set(id, newMember);

  // Update workspace member count
  const ws = inMemoryStore.workspaces.get(workspaceId);
  if (ws) {
    ws.memberCount = (ws.memberCount || 1) + 1;
  }

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne({ email: cleanEmail }, { $set: newMember }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB insertTeamMember notice:', e);
  }

  return newMember;
}

export async function removeTeamMember(
  workspaceId: string,
  userId: string,
  emailHint?: string
): Promise<boolean> {
  const targetId = (userId || '').trim();
  let cleanEmail = (emailHint || '').toLowerCase().trim();
  let targetWsId = (workspaceId || '').trim();

  // Resolve fallback workspace if needed
  if (!targetWsId || targetWsId === 'ws_default' || targetWsId === 'ws_public') {
    const memWs = Array.from(inMemoryStore.workspaces.values()).find((w) => w.id !== 'ws_default' && w.id !== 'ws_public');
    if (memWs) targetWsId = memWs.id;
  }

  // Founder protection: cannot remove founder
  if (cleanEmail && isFounderEmail(cleanEmail)) {
    return false;
  }

  // 1. Locate user in MongoDB or memory store to ensure we have both ID and Email
  try {
    const userCol = await getCollection<UserProfile>('users');
    if (userCol) {
      const q: any[] = [];
      if (targetId) q.push({ id: targetId }, { uid: targetId });
      if (cleanEmail) q.push({ email: cleanEmail }, { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
      if (q.length > 0) {
        const found = await userCol.findOne({ $or: q });
        if (found) {
          if (!cleanEmail && found.email) cleanEmail = found.email.toLowerCase().trim();
        }
      }
    }
  } catch {}

  // Also check workspace_teams in MongoDB to get email if missing
  if (!cleanEmail && targetId) {
    try {
      const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
      if (teamCol) {
        const foundTeam = await teamCol.findOne({ $or: [{ userId: targetId }, { id: targetId }] });
        if (foundTeam?.email) {
          cleanEmail = foundTeam.email.toLowerCase().trim();
        }
      }
    } catch {}
  }

  let memoryUser: UserProfile | undefined;
  if (targetId) {
    memoryUser = inMemoryStore.users.get(targetId);
  }
  if (!memoryUser) {
    for (const u of inMemoryStore.users.values()) {
      if (
        (targetId && (u.id === targetId || u.uid === targetId)) ||
        (cleanEmail && u.email?.toLowerCase() === cleanEmail) ||
        (targetId && u.email?.toLowerCase() === targetId.toLowerCase())
      ) {
        memoryUser = u;
        break;
      }
    }
  }

  if (memoryUser && isFounderEmail(memoryUser.email)) {
    return false;
  }

  if (memoryUser?.email && !cleanEmail) {
    cleanEmail = memoryUser.email.toLowerCase().trim();
  }

  // 2. Remove workspace association across in-memory store
  for (const [k, u] of inMemoryStore.users.entries()) {
    const matches =
      (targetId && (u.id === targetId || u.uid === targetId || k === targetId)) ||
      (cleanEmail && u.email?.toLowerCase() === cleanEmail);
    if (matches) {
      u.workspaceIds = (u.workspaceIds || []).filter((w) => w !== targetWsId && w !== 'ws_default');
      if (u.activeWorkspaceId === targetWsId || u.activeWorkspaceId === 'ws_default') {
        u.activeWorkspaceId = u.workspaceIds[0] || (u.id ? `ws_${u.id}` : undefined);
      }
      if ((u as any).workspaceId === targetWsId) {
        (u as any).workspaceId = u.workspaceIds[0] || undefined;
      }
    }
  }

  // Also remove from inMemoryMemberships
  try {
    const { inMemoryMemberships, inMemoryInvitations } = require('./invitations');
    if (inMemoryMemberships) {
      for (const [k, mem] of inMemoryMemberships.entries()) {
        const matches =
          (!targetWsId || mem.workspaceId === targetWsId || mem.workspaceId === 'ws_default') &&
          ((targetId && (mem.userId === targetId || (mem as any).id === targetId)) ||
           (cleanEmail && (mem.userId === cleanEmail || (mem as any).email?.toLowerCase() === cleanEmail)));
        if (matches) {
          inMemoryMemberships.delete(k);
        }
      }
    }
    if (inMemoryInvitations) {
      for (const [k, inv] of inMemoryInvitations.entries()) {
        const matches =
          (!targetWsId || inv.workspaceId === targetWsId || inv.workspaceId === 'ws_default') &&
          ((cleanEmail && inv.email?.toLowerCase() === cleanEmail) ||
           (targetId && inv.inviteeUserId === targetId));
        if (matches) {
          inMemoryInvitations.delete(k);
        }
      }
    }
  } catch {}

  // 3. Update workspace member count in memory
  if (targetWsId) {
    const ws = inMemoryStore.workspaces.get(targetWsId);
    if (ws && ws.memberCount > 1) {
      ws.memberCount -= 1;
    }
  }

  // 4. Locate and remove from MongoDB workspace_teams collection
  try {
    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    if (teamCol) {
      const orClauses: any[] = [];
      if (targetId) orClauses.push({ userId: targetId }, { id: targetId }, { uid: targetId });
      if (cleanEmail) {
        orClauses.push({ email: cleanEmail });
        orClauses.push({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
      }
      if (orClauses.length > 0) {
        const filter: any = { $or: orClauses };
        if (targetWsId && targetWsId !== 'ws_default' && targetWsId !== 'ws_public') {
          filter.$and = [
            { $or: orClauses },
            { $or: [{ workspaceId: targetWsId }, { workspaceId: 'ws_default' }, { workspaceId: 'ws_public' }] }
          ];
          delete filter.$or;
        }
        await teamCol.deleteMany(filter);
      }
    }

    // 5. Remove from workspace_memberships
    const memCol = await getCollection<any>('workspace_memberships');
    if (memCol) {
      const memConditions: any[] = [];
      if (targetId) memConditions.push({ userId: targetId }, { id: targetId }, { uid: targetId });
      if (cleanEmail) {
        memConditions.push({ userId: cleanEmail }, { email: cleanEmail }, { userEmail: cleanEmail });
        memConditions.push({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
      }
      if (memConditions.length > 0) {
        const filter: any = { $or: memConditions };
        if (targetWsId && targetWsId !== 'ws_default' && targetWsId !== 'ws_public') {
          filter.$and = [
            { $or: memConditions },
            { $or: [{ workspaceId: targetWsId }, { workspaceId: 'ws_default' }, { workspaceId: 'ws_public' }] }
          ];
          delete filter.$or;
        }
        await memCol.deleteMany(filter);
      }
    }

    // 5B. Remove or revoke any invitations for this user in this workspace
    const invCol = await getCollection<any>('invitations');
    if (invCol) {
      const invClauses: any[] = [];
      if (cleanEmail) {
        invClauses.push({ email: cleanEmail }, { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
      }
      if (targetId) {
        invClauses.push({ inviteeUserId: targetId }, { id: targetId });
      }
      if (invClauses.length > 0) {
        await invCol.deleteMany({
          $or: invClauses,
          ...(targetWsId && targetWsId !== 'ws_default' && targetWsId !== 'ws_public' ? { workspaceId: targetWsId } : {}),
        });
      }
    }

    // 6. Update user's workspaceIds and clear activeWorkspaceId in users collection
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const matchQueries: any[] = [];
      if (targetId) matchQueries.push({ id: targetId }, { uid: targetId });
      if (cleanEmail) {
        matchQueries.push({ email: cleanEmail });
        matchQueries.push({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
      }
      if (matchQueries.length > 0) {
        // Pull workspace from workspaceIds array
        if (targetWsId) {
          await col.updateMany(
            { $or: matchQueries },
            { $pull: { workspaceIds: targetWsId } }
          );
          await col.updateMany(
            { $or: matchQueries, activeWorkspaceId: targetWsId },
            { $unset: { activeWorkspaceId: '' } }
          );
          await col.updateMany(
            { $or: matchQueries, workspaceId: targetWsId as any },
            { $unset: { workspaceId: '' as any } }
          );
        }
      }
    }

    // 7. Update workspace member count
    if (targetWsId) {
      const wsCol = await getCollection<Workspace>('workspaces');
      if (wsCol) {
        await wsCol.updateOne(
          { id: targetWsId, memberCount: { $gt: 1 } },
          { $inc: { memberCount: -1 } }
        );
      }
    }
  } catch (e) {
    console.warn('MongoDB removeTeamMember notice:', e);
  }

  return true;
}


export async function updateTeamMember(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  let user = inMemoryStore.users.get(userId);
  const col = await getCollection<UserProfile>('users');
  if (!user && col) {
    user = (await col.findOne({ $or: [{ id: userId }, { uid: userId }] })) as any;
  }
  if (!user) return null;

  const isTargetFounder = isFounderEmail(user.email);
  const cleanUpdates = { ...updates };
  if (!isTargetFounder) {
    if (cleanUpdates.role === 'owner') cleanUpdates.role = 'member';
    if (cleanUpdates.title && (cleanUpdates.title.toLowerCase().includes('founder') || cleanUpdates.title.toLowerCase().includes('ceo') || cleanUpdates.title.toLowerCase().includes('owner'))) {
      cleanUpdates.title = 'User';
    }
  }

  const nowIso = new Date().toISOString();
  Object.assign(user, cleanUpdates);
  if (!cleanUpdates.lastActiveAt) {
    user.lastActiveAt = nowIso;
  }
  sanitizeTeamUser(user);

  try {
    if (col) {
      await col.updateOne({ $or: [{ id: userId }, { uid: userId }] }, { $set: user }, { upsert: true });
    }
    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    if (teamCol) {
      await teamCol.updateMany(
        { userId },
        {
          $set: {
            presence: user.presence,
            role: user.role,
            title: user.title,
            department: user.department,
            updatedAt: nowIso,
          },
        }
      );
    }
  } catch (e) {
    console.warn('MongoDB updateTeamMember notice:', e);
  }

  inMemoryStore.users.set(user.id, user);
  if (user.uid) inMemoryStore.users.set(user.uid, user);
  return user;
}

export {
  createTeamInvitation,
  getWorkspaceInvitations,
  revokeWorkspaceInvitation,
  revokeWorkspaceInvitation as revokeTeamInvitation,
  acceptWorkspaceInvitation,
  acceptWorkspaceInvitation as acceptTeamInvitation,
  declineWorkspaceInvitation,
} from './invitations';

export async function updateOnboardingChecklistItem(
  userId: string,
  itemId: string,
  completed: boolean
): Promise<UserProfile | null> {
  const user = inMemoryStore.users.get(userId);
  if (!user) return null;

  const item = user.onboardingChecklist.find((i) => i.id === itemId);
  if (item) {
    item.completed = completed;
  }

  const allCompleted = user.onboardingChecklist.every((i) => i.completed);
  user.onboardingStatus = allCompleted ? 'completed' : 'in_progress';
  user.lastActiveAt = new Date().toISOString();

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne({ id: userId }, { $set: user });
    }
  } catch {}

  return user;
}

// Find best matching team members based on required skills and current workload
export async function findBestMatchingHelpers(
  workspaceId: string,
  requiredSkills: string[]
): Promise<Array<{ user: UserProfile; matchScore: number; currentTaskCount: number }>> {
  const team = await getWorkspaceTeam(workspaceId);
  const tasks = Array.from(inMemoryStore.tasks.values()).filter(
    (t) => t.workspaceId === workspaceId && t.status !== 'done'
  );

  const results = team.map((member) => {
    const matchingSkills = (member.skills || []).filter((s) =>
      requiredSkills.some((req) => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase()))
    );

    const matchScore = requiredSkills.length > 0 ? Math.round((matchingSkills.length / requiredSkills.length) * 100) : 50;
    const assignedTasks = tasks.filter((t) => t.assigneeId === member.id);

    return {
      user: member,
      matchScore,
      currentTaskCount: assignedTasks.length,
    };
  });

  return results.sort((a, b) => b.matchScore - a.matchScore || a.currentTaskCount - b.currentTaskCount);
}
