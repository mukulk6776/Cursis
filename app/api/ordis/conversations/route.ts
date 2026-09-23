import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import {
  ConversationStorageError,
  ConversationValidationError,
  MAX_CONVERSATION_BYTES,
  deleteConversation,
  listConversations,
  saveConversation,
} from '@/lib/ordis/conversations';

export const runtime = 'nodejs';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function failure(error: unknown) {
  if (error instanceof ConversationValidationError) return json({ success: false, error: error.message }, 400);
  if (error instanceof ConversationStorageError) return json({ success: false, error: error.message, code: 'HISTORY_UNAVAILABLE' }, 503);
  return json({ success: false, error: 'Could not access your chat history.' }, 500);
}

async function authorize(request: Request, selectedWorkspace: unknown) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { errorResponse: json({ success: false, error: 'Unauthorized' }, 401) };
  const expectedUser = request.headers.get('X-Ordis-User');
  if (expectedUser !== null && expectedUser !== user.uid) {
    return { errorResponse: json({ success: false, error: 'Your account changed. Reload chat history before syncing.' }, 403) };
  }
  if (selectedWorkspace !== undefined && selectedWorkspace !== null && (typeof selectedWorkspace !== 'string' || selectedWorkspace.length > 200)) {
    throw new ConversationValidationError('Invalid workspace ID.');
  }
  const rawWorkspace = typeof selectedWorkspace === 'string' ? selectedWorkspace.trim() : '';
  const workspaceId = rawWorkspace && !['ws_default', 'ws_public'].includes(rawWorkspace)
    ? rawWorkspace : user.workspaceId || `ws_${user.uid}`;
  const auth = await authorizeWorkspaceAccess(request, workspaceId);
  if (auth.errorResponse) {
    auth.errorResponse.headers.set('Cache-Control', 'private, no-store');
    return { errorResponse: auth.errorResponse };
  }
  return { userId: auth.user.uid, workspaceId, errorResponse: null };
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const auth = await authorize(request, query.get('workspaceId'));
    if (auth.errorResponse) return auth.errorResponse;
    return json({ success: true, data: await listConversations(auth.userId!, auth.workspaceId!, query.get('cursor')) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_CONVERSATION_BYTES + 1_000) return json({ success: false, error: 'This conversation is too large to sync.' }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new ConversationValidationError('Invalid JSON.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ConversationValidationError('A conversation is required.');
    const input = body as Record<string, unknown>;
    const auth = await authorize(request, input.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const conversation = await saveConversation(auth.userId!, auth.workspaceId!, input.conversation);
    return json({ success: true, data: { conversation } });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const auth = await authorize(request, query.get('workspaceId'));
    if (auth.errorResponse) return auth.errorResponse;
    await deleteConversation(auth.userId!, auth.workspaceId!, query.get('id'));
    return json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
