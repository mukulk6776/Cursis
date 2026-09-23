'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/dashboard/types';
import type { OrdisConversation } from './conversation-types';
import { conversationStorageKey, conversationTitle, emptyConversationCache, mergeConversationHistory, readConversationCache, savedMessages, type ConversationCache } from './conversation-cache';

export type ChatHistoryStatus = 'loading' | 'saving' | 'saved' | 'local' | 'error';
type MessagesUpdate = ChatMessage[] | ((previous: ChatMessage[]) => ChatMessage[]);
type ScopedCache = ConversationCache & { userId: string; workspaceId: string; localSaved: boolean; status: ChatHistoryStatus };

export function useOrdisConversations(userId: string, workspaceId: string) {
  const validScope = Boolean(userId && userId !== 'u_member' && workspaceId && !['ws_default', 'ws_public'].includes(workspaceId));
  const storageKey = validScope ? conversationStorageKey(userId, workspaceId) : '';
  const stores = useRef(new Map<string, ScopedCache>());
  const removed = useRef(new Map<string, Set<string>>());
  const activeScope = useRef('');
  const queue = useRef(Promise.resolve());
  const [view, setView] = useState<{ key: string; cache: ScopedCache } | null>(null);

  const publish = useCallback((key: string, cache: ScopedCache) => {
    stores.current.set(key, cache);
    if (activeScope.current === key) setView({ key, cache });
  }, []);

  const commit = useCallback((key: string, cache: ScopedCache) => {
    try {
      localStorage.setItem(key, JSON.stringify({ ...cache, conversations: cache.conversations.map(chat => ({ ...chat, messages: savedMessages(chat.messages) })) }));
      cache = { ...cache, localSaved: true };
    } catch { cache = { ...cache, localSaved: false, status: 'error' }; }
    publish(key, cache);
  }, [publish]);

  const sync = useCallback((key: string) => {
    // Capture credentials now so an old account's queue cannot use a new login's token.
    const token = localStorage.getItem('cursis_token');
    const ownerId = stores.current.get(key)?.userId || '';
    const headers = { 'Content-Type': 'application/json', 'X-Ordis-User': ownerId, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    queue.current = queue.current.catch(() => {}).then(async () => {
      let cache = stores.current.get(key);
      if (!cache) return;
      const dirty = [...cache.dirtyIds];
      const deleted = [...cache.deletedIds];
      if (!dirty.length && !deleted.length) return;
      publish(key, { ...cache, status: 'saving' });
      try {
        for (const id of deleted) {
          const response = await fetch(`/api/ordis/conversations?workspaceId=${encodeURIComponent(cache.workspaceId)}&id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include', headers });
          if (!response.ok) throw new Error('Delete not synced');
          const current = stores.current.get(key)!;
          commit(key, { ...current, deletedIds: current.deletedIds.filter(item => item !== id) });
        }
        for (const id of dirty) {
          const chat = stores.current.get(key)?.conversations.find(item => item.id === id);
          if (!chat || !savedMessages(chat.messages).length) continue;
          const version = JSON.stringify({ ...chat, messages: savedMessages(chat.messages) });
          const response = await fetch('/api/ordis/conversations', { method: 'PUT', credentials: 'include', headers, body: JSON.stringify({ workspaceId: cache.workspaceId, conversation: JSON.parse(version) }) });
          if (!response.ok) throw new Error('Save not synced');
          const current = stores.current.get(key)!;
          const latest = current.conversations.find(item => item.id === id);
          if (latest && JSON.stringify({ ...latest, messages: savedMessages(latest.messages) }) === version) {
            commit(key, { ...current, dirtyIds: current.dirtyIds.filter(item => item !== id) });
          }
        }
        cache = stores.current.get(key)!;
        commit(key, { ...cache, status: cache.dirtyIds.length || cache.deletedIds.length ? 'saving' : 'saved' });
      } catch {
        cache = stores.current.get(key)!;
        publish(key, { ...cache, status: cache.localSaved ? 'local' : 'error' });
      }
    });
  }, [commit, publish]);

  useEffect(() => {
    activeScope.current = storageKey;
    if (!storageKey) return;
    let cached = stores.current.get(storageKey);
    if (!cached) {
      try { cached = { ...readConversationCache(localStorage.getItem(storageKey)), userId, workspaceId, localSaved: true, status: 'loading' }; }
      catch { cached = { ...emptyConversationCache(), userId, workspaceId, localSaved: false, status: 'loading' }; }
    }
    publish(storageKey, cached);
    let cancelled = false;
    const load = async () => {
      const startingVersions = new Map(stores.current.get(storageKey)?.conversations.map(chat => [chat.id, chat.updatedAt]));
      try {
        const token = localStorage.getItem('cursis_token');
        const remote: OrdisConversation[] = [];
        let cursor: string | null = null;
        do {
          const response: Response = await fetch(`/api/ordis/conversations?workspaceId=${encodeURIComponent(workspaceId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { credentials: 'include', headers: { 'X-Ordis-User': userId, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
          if (!response.ok) throw new Error('History unavailable');
          const payload: { data?: { conversations?: OrdisConversation[]; nextCursor?: string | null } } = await response.json();
          remote.push(...readConversationCache(JSON.stringify({ conversations: payload.data?.conversations })).conversations);
          cursor = payload.data?.nextCursor || null;
          if (cancelled) return;
        } while (cursor);
        if (cancelled) return;
        const current = stores.current.get(storageKey)!;
        const changed = current.conversations.filter(chat => startingVersions.get(chat.id) !== chat.updatedAt).map(chat => chat.id);
        const visibleRemote = remote.filter(chat => !removed.current.get(storageKey)?.has(chat.id));
        commit(storageKey, { ...current, ...mergeConversationHistory(current, visibleRemote, changed), status: 'saved' });
        sync(storageKey);
      } catch {
        if (cancelled) return;
        const current = stores.current.get(storageKey)!;
        publish(storageKey, { ...current, status: current.localSaved ? 'local' : 'error' });
      }
    };
    void load();
    const retry = () => { void load(); };
    window.addEventListener('online', retry);
    return () => { cancelled = true; window.removeEventListener('online', retry); };
  }, [storageKey, userId, workspaceId, commit, publish, sync]);

  const cache = view?.key === storageKey ? view.cache : null;
  const active = cache?.conversations.find(chat => chat.id === cache.activeId);
  const newOrdisChat = () => {
    const current = stores.current.get(storageKey);
    if (!current) return;
    commit(storageKey, { ...current, activeId: null });
  };
  const selectOrdisChat = (id: string) => {
    const current = stores.current.get(storageKey);
    if (current?.conversations.some(chat => chat.id === id)) commit(storageKey, { ...current, activeId: id });
  };
  const renameOrdisChat = (id: string, title: string) => {
    const current = stores.current.get(storageKey);
    if (!current || !title.trim()) return;
    commit(storageKey, { ...current, conversations: current.conversations.map(chat => chat.id === id ? { ...chat, title: title.trim().slice(0, 120), updatedAt: new Date().toISOString() } : chat), dirtyIds: [...new Set([...current.dirtyIds, id])] });
    sync(storageKey);
  };
  const deleteOrdisChat = (id: string) => {
    const current = stores.current.get(storageKey);
    if (!current) return;
    const deleted = removed.current.get(storageKey) || new Set<string>();
    deleted.add(id);
    removed.current.set(storageKey, deleted);
    commit(storageKey, { ...current, conversations: current.conversations.filter(chat => chat.id !== id), activeId: current.activeId === id ? null : current.activeId, dirtyIds: current.dirtyIds.filter(item => item !== id), deletedIds: [...new Set([...current.deletedIds, id])] });
    sync(storageKey);
  };
  const beginOrdisChat = () => {
    const current = stores.current.get(storageKey);
    if (!current) return null;
    let chat = current.conversations.find(item => item.id === current.activeId);
    if (chat?.messages.some(message => message.typing)) return null;
    if (!chat) {
      const now = new Date().toISOString();
      chat = { id: crypto.randomUUID(), title: 'New chat', createdAt: now, updatedAt: now, messages: [] };
      commit(storageKey, { ...current, conversations: [chat, ...current.conversations], activeId: chat.id });
    }
    const id = chat.id;
    // The updater is tied to this chat, even if the user switches chats during a reply.
    const setMessages = (update: MessagesUpdate) => {
      const latest = stores.current.get(storageKey);
      const previous = latest?.conversations.find(item => item.id === id);
      if (!latest || !previous) return; // Never resurrect a deleted chat.
      const messages = typeof update === 'function' ? update(previous.messages) : update;
      const conversation = { ...previous, messages, title: previous.title === 'New chat' ? conversationTitle(messages) : previous.title, updatedAt: new Date().toISOString() };
      commit(storageKey, { ...latest, conversations: latest.conversations.map(item => item.id === id ? conversation : item).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), dirtyIds: [...new Set([...latest.dirtyIds, id])], status: 'saving' });
      sync(storageKey);
    };
    return { id, history: chat.messages, setMessages };
  };
  return {
    chatHistory: active?.messages || [], chatConversations: cache?.conversations || [], activeChatId: cache?.activeId || null,
    chatHistoryReady: Boolean(cache), chatHistoryStatus: cache?.status || 'loading' as ChatHistoryStatus,
    newOrdisChat, selectOrdisChat, renameOrdisChat, deleteOrdisChat, beginOrdisChat,
  };
}
