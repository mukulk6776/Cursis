import { NextResponse } from 'next/server';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { inMemoryStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetWorkspace = searchParams.get('workspaceId') || undefined;

    const wsAuth = await authorizeWorkspaceAccess(request, targetWorkspace);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const radarItems = Array.from(inMemoryStore.riskRadar.values()).filter((r) => r.workspaceId === workspaceId);
    return NextResponse.json({ radarItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
