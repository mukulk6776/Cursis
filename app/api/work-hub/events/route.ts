import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/mongodb';
import { openWorkStream, workChangeFrame } from '@/lib/realtime/work-stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get('workspaceId');
  if (!workspaceId || workspaceId.includes('*')) return new Response('Workspace is required.', { status: 400 });
  const auth = await authorizeWorkspaceAccess(request, workspaceId);
  if (auth.errorResponse) return auth.errorResponse;
  const db = await getDb();
  if (!db) return new Response('Live chat is unavailable. Reconnect when the database is available.', { status: 503 });
  let opened;
  try { opened = await openWorkStream(db, auth.workspaceId, auth.user.uid); }
  catch { return new Response('Live chat requires MongoDB Atlas or a replica set with change-stream access.', { status: 503 }); }
  const { changes, first } = opened;
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat); clearTimeout(expiry);
        request.signal.removeEventListener('abort', close);
        void changes.close().catch(() => {});
        try { controller.close(); } catch {}
      };
      cleanup = close;
      const send = (frame: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(frame)); } catch { close(); }
      };
      const deliver = async (change: Parameters<typeof workChangeFrame>[0]) => {
        if (change.ns?.coll === 'channel_messages') {
          // Recheck access before sending message content, including session revocations.
          const access = await authorizeWorkspaceAccess(request, auth.workspaceId);
          if (access.errorResponse || access.user.uid !== auth.user.uid) { close(); return; }
        }
        const frame = workChangeFrame(change, auth.workspaceId, auth.user.uid);
        if (frame) send(frame);
      };
      const heartbeat = setInterval(() => send(': heartbeat\n\n'), 15000);
      // Reconnect before the hosting limit, renewing authentication on each connection.
      const expiry = setTimeout(close, 50000);
      send(': connected\nretry: 250\n\n');
      request.signal.addEventListener('abort', close, { once: true });
      if (request.signal.aborted) { close(); return; }
      void (async () => {
        try {
          if (first) await deliver(first);
          for await (const change of changes) { if (closed) break; await deliver(change); }
        }
        catch { /* The browser reconnects and reloads any messages it missed. */ }
        finally { close(); }
      })();
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: {
    'Content-Type': 'text/event-stream', 'Cache-Control': 'private, no-cache, no-transform',
    'Content-Encoding': 'identity',
    'X-Accel-Buffering': 'no',
  } });
}
