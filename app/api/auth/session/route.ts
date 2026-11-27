import { getUserWorkspaceRole } from '@/lib/auth/rbac';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUserProfile, findUserByEmail } from '@/lib/db/users';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser, createSessionToken, isSessionRevoked, isSessionUserSuspended } from '@/lib/auth/session';
import { adminAuth } from '@/lib/auth/firebase-admin';
import { verifySessionToken } from '@/lib/auth/token';
import { isFounderEmail, getAuthorizedTitle, getAuthorizedRole, getAuthorizedDepartment } from '@/lib/auth/founder';
import { isAdminEmail, isVerifiedAdminUser } from '@/lib/auth/admin';
import { resolveActiveUserPlan } from '@/lib/plans';
import { getCollection } from '@/lib/mongodb';
import type { UserProfile } from '@/lib/db/types';
import { PrivacyError, accountBlocked, recordAccountConsent } from '@/lib/privacy/core';
import { PRIVACY_VERSION } from '@/lib/privacy/config';

export async function GET(request: Request) {
  try {
    // Check if an otherwise valid token belongs to a suspended user
    let rawToken: string | undefined;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) rawToken = authHeader.substring(7).trim();
    if (!rawToken) {
      const cookieMatch = request.headers.get('cookie')?.match(/cursis_session=([^;]+)/);
      if (cookieMatch) rawToken = decodeURIComponent(cookieMatch[1]);
    }
    if (!rawToken) {
      try {
        const store = await cookies();
        rawToken = store.get('cursis_session')?.value;
      } catch {}
    }
    if (rawToken && rawToken.startsWith('cursis_usr_')) {
      const parsedToken = verifySessionToken(rawToken);
      if (parsedToken && (await isSessionUserSuspended(parsedToken))) {
        const res = NextResponse.json(
          { success: false, suspended: true, error: 'Your account has been suspended by an administrator.' },
          { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
        );
        res.cookies.delete('cursis_session');
        res.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
        return res;
      }
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized', 401);
    }
    const profile = await findUserByEmail(user.email);
    if (profile?.accountStatus === 'suspended') {
      const res = NextResponse.json(
        { success: false, suspended: true, error: 'Your account has been suspended by an administrator.' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
      );
      res.cookies.delete('cursis_session');
      res.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      return res;
    }

    // Backfill verified admin role in DB if verified ADMIN_EMAIL does not yet carry platformRole='admin'
    if (profile && isAdminEmail(profile.email) && profile.emailVerified === true && profile.platformRole !== 'admin') {
      try {
        const usersCol = await getCollection<UserProfile>('users');
        if (usersCol) {
          await usersCol.updateOne({ uid: profile.uid }, { $set: { platformRole: 'admin' } });
        }
        profile.platformRole = 'admin';
      } catch {}
    }

    const resolvedPhoto = profile?.photoURL || user.photoURL;
    const workspaceId = profile?.activeWorkspaceId || profile?.workspaceIds?.[0] || user.workspaceId || `ws_${user.uid}`;
    const workspaceRole = await getUserWorkspaceRole(user.uid, workspaceId);
    const activePlan = resolveActiveUserPlan(profile?.subscription);
    const platformRole = isVerifiedAdminUser(profile) ? 'admin' : 'user';
    const enrichedUser = {
      ...user,
      role: workspaceRole || 'member',
      workspaceRole: workspaceRole || 'member',
      platformRole,
      emailVerified: Boolean(profile?.emailVerified),
      activePlan,
      photoURL: resolvedPhoto,
      avatar: resolvedPhoto,
      workspaceId: profile?.activeWorkspaceId || profile?.workspaceIds?.[0] || user.workspaceId,
      title: profile?.title || user.title || 'Team Member',
      department: profile?.department || user.department || 'Engineering',
      skills: profile?.skills || user.skills || ['General'],
      planTier: profile?.planTier || user.planTier || 'standard',
    };
    return apiSuccess({ user: enrichedUser }, 200, { 'Cache-Control': 'private, no-store' });
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
      // Support session workspace refresh for authenticated user (PROJECT.md line 51 & E2E 9.1)
      const authUser = await getAuthenticatedUser(request);
      if (authUser && body.workspaceId) {
        const targetWsId = String(body.workspaceId).trim();
        const wsRole = (await getUserWorkspaceRole(authUser.uid, targetWsId, authUser.email)) || authUser.role;
        const refreshedPayload = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          role: wsRole,
          platformRole: authUser.platformRole,
          workspaceId: targetWsId,
          createdAt: Date.now(),
        };
        const refreshedToken = createSessionToken(refreshedPayload);
        const maxAgeSeconds = 60 * 60 * 24 * 7;
        const host = request.headers.get('host') || '';
        const isCursisDomain = host.includes('cursis.in');
        const cookieOptions = {
          maxAge: maxAgeSeconds,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          sameSite: 'lax' as const,
          ...(isCursisDomain ? { domain: '.cursis.in' } : {}),
        };
        try {
          const cookieStore = await cookies();
          cookieStore.set('cursis_session', refreshedToken, cookieOptions);
        } catch {}
        const response = apiSuccess({
          message: 'Session refreshed with updated workspace',
          user: refreshedPayload,
          token: refreshedToken,
        }, 200, { 'Cache-Control': 'private, no-store' });
        if (response.cookies?.set) {
          response.cookies.set('cursis_session', refreshedToken, cookieOptions);
        }
        return response;
      }
      return apiError('Authentication token is required to establish a session', 401);
    }

    let userUid = '';
    let userEmail = '';
    let userName = '';
    let photoURL: string | undefined;
    let verifiedByProvider = false;

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
        if (decoded.email_verified !== true) {
          return apiError('Email address must be verified by your identity provider before signing in', 401);
        }

        userUid = decoded.uid;
        userEmail = providerEmail;
        userName = String(decoded.name || userEmail.split('@')[0] || 'Cursis User').trim();
        photoURL = decoded.picture || undefined;
        verifiedByProvider = true;
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
        if (existing.accountStatus === 'suspended') {
          return apiError('Your account has been suspended by an administrator. Contact official@cursis.in for assistance.', 403);
        }
        userUid = existing.uid || existing.id || userUid;
        userName = existing.displayName || userName;
        photoURL = existing.photoURL || photoURL;
      }
    }

    const emailVerified = verifiedByProvider || Boolean(existing?.emailVerified);
    const isAdminAccount = isAdminEmail(userEmail) && emailVerified;
    const isFounder = isFounderEmail(userEmail) && emailVerified;
    if (await accountBlocked(userUid, userEmail)) return apiError('This account is closed or pending erasure.', 403);
    if (!existing) {
      if (body.ageConfirmed !== true || body.privacyConsent !== true || body.noticeVersion !== PRIVACY_VERSION) {
        return apiError('New users must use /signup, confirm they are 13 or older, and consent to the privacy notice.', 400);
      }
      await recordAccountConsent(userUid, 'google-signup');
    }
    const sessionRole = isFounder ? ('owner' as const) : (existing?.role || 'member');
    const platformRole = isAdminAccount ? ('admin' as const) : ('user' as const);
    const sessionWorkspaceId = existing?.activeWorkspaceId || existing?.workspaceIds?.[0] || `ws_${userUid}`;
    const activePlan = resolveActiveUserPlan(existing?.subscription);
    const redirectTo = platformRole === 'admin' ? '/admin' : '/dashboard?setup=true';

    // If Google verified an email that previously had an unverified password row, drop the unverified password
    const preservePasswordHash = existing?.emailVerified ? existing?.passwordHash : (verifiedByProvider ? undefined : existing?.passwordHash);
    const preserveSalt = existing?.emailVerified ? existing?.salt : (verifiedByProvider ? undefined : existing?.salt);

    const sessionPayload = {
      uid: userUid,
      email: userEmail,
      displayName: userName,
      photoURL,
      role: sessionRole,
      platformRole,
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
      platformRole,
      emailVerified,
      emailVerifiedAt: existing?.emailVerifiedAt || (emailVerified ? new Date().toISOString() : null),
      passwordHash: preservePasswordHash,
      salt: preserveSalt,
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
      httpOnly: true, // SECURITY FIX: Prevent XSS access to session cookie
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
      user: { ...sessionPayload, emailVerified, activePlan },
      redirectTo,
      token: sessionToken,
    }, 200, { 'Cache-Control': 'private, no-store' });

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
