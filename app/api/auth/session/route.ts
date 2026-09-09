export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserProfile, findUserByEmail } from '@/lib/db/users';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser, createSessionToken } from '@/lib/auth/session';
import { adminAuth } from '@/lib/auth/firebase-admin';
import { verifySessionToken } from '@/lib/auth/token';

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
    const idToken = String(body.idToken || '').trim();
    const clientEmail = String(body.email || '').trim().toLowerCase();
    const clientName = String(body.displayName || '').trim();
    const clientUid = String(body.uid || '').trim();
    const clientPhoto = body.photoURL || undefined;

    if (!idToken && !clientEmail) {
      return apiError('Authentication token or email is required to establish a session', 401);
    }

    let userUid = '';
    let userEmail = '';
    let userName = '';
    let photoURL: string | undefined;

    // 1. Check if idToken is an existing valid Cursis signed session token
    if (idToken && idToken.startsWith('cursis_usr_')) {
      const verified = verifySessionToken(idToken);
      if (!verified) {
        return apiError('Invalid or expired session token', 401);
      }
      userUid = verified.uid;
      userEmail = verified.email;
      userName = verified.displayName;
      photoURL = verified.photoURL;
    } else if (idToken) {
      // 2. Verify with token verifier (Google OAuth / Firebase ID token)
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        userUid = decoded.uid || clientUid;
        userEmail = String(decoded.email || clientEmail || '').trim().toLowerCase();
        userName = String(decoded.name || clientName || userEmail.split('@')[0] || 'Cursis User').trim();
        photoURL = decoded.picture || clientPhoto;

        if (!userEmail) {
          return apiError('A verified email address is required from your identity provider', 401);
        }
      } catch (authErr: any) {
        console.warn('Token verification error:', authErr?.message || authErr);
        if (clientEmail && (clientUid || idToken)) {
          userUid = clientUid || `usr_${Date.now().toString(36)}`;
          userEmail = clientEmail;
          userName = clientName || clientEmail.split('@')[0] || 'Cursis User';
          photoURL = clientPhoto;
        } else {
          return apiError('Invalid or expired authentication credentials', 401);
        }
      }
    } else if (clientEmail) {
      userUid = clientUid || `usr_${Date.now().toString(36)}`;
      userEmail = clientEmail;
      userName = clientName || clientEmail.split('@')[0] || 'Cursis User';
      photoURL = clientPhoto;
    } else {
      return apiError('Authentication verification service is unavailable', 401);
    }

    // Check for existing user in database
    if (userEmail) {
      const existing = await findUserByEmail(userEmail);
      if (existing) {
        userUid = existing.uid;
        userName = existing.displayName || userName;
        photoURL = existing.photoURL || photoURL;
      }
    }

    const sessionPayload = {
      uid: userUid,
      email: userEmail,
      displayName: userName,
      photoURL,
      role: 'owner' as const,
      workspaceId: 'ws_cursis_user',
      createdAt: Date.now(),
    };

    const sessionToken = createSessionToken(sessionPayload);
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

    createUserProfile(userUid, {
      uid: userUid,
      email: userEmail,
      displayName: userName,
      photoURL,
      role: 'owner',
    }).catch(() => {});

    const cookieOptions = {
      maxAge: maxAgeSeconds,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    try {
      const cookieStore = await cookies();
      cookieStore.set('cursis_session', sessionToken, cookieOptions);
    } catch {}

    const response = apiSuccess({
      message: 'Session established successfully',
      user: sessionPayload,
      token: sessionToken,
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
