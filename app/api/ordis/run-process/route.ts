import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const wsAuth = await authorizeWorkspaceAccess(request, body.workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    if (!body.prompt) {
      return apiError('Prompt is required', 400);
    }

    const result = await OrdisEngine.runProcessFromSentence(workspaceId, body.prompt);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to execute process', 500);
  }
}
