import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getUserWorkspaces, createWorkspace, updateWorkspace } from '@/lib/db/workspaces';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const workspaces = await getUserWorkspaces(authUser.uid);
    const formatted = workspaces.map((w) => ({
      id: w.id,
      name: w.name || 'Workspace',
      shortName: (w as any).shortName || (w.name ? w.name.slice(0, 3).toUpperCase() : 'WS'),
      tagline: (w as any).tagline || 'Intelligent Workspace for Modern Teams',
      isCustomClient: Boolean((w as any).isCustomClient),
      badge: w.ownerId === authUser.uid ? 'Owner' : 'Member',
      color: (w as any).color || '#0f4cff',
      ownerId: w.ownerId,
      memberCount: w.memberCount || 1,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
    return apiSuccess({ workspaces: formatted });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve workspaces', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return apiError('Workspace name is required', 400);
    }

    const workspaceId = await createWorkspace(authUser.uid, {
      ...body,
      name: body.name.trim(),
    });

    return apiSuccess({ workspaceId }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create workspace', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const rawId = String(body.workspaceId || body.id || '').trim();
    const targetWsId =
      rawId && rawId !== 'ws_default' && rawId !== 'ws_public'
        ? rawId
        : ((authUser as any).workspaceId || `ws_${authUser.uid}`);

    const name = body.name ? String(body.name).trim() : undefined;
    if (!name && !body.tagline && !body.settings && !body.industry && !body.accentColor) {
      return apiError('At least one workspace attribute must be updated', 400);
    }

    const updates: any = {};
    if (name) {
      updates.name = name;
      updates.shortName = name.slice(0, 3).toUpperCase();
    }
    if (body.tagline !== undefined) updates.tagline = body.tagline;
    if (body.industry !== undefined) updates.industry = body.industry;
    if (body.teamSize !== undefined) updates.teamSize = body.teamSize;
    if (body.settings) updates.settings = body.settings;
    if (body.accentColor) updates.color = body.accentColor;

    const updated = await updateWorkspace(targetWsId, updates);
    if (!updated) {
      return apiError('Failed to update workspace in store', 500);
    }

    return apiSuccess({
      workspace: {
        id: updated.id,
        name: updated.name,
        shortName: (updated as any).shortName || (updated.name ? updated.name.slice(0, 3).toUpperCase() : 'WS'),
        tagline: (updated as any).tagline || 'Intelligent Workspace for Modern Teams',
        color: (updated as any).color || '#0f4cff',
        updatedAt: updated.updatedAt,
      },
      message: 'Workspace updated successfully',
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update workspace', 500);
  }
}
