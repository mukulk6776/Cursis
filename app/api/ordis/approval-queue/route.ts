import { NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { inMemoryStore } from '@/lib/db/store';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetWorkspace = searchParams.get('workspaceId') || undefined;

    const wsAuth = await authorizeWorkspaceAccess(request, targetWorkspace);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const status = searchParams.get('status') || undefined;

    let items = Array.from(inMemoryStore.approvalQueue.values())
      .filter((a) => {
        if (a.workspaceId !== workspaceId) return false;
        if (status && a.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam !== null ? Math.max(0, parseInt(offsetParam, 10) || 0) : 0;
    if (offset > 0) items = items.slice(offset);
    if (limitParam !== null) {
      const limit = Math.max(0, parseInt(limitParam, 10));
      items = items.slice(0, limit);
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to retrieve approval queue', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetWorkspace = body.workspaceId;
    const wsAuth = await authorizeWorkspaceAccess(request, targetWorkspace, ['owner', 'admin', 'manager', 'member']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const operation = body.operation || body.actionName || body.action;
    if (!operation) return apiError('Operation is required for approval item', 400);

    const id = body.id || `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem = {
      id,
      workspaceId,
      operation,
      action: operation,
      capability: body.capability || 'takes_outside_action',
      description: body.description || `Approval required for ${operation}`,
      status: 'pending',
      input: body.input || body.payload || {},
      payload: body.payload || body.input || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryStore.approvalQueue.set(id, newItem as any);
    try {
      const db = await getDb();
      if (db) await db.collection('ordis_approvals').insertOne(newItem as any);
    } catch (e) {
      console.warn('MongoDB approval enqueue notice:', e);
    }

    return apiSuccess({ item: newItem }, 201);
  } catch (error: any) {
    return apiError(error?.message || 'Failed to create approval item', 500);
  }
}


