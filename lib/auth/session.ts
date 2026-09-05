import { cookies, headers } from 'next/headers';
import { adminAuth } from '@/lib/auth/firebase-admin';
import { inMemoryStore } from '@/lib/db/store';
import { UserProfile, UserRole } from '@/lib/db/types';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  workspaceId: string;
  isDev?: boolean;
}

export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser | null> {
  try {
    let sessionToken: string | undefined;

    // Check request headers for Authorization Bearer token first if request provided
    if (request) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
      }
    }

    // Check cookies from request headers first, then try next/headers cookies()
    if (!sessionToken && request) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/cursis_session=([^;]+)/);
        if (match) {
          sessionToken = decodeURIComponent(match[1]);
        }
      }
    }

    if (!sessionToken) {
      try {
        const cookieStore = await cookies();
        sessionToken = cookieStore.get('cursis_session')?.value;
      } catch {
        // cookies() may throw if called outside a request context
      }
    }

    // User session payload decoding
    if (sessionToken?.startsWith('cursis_usr_')) {
      try {
        const rawJson = Buffer.from(sessionToken.replace('cursis_usr_', ''), 'base64url').toString('utf-8');
        const parsed = JSON.parse(rawJson);
        if (parsed.email) {
          // Register in store for foreign-key lookups
          if (!inMemoryStore.users.has(parsed.uid)) {
            inMemoryStore.users.set(parsed.uid, {
              id: parsed.uid,
              uid: parsed.uid,
              email: parsed.email,
              displayName: parsed.displayName,
              role: (parsed.role as UserRole) || 'owner',
              workspaceIds: [parsed.workspaceId || 'ws_cursis_user'],
              activeWorkspaceId: parsed.workspaceId || 'ws_cursis_user',
              skills: [],
              onboardingStatus: 'completed',
              onboardingChecklist: [],
              presence: 'online',
              lastActiveAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });
          }

          return {
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            role: (parsed.role as UserRole) || 'owner',
            workspaceId: parsed.workspaceId || 'ws_cursis_user',
            isDev: false,
          };
        }
      } catch (err) {
        console.warn('Failed to parse cursis_usr_ session token:', err);
      }
    }

    // Demo or dev session fallback
    if (
      sessionToken === 'demo_session_authenticated' ||
      sessionToken?.startsWith('dev_session_') ||
      sessionToken === 'demo_token_cursis_access'
    ) {
      const defaultUser = inMemoryStore.users.get('usr_owner_demo') || {
        id: 'usr_owner_demo',
        uid: 'usr_owner_demo',
        email: 'founder@cursis.ai',
        displayName: 'Aarav Sharma',
        role: 'owner',
        workspaceIds: ['ws_cursis_demo'],
        activeWorkspaceId: 'ws_cursis_demo',
      };

      return {
        uid: defaultUser.uid,
        email: defaultUser.email,
        displayName: defaultUser.displayName,
        role: (defaultUser.role as UserRole) || 'owner',
        workspaceId: defaultUser.activeWorkspaceId || 'ws_cursis_demo',
        isDev: true,
      };
    }

    // If Firebase Admin Auth is active and sessionToken exists
    if (sessionToken && adminAuth && typeof adminAuth.verifySessionCookie === 'function' && process.env.FIREBASE_PROJECT_ID) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionToken, true);
        const userDoc = inMemoryStore.users.get(decoded.uid);
        return {
          uid: decoded.uid,
          email: decoded.email || 'user@cursis.ai',
          displayName: decoded.name || 'Cursis Team Member',
          role: userDoc?.role || 'member',
          workspaceId: userDoc?.activeWorkspaceId || 'ws_cursis_demo',
        };
      } catch (err) {
        console.warn('Session verification fallback to demo user in dev environment');
      }
    }

    // If no valid session cookie/token exists, user is unauthenticated
    return null;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}
