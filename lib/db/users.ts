import { inMemoryStore } from './store';
import { UserProfile } from './types';
import { getCollection } from '@/lib/mongodb';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const user = inMemoryStore.users.get(uid);
  if (user) return user;

  // Check by email in memory
  for (const u of inMemoryStore.users.values()) {
    if (u.email === uid || u.uid === uid || u.id === uid) return u;
  }

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const doc = await col.findOne({
        $or: [{ uid }, { id: uid }, { email: uid }],
      });
      if (doc) {
        inMemoryStore.users.set(doc.uid || doc.id, doc);
        return doc;
      }
    }
  } catch (e) {
    console.warn('MongoDB getUserProfile notice:', e);
  }

  return null;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const existing = inMemoryStore.users.get(uid);
  const updatedUser: UserProfile = {
    id: uid,
    uid,
    email: data.email || existing?.email || `${uid}@cursis.ai`,
    displayName: data.displayName || existing?.displayName || 'Cursis User',
    photoURL: data.photoURL || existing?.photoURL,
    role: data.role || existing?.role || 'member',
    department: data.department || existing?.department || 'General',
    title: data.title || existing?.title || 'Team Member',
    skills: data.skills || existing?.skills || ['General'],
    workspaceIds: data.workspaceIds || existing?.workspaceIds || ['ws_cursis_main'],
    activeWorkspaceId: data.activeWorkspaceId || existing?.activeWorkspaceId || 'ws_cursis_main',
    onboardingStatus: data.onboardingStatus || existing?.onboardingStatus || 'completed',
    onboardingChecklist: data.onboardingChecklist || existing?.onboardingChecklist || [
      { id: 'ob_1', title: 'Complete profile setup', completed: true },
      { id: 'ob_2', title: 'Review workspace channels', completed: true },
    ],
    presence: data.presence || existing?.presence || 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  inMemoryStore.users.set(uid, updatedUser);

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne({ uid }, { $set: updatedUser }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB createUserProfile notice:', e);
  }

  return updatedUser;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const existing = await getUserProfile(uid);
  if (!existing) return null;

  const updated: UserProfile = {
    ...existing,
    ...updates,
    lastActiveAt: new Date().toISOString(),
  };

  inMemoryStore.users.set(uid, updated);

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne({ uid }, { $set: updated }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB updateUserProfile notice:', e);
  }

  return updated;
}
