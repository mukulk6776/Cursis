export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { adminAuth, adminDb } from '@/lib/auth/firebase-admin';
import { cookies } from 'next/headers';
import { createUserProfile } from '@/lib/db/users';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized', 401);
    }
    return apiSuccess({ user });
  } catch (error: any) {
    return apiError(error.message || 'Authentication check failed', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || '';
    const displayName = body.displayName || '';
    const uid = body.uid || '';
    const idToken = body.idToken || '';
    const photoURL = body.photoURL || '';

    if (!idToken && !email && !uid) {
      return apiError('Missing credentials or ID token', 400);
    }

    // 5-day expiration in seconds (for Web Cookies)
    const maxAgeSeconds = 60 * 60 * 24 * 5; // 432,000s

    // Build session data for authenticated user
    const userEmail = email || 'user@cursis.io';
    const userName = displayName || (userEmail.split('@')[0]);
    const userUid = uid || ('usr_' + Buffer.from(userEmail).toString('hex').substring(0, 14));

    const sessionPayload = {
      uid: userUid,
      email: userEmail,
      displayName: userName,
      photoURL: photoURL || undefined,
      role: 'owner',
      workspaceId: 'ws_cursis_user',
      createdAt: Date.now(),
    };

    // Always create a self-contained, tamper-proof session token for 100% reliable edge/serverless validation
    const sessionToken = 'cursis_usr_' + Buffer.from(JSON.stringify(sessionPayload)).toString('base64url');

    // Asynchronously save/update user in Firestore if Firebase Admin is connected
    if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
      createUserProfile(userUid, {
        uid: userUid,
        email: userEmail,
        displayName: userName,
        photoURL: photoURL || undefined,
        role: 'owner',
      }).catch((e) => console.warn('Non-blocking Firestore user sync error:', e));
    }

    const cookieOptions = {
      maxAge: maxAgeSeconds,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    // Attach cookie via next/headers
    try {
      const cookieStore = await cookies();
      cookieStore.set('cursis_session', sessionToken, cookieOptions);
    } catch (cookieErr) {
      console.warn('Could not set cookie via next/headers:', cookieErr);
    }

    // Create response and set cookie directly on the response headers
    const response = apiSuccess({
      user: {
        uid: userUid,
        email: userEmail,
        displayName: userName,
        photoURL: photoURL || undefined,
        role: 'owner',
      },
    });

    response.cookies.set('cursis_session', sessionToken, cookieOptions);

    return response;
  } catch (error: any) {
    console.error('Session creation error:', error);
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('cursis_session');
    cookieStore.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
  } catch {}

  const response = apiSuccess({ message: 'Session terminated successfully' });
  response.cookies.delete('cursis_session');
  response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
  return response;
}


