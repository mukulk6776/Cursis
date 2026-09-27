export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { verifySessionToken } from '@/lib/auth/session';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  hasWorkspaceAccess
} from '@/lib/db/workspaces-enhanced';

/**
 * GET /api/workspaces - Get all user's workspaces
 * POST /api/workspaces - Create new workspace
 */

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('cookie')?.match(/cursis_session=([^;]+)/)?.[1];

    if (!token) {
      return apiError('Authentication required', 401);
    }

    const session = verifySessionToken(token);
    if (!session) {
      return apiError('Invalid or expired session', 401);
    }

    const workspaces = await getUserWorkspaces(session.uid);

    return apiSuccess({
      workspaces: workspaces.map(w => ({
        workspaceId: w.workspaceId,
        name: w.name,
        slug: w.slug,
        role: w.members.find(m => m.userId === session.uid)?.role,
        memberCount: w.members.length,
        createdAt: w.createdAt,
        settings: w.settings,
      })),
    });
  } catch (error: any) {
    console.error('Get workspaces error:', error);
    return apiError(error.message || 'Failed to fetch workspaces', 500);
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('cookie')?.match(/cursis_session=([^;]+)/)?.[1];

    if (!token) {
      return apiError('Authentication required', 401);
    }

    const session = verifySessionToken(token);
    if (!session) {
      return apiError('Invalid or expired session', 401);
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();

    if (!name) {
      return apiError('Workspace name is required', 400);
    }

    if (name.length < 3) {
      return apiError('Workspace name must be at least 3 characters', 400);
    }

    const workspace = await createWorkspace({
      name,
      ownerId: session.uid,
      ownerEmail: session.email,
    });

    return apiSuccess({
      message: 'Workspace created successfully',
      workspace: {
        workspaceId: workspace.workspaceId,
        name: workspace.name,
        slug: workspace.slug,
        url: `/dashboard/w/${workspace.slug}`,
      },
    }, 201);
  } catch (error: any) {
    console.error('Create workspace error:', error);
    return apiError(error.message || 'Failed to create workspace', 500);
  }
}
