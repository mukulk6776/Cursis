import { cookies } from 'next/headers';
import { inMemoryStore } from '@/lib/db/store';
import { UserRole } from '@/lib/db/types';
import { isFounderEmail } from './founder';
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
  workspaceId: string;
  photoURL?: string;
  title?: string;
  department?: string;
  skills?: string[];
  planTier?: 'standard';
  isDev?: boolean;
}

export async function isSessionRevoked(session: SessionPayload): Promise<boolean> {
  const users = await getCollection('users');
  if (!users) return process.env.NODE_ENV === 'production';
  return Boolean(await users.findOne({ email: session.email,
    passwordChangedAt: { $gte: session.createdAt || 0 },
  }, { projection: { _id: 1 } }));
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
        } catch {}
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
        const email = verified.email;
        if (await accountBlocked(uid, email) || await isSessionRevoked(verified)) return null;
        const displayName = verified.displayName || email.split('@')[0];
        const isFounder = isFounderEmail(email);
        const role: UserRole = isFounder ? 'owner' : (verified.role !== 'owner' ? (verified.role as UserRole) : 'member');
        const workspaceId = verified.workspaceId || `ws_${verified.uid}`;

        // Retrieve existing user from cache if present
        const storedUser = inMemoryStore.users.get(uid) || Array.from(inMemoryStore.users.values()).find((u) => u.email === email);
        const title = isFounder ? 'Founder & CEO' : (storedUser?.title || 'Team Member');
        const department = isFounder ? 'Leadership' : (storedUser?.department || 'Engineering');
        const skills = isFounder ? ['Founder & CEO', 'Leadership', 'Strategy'] : (storedUser?.skills || ['General']);
        const planTier = storedUser?.planTier || 'standard';

        const activePhoto = storedUser?.photoURL || verified.photoURL;

        // Auto-provision user in store if not present (only with personal workspace ws_${uid})
        if (!inMemoryStore.users.has(uid)) {
          const personalWsId = `ws_${uid}`;
          inMemoryStore.users.set(uid, {
            id: uid,
            uid,
            email,
            displayName,
            photoURL: activePhoto,
            role: isFounder ? 'owner' : 'member',
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
