export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, registerUser } from '@/lib/db/users';
import { createSessionToken } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { EMAIL_REGEX } from '@/lib/db/team';
import { isFounderEmail } from '@/lib/auth/founder';
import { isAdminEmail } from '@/lib/auth/admin';
import { issueAdminEmailVerificationCode, verifyAdminEmailCode } from '@/lib/auth/email-verification';
import { isVerificationEmailConfigured } from '@/lib/email/notifications';
import { checkRateLimit, recordAttempt, clearRateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { PrivacyError, accountBlocked, privacyDb, recordAccountConsent } from '@/lib/privacy/core';
import { PRIVACY_VERSION } from '@/lib/privacy/config';
import { passwordValidationError } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit before processing
    const rateCheck = await checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return apiError(
        rateCheck.message || 'Too many signup attempts. Please try again in 30 minutes.',
        429,
        { resetAt: rateCheck.resetAt?.toISOString() }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const ageConfirmed = body.ageConfirmed === true;
    if (body.privacyConsent !== true || body.noticeVersion !== PRIVACY_VERSION) return apiError('Please read the current privacy notice and actively consent to account processing.', 400);
    if (await accountBlocked('', email)) return apiError('Account closure is in progress. Contact the privacy team.', 403);

    // COPPA & Age Eligibility Verification Check
    if (!ageConfirmed) {
      return apiError(
        'You must confirm that you are at least 13. Cursis does not offer accounts for anyone under 13.',
        400
      );
    }

    if (!name) {
      return apiError('Full name is required', 400);
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return apiError('A valid email address is required', 400);
    }

    // Only allow Gmail and Microsoft email domains
    const allowedDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
    const emailDomain = email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      return apiError('Only Gmail and Microsoft email accounts (gmail.com, outlook.com, hotmail.com, live.com) are permitted to create an account.', 403);
    }

    const passwordError = passwordValidationError(password);
    if (passwordError) return apiError(passwordError, 400);

    // Check if account already exists
    const existing = await findUserByEmail(email);
    const isAdminCandidate = isAdminEmail(email);

    if (existing) {
      if (existing.accountStatus === 'suspended') {
        return apiError('This account is suspended. Contact official@cursis.in for assistance.', 403);
      }
      if (!isAdminCandidate || existing.emailVerified) {
        await recordAttempt(clientIP);
        if (existing.passwordHash) {
          return apiError('An account with this email already exists. Please sign in instead.', 409);
        }
        return apiError('An account with this email is already registered using Google Sign-In. Please sign in with Google.', 409);
      }
    }

    let adminEmailVerified = false;
    if (isAdminCandidate) {
      const submittedCode = String(body.verificationCode || '').trim();
      if (!submittedCode) {
        if (isVerificationEmailConfigured()) {
          await issueAdminEmailVerificationCode(email, 'admin_signup');
          return NextResponse.json(
            {
              success: false,
              requiresEmailVerification: true,
              email,
              message: `A 6-digit verification code was sent to ${email}. Enter it below to verify ownership and create your admin account.`,
            },
            { status: 202 }
          );
        }
        return NextResponse.json(
          {
            success: false,
            requiresGoogleVerification: true,
            error: 'Email verification is required to register the administrator address. Click "Continue with Google" to verify ownership and sign up.',
          },
          { status: 403 }
        );
      }

      const codeValid = await verifyAdminEmailCode(email, 'admin_signup', submittedCode);
      if (!codeValid) {
        await recordAttempt(clientIP);
        return apiError('Invalid or expired verification code. Please check your email and try again.', 400);
      }
      adminEmailVerified = true;
    }

    await privacyDb(); // Fail closed: do not create an account with no durable consent storage.
    // Register user account with PBKDF2 salt & hash
    const isFounder = isFounderEmail(email) && adminEmailVerified;
    const user = await registerUser({
      displayName: name,
      email,
      password,
      role: isFounder ? 'owner' : 'member',
      ageConfirmed: true,
      emailVerified: adminEmailVerified,
    });
    await recordAccountConsent(user.uid, 'password-signup');

    // Clear rate limit on successful signup
    await clearRateLimit(clientIP);

    const platformRole = isAdminCandidate && adminEmailVerified ? 'admin' : 'user';
    const redirectTo = platformRole === 'admin' ? '/admin' : '/dashboard?setup=true';

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
    } catch { }

    const response = apiSuccess({
      message: 'Workspace account created successfully',
      user: { ...sessionPayload, emailVerified: adminEmailVerified, activePlan: null },
      redirectTo,
      token,
    }, 201);

    response.cookies.set('cursis_session', token, cookieOptions);
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error instanceof PrivacyError && error.status === 503) return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. Please try again shortly.' }, { status: 503 });
    return apiError('Failed to create workspace account due to an internal server error. Please try again.', 500);
  }
}
