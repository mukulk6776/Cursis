export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { cookies } from 'next/headers';
import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getUserWorkspaceRole } from '@/lib/auth/rbac';
import { createSessionToken, SessionPayload } from '@/lib/auth/token';
import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import { UserProfile } from '@/lib/db/types';

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : '';

    if (!workspaceId) {
      return apiError('A valid workspaceId is required to switch workspace', 400);
    }

    // Verify user is an active member or owner of target workspace
    const targetRole = await getUserWorkspaceRole(authUser.uid, workspaceId, authUser.email);
    if (!targetRole) {
      return apiError('Forbidden: You are not an active member of the target workspace', 403);
    }

    // Update activeWorkspaceId in MongoDB users collection
    try {
      const usersCol = await getCollection<UserProfile>('users');
      if (usersCol) {
        await usersCol.updateOne(
          { $or: [{ id: authUser.uid }, { uid: authUser.uid }, { email: authUser.email }] },
          { $set: { activeWorkspaceId: workspaceId, updatedAt: new Date().toISOString() } }
        );
      }
    } catch (e) {
      console.warn('MongoDB switch workspace user update notice:', e);
    }

    // Update in-memory user fallback
    const memUser = inMemoryStore.users.get(authUser.uid) ||
      Array.from(inMemoryStore.users.values()).find((u) => u.email === authUser.email);
    if (memUser) {
      memUser.activeWorkspaceId = workspaceId;
    }

    // Re-mint cursis_session HTTP-only cookie with the new workspaceId and target role
    const sessionPayload: SessionPayload = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      photoURL: authUser.photoURL,
      role: targetRole,
      workspaceId,
      createdAt: Date.now(),
    };

    const sessionToken = createSessionToken(sessionPayload);
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days
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
      cookieStore.set('cursis_session', sessionToken, cookieOptions);
    } catch {}

    const response = apiSuccess({
      success: true,
      workspaceId,
      token: sessionToken,
      user: sessionPayload,
    });
    if (response.cookies?.set) {
      response.cookies.set('cursis_session', sessionToken, cookieOptions);
    }
    return response;
  } catch (error: any) {
    return apiError(error.message || 'Failed to switch workspace', 500);
  }
}
