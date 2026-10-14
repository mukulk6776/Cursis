import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { inMemoryStore } from '@/lib/db/store';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const newCards = await OrdisEngine.runAmbientScan(wsAuth.workspaceId);
    const allCards = Array.from(inMemoryStore.ordisCards.values()).filter((c) => c.workspaceId === wsAuth.workspaceId);

    return apiSuccess({
      newlyDetectedCount: newCards.length,
      activeCards: allCards,
    });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const cards = Array.from(inMemoryStore.ordisCards.values()).filter((c) => c.workspaceId === wsAuth.workspaceId);
    return apiSuccess({ cards });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
