import type { ChatMessage } from '@/lib/dashboard/types';
import type { OrdisConversation } from './conversation-types';

export interface ConversationCache {
  conversations: OrdisConversation[];
  activeId: string | null;
  dirtyIds: string[];
  deletedIds: string[];
}
export const emptyConversationCache = (): ConversationCache => ({ conversations: [], activeId: null, dirtyIds: [], deletedIds: [] });
export function conversationStorageKey(userId: string, workspaceId: string): string {
  return `cursis_ordis_chats_v1:${encodeURIComponent(userId)}:${encodeURIComponent(workspaceId)}`;
}
export function savedMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(message => !message.typing && typeof message.text === 'string');
}
export function conversationTitle(messages: ChatMessage[]): string {
  const first = messages.find(message => message.role === 'user' && message.text)?.text || 'New chat';
  const title = first.replace(/\s+/g, ' ').trim();
  return title.length > 60 ? `${title.slice(0, 57)}…` : title;
}
export function readConversationCache(raw: string | null): ConversationCache {
  if (!raw) return emptyConversationCache();
  try {
    const value = JSON.parse(raw);
    const conversations: OrdisConversation[] = (Array.isArray(value.conversations) ? value.conversations : []).filter((item: OrdisConversation) =>
      item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.updatedAt === 'string' && typeof item.createdAt === 'string' && Array.isArray(item.messages)
    ).map((item: OrdisConversation) => ({ ...item, messages: savedMessages(item.messages.filter(message => message && ['user', 'ai'].includes(message.role))) }));
    return {
      conversations,
      activeId: conversations.some(item => item.id === value.activeId) ? value.activeId : null,
      dirtyIds: Array.isArray(value.dirtyIds) ? value.dirtyIds.filter((id: unknown) => typeof id === 'string') : [],
      deletedIds: Array.isArray(value.deletedIds) ? value.deletedIds.filter((id: unknown) => typeof id === 'string') : [],
    };
  } catch { return emptyConversationCache(); }
}
export function mergeConversationHistory(cache: ConversationCache, remote: OrdisConversation[], changedSinceLoad: string[] = []): ConversationCache {
  const merged = new Map(remote.filter(item => !cache.deletedIds.includes(item.id)).map(item => [item.id, item]));
  for (const local of cache.conversations) {
    // Unsynced edits and in-flight replies always win over a stale server snapshot.
    if (cache.dirtyIds.includes(local.id) || changedSinceLoad.includes(local.id) || local.messages.some(message => message.typing) || !local.messages.length) merged.set(local.id, local);
  }
  const conversations = [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { ...cache, conversations, activeId: cache.activeId && merged.has(cache.activeId) ? cache.activeId : null };
}
