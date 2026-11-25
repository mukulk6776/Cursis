import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser, AuthenticatedUser } from './session';
import { verifySessionToken } from './token';
import { isAdminEmail, isVerifiedAdminUser } from './admin';
import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import type { UserProfile } from '@/lib/db/types';
import { apiError } from '@/lib/api/response';

export type AdminGuardResult =
  | { adminUser: AuthenticatedUser; dbUser: UserProfile; errorResponse: null }
  | { adminUser: null; dbUser: null; errorResponse: NextResponse };

/**
 * Fetches authoritative database user record for authorization checks.
 * Always reads fresh from MongoDB in production so revoked/suspended status applies immediately.
 */
async function loadAuthoritativeUser(uid: string, email: string): Promise<UserProfile | null> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const usersCol = await getCollection<UserProfile>('users');
    if (usersCol) {
      const doc = await usersCol.findOne({
        $or: [{ uid }, { id: uid }, { email: cleanEmail }],
      });
      if (doc) {
        inMemoryStore.users.set(doc.uid || doc.id, doc);
        return doc;
      }
      return null;
    }
  } catch (err) {
    console.warn('[admin-guard] Failed DB user lookup:', err instanceof Error ? err.message : 'lookup failed');
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return (
      inMemoryStore.users.get(uid) ||
      Array.from(inMemoryStore.users.values()).find((u) => u.email?.toLowerCase() === cleanEmail) ||
      null
    );
  }

  return null;
}

/**
 * Reusable server-side Admin Authorization Middleware for API routes.
 * Enforces:
 * 1. Valid session/token (401 if missing/invalid/expired/suspended)
 * 2. Database verification that role is `admin`, email is verified, account is active, and email matches ADMIN_EMAIL (403 otherwise)
 */
export async function requireAdmin(request: Request): Promise<AdminGuardResult> {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return {
      adminUser: null,
      dbUser: null,
      errorResponse: apiError('Unauthorized: A valid authenticated session is required.', 401),
    };
  }

  const dbUser = await loadAuthoritativeUser(authUser.uid, authUser.email);
  if (!dbUser || !isVerifiedAdminUser(dbUser)) {
    return {
      adminUser: null,
      dbUser: null,
      errorResponse: apiError('Forbidden: Platform administrator access is restricted.', 403),
    };
  }

  return {
    adminUser: authUser,
    dbUser,
    errorResponse: null,
  };
}

/**
 * Server Component authorization check for /admin/* pages (prevents any SSR flash of admin UI).
 * Distinguishes unauthenticated vs authenticated-non-admin so callers can redirect appropriately.
 */
export async function getServerAdminContext(): Promise<
  | { status: 'authorized'; adminUser: UserProfile }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' }
> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('cursis_session')?.value;
    if (!sessionToken) return { status: 'unauthenticated' };

    const verified = verifySessionToken(sessionToken);
    if (!verified) return { status: 'unauthenticated' };

    const dbUser = await loadAuthoritativeUser(verified.uid, verified.email);
    if (!dbUser) return { status: 'unauthenticated' };
    if (dbUser.accountStatus === 'suspended') return { status: 'unauthenticated' };
    if (dbUser.passwordChangedAt && dbUser.passwordChangedAt >= (verified.createdAt || 0)) {
      return { status: 'unauthenticated' };
    }

    if (!isAdminEmail(dbUser.email) || dbUser.platformRole !== 'admin' || dbUser.emailVerified !== true) {
      return { status: 'forbidden' };
    }

    return { status: 'authorized', adminUser: dbUser };
  } catch {
    return { status: 'unauthenticated' };
  }
}
