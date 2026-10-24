import { getUserWorkspaceRole } from '@/lib/auth/rbac';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserProfile, findUserByEmail } from '@/lib/db/users';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser, createSessionToken, isSessionRevoked } from '@/lib/auth/session';
import { adminAuth } from '@/lib/auth/firebase-admin';
import { verifySessionToken } from '@/lib/auth/token';
import { isFounderEmail, getAuthorizedTitle, getAuthorizedRole, getAuthorizedDepartment } from '@/lib/auth/founder';
import { PrivacyError, accountBlocked, recordAccountConsent } from '@/lib/privacy/core';
import { PRIVACY_VERSION } from '@/lib/privacy/config';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized', 401);
    }
    const profile = await findUserByEmail(user.email);
    const resolvedPhoto = profile?.photoURL || user.photoURL;
    const workspaceId = profile?.activeWorkspaceId || profile?.workspaceIds?.[0] || user.workspaceId || `ws_${user.uid}`;
    const workspaceRole = await getUserWorkspaceRole(user.uid, workspaceId);
    const enrichedUser = {
      ...user,
      role: workspaceRole || 'member',
      workspaceRole: workspaceRole || 'member',
      photoURL: resolvedPhoto,
      avatar: resolvedPhoto,
      workspaceId: profile?.activeWorkspaceId || profile?.workspaceIds?.[0] || user.workspaceId,
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
      if (!verified || await isSessionRevoked(verified)) {
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
        if (!decoded || !decoded.uid) {
          return apiError('Invalid authentication token', 401);
        }

        // AUTH-09: Require verified provider email from the identity provider.
        // Never use client-supplied email or UID for account identity binding.
        const providerEmail = String(decoded.email || '').trim().toLowerCase();
        if (!providerEmail) {
          return apiError('A verified email address is required from your identity provider', 401);
        }
        if (decoded.email_verified === false) {
          return apiError('Email address must be verified by your identity provider before signing in', 401);
        }

        userUid = decoded.uid;
        userEmail = providerEmail;
        userName = String(decoded.name || userEmail.split('@')[0] || 'Cursis User').trim();
        photoURL = decoded.picture || undefined;
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
    if (await accountBlocked(userUid, userEmail)) return apiError('This account is closed or pending erasure.', 403);
    if (!existing) {
      if (body.ageConfirmed !== true || body.privacyConsent !== true || body.noticeVersion !== PRIVACY_VERSION) {
        return apiError('New users must use /signup, confirm they are 18 or older, and consent to the privacy notice.', 400);
      }
      await recordAccountConsent(userUid, 'google-signup');
    }
    const sessionRole = isFounder ? ('owner' as const) : (existing?.role || 'member');
    const sessionWorkspaceId = existing?.activeWorkspaceId || existing?.workspaceIds?.[0] || `ws_${userUid}`;

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
      ? existing.workspaceIds
      : [`ws_${userUid}`];

    await createUserProfile(userUid, {
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
    });

    const host = request.headers.get('host') || '';
    const isCursisDomain = host.includes('cursis.in');
    const cookieOptions = {
      maxAge: maxAgeSeconds,
      httpOnly: true,  // ✅ SECURITY FIX: Prevent XSS access to session cookie
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
      ...(isCursisDomain ? { domain: '.cursis.in' } : {}),
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
    if (error instanceof PrivacyError && error.status === 503) return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. Please try again shortly.' }, { status: 503 });
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function DELETE(request: Request) {
  const host = request?.headers?.get('host') || '';
  const isCursisDomain = host.includes('cursis.in');
  const deleteCookieOptions = {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(0),
    ...(isCursisDomain ? { domain: '.cursis.in' } : {}),
  };
  try {
    const cookieStore = await cookies();
    cookieStore.delete('cursis_session');
    cookieStore.set('cursis_session', '', deleteCookieOptions);
  } catch {}

  const response = apiSuccess({ message: 'Session terminated successfully' });
  response.cookies.delete('cursis_session');
  response.cookies.set('cursis_session', '', deleteCookieOptions);
  return response;
}
