export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, registerUser } from '@/lib/db/users';
import { createSessionToken } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { isFounderEmail } from '@/lib/auth/founder';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!name) {
      return apiError('Full name is required', 400);
    }
    if (!email || !email.includes('@')) {
      return apiError('A valid email address is required', 400);
    }
    if (!password || password.length < 6) {
      return apiError('Password must be at least 6 characters long', 400);
    }

    // Check if account already exists
    const existing = await findUserByEmail(email);
    if (existing && existing.passwordHash) {
      return apiError('An account with this email already exists. Please sign in instead.', 409);
    }

    // Register user account with PBKDF2 salt & hash
    const isFounder = isFounderEmail(email);
    const user = await registerUser({
      displayName: name,
      email,
      password,
      role: isFounder ? 'owner' : 'member',
    });

    const sessionPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      workspaceId: user.activeWorkspaceId || 'ws_cursis_user',
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
      message: 'Workspace account created successfully',
      user: sessionPayload,
      token,
    }, 201);

    response.cookies.set('cursis_session', token, cookieOptions);
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return apiError(error.message || 'Failed to create workspace account', 500);
  }
}
