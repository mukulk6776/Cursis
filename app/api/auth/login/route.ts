export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, registerUser, verifyPassword } from '@/lib/db/users';
import { createSessionToken } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { isFounderEmail } from '@/lib/auth/founder';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    // Credentials Validation
    if (!email || !email.includes('@')) {
      return apiError('Please enter a valid email address', 400);
    }

    // Only allow Gmail and Microsoft email domains
    const allowedDomains = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
    const emailDomain = email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      return apiError('Only Gmail and Microsoft email accounts (gmail.com, outlook.com, hotmail.com, live.com) are permitted to sign in.', 403);
    }

    if (!password) {
      return apiError('Please enter your password', 400);
    }

    let user = await findUserByEmail(email);

    if (user && user.passwordHash && user.salt) {
      // Verify stored password hash
      const isValid = verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        return apiError('Incorrect email or password. Please verify your credentials.', 401);
      }
    } else if (!user) {
      // Auto-provision new account if not already in system
      const isFounder = isFounderEmail(email);
      user = await registerUser({
        displayName: email.split('@')[0],
        email,
        password,
        role: isFounder ? 'owner' : 'member',
      });
    }

    const sessionPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      workspaceId: user.activeWorkspaceId || `ws_${user.uid}`,
      photoURL: user.photoURL,
      createdAt: Date.now(),
    };

    const token = createSessionToken(sessionPayload);
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

    const cookieOptions = {
      maxAge: maxAgeSeconds,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    try {
      const cookieStore = await cookies();
      cookieStore.set('cursis_session', token, cookieOptions);
    } catch {}

    const response = apiSuccess({
      message: 'Authentication successful',
      user: sessionPayload,
      token,
    });

    response.cookies.set('cursis_session', token, cookieOptions);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return apiError(error.message || 'Authentication failed', 500);
  }
}
