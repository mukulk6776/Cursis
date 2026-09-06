import crypto from 'crypto';
import { inMemoryStore } from './store';
import { UserProfile, UserRole } from './types';
import { getCollection } from '@/lib/mongodb';

/**
 * Generate a cryptographically strong salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash password using PBKDF2 with SHA-512
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

/**
 * Secure constant-time password verification
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Find user by email from in-memory cache or MongoDB
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  
  // 1. Check in-memory store
  for (const u of inMemoryStore.users.values()) {
    if (u.email.toLowerCase() === normalized) {
      return u;
    }
  }

  // 2. Query MongoDB
  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const doc = await col.findOne({ email: { $regex: new RegExp(`^${normalized}$`, 'i') } });
      if (doc) {
        inMemoryStore.users.set(doc.uid || doc.id, doc);
        return doc;
      }
    }
  } catch (e) {
    console.warn('MongoDB findUserByEmail notice:', e);
  }

  return null;
}

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

/**
 * Register a new user with secure password hash
 */
export async function registerUser(params: {
  displayName: string;
  email: string;
  password?: string;
  role?: UserRole;
  photoURL?: string;
  workspaceId?: string;
}): Promise<UserProfile> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.displayName.trim() || cleanEmail.split('@')[0];
  const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const workspaceId = params.workspaceId || 'ws_cursis_user';

  let salt: string | undefined;
  let passwordHash: string | undefined;

  if (params.password) {
    salt = generateSalt();
    passwordHash = hashPassword(params.password, salt);
  }

  const newUser: UserProfile = {
    id: uid,
    uid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL: params.photoURL,
    role: params.role || 'owner',
    passwordHash,
    salt,
    department: 'Leadership',
    title: params.role === 'owner' ? 'Founder & CEO' : 'Team Member',
    skills: ['Workspace Owner', 'Strategy'],
    workspaceIds: [workspaceId],
    activeWorkspaceId: workspaceId,
    onboardingStatus: 'completed',
    onboardingChecklist: [
      { id: 'ob_1', title: 'Complete profile setup', completed: true },
      { id: 'ob_2', title: 'Review workspace channels', completed: true },
    ],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.users.set(uid, newUser);

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne({ uid }, { $set: newUser }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB registerUser notice:', e);
  }

  return newUser;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const existing = inMemoryStore.users.get(uid);
  const updatedUser: UserProfile = {
    id: uid,
    uid,
    email: data.email || existing?.email || `${uid}@cursis.ai`,
    displayName: data.displayName || existing?.displayName || 'Cursis User',
    photoURL: data.photoURL || existing?.photoURL,
    role: data.role || existing?.role || 'owner',
    passwordHash: data.passwordHash || existing?.passwordHash,
    salt: data.salt || existing?.salt,
    department: data.department || existing?.department || 'Leadership',
    title: data.title || existing?.title || 'Team Member',
    skills: data.skills || existing?.skills || ['General'],
    workspaceIds: data.workspaceIds || existing?.workspaceIds || ['ws_cursis_user'],
    activeWorkspaceId: data.activeWorkspaceId || existing?.activeWorkspaceId || 'ws_cursis_user',
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
