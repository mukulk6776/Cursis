/**
 * Cursis Real-Time Event Bus
 * In-process pub/sub system for broadcasting workspace mutations to connected SSE clients.
 * Supports workspace-scoped channels and wildcard subscriptions.
 */

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

export interface CursisEvent {
  id: string;
  type: CursisEventType;
  workspaceId: string;
  payload: Record<string, any>;
  timestamp: string;
  userId?: string;
}

type EventListener = (event: CursisEvent) => void;

interface Subscription {
  id: string;
  workspaceId: string | '*'; // '*' for global
  eventType: CursisEventType | '*'; // '*' for all events
  listener: EventListener;
}

class EventBus {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventHistory: CursisEvent[] = [];
  private maxHistory = 100;

  /**
   * Subscribe to events for a workspace
   */
  subscribe(
    workspaceId: string,
    eventType: CursisEventType | '*',
    listener: EventListener
  ): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.subscriptions.set(id, { id, workspaceId, eventType, listener });
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Emit an event to all matching subscribers
   */
  emit(type: CursisEventType, workspaceId: string, payload: Record<string, any>, userId?: string): CursisEvent {
    const event: CursisEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      workspaceId,
      payload,
      timestamp: new Date().toISOString(),
      userId,
    };

    // Store in history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Notify subscribers
    for (const sub of this.subscriptions.values()) {
      const workspaceMatch = sub.workspaceId === '*' || sub.workspaceId === workspaceId;
      const typeMatch = sub.eventType === '*' || sub.eventType === type;

      if (workspaceMatch && typeMatch) {
        try {
          sub.listener(event);
        } catch (err) {
          console.warn(`[EventBus] Listener error for ${sub.id}:`, err);
        }
      }
    }

    return event;
  }

  /**
   * Get recent events for a workspace (useful for SSE reconnection catch-up)
   */
  getRecentEvents(workspaceId: string, since?: string, limit: number = 20): CursisEvent[] {
    let events = this.eventHistory.filter((e) => e.workspaceId === workspaceId);

    if (since) {
      const sinceDate = new Date(since).getTime();
      events = events.filter((e) => new Date(e.timestamp).getTime() > sinceDate);
    }

    return events.slice(0, limit);
  }

  /**
   * Get count of active subscriptions (for monitoring)
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Clean up stale subscriptions (call periodically)
   */
  cleanup(): void {
    // In a real app, we'd track last activity per subscription
    // For now, this is a placeholder for future use
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * Helper: emit a task event
 */
export function emitTaskEvent(
  type: 'task.created' | 'task.updated' | 'task.deleted',
  workspaceId: string,
  task: Record<string, any>,
  userId?: string
) {
  return eventBus.emit(type, workspaceId, { task }, userId);
}

/**
 * Helper: emit a notification event
 */
export function emitNotificationEvent(
  workspaceId: string,
  notification: Record<string, any>,
  userId?: string
) {
  return eventBus.emit('notification.new', workspaceId, { notification }, userId);
}

/**
 * Helper: emit an Ordis proactive card event
 */
export function emitOrdisProactiveEvent(
  workspaceId: string,
  card: { title: string; summary: string; severity: 'info' | 'warning' | 'critical'; actionLabel?: string }
) {
  return eventBus.emit('ordis.proactive', workspaceId, { card });
}

/**
 * Helper: emit a presence change event
 */
export function emitPresenceEvent(
  workspaceId: string,
  userId: string,
  status: 'online' | 'away' | 'offline'
) {
  return eventBus.emit('team.presence_changed', workspaceId, { userId, status }, userId);
}
