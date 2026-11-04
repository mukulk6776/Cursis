import { apiSuccess, apiError } from '@/lib/api/response';
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

    if (!body.action || (body.action !== 'approve' && body.action !== 'reject')) {
      return apiError('Invalid action. Must be approve or reject', 400);
    }
    const action = body.action;

    let targetWsId = body.workspaceId;
    let existingItem: any = inMemoryStore.approvalQueue.get(id);
    if (!existingItem) {
      try {
        const db = await getDb();
        if (db) {
          existingItem = await db.collection('ordis_approvals').findOne({ id });
        }
      } catch (e) {
        console.warn('MongoDB approval fetch fallback notice:', e);
      }
    }
    if (!existingItem) {
      return apiError('Approval item not found', 404);
    }
    targetWsId = existingItem.workspaceId;

    // Strictly restrict approval resolution to workspace owner or admin
    const wsAuth = await authorizeWorkspaceAccess(request, targetWsId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const resolved = await OrdisEngine.resolveApprovalItem(id, action, wsAuth.user.uid, wsAuth.workspaceId);
    if (!resolved) {
      return apiError('Approval item not found or unauthorized', 404);
    }

    return apiSuccess({ item: resolved });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to resolve approval item', 500);
  }
}

