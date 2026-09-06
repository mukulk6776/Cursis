import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/auth/firebase-admin';
import { inMemoryStore } from '@/lib/db/store';
import { UserRole } from '@/lib/db/types';

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

    if (sessionToken) {
      sessionToken = sessionToken.trim().replace(/^["']|["']$/g, '');
      if (sessionToken.startsWith('%22') || sessionToken.includes('%')) {
        try {
          sessionToken = decodeURIComponent(sessionToken).replace(/^["']|["']$/g, '');
        } catch {}
      }
    }

    if (!sessionToken) {
      return null;
    }

    // 1. Decoded user session payload (cursis_usr_...)
    if (sessionToken.startsWith('cursis_usr_')) {
      try {
        let payloadStr = sessionToken.replace('cursis_usr_', '');
        if (payloadStr.includes('%')) {
          try {
            payloadStr = decodeURIComponent(payloadStr);
          } catch {}
        }

        let parsed: any = null;

        // Try base64url first
        try {
          const raw = Buffer.from(payloadStr, 'base64url').toString('utf-8');
          parsed = JSON.parse(raw);
        } catch {}

        // Fallback to standard base64
        if (!parsed) {
          try {
            const raw = Buffer.from(payloadStr, 'base64').toString('utf-8');
            parsed = JSON.parse(raw);
          } catch {}
        }

        // Fallback to sanitized base64 replacing standard chars
        if (!parsed) {
          try {
            const raw = Buffer.from(payloadStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
            parsed = JSON.parse(raw);
          } catch {}
        }

        if (parsed && (parsed.email || parsed.uid)) {
          const uid = parsed.uid || ('usr_' + Date.now());
          const email = parsed.email || 'workspace-user@cursis.ai';
          const displayName = parsed.displayName || email.split('@')[0] || 'Cursis User';
          const role = (parsed.role as UserRole) || 'owner';
          const workspaceId = parsed.workspaceId || 'ws_cursis_user';

          // Register in store for foreign-key lookups
          if (!inMemoryStore.users.has(uid)) {
            inMemoryStore.users.set(uid, {
              id: uid,
              uid,
              email,
              displayName,
              photoURL: parsed.photoURL,
              role,
              workspaceIds: [workspaceId],
              activeWorkspaceId: workspaceId,
              skills: ['Workspace Owner', 'Leadership'],
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
            isDev: false,
          };
        }
      } catch (err) {
        console.warn('Failed to parse cursis_usr_ session token:', err);
      }
    }

    // 2. Direct workspace local/dev tokens (cursis_local_..., cursis_dev_..., cursis_google_..., usr_...)
    if (
      sessionToken.startsWith('cursis_local_') ||
      sessionToken.startsWith('cursis_dev_') ||
      sessionToken.startsWith('cursis_google_') ||
      sessionToken.startsWith('usr_')
    ) {
      const uid = sessionToken.startsWith('usr_')
        ? sessionToken
        : 'usr_' + sessionToken.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      
      const existingUser = inMemoryStore.users.get(uid);
      const email = existingUser?.email || 'workspace-founder@cursis.ai';
      const displayName = existingUser?.displayName || 'Cursis Founder';
      const workspaceId = existingUser?.activeWorkspaceId || 'ws_cursis_user';
      const role: UserRole = (existingUser?.role as UserRole) || 'owner';

      if (!inMemoryStore.users.has(uid)) {
        inMemoryStore.users.set(uid, {
          id: uid,
          uid,
          email,
          displayName,
          role,
          workspaceIds: [workspaceId],
          activeWorkspaceId: workspaceId,
          skills: ['Workspace Owner'],
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
        isDev: false,
      };
    }

    // 3. Firebase Admin Session Cookie verification if configured
    if (adminAuth && typeof adminAuth.verifySessionCookie === 'function' && process.env.FIREBASE_PROJECT_ID) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionToken, true);
        const userDoc = inMemoryStore.users.get(decoded.uid);
        return {
          uid: decoded.uid,
          email: decoded.email || 'user@cursis.ai',
          displayName: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Workspace Member'),
          role: userDoc?.role || 'member',
          workspaceId: userDoc?.activeWorkspaceId || 'ws_cursis_main',
        };
      } catch (err) {
        console.warn('Session verification notice:', err);
      }
    }

    // If no valid session cookie/token exists, user is unauthenticated
    return null;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}
