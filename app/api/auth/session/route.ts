export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserProfile, findUserByEmail } from '@/lib/db/users';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser, createSessionToken } from '@/lib/auth/session';

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
    const email = String(body.email || '').trim().toLowerCase();
    const displayName = String(body.displayName || '').trim();
    const uid = String(body.uid || '').trim();
    const photoURL = body.photoURL || undefined;

    let userEmail = email;
    let userUid = uid;
    let userName = displayName;

    if (userEmail) {
      const existing = await findUserByEmail(userEmail);
      if (existing) {
        userUid = existing.uid;
        userName = existing.displayName || userName;
      }
    }

    if (!userEmail && !userUid) {
      return apiError('Valid authentication credentials are required to initialize a session', 401);
    }
    if (!userUid) {
      userUid = 'usr_' + Date.now().toString(36);
    }

    if (!userName) {
      userName = userEmail.split('@')[0] || 'Cursis User';
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
