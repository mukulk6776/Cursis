import { NextResponse } from 'next/server';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { inMemoryStore } from '@/lib/db/store';
import { getDb } from '@/lib/mongodb';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'approve'; // 'approve' | 'reject'

    let targetWsId = body.workspaceId;
    let existingItem: any = inMemoryStore.approvalQueue.get(id);
    if (!existingItem) {
      const db = await getDb();
      if (db) {
        existingItem = await db.collection('ordis_approvals').findOne({ id });
      }
    }
    if (existingItem) {
      targetWsId = existingItem.workspaceId;
    }

    const wsAuth = await authorizeWorkspaceAccess(request, targetWsId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const resolved = await OrdisEngine.resolveApprovalItem(id, action, wsAuth.user.uid, wsAuth.workspaceId);
    if (!resolved) {
      return NextResponse.json({ error: 'Approval item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: resolved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

