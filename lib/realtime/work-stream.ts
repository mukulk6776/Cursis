import type { Db, Document } from 'mongodb';

export const WORK_COLLECTIONS = ['channel_messages', 'tasks', 'day_plans', 'focus_sessions'];

export async function openWorkStream(db: Db, workspaceId: string, userId: string) {
  const changes = db.watch([
    { $match: {
      'ns.coll': { $in: WORK_COLLECTIONS },
      operationType: { $in: ['insert', 'update', 'replace'] },
      $or: [
        { 'fullDocument.workspaceId': workspaceId },
        { 'ns.coll': 'focus_sessions', 'fullDocument.userId': userId },
      ],
    } },
  ], { fullDocument: 'updateLookup', maxAwaitTimeMS: 1000 });
  try {
    // Open the Mongo cursor before the browser reloads its initial snapshot.
    const first = await changes.tryNext();
    return { changes, first };
  } catch (error) { await changes.close(); throw error; }
}

export function workChangeFrame(change: Document, workspaceId: string, userId: string): string | null {
  const document = change.fullDocument;
  const collection = change.ns?.coll;
  if (!WORK_COLLECTIONS.includes(collection) || !document) return null;
  if (document.workspaceId !== workspaceId && !(collection === 'focus_sessions' && document.userId === userId)) return null;
  const message = collection === 'channel_messages' ? {
    id: document.id, workspaceId: document.workspaceId, channelId: document.channelId,
    authorId: document.authorId, authorName: document.authorName, text: document.text,
    files: document.files, createdAt: document.createdAt,
  } : undefined;
  return `event: work.changed\ndata: ${JSON.stringify({ type: 'work.changed', workspaceId, payload: { collection, ...(message ? { message } : {}) }, timestamp: new Date().toISOString() })}\n\n`;
}
