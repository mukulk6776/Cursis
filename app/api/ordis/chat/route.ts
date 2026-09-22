import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { resolveGroqApiKey, GROQ_MODELS } from '@/lib/ordis/groq';
import { runWorkspaceAssistant } from '@/lib/ordis/assistant';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const message = body.message || body.prompt || body.command || body.text;
    if (typeof message !== 'string' || !message.trim() || message.length > 20000) {
      return NextResponse.json({ success: false, error: 'A message of 1–20000 characters is required.' }, { status: 400 });
    }
    const selected = body.state?.activeWorkspace?.id;
    const workspaceId = typeof selected === 'string' && !['ws_public', 'ws_default'].includes(selected)
      ? selected : user.workspaceId || `ws_${user.uid}`;
    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const apiKey = resolveGroqApiKey();
    const model = GROQ_MODELS.some(item => item.id === body.model) ? body.model : 'openai/gpt-oss-20b';
    const result = await runWorkspaceAssistant({ request, workspaceId, message: message.trim(), history: Array.isArray(body.history) ? body.history : [], apiKey, model });
    return NextResponse.json({ success: true, data: result, source: apiKey ? 'groq' : 'local_fallback', model });
  } catch {
    return NextResponse.json({ success: false, error: 'Ordis could not complete this request.' }, { status: 500 });
  }
}
