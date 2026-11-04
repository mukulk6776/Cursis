import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { inMemoryStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetWorkspace = searchParams.get('workspaceId') || undefined;

    const wsAuth = await authorizeWorkspaceAccess(request, targetWorkspace);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const simulations = Array.from(inMemoryStore.simulations.values()).filter((s) => s.workspaceId === workspaceId);

    return NextResponse.json({ simulations });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to fetch simulations', 500);
  }
}

