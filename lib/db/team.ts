import { inMemoryStore } from './store';
import { UserProfile, UserRole, WorkspaceInvitation } from './types';
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

export async function getWorkspaceTeam(workspaceId: string): Promise<UserProfile[]> {
  const isDefaultWs = !workspaceId || workspaceId === 'ws_public' || workspaceId === 'ws_cursis_user' || workspaceId === 'ws_default';
  const defaultAliases = ['ws_public', 'ws_cursis_user', 'ws_default', workspaceId].filter(Boolean);

  try {
    const col = await getCollection<UserProfile>('users');
    const memCol = await getCollection<any>('workspace_memberships');

    // Find any user IDs from workspace_memberships
    let memberUserIds: string[] = [];
    if (memCol) {
      const memDocs = await memCol.find({
        workspaceId: isDefaultWs ? { $in: defaultAliases } : workspaceId
      }).toArray();
      memberUserIds = memDocs.map((m: any) => m.userId).filter(Boolean);
    }

    if (col) {
      const orClauses: any[] = isDefaultWs
        ? [
            { workspaceIds: { $in: defaultAliases } },
            { activeWorkspaceId: { $in: defaultAliases } },
            { workspaceId: { $in: defaultAliases } },
          ]
        : [
            { workspaceIds: workspaceId },
            { activeWorkspaceId: workspaceId },
            { workspaceId: workspaceId },
          ];

      if (memberUserIds.length > 0) {
        orClauses.push({ uid: { $in: memberUserIds } });
        orClauses.push({ id: { $in: memberUserIds } });
      }

      const docs = await col.find({ $or: orClauses }).toArray();

      if (docs.length > 0) {
        const sanitized = docs.map(sanitizeTeamUser);
        sanitized.forEach((u) => {
          if (u.id) inMemoryStore.users.set(u.id, u);
          if (u.uid) inMemoryStore.users.set(u.uid, u);
        });
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('MongoDB getWorkspaceTeam notice:', e);
  }

  return Array.from(inMemoryStore.users.values())
    .filter((u) => {
      if (isDefaultWs) {
        return (
          u.workspaceIds?.some((w) => defaultAliases.includes(w)) ||
          defaultAliases.includes(u.activeWorkspaceId || '') ||
          defaultAliases.includes((u as any).workspaceId || '')
        );
      }
      return (
        u.workspaceIds?.includes(workspaceId) ||
        u.activeWorkspaceId === workspaceId ||
        (u as any).workspaceId === workspaceId
      );
    })
    .map(sanitizeTeamUser);
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
  const cleanEmail = (emailHint || '').toLowerCase().trim();

  // Founder protection: cannot remove founder
  if (cleanEmail && isFounderEmail(cleanEmail)) {
    return false;
  }

  // 1. Locate user in memory store
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

  const isDefaultWs = !workspaceId || workspaceId === 'ws_public' || workspaceId === 'ws_cursis_user' || workspaceId === 'ws_default';
  const aliasesToRemove = isDefaultWs
    ? ['ws_public', 'ws_cursis_user', 'ws_default', workspaceId].filter(Boolean)
    : [workspaceId];


  // 2. Remove from memory store
  if (memoryUser) {
    memoryUser.workspaceIds = (memoryUser.workspaceIds || []).filter((w) => !aliasesToRemove.includes(w));
    if (memoryUser.activeWorkspaceId && aliasesToRemove.includes(memoryUser.activeWorkspaceId)) {
      memoryUser.activeWorkspaceId = memoryUser.workspaceIds[0] || undefined;
    }

    // If no workspaces left or this was a provisioned team member without custom account, delete entirely from memory
    if (memoryUser.workspaceIds.length === 0 || !memoryUser.passwordHash) {
      if (memoryUser.id) inMemoryStore.users.delete(memoryUser.id);
      if (memoryUser.uid) inMemoryStore.users.delete(memoryUser.uid);
      if (targetId) inMemoryStore.users.delete(targetId);
    }
  } else if (targetId) {
    inMemoryStore.users.delete(targetId);
  }

  // 3. Update workspace member count in memory
  const ws = inMemoryStore.workspaces.get(workspaceId);
  if (ws && ws.memberCount > 1) {
    ws.memberCount -= 1;
  }

  // 4. Locate and remove/update in MongoDB
  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const matchQueries: any[] = [];
      if (targetId) {
        matchQueries.push({ id: targetId }, { uid: targetId });
        try {
          const { ObjectId } = await import('mongodb');
          if (ObjectId.isValid(targetId)) {
            matchQueries.push({ _id: new ObjectId(targetId) as any });
          }
        } catch {}
      }
      if (cleanEmail) {
        matchQueries.push({ email: cleanEmail });
      }
      if (targetId && targetId.includes('@')) {
        matchQueries.push({ email: targetId.toLowerCase() });
      }

      if (matchQueries.length > 0) {
        const mongoUser = await col.findOne({ $or: matchQueries });
        if (mongoUser) {
          if (isFounderEmail(mongoUser.email)) {
            return false;
          }

          const remainingWs = (mongoUser.workspaceIds || []).filter((w) => !aliasesToRemove.includes(w));
          // If no workspaces left or provisioned user (no passwordHash), delete permanently
          if (remainingWs.length === 0 || !mongoUser.passwordHash) {
            await col.deleteMany({ $or: matchQueries });
          } else {
            const nextActiveWs = mongoUser.activeWorkspaceId && aliasesToRemove.includes(mongoUser.activeWorkspaceId)
              ? (remainingWs[0] || undefined)
              : mongoUser.activeWorkspaceId;

            await col.updateMany(
              { $or: matchQueries },
              { $pull: { workspaceIds: { $in: aliasesToRemove } } }
            );
            await col.updateMany(
              { $or: matchQueries, activeWorkspaceId: { $in: aliasesToRemove } },
              { $unset: { activeWorkspaceId: "" } }
            );
            await col.updateMany(
              { $or: matchQueries, workspaceId: { $in: aliasesToRemove } },
              { $unset: { workspaceId: "" } }
            );
          }
        } else {
          // Attempt deletion by queries just in case
          await col.deleteMany({ $or: matchQueries });
        }
      }
    }

    const memCol = await getCollection<any>('workspace_memberships');
    if (memCol) {
      const memConditions: any[] = [];
      if (targetId) memConditions.push({ userId: targetId });
      if (cleanEmail) memConditions.push({ userId: cleanEmail });
      if (memConditions.length > 0) {
        await memCol.deleteMany({
          workspaceId: { $in: aliasesToRemove },
          $or: memConditions,
        });
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
  const user = inMemoryStore.users.get(userId);
  if (!user) return null;

  const isTargetFounder = isFounderEmail(user.email);
  const cleanUpdates = { ...updates };
  if (!isTargetFounder) {
    if (cleanUpdates.role === 'owner') cleanUpdates.role = 'member';
    if (cleanUpdates.title && (cleanUpdates.title.toLowerCase().includes('founder') || cleanUpdates.title.toLowerCase().includes('ceo') || cleanUpdates.title.toLowerCase().includes('owner'))) {
      cleanUpdates.title = 'User';
    }
  }

  Object.assign(user, cleanUpdates, { lastActiveAt: new Date().toISOString() });
  sanitizeTeamUser(user);

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne({ id: userId }, { $set: user });
    }
  } catch (e) {
    console.warn('MongoDB updateTeamMember notice:', e);
  }

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
