import { inMemoryStore } from './store';
import { UserProfile, UserRole, WorkspaceInvitation } from './types';
import { getCollection } from '@/lib/mongodb';

export async function getWorkspaceTeam(workspaceId: string): Promise<UserProfile[]> {
  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const docs = await col
        .find({
          $or: [
            { workspaceIds: workspaceId },
            { activeWorkspaceId: workspaceId },
          ],
        })
        .toArray();

      if (docs.length > 0) {
        docs.forEach((u) => inMemoryStore.users.set(u.id, u));
        return docs;
      }
    }
  } catch (e) {
    console.warn('MongoDB getWorkspaceTeam notice:', e);
  }

  return Array.from(inMemoryStore.users.values()).filter(
    (u) => u.workspaceIds.includes(workspaceId) || workspaceId === 'ws_cursis_user' || workspaceId === 'ws_public'
  );
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
    planTier?: 'standard' | 'premium';
  }
): Promise<UserProfile> {
  // Check for existing user by email to prevent duplicate accounts
  const existingMem = Array.from(inMemoryStore.users.values()).find(
    (u) => u.email.toLowerCase() === memberData.email.toLowerCase()
  );

  if (existingMem) {
    if (!existingMem.workspaceIds.includes(workspaceId)) {
      existingMem.workspaceIds.push(workspaceId);
    }
    existingMem.displayName = memberData.displayName || existingMem.displayName;
    existingMem.role = memberData.role || existingMem.role;
    existingMem.department = memberData.department || existingMem.department;
    existingMem.title = memberData.title || existingMem.title;
    if (memberData.planTier) {
      existingMem.planTier = memberData.planTier;
    }
    if (memberData.skills && memberData.skills.length > 0) {
      existingMem.skills = Array.from(new Set([...existingMem.skills, ...memberData.skills]));
    }
    existingMem.lastActiveAt = new Date().toISOString();

    try {
      const col = await getCollection<UserProfile>('users');
      if (col) {
        await col.updateOne({ id: existingMem.id }, { $set: existingMem });
      }
    } catch (e) {
      console.warn('MongoDB updateTeamMember notice:', e);
    }

    return existingMem;
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newMember: UserProfile = {
    id,
    uid: id,
    email: memberData.email.toLowerCase(),
    displayName: memberData.displayName,
    photoURL: memberData.photoURL,
    role: memberData.role || 'member',
    department: memberData.department || 'Engineering',
    title: memberData.title || 'Team Member',
    skills: memberData.skills || ['General'],
    workspaceIds: [workspaceId],
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
  };

  inMemoryStore.users.set(id, newMember);

  // Update workspace member count
  const ws = inMemoryStore.workspaces.get(workspaceId);
  if (ws) {
    ws.memberCount = (ws.memberCount || 1) + 1;
  }

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.insertOne(newMember);
    }
  } catch (e) {
    console.warn('MongoDB insertTeamMember notice:', e);
  }

  return newMember;
}

export async function removeTeamMember(workspaceId: string, userId: string): Promise<boolean> {
  const user = inMemoryStore.users.get(userId);
  if (!user) return false;

  user.workspaceIds = user.workspaceIds.filter((w) => w !== workspaceId);
  if (user.workspaceIds.length === 0) {
    inMemoryStore.users.delete(userId);
  }

  const ws = inMemoryStore.workspaces.get(workspaceId);
  if (ws && ws.memberCount > 1) {
    ws.memberCount -= 1;
  }

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      if (user.workspaceIds.length === 0) {
        await col.deleteOne({ id: userId });
      } else {
        await col.updateOne({ id: userId }, { $set: { workspaceIds: user.workspaceIds } });
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

  Object.assign(user, updates, { lastActiveAt: new Date().toISOString() });

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

// In-memory fallback map for invitations
const inMemoryInvitations = new Map<string, WorkspaceInvitation>();

export async function sendTeamInvitation(
  workspaceId: string,
  inviteData: {
    email: string;
    name?: string;
    roleTitle?: string;
    workspaceRole: UserRole | string;
    department: string;
    team?: string | null;
    note?: string;
    invitedBy: string;
    planTier?: 'standard' | 'premium';
  }
): Promise<WorkspaceInvitation> {
  const token = 'tok_' + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
  const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  const invitation: WorkspaceInvitation = {
    id,
    workspaceId,
    email: inviteData.email.toLowerCase(),
    name: inviteData.name || inviteData.email.split('@')[0],
    roleTitle: inviteData.roleTitle || 'Team Member',
    workspaceRole: inviteData.workspaceRole || 'member',
    department: inviteData.department,
    team: inviteData.team || null,
    note: inviteData.note,
    status: 'pending',
    token,
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    invitedBy: inviteData.invitedBy,
    planTier: inviteData.planTier || 'standard',
  };

  inMemoryInvitations.set(id, invitation);

  try {
    const col = await getCollection<WorkspaceInvitation>('invitations');
    if (col) {
      await col.insertOne(invitation);
    }
  } catch (e) {
    console.warn('MongoDB insertInvitation notice:', e);
  }

  return invitation;
}

export async function getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  try {
    const col = await getCollection<WorkspaceInvitation>('invitations');
    if (col) {
      const docs = await col.find({ workspaceId }).sort({ sentAt: -1 }).toArray();
      if (docs.length > 0) {
        docs.forEach((inv) => inMemoryInvitations.set(inv.id, inv));
        return docs;
      }
    }
  } catch (e) {
    console.warn('MongoDB getWorkspaceInvitations notice:', e);
  }

  return Array.from(inMemoryInvitations.values()).filter(
    (inv) => inv.workspaceId === workspaceId || workspaceId === 'ws_public'
  );
}

export async function revokeTeamInvitation(invitationId: string): Promise<boolean> {
  inMemoryInvitations.delete(invitationId);

  try {
    const col = await getCollection<WorkspaceInvitation>('invitations');
    if (col) {
      await col.deleteOne({ id: invitationId });
    }
  } catch (e) {
    console.warn('MongoDB revokeInvitation notice:', e);
  }

  return true;
}

export async function acceptTeamInvitation(token: string): Promise<UserProfile | null> {
  let invitation: WorkspaceInvitation | undefined;

  for (const inv of inMemoryInvitations.values()) {
    if (inv.token === token && inv.status === 'pending') {
      invitation = inv;
      break;
    }
  }

  if (!invitation) {
    try {
      const col = await getCollection<WorkspaceInvitation>('invitations');
      if (col) {
        const found = await col.findOne({ token, status: 'pending' });
        if (found) invitation = found;
      }
    } catch {}
  }

  if (!invitation) return null;

  invitation.status = 'accepted';

  // Provision user into team
  const newMember = await addTeamMember(invitation.workspaceId, {
    email: invitation.email,
    displayName: invitation.name || invitation.email.split('@')[0],
    role: invitation.workspaceRole as UserRole,
    department: invitation.department,
    title: invitation.roleTitle || 'Team Member',
    skills: ['Collaboration', 'Cursis'],
    planTier: invitation.planTier || 'standard',
  });

  try {
    const col = await getCollection<WorkspaceInvitation>('invitations');
    if (col) {
      await col.updateOne({ id: invitation.id }, { $set: { status: 'accepted' } });
    }
  } catch {}

  return newMember;
}

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
