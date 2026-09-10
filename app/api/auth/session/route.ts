export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserProfile, findUserByEmail } from '@/lib/db/users';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser, createSessionToken } from '@/lib/auth/session';
import { adminAuth } from '@/lib/auth/firebase-admin';
import { verifySessionToken } from '@/lib/auth/token';
import { isFounderEmail, getAuthorizedTitle, getAuthorizedRole, getAuthorizedDepartment } from '@/lib/auth/founder';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized', 401);
    }
    const profile = await findUserByEmail(user.email);
    const enrichedUser = {
      ...user,
      title: profile?.title || user.title || 'Team Member',
      department: profile?.department || user.department || 'Engineering',
      skills: profile?.skills || user.skills || ['General'],
      planTier: profile?.planTier || user.planTier || 'standard',
    };
    return apiSuccess({ user: enrichedUser });
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

    if (!idToken) {
      return apiError('Authentication token is required to establish a session', 401);
    }

    let userUid = '';
    let userEmail = '';
    let userName = '';
    let photoURL: string | undefined;

    // 1. Check if idToken is an existing valid Cursis signed session token
    if (idToken.startsWith('cursis_usr_')) {
      const verified = verifySessionToken(idToken);
      if (!verified) {
        return apiError('Invalid or expired session token', 401);
      }
      userUid = verified.uid;
      userEmail = verified.email;
      userName = verified.displayName;
      photoURL = verified.photoURL;
    } else {
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
        return apiError('Invalid or expired authentication credentials', 401);
      }
    }

    // Only allow Gmail and Microsoft email domains
    const allowedDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
    const emailDomain = userEmail.split('@')[1];
    if (emailDomain && !allowedDomains.includes(emailDomain)) {
      return apiError('Only Gmail and Microsoft email accounts (gmail.com, outlook.com, hotmail.com, live.com) are permitted to sign in.', 403);
    }

    // Check for existing user in database
    let existing: any = null;
    if (userEmail) {
      existing = await findUserByEmail(userEmail);
      if (existing) {
        userUid = existing.uid || existing.id || userUid;
        userName = existing.displayName || userName;
        photoURL = existing.photoURL || photoURL;
      }
    }

    const isFounder = isFounderEmail(userEmail);
    const sessionRole = isFounder ? ('owner' as const) : (existing?.role || 'member');
    const sessionWorkspaceId = existing?.activeWorkspaceId || existing?.workspaceIds?.[0] || 'ws_public';

    const sessionPayload = {
      uid: userUid,
      email: userEmail,
      displayName: userName,
      photoURL,
      role: sessionRole,
      workspaceId: sessionWorkspaceId,
      createdAt: Date.now(),
    };

    const sessionToken = createSessionToken(sessionPayload);
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

    const userWorkspaceIds = existing?.workspaceIds && existing.workspaceIds.length > 0
      ? Array.from(new Set([...existing.workspaceIds, 'ws_public', 'ws_default', 'ws_cursis_user']))
      : ['ws_public', 'ws_default', 'ws_cursis_user'];

    createUserProfile(userUid, {
      uid: userUid,
      email: userEmail,
      displayName: userName,
      photoURL,
      role: sessionRole,
      title: isFounder ? 'Founder & CEO' : (existing?.title || 'Team Member'),
      department: isFounder ? 'Leadership' : (existing?.department || 'Engineering'),
      skills: isFounder ? ['Founder & CEO', 'Strategy', 'Architecture'] : (existing?.skills || ['General']),
      workspaceIds: userWorkspaceIds,
      activeWorkspaceId: sessionWorkspaceId,
      planTier: existing?.planTier || 'standard',
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
