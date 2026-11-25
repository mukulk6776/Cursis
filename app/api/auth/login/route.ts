export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, registerUser, verifyPasswordResultAsync, upgradePasswordHash } from '@/lib/db/users';
import { createSessionToken } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { isFounderEmail } from '@/lib/auth/founder';
import { isAdminEmail } from '@/lib/auth/admin';
import { issueAdminEmailVerificationCode, verifyAdminEmailCode } from '@/lib/auth/email-verification';
import { isVerificationEmailConfigured } from '@/lib/email/notifications';
import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import type { PlatformRole, UserProfile } from '@/lib/db/types';
import { resolveActiveUserPlan } from '@/lib/plans';
import { checkRateLimit, recordAttempt, clearRateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { PrivacyError, accountBlocked, privacyDb } from '@/lib/privacy/core';
import { EMAIL_REGEX } from '@/lib/db/team';

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit before processing
    const rateCheck = await checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return apiError(
        rateCheck.message || 'Too many login attempts. Please try again in 30 minutes.',
        429,
        { resetAt: rateCheck.resetAt?.toISOString() }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    await privacyDb();
    if (await accountBlocked('', email)) return apiError('This account is closed or pending erasure. Contact the privacy team for assistance.', 403);

    // Credentials Validation
    if (!email || !EMAIL_REGEX.test(email)) {
      await recordAttempt(clientIP);
      return apiError('Please enter a valid email address', 400);
    }

    // Only allow Gmail and Microsoft email domains
    const allowedDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
    const emailDomain = email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      await recordAttempt(clientIP);
      return apiError('Only Gmail and Microsoft email accounts (gmail.com, outlook.com, hotmail.com, live.com) are permitted to sign in.', 403);
    }

    if (!password) {
      await recordAttempt(clientIP);
      return apiError('Please enter your password', 400);
    }

    const userRateKey = `${clientIP}_${email}`;
    const accountCheck = await checkRateLimit(userRateKey);
    if (!accountCheck.allowed) {
      return apiError(
        accountCheck.message || 'Too many login attempts for this account. Please try again later.',
        429,
        { resetAt: accountCheck.resetAt?.toISOString() }
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      await recordAttempt(clientIP);
      await recordAttempt(userRateKey);
      return apiError('Incorrect email or password. Please verify your credentials.', 401);
    }

    // Block password login for OAuth-only accounts (no password hash set)
    if (!user.passwordHash || !user.salt) {
      await recordAttempt(clientIP);
      await recordAttempt(userRateKey);
      return apiError('This account was created with Google sign-in. Please use the Google button to sign in.', 401);
    }

    // Verify stored password hash asynchronously to prevent event-loop starvation
    const authResult = await verifyPasswordResultAsync(password, user.salt, user.passwordHash);
    if (!authResult.valid) {
      // Record failed attempt
      await recordAttempt(clientIP);
      await recordAttempt(userRateKey);
      return apiError('Incorrect email or password. Please verify your credentials.', 401);
    }

    // Transparently upgrade legacy iteration hashes on successful login
    if (authResult.needsRehash) {
      await upgradePasswordHash(user.email, password).catch((err) => {
        console.warn('Password rehash upgrade notice:', err);
      });
    }

    // Block suspended accounts from signing in
    if (user.accountStatus === 'suspended') {
      return apiError('Your account has been suspended by an administrator. Contact official@cursis.in for assistance.', 403);
    }

    const nowIso = new Date().toISOString();
    const isDesignatedAdmin = isAdminEmail(user.email);
    let emailVerified = Boolean(user.emailVerified);
    let platformRole: PlatformRole = isDesignatedAdmin && emailVerified ? 'admin' : 'user';

    // Never grant admin privileges until the admin email has been verified
    if (isDesignatedAdmin && !emailVerified) {
      const submittedCode = String(body.verificationCode || '').trim();
      if (submittedCode) {
        const verifiedNow = await verifyAdminEmailCode(user.email, 'admin_login', submittedCode);
        if (!verifiedNow) {
          await recordAttempt(clientIP);
          await recordAttempt(userRateKey);
          return apiError('Invalid or expired verification code. Please request a new code and try again.', 400);
        }
        emailVerified = true;
        platformRole = 'admin';
      } else if (isVerificationEmailConfigured()) {
        await issueAdminEmailVerificationCode(user.email, 'admin_login');
        return NextResponse.json(
          {
            success: false,
            requiresEmailVerification: true,
            email: user.email,
            message: `Enter the 6-digit verification code sent to ${user.email} to verify ownership and access the Admin Console.`,
          },
          { status: 202 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            requiresGoogleVerification: true,
            error: 'Email verification is required for administrator access. Sign in once with "Continue with Google" to verify your email.',
          },
          { status: 403 }
        );
      }
    }

    // Clear rate limit on successful login
    await clearRateLimit(clientIP);
    await clearRateLimit(userRateKey);

    // Sync verified platformRole and lastActiveAt in MongoDB & memory store
    try {
      const usersCol = await getCollection<UserProfile>('users');
      const setDoc: Record<string, any> = {
        platformRole,
        lastActiveAt: nowIso,
        presence: 'online',
      };
      if (emailVerified) {
        setDoc.emailVerified = true;
        setDoc.emailVerifiedAt = user.emailVerifiedAt || nowIso;
      }
      if (usersCol) {
        await usersCol.updateOne({ uid: user.uid }, { $set: setDoc });
      }
      user.platformRole = platformRole;
      user.emailVerified = emailVerified;
      user.lastActiveAt = nowIso;
      inMemoryStore.users.set(user.uid, user);
    } catch (syncErr) {
      console.warn('Login user role/activity sync notice:', syncErr);
    }

    const activePlan = resolveActiveUserPlan(user.subscription);
    const sessionPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      platformRole,
      workspaceId: user.activeWorkspaceId || `ws_${user.uid}`,
      photoURL: user.photoURL,
      createdAt: Date.now(),
    };
    const redirectTo = platformRole === 'admin' ? '/admin' : '/dashboard';

    const token = createSessionToken(sessionPayload);
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

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
      cookieStore.set('cursis_session', token, cookieOptions);
    } catch {}

    const response = apiSuccess({
      message: 'Authentication successful',
      user: { ...sessionPayload, activePlan, emailVerified },
      redirectTo,
      token,
    });

    response.cookies.set('cursis_session', token, cookieOptions);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    if (error instanceof PrivacyError && error.status === 503) return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. Please try again shortly.' }, { status: 503 });
    return apiError('Authentication failed due to an internal server error. Please try again.', 500);
  }
}
