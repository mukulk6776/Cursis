import { cookies } from 'next/headers';
import { inMemoryStore } from '@/lib/db/store';
import { UserProfile, UserRole, PlatformRole } from '@/lib/db/types';
import { isFounderEmail } from './founder';
import { isVerifiedAdminUser } from './admin';
import { accountBlocked } from '@/lib/privacy/core';
import { getCollection } from '@/lib/mongodb';
import {
  SESSION_SECRET,
  SessionPayload,
  createSessionToken,
  verifySessionToken,
  isSessionTokenValid,
} from './token';

export {
  SESSION_SECRET,
  type SessionPayload,
  createSessionToken,
  verifySessionToken,
  isSessionTokenValid,
};

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  platformRole: PlatformRole;
  emailVerified: boolean;
  workspaceId: string;
  photoURL?: string;
  title?: string;
  department?: string;
  skills?: string[];
  planTier?: 'standard';
  isDev?: boolean;
}

export async function isSessionRevoked(session: SessionPayload): Promise<boolean> {
  const users = await getCollection<UserProfile>('users');
  if (!users) {
    if (process.env.NODE_ENV === 'production') return true;
    const mem = inMemoryStore.users.get(session.uid) ||
      Array.from(inMemoryStore.users.values()).find((u) => u.email?.toLowerCase() === session.email.toLowerCase());
    if (!mem) return false;
    return mem.accountStatus === 'suspended' || Boolean(mem.passwordChangedAt && mem.passwordChangedAt >= (session.createdAt || 0));
  }
  const cleanEmail = session.email.trim().toLowerCase();
  const doc = await users.findOne(
    { $or: [{ uid: session.uid }, { id: session.uid }, { email: cleanEmail }] },
    { projection: { _id: 1, passwordChangedAt: 1, accountStatus: 1 } }
  );
  if (!doc) return false;
  if (doc.accountStatus === 'suspended') return true;
  if (doc.passwordChangedAt && doc.passwordChangedAt >= (session.createdAt || 0)) return true;
  return false;
}

export async function isSessionUserSuspended(session: SessionPayload): Promise<boolean> {
  try {
    const cleanEmail = session.email.trim().toLowerCase();
    const users = await getCollection<UserProfile>('users');
    if (users) {
      const doc = await users.findOne(
        { $or: [{ uid: session.uid }, { id: session.uid }, { email: cleanEmail }] },
        { projection: { accountStatus: 1 } }
      );
      return doc?.accountStatus === 'suspended';
    }
    const mem = inMemoryStore.users.get(session.uid) ||
      Array.from(inMemoryStore.users.values()).find((u) => u.email?.toLowerCase() === cleanEmail);
    return mem?.accountStatus === 'suspended';
  } catch {
    return false;
  }
}

/**
 * Authenticate incoming request and retrieve active user
 */
export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser | null> {
  try {
    let sessionToken: string | undefined;

    // 1. Check Authorization Bearer header
    if (request) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
      }
    }

    // 2. Check Cookie header directly
    if (!sessionToken && request) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/cursis_session=([^;]+)/);
        if (match) {
          sessionToken = decodeURIComponent(match[1]);
        }
      }
    }

    // 3. Check next/headers cookies()
    if (!sessionToken) {
      try {
        const cookieStore = await cookies();
        sessionToken = cookieStore.get('cursis_session')?.value;
      } catch {
        // cookies() may throw outside Next.js request context
      }
    }

    if (sessionToken) {
      sessionToken = sessionToken.trim().replace(/^["']|["']$/g, '');
      if (sessionToken.includes('%')) {
        try {
          sessionToken = decodeURIComponent(sessionToken).replace(/^["']|["']$/g, '');
        } catch { }
      }
    }

    if (!sessionToken) {
      return null;
    }

    // 4. Decode verified session token (cursis_usr_...)
    if (sessionToken.startsWith('cursis_usr_')) {
      const verified = verifySessionToken(sessionToken);
      if (verified) {
        const uid = verified.uid;
        const email = verified.email.trim().toLowerCase();
        if (await accountBlocked(uid, email) || await isSessionRevoked(verified)) return null;

        let dbUser: UserProfile | null = null;
        try {
          const usersCol = await getCollection<UserProfile>('users');
          if (usersCol) {
            dbUser = await usersCol.findOne({ $or: [{ uid }, { id: uid }, { email }] });
            if (dbUser) {
              inMemoryStore.users.set(dbUser.uid || dbUser.id, dbUser);
            }
          }
        } catch { }

        if (dbUser?.accountStatus === 'suspended') {
          return null;
        }

        const storedUser = dbUser || inMemoryStore.users.get(uid) || Array.from(inMemoryStore.users.values()).find((u) => u.email?.toLowerCase() === email);
        if (storedUser?.accountStatus === 'suspended') {
          return null;
        }

        const displayName = storedUser?.displayName || verified.displayName || email.split('@')[0];
        const isFounder = isFounderEmail(email);
        const role: UserRole = isFounder ? 'owner' : (verified.role !== 'owner' ? (verified.role as UserRole) : 'member');
        const platformRole: PlatformRole = isVerifiedAdminUser(storedUser) ? 'admin' : 'user';
        const emailVerified = Boolean(storedUser?.emailVerified);
        const workspaceId = storedUser?.activeWorkspaceId || verified.workspaceId || `ws_${verified.uid}`;

        const title = isFounder ? 'Founder & CEO' : (storedUser?.title || 'Team Member');
        const department = isFounder ? 'Leadership' : (storedUser?.department || 'Engineering');
        const skills = isFounder ? ['Founder & CEO', 'Leadership', 'Strategy'] : (storedUser?.skills || ['General']);
        const planTier = storedUser?.planTier || 'standard';

        const activePhoto = storedUser?.photoURL || verified.photoURL;

        // Auto-provision user in memory cache if not present (only with personal workspace ws_${uid})
        if (!inMemoryStore.users.has(uid)) {
          const personalWsId = `ws_${uid}`;
          inMemoryStore.users.set(uid, {
            id: uid,
            uid,
            email,
            displayName,
            photoURL: activePhoto,
            role: isFounder ? 'owner' : 'member',
            platformRole,
            accountStatus: 'active',
            emailVerified,
            title,
            department,
            workspaceIds: [personalWsId],
            activeWorkspaceId: personalWsId,
            skills,
            planTier,
            onboardingStatus: 'completed',
            onboardingChecklist: [],
            presence: 'online',
            lastActiveAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }

        return {
          uid,
          email,
          displayName,
          role,
          platformRole,
          emailVerified,
          workspaceId,
          photoURL: activePhoto,
          title,
          department,
          skills,
          planTier,
          isDev: false,
        };
      }
    }

    // Strictly reject all unverified, unsigned, or dev/mock tokens
    return null;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}
