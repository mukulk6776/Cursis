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

    const status = searchParams.get('status') || undefined;

    const items = Array.from(inMemoryStore.approvalQueue.values())
      .filter((a) => {
        if (a.workspaceId !== workspaceId) return false;
        if (status && a.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

