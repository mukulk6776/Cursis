import { eventBus, CursisEvent } from '@/lib/realtime/event-bus';
import { getAuthenticatedUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE (Server-Sent Events) endpoint for real-time dashboard updates.
 * Clients connect with a workspace ID and receive live events.
 * 
 * Usage: GET /api/sse?workspaceId=ws_xxx&lastEventId=evt_xxx
 * 
 * Events are workspace-scoped: clients only receive events for their workspace.
 * Supports reconnection via Last-Event-ID header or lastEventId query param.
 */
export async function GET(request: Request) {
  // Authenticate
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return new Response('Missing workspaceId parameter', { status: 400 });
  }

  // Check for reconnection: send missed events
  const lastEventId =
    request.headers.get('Last-Event-ID') ||
    searchParams.get('lastEventId') ||
    null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = formatSSE({
        id: `evt_connect_${Date.now()}`,
        type: 'notification.new',
        workspaceId,
        payload: { message: 'Connected to Cursis real-time stream' },
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(connectEvent));

      // Send any missed events since last connection
      if (lastEventId) {
        const missedEvents = eventBus.getRecentEvents(workspaceId, undefined, 50);
        let foundLastEvent = false;
        for (const evt of missedEvents.reverse()) {
          if (foundLastEvent) {
            controller.enqueue(encoder.encode(formatSSE(evt)));
          }
          if (evt.id === lastEventId) {
            foundLastEvent = true;
          }
        }
      }

      // Subscribe to workspace events
      const subscriptionId = eventBus.subscribe(workspaceId, '*', (event) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event)));
        } catch {
          // Client disconnected
          eventBus.unsubscribe(subscriptionId);
        }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
          eventBus.unsubscribe(subscriptionId);
        }
      }, 30000);

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        eventBus.unsubscribe(subscriptionId);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * Format an event as SSE text
 */
function formatSSE(event: CursisEvent): string {
  const data = JSON.stringify({
    type: event.type,
    payload: event.payload,
    workspaceId: event.workspaceId,
    timestamp: event.timestamp,
    userId: event.userId,
  });

  return `id: ${event.id}\nevent: ${event.type}\ndata: ${data}\n\n`;
}
