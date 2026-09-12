import { inMemoryStore } from './store';
import { UserProfile, UserRole, Workspace, WorkspaceMembership, WorkspaceTeamMember } from './types';
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
  const targetWsId = (workspaceId || '').trim();
  if (!targetWsId || targetWsId === 'ws_public') {
    return [];
  }

  try {
    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    const usersCol = await getCollection<UserProfile>('users');
    const wsCol = await getCollection<Workspace>('workspaces');
    const memCol = await getCollection<WorkspaceMembership>('workspace_memberships');

    if (teamCol) {
      let teamDocs: (WorkspaceTeamMember | any)[] = await teamCol.find({ workspaceId: targetWsId }).toArray();

      // If workspace_teams is empty for this workspace, auto-seed the Owner & accepted members
      if (teamDocs.length === 0 && wsCol) {
        const ws = await wsCol.findOne({ id: targetWsId });
        if (ws && ws.ownerId) {
          const ownerUser = usersCol ? await usersCol.findOne({ $or: [{ uid: ws.ownerId }, { id: ws.ownerId }] }) : null;
          const ownerDisplayName = ownerUser?.displayName || 'Workspace Owner';
          const ownerEmail = ownerUser?.email || '';

          if (ownerEmail) {
            const ownerTeamMember: WorkspaceTeamMember = {
              id: `wtm_${targetWsId}_${ws.ownerId}`,
              workspaceId: targetWsId,
              workspaceName: ws.name || 'Workspace',
              userId: ws.ownerId,
              name: ownerDisplayName,
              email: ownerEmail,
              role: 'owner',
              title: ownerUser?.title || 'Workspace Owner',
              department: ownerUser?.department || 'Leadership',
              skills: ownerUser?.skills || ['Leadership'],
              photoURL: ownerUser?.photoURL,
              presence: ownerUser?.presence || 'online',
              joinedAt: ws.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await teamCol.updateOne(
              { workspaceId: targetWsId, userId: ws.ownerId },
              { $set: ownerTeamMember },
              { upsert: true }
            );
            teamDocs = [ownerTeamMember];
          }

          // Also check accepted memberships in workspace_memberships to backfill if any exist
          if (memCol && usersCol) {
            const mems = await memCol.find({ workspaceId: targetWsId }).toArray();
            for (const m of mems) {
              if (m.userId === ws.ownerId) continue;
              const u = await usersCol.findOne({ $or: [{ uid: m.userId }, { id: m.userId }] });
              if (u) {
                const memDoc: WorkspaceTeamMember = {
                  id: `wtm_${targetWsId}_${u.uid}`,
                  workspaceId: targetWsId,
                  workspaceName: ws.name || 'Workspace',
                  userId: u.uid,
                  name: u.displayName || u.email.split('@')[0],
                  email: u.email,
                  role: m.role || 'member',
                  title: u.title || 'Team Member',
                  department: u.department || 'Engineering',
                  skills: u.skills || ['General'],
                  photoURL: u.photoURL,
                  presence: u.presence || 'online',
                  joinedAt: m.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                await teamCol.updateOne(
                  { workspaceId: targetWsId, userId: u.uid },
                  { $set: memDoc },
                  { upsert: true }
                );
                teamDocs.push(memDoc);
              }
            }
          }
        }
      }

      if (teamDocs.length > 0) {
        // Hydrate real-time presence from users collection for these specific workspace team members only
        const uids = teamDocs.map((t) => t.userId).filter(Boolean);
        const liveUsers = usersCol ? await usersCol.find({ $or: [{ uid: { $in: uids } }, { id: { $in: uids } }] }).toArray() : [];
        const liveUserMap = new Map(liveUsers.map((u) => [u.uid || u.id, u]));

        const result: UserProfile[] = teamDocs.map((doc) => {
          const live = liveUserMap.get(doc.userId);
          const userObj: UserProfile = {
            id: doc.userId || doc.id,
            uid: doc.userId || doc.id,
            email: doc.email,
            displayName: doc.name || doc.email.split('@')[0],
            role: doc.role,
            title: doc.title || (doc.role === 'owner' ? 'Workspace Owner' : 'Team Member'),
            department: doc.department || (doc.role === 'owner' ? 'Leadership' : 'Engineering'),
            skills: doc.skills || [],
            photoURL: doc.photoURL,
            workspaceIds: [doc.workspaceId],
            activeWorkspaceId: doc.workspaceId,
            presence: live?.presence || doc.presence || 'offline',
            lastActiveAt: live?.lastActiveAt || doc.updatedAt || doc.joinedAt,
            createdAt: doc.joinedAt,
            onboardingStatus: 'completed',
            onboardingChecklist: [],
          };
          return sanitizeTeamUser(userObj);
        });

        result.forEach((u) => {
          if (u.id) inMemoryStore.users.set(u.id, u);
          if (u.uid) inMemoryStore.users.set(u.uid, u);
        });
        return result;
      }
    }
  } catch (e) {
    console.warn('MongoDB getWorkspaceTeam notice:', e);
  }

  return Array.from(inMemoryStore.users.values())
    .filter((u) => u.workspaceIds?.includes(targetWsId) || u.activeWorkspaceId === targetWsId)
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
  const targetWsId = (workspaceId || '').trim();

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

  // 2. Remove from memory store
  if (memoryUser) {
    memoryUser.workspaceIds = (memoryUser.workspaceIds || []).filter((w) => w !== targetWsId);
    if (memoryUser.activeWorkspaceId === targetWsId) {
      memoryUser.activeWorkspaceId = memoryUser.workspaceIds[0] || undefined;
    }
  }

  // 3. Update workspace member count in memory
  const ws = inMemoryStore.workspaces.get(targetWsId);
  if (ws && ws.memberCount > 1) {
    ws.memberCount -= 1;
  }

  // 4. Locate and remove from MongoDB workspace_teams collection
  try {
    const teamCol = await getCollection<WorkspaceTeamMember>('workspace_teams');
    if (teamCol) {
      const orClauses: any[] = [];
      if (targetId) orClauses.push({ userId: targetId }, { id: targetId });
      if (cleanEmail) orClauses.push({ email: cleanEmail });
      if (orClauses.length > 0) {
        await teamCol.deleteMany({
          workspaceId: targetWsId,
          $or: orClauses,
        });
      }
    }

    // 5. Remove from workspace_memberships
    const memCol = await getCollection<any>('workspace_memberships');
    if (memCol) {
      const memConditions: any[] = [];
      if (targetId) memConditions.push({ userId: targetId });
      if (cleanEmail) memConditions.push({ userId: cleanEmail });
      if (memConditions.length > 0) {
        await memCol.deleteMany({
          workspaceId: targetWsId,
          $or: memConditions,
        });
      }
    }

    // 6. Update user's workspaceIds in users collection
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const matchQueries: any[] = [];
      if (targetId) matchQueries.push({ id: targetId }, { uid: targetId });
      if (cleanEmail) matchQueries.push({ email: cleanEmail });
      if (matchQueries.length > 0) {
        await col.updateMany(
          { $or: matchQueries },
          { $pull: { workspaceIds: targetWsId } }
        );
      }
    }

    // 7. Update workspace member count
    const wsCol = await getCollection<Workspace>('workspaces');
    if (wsCol) {
      await wsCol.updateOne(
        { id: targetWsId, memberCount: { $gt: 1 } },
        { $inc: { memberCount: -1 } }
      );
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
