import { inMemoryStore } from './store';
import { UserProfile, UserRole } from './types';

export async function getWorkspaceTeam(workspaceId: string): Promise<UserProfile[]> {
  return Array.from(inMemoryStore.users.values()).filter(
    (u) => u.workspaceIds.includes(workspaceId) || workspaceId === 'ws_cursis_demo'
  );
}

export async function addTeamMember(
  workspaceId: string,
  memberData: {
    email: string;
    displayName: string;
    role: UserRole;
    department: string;
    title: string;
    skills: string[];
  }
): Promise<UserProfile> {
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newMember: UserProfile = {
    id,
    uid: id,
    email: memberData.email,
    displayName: memberData.displayName,
    role: memberData.role,
    department: memberData.department,
    title: memberData.title,
    skills: memberData.skills,
    workspaceIds: [workspaceId],
    activeWorkspaceId: workspaceId,
    onboardingStatus: 'in_progress',
    onboardingChecklist: [
      { id: 'ob_1', title: 'Complete account setup & profile photo', completed: false },
      { id: 'ob_2', title: 'Join department channels', completed: false },
      { id: 'ob_3', title: 'Review Ordis proactive guidance', completed: false },
      { id: 'ob_4', title: 'Connect calendar and notifications', completed: false },
    ],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.users.set(id, newMember);

  // Update workspace member count
  const ws = inMemoryStore.workspaces.get(workspaceId);
  if (ws) {
    ws.memberCount = (ws.memberCount || 1) + 1;
  }

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
    // Calculate skill overlap
    const matchingSkills = member.skills.filter((s) =>
      requiredSkills.some((req) => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase()))
    );

    const matchScore = requiredSkills.length > 0 ? Math.round((matchingSkills.length / requiredSkills.length) * 100) : 50;

    // Count open tasks assigned to this user
    const assignedTasks = tasks.filter((t) => t.assigneeId === member.id);

    return {
      user: member,
      matchScore,
      currentTaskCount: assignedTasks.length,
    };
  });

  // Sort by match score descending, then least busy
  return results.sort((a, b) => b.matchScore - a.matchScore || a.currentTaskCount - b.currentTaskCount);
}
