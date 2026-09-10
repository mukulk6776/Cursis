import crypto from 'crypto';
import { inMemoryStore } from './store';
import { UserProfile, UserRole } from './types';
import { getCollection } from '@/lib/mongodb';
import { isFounderEmail, getAuthorizedTitle, getAuthorizedRole, getAuthorizedDepartment } from '@/lib/auth/founder';

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
 * Sanitize user profile to ensure only mukulk3962364@gmail.com can be Founder & CEO
 */
function sanitizeFounderIntegrity(user: UserProfile): UserProfile {
  const isFounder = isFounderEmail(user.email);
  if (isFounder) {
    user.role = 'owner';
    user.title = 'Founder & CEO';
    user.department = 'Leadership';
  } else {
    if (user.role === 'owner') {
      user.role = 'member';
    }
    user.title = getAuthorizedTitle(user.email, user.title || 'User');
    user.department = getAuthorizedDepartment(user.email, user.department || 'Operations');
  }
  return user;
}

/**
 * Find user by email from in-memory cache or MongoDB
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  
  // 1. Check in-memory store
  for (const u of inMemoryStore.users.values()) {
    if (u.email.toLowerCase() === normalized) {
      return sanitizeFounderIntegrity(u);
    }
  }

  // 2. Query MongoDB
  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const doc = await col.findOne({ email: { $regex: new RegExp(`^${normalized}$`, 'i') } });
      if (doc) {
        const sanitized = sanitizeFounderIntegrity(doc);
        inMemoryStore.users.set(sanitized.uid || sanitized.id, sanitized);
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('MongoDB findUserByEmail notice:', e);
  }

  return null;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const user = inMemoryStore.users.get(uid);
  if (user) return sanitizeFounderIntegrity(user);

  // Check by email in memory
  for (const u of inMemoryStore.users.values()) {
    if (u.email === uid || u.uid === uid || u.id === uid) return sanitizeFounderIntegrity(u);
  }

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const doc = await col.findOne({
        $or: [{ uid }, { id: uid }, { email: uid }],
      });
      if (doc) {
        const sanitized = sanitizeFounderIntegrity(doc);
        inMemoryStore.users.set(doc.uid || doc.id, sanitized);
        return sanitized;
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

  const isFounder = isFounderEmail(cleanEmail);
  const assignedRole: UserRole = isFounder ? 'owner' : (params.role && params.role !== 'owner' ? params.role : 'member');
  const assignedTitle = isFounder ? 'Founder & CEO' : 'User';
  const assignedDept = isFounder ? 'Leadership' : 'Operations';
  const assignedSkills = isFounder ? ['Founder & CEO', 'Strategy', 'Architecture'] : ['Workspace Collaborator'];

  const newUser: UserProfile = {
    id: uid,
    uid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL: params.photoURL,
    role: assignedRole,
    passwordHash,
    salt,
    department: assignedDept,
    title: assignedTitle,
    skills: assignedSkills,
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
  let existing: UserProfile | null = inMemoryStore.users.get(uid) || null;
  const cleanEmail = (data.email || existing?.email || `${uid}@cursis.ai`).trim().toLowerCase();

  try {
    const col = await getCollection<UserProfile>('users');
    if (col) {
      const doc = await col.findOne({
        $or: [{ uid }, { id: uid }, { email: cleanEmail }],
      });
      if (doc) existing = doc;
    }
  } catch (e) {
    console.warn('MongoDB createUserProfile lookup notice:', e);
  }

  const isFounder = isFounderEmail(cleanEmail);

  const assignedRole: UserRole = isFounder ? 'owner' : (data.role && data.role !== 'owner' ? data.role : (existing?.role && existing.role !== 'owner' ? existing.role : 'member'));
  const assignedTitle = isFounder ? 'Founder & CEO' : getAuthorizedTitle(cleanEmail, data.title || existing?.title || 'Team Member');
  const assignedDept = isFounder ? 'Leadership' : getAuthorizedDepartment(cleanEmail, data.department || existing?.department || 'Engineering');
  const assignedSkills = isFounder ? ['Founder & CEO', 'Strategy', 'Architecture'] : (data.skills || existing?.skills || ['General']);

  const userWorkspaceIds = data.workspaceIds || existing?.workspaceIds || ['ws_public', 'ws_default', 'ws_cursis_user'];
  const userActiveWorkspaceId = data.activeWorkspaceId || existing?.activeWorkspaceId || userWorkspaceIds[0] || 'ws_public';

  const updatedUser: UserProfile = {
    id: existing?.id || uid,
    uid,
    email: cleanEmail,
    displayName: data.displayName || existing?.displayName || 'Cursis User',
    photoURL: data.photoURL || existing?.photoURL,
    role: assignedRole,
    passwordHash: data.passwordHash || existing?.passwordHash,
    salt: data.salt || existing?.salt,
    department: assignedDept,
    title: assignedTitle,
    skills: assignedSkills,
    workspaceIds: userWorkspaceIds,
    activeWorkspaceId: userActiveWorkspaceId,
    planTier: data.planTier || existing?.planTier || 'standard',
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
      await col.updateOne({ $or: [{ uid }, { id: uid }, { email: cleanEmail }] }, { $set: updatedUser }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB createUserProfile notice:', e);
  }

  return updatedUser;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const existing = await getUserProfile(uid);
  if (!existing) return null;

  const isFounder = isFounderEmail(existing.email);
  const cleanUpdates = { ...updates };

  if (!isFounder) {
    if (cleanUpdates.role === 'owner') cleanUpdates.role = 'member';
    if (cleanUpdates.title && (cleanUpdates.title.toLowerCase().includes('founder') || cleanUpdates.title.toLowerCase().includes('ceo') || cleanUpdates.title.toLowerCase().includes('owner'))) {
      cleanUpdates.title = 'User';
    }
    if (cleanUpdates.department === 'Leadership') {
      cleanUpdates.department = 'Operations';
    }
  }

  const updated: UserProfile = {
    ...existing,
    ...cleanUpdates,
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
