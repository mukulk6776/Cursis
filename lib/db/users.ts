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

// OWASP recommendation for PBKDF2-HMAC-SHA512 is 210,000 iterations
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_LEGACY_ITERATIONS = 10_000; // Previous iteration count for backward-compat verification

/**
 * Hash password using PBKDF2 with SHA-512 (210,000 iterations per OWASP recommendations for SHA-512)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
}

/**
 * Secure constant-time password verification returning validation and rehash migration status.
 */
export function verifyPasswordResult(password: string, salt: string, expectedHash: string): { valid: boolean; needsRehash: boolean } {
  try {
    // 1. Current iteration count (210,000 iterations for SHA-512)
    const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
    if (hash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'))) {
      return { valid: true, needsRehash: false };
    }

    // 2. Previously upgraded 600,000 iteration hashes
    const hash600k = crypto.pbkdf2Sync(password, salt, 600_000, 64, 'sha512').toString('hex');
    if (hash600k.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(hash600k, 'hex'), Buffer.from(expectedHash, 'hex'))) {
      return { valid: true, needsRehash: false };
    }

    // 3. Fall back to legacy 10,000 iteration count for existing accounts (triggers transparent upgrade)
    const legacyHash = crypto.pbkdf2Sync(password, salt, PBKDF2_LEGACY_ITERATIONS, 64, 'sha512').toString('hex');
    if (legacyHash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(legacyHash, 'hex'), Buffer.from(expectedHash, 'hex'))) {
      return { valid: true, needsRehash: true };
    }

    return { valid: false, needsRehash: false };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

/**
 * Secure constant-time password verification (boolean helper).
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  return verifyPasswordResult(password, salt, expectedHash).valid;
}

/**
 * Transparently upgrade user's legacy password hash to modern iteration count upon successful login.
 */
export async function upgradePasswordHash(email: string, password: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const newSalt = generateSalt();
    const newHash = hashPassword(password, newSalt);

    // Update in-memory store
    for (const u of inMemoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        u.salt = newSalt;
        u.passwordHash = newHash;
      }
    }

    // Update MongoDB
    const col = await getCollection<UserProfile>('users');
    if (col) {
      await col.updateOne(
        { email: cleanEmail },
        { $set: { salt: newSalt, passwordHash: newHash, lastPasswordUpgradeAt: new Date().toISOString() } }
      );
    }
    return true;
  } catch (err) {
    console.warn('upgradePasswordHash notice:', err);
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
      // Direct equality check - email is already normalized to lowercase
      const doc = await col.findOne({ email: normalized });
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
  
  let existing = await findUserByEmail(cleanEmail);
  if (existing && existing.passwordHash) {
    throw new Error('An account with this email already exists.');
  }

  const cleanName = params.displayName.trim() || cleanEmail.split('@')[0];
  const uid = existing?.uid || existing?.id || 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const defaultWsId = `ws_${uid}`;
  const workspaceId = params.workspaceId || defaultWsId;

  let salt: string | undefined;
  let passwordHash: string | undefined;

  if (params.password) {
    salt = generateSalt();
    passwordHash = hashPassword(params.password, salt);
  }

  const isFounder = isFounderEmail(cleanEmail);
  const assignedRole: UserRole = isFounder ? 'owner' : (params.role && params.role !== 'owner' ? params.role : (existing?.role || 'member'));
  const assignedTitle = isFounder ? 'Founder & CEO' : (existing?.title || 'User');
  const assignedDept = isFounder ? 'Leadership' : (existing?.department || 'Operations');
  const assignedSkills = isFounder ? ['Founder & CEO', 'Strategy', 'Architecture'] : (existing?.skills || ['Workspace Collaborator']);

  const mergedWorkspaceIds = Array.from(new Set([
    ...(existing?.workspaceIds || []),
    workspaceId
  ]));

  const activeWorkspaceId = existing?.activeWorkspaceId || workspaceId;

  const newUser: UserProfile = {
    id: uid,
    uid,
    email: cleanEmail,
    displayName: existing?.displayName && existing.displayName !== cleanEmail.split('@')[0] ? existing.displayName : cleanName,
    photoURL: params.photoURL || existing?.photoURL,
    role: assignedRole,
    passwordHash,
    salt,
    department: assignedDept,
    title: assignedTitle,
    skills: assignedSkills,
    workspaceIds: mergedWorkspaceIds,
    activeWorkspaceId,
    onboardingStatus: 'completed',
    onboardingChecklist: [
      { id: 'ob_1', title: 'Complete profile setup', completed: true },
      { id: 'ob_2', title: 'Review workspace channels', completed: true },
    ],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
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

  const userWorkspaceIds = data.workspaceIds || existing?.workspaceIds || [`ws_${uid}`];
  const userActiveWorkspaceId = data.activeWorkspaceId || existing?.activeWorkspaceId || userWorkspaceIds[0];

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
