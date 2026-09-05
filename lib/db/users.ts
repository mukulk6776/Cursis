import { inMemoryStore } from './store';
import { UserProfile, UserRole } from './types';
import { adminDb } from '@/lib/auth/firebase-admin';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const user = inMemoryStore.users.get(uid);
  if (user) return user;

  // Check by email
  for (const u of inMemoryStore.users.values()) {
    if (u.email === uid || u.uid === uid || u.id === uid) return u;
  }

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      const doc = await adminDb.collection('users').doc(uid).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore getUserProfile error:', e);
    }
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
    workspaceIds: data.workspaceIds || existing?.workspaceIds || ['ws_cursis_demo'],
    activeWorkspaceId: data.activeWorkspaceId || existing?.activeWorkspaceId || 'ws_cursis_demo',
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

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      await adminDb.collection('users').doc(uid).set(updatedUser, { merge: true });
    } catch (e) {
      console.warn('Firestore createUserProfile error:', e);
    }
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

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      await adminDb.collection('users').doc(uid).set(updated, { merge: true });
    } catch (e) {
      console.warn('Firestore updateUserProfile error:', e);
    }
  }

  return updated;
}
