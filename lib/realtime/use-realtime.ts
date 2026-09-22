'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type CursisEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'project.created'
  | 'project.updated'
  | 'meeting.scheduled'
  | 'meeting.updated'
  | 'notification.new'
  | 'team.member_joined'
  | 'team.member_updated'
  | 'team.presence_changed'
  | 'ordis.proactive'
  | 'ordis.response'
  | 'workspace.updated'
  | 'document.created'
  | 'automation.triggered'
  | 'crm.deal_created'
  | 'crm.deal_updated';

export interface RealtimeEvent {
  type: CursisEventType;
  payload: Record<string, any>;
  workspaceId: string;
  timestamp: string;
  userId?: string;
}

type EventHandler = (event: RealtimeEvent) => void;

interface UseRealtimeOptions {
  /** Workspace ID to subscribe to */
  workspaceId: string;
  /** Whether to enable the connection (default: true) */
  enabled?: boolean;
  /** Event handlers keyed by event type */
  onEvent?: Partial<Record<CursisEventType | '*', EventHandler>>;
  /** Called on connection status change */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * React hook for consuming real-time SSE events from Cursis.
 * Auto-reconnects with exponential backoff on disconnect.
 * 
 * Usage:
 * ```tsx
 * useRealtime({
 *   workspaceId: activeWorkspace.id,
 *   onEvent: {
 *     'task.created': (e) => addTask(e.payload.task),
 *     'notification.new': (e) => addNotification(e.payload.notification),
 *     '*': (e) => console.log('Any event:', e),
 *   },
 * });
 * ```
 */
export function useRealtime({ workspaceId, enabled = true, onEvent, onConnectionChange }: UseRealtimeOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(onEvent);

  // Keep handlers ref up to date without re-connecting
  useEffect(() => {
    handlersRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!workspaceId || !enabled) return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
    const params = new URLSearchParams({ workspaceId });
    if (lastEventIdRef.current) {
      params.set('lastEventId', lastEventIdRef.current);
    }
    if (token) {
      params.set('token', token);
    }

    const es = new EventSource(`/api/sse?${params.toString()}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      onConnectionChange?.(true);
      retryCountRef.current = 0; // Reset retry count on successful connect
    };

    es.onerror = () => {
      setConnected(false);
      onConnectionChange?.(false);
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current++;

      retryTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    // Listen for all event types
    const allEventTypes: CursisEventType[] = [
      'task.created', 'task.updated', 'task.deleted',
      'project.created', 'project.updated',
      'meeting.scheduled', 'meeting.updated',
      'notification.new',
      'team.member_joined', 'team.member_updated', 'team.presence_changed',
      'ordis.proactive', 'ordis.response',
      'workspace.updated',
      'document.created',
      'automation.triggered',
      'crm.deal_created', 'crm.deal_updated',
    ];

    for (const eventType of allEventTypes) {
      es.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          lastEventIdRef.current = e.lastEventId || null;

          // Call specific handler
          handlersRef.current?.[eventType]?.(event);
          // Call wildcard handler
          handlersRef.current?.['*']?.(event);
        } catch (err) {
          console.warn('[useRealtime] Event parse error:', err);
        }
      });
    }
  }, [workspaceId, enabled, onConnectionChange]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [connect]);

  return { connected };
}
