import type { Collection } from 'mongodb';
import type { ChatActionCard, ChatMessage } from '@/lib/dashboard/types';
import { getDb } from '@/lib/mongodb';
import type { OrdisConversation } from './conversation-types';

export const MAX_CONVERSATION_BYTES = 1_000_000;
const MAX_MESSAGES = 500;
const PAGE_SIZE = 100;
const CARD_TYPES = new Set(['task', 'project', 'meeting', 'deal', 'doc', 'automation', 'apikey', 'theme', 'navigation', 'team', 'feature']);
const ACTION_TYPES = new Set(['navigate', 'toggle_status', 'open_modal', 'copy', 'link', 'execute_feature']);

interface StoredConversation extends OrdisConversation {
  userId: string;
  workspaceId: string;
}

export class ConversationValidationError extends Error {}
export class ConversationStorageError extends Error {
  constructor() {
    super('Cloud chat history is temporarily unavailable. Your chats can still be kept on this device.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, label: string, max: number, required = false): string | undefined {
  if (value === undefined || value === null) {
    if (required) throw new ConversationValidationError(`${label} is required.`);
    return undefined;
  }
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new ConversationValidationError(`${label} must be ${required ? '1' : '0'}–${max} characters.`);
  }
  return value;
}

export function validateConversationId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new ConversationValidationError('A valid conversation ID is required.');
  }
  return value;
}

function action(value: unknown): ChatActionCard['primaryAction'] {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !ACTION_TYPES.has(String(value.actionType))) {
    throw new ConversationValidationError('Invalid message action.');
  }
  const target = text(value.target, 'Action target', 20_000);
  if (target && (/^\s*(javascript|data|vbscript):/i.test(target) || (value.actionType === 'link' && !/^https?:\/\//i.test(target)))) {
    throw new ConversationValidationError('Invalid action link.');
  }
  return {
    label: text(value.label, 'Action label', 200, true)!,
    actionType: value.actionType as NonNullable<ChatActionCard['primaryAction']>['actionType'],
    ...(target !== undefined ? { target } : {}),
  };
}

function cleanMetadata(value: unknown, depth = 0): unknown {
  if (depth > 8) throw new ConversationValidationError('Action metadata is too deeply nested.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(item => cleanMetadata(item, depth + 1));
  if (!isRecord(value)) throw new ConversationValidationError('Invalid action metadata.');
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
    .map(([key, item]) => [key, cleanMetadata(item, depth + 1)]));
}

function card(value: unknown): ChatActionCard | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !CARD_TYPES.has(String(value.type))) throw new ConversationValidationError('Invalid message action card.');
  const result: ChatActionCard = {
    type: value.type as ChatActionCard['type'],
    title: text(value.title, 'Action card title', 500, true)!,
  };
  for (const key of ['subtitle', 'badge', 'badgeColor'] as const) {
    const cleaned = text(value[key], `Action card ${key}`, 1_000);
    if (cleaned !== undefined) result[key] = cleaned;
  }
  if (value.meta !== undefined) {
    if (!isRecord(value.meta)) throw new ConversationValidationError('Invalid action metadata.');
    result.meta = cleanMetadata(value.meta) as Record<string, unknown>;
  }
  for (const key of ['primaryAction', 'secondaryAction'] as const) {
    const cleaned = action(value[key]);
    if (cleaned) result[key] = cleaned;
  }
  return result;
}

/** Select known fields so callers cannot persist ownership, provider prompts, or typing state. */
export function normalizeConversation(value: unknown, now = new Date().toISOString()): OrdisConversation {
  if (!isRecord(value)) throw new ConversationValidationError('A conversation is required.');
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_CONVERSATION_BYTES) {
    throw new ConversationValidationError('This conversation is too large to sync. Start a new chat to continue.');
  }
  if (!Array.isArray(value.messages) || value.messages.length > MAX_MESSAGES) {
    throw new ConversationValidationError(`A conversation can contain at most ${MAX_MESSAGES} messages. Start a new chat to continue.`);
  }
  const messages: ChatMessage[] = [];
  for (const item of value.messages) {
    if (!isRecord(item) || !['user', 'ai'].includes(String(item.role))) throw new ConversationValidationError('Invalid message role.');
    if (item.typing === true) continue;
    const messageText = text(item.text, 'Message', 50_000);
    const actionCard = item.role === 'ai' ? card(item.actionCard) : undefined;
    if (!messageText?.trim() && !actionCard) continue;
    const message: ChatMessage = { role: item.role as ChatMessage['role'], text: messageText ?? null };
    const id = text(item.id, 'Message ID', 128);
    const time = text(item.time, 'Message time', 100);
    if (id) message.id = id;
    if (time) message.time = time;
    if (actionCard) message.actionCard = actionCard;
    if (item.role === 'ai' && item.suggestedFollowUps !== undefined) {
      if (!Array.isArray(item.suggestedFollowUps) || item.suggestedFollowUps.length > 8) throw new ConversationValidationError('Invalid suggested follow-ups.');
      message.suggestedFollowUps = item.suggestedFollowUps.map(followUp => text(followUp, 'Suggested follow-up', 1_000, true)!);
    }
    messages.push(message);
  }
  const rawCreatedAt = value.createdAt === undefined ? now : value.createdAt;
  if (typeof rawCreatedAt !== 'string' || !Number.isFinite(Date.parse(rawCreatedAt))) {
    throw new ConversationValidationError('Invalid conversation creation date.');
  }
  const createdAt = new Date(Math.min(Date.parse(rawCreatedAt), Date.parse(now))).toISOString();
  const fallbackTitle = messages.find(message => message.role === 'user')?.text?.trim().replace(/\s+/g, ' ').slice(0, 80) || 'New chat';
  return {
    id: validateConversationId(value.id),
    title: text(value.title, 'Conversation title', 160)?.trim() || fallbackTitle,
    createdAt,
    updatedAt: now,
    messages,
  };
}

function publicConversation(value: StoredConversation): OrdisConversation {
  return { id: value.id, title: value.title, createdAt: value.createdAt, updatedAt: value.updatedAt, messages: value.messages };
}

async function collection(): Promise<Collection<StoredConversation>> {
  try {
    const db = await getDb();
    if (!db) throw new ConversationStorageError();
    const conversations = db.collection<StoredConversation>('ordis_conversations');
    // The compound unique index makes retries idempotent without allowing IDs to cross users/workspaces.
    await conversations.createIndex({ userId: 1, workspaceId: 1, id: 1 }, { unique: true });
    await conversations.createIndex({ userId: 1, workspaceId: 1, updatedAt: -1, id: -1 });
    return conversations;
  } catch {
    throw new ConversationStorageError();
  }
}

export async function listConversations(userId: string, workspaceId: string, cursor?: string | null) {
  let before: { updatedAt: string; id: string } | undefined;
  if (cursor) {
    try {
      const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (!isRecord(parsed) || typeof parsed.updatedAt !== 'string' || !Number.isFinite(Date.parse(parsed.updatedAt))) throw new Error();
      before = { updatedAt: new Date(parsed.updatedAt).toISOString(), id: validateConversationId(parsed.id) };
    } catch {
      throw new ConversationValidationError('Invalid history cursor.');
    }
  }
  try {
    const conversations = await collection();
    const rows = await conversations.find({
      userId, workspaceId,
      ...(before ? { $or: [{ updatedAt: { $lt: before.updatedAt } }, { updatedAt: before.updatedAt, id: { $lt: before.id } }] } : {}),
    }).sort({ updatedAt: -1, id: -1 }).limit(PAGE_SIZE + 1).toArray();
    const page = rows.slice(0, PAGE_SIZE);
    const last = page.at(-1);
    return {
      conversations: page.map(publicConversation),
      nextCursor: rows.length > PAGE_SIZE && last
        ? Buffer.from(JSON.stringify({ updatedAt: last.updatedAt, id: last.id })).toString('base64url') : null,
    };
  } catch {
    throw new ConversationStorageError();
  }
}

export async function saveConversation(userId: string, workspaceId: string, value: unknown): Promise<OrdisConversation> {
  const conversation = normalizeConversation(value);
  try {
    const conversations = await collection();
    const { createdAt, ...fields } = conversation;
    const scope = { userId, workspaceId, id: conversation.id };
    const saved = await conversations.findOneAndUpdate(scope, {
      $set: fields,
      $setOnInsert: { userId, workspaceId, createdAt },
    }, { upsert: true, returnDocument: 'after' });
    if (!saved) throw new ConversationStorageError();
    return publicConversation(saved);
  } catch {
    throw new ConversationStorageError();
  }
}

export async function deleteConversation(userId: string, workspaceId: string, rawId: unknown): Promise<void> {
  const id = validateConversationId(rawId);
  try {
    const conversations = await collection();
    // Idempotent deletion reveals nothing about a same-ID chat belonging to somebody else.
    await conversations.deleteOne({ userId, workspaceId, id });
  } catch {
    throw new ConversationStorageError();
  }
}
