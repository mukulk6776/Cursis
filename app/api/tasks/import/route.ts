import { createHash } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/mongodb';
import { engagementFailure, readAppBody } from '@/lib/engagement/http';
import { parseTaskCsv } from '@/lib/engagement/csv';
import type { Task } from '@/lib/db/types';

export async function POST(request: Request) {
  try {
    const parsed = z.object({ workspaceId: z.string().min(1).max(128), batchId: z.string().uuid(), csv: z.string().min(1).max(64000) }).strict().safeParse(await readAppBody(request, 100000));
    if (!parsed.success) return apiError('Invalid import request.', 400);
    const auth = await authorizeWorkspaceAccess(request, parsed.data.workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const db = await getDb();
    if (!db) throw new Error('Import storage unavailable');
    const workspace = await db.collection('workspaces').findOne({ id: auth.workspaceId });
    if (!workspace) return apiError('Workspace not found.', 404);
    const memberships = await db.collection('workspace_memberships').find({ workspaceId: auth.workspaceId }).toArray();
    const ids = [...new Set([workspace.ownerId, ...memberships.map(member => member.userId)].filter((id): id is string => typeof id === 'string' && Boolean(id.trim())))];
    const members = await db.collection('users').find({ $or: [{ uid: { $in: ids } }, { id: { $in: ids } }] }, { projection: { uid: 1, id: 1, email: 1, displayName: 1 } }).toArray();
    const byEmail = new Map(members.filter(member => typeof member.email === 'string').map(member => [member.email.trim().toLowerCase(), member]));
    let rows;
    try { rows = parseTaskCsv(parsed.data.csv, [...byEmail.keys()]); } catch (error) { return apiError((error as Error).message, 400); }
    if (rows.some(row => row.errors.length)) return apiError('Fix the CSV validation errors before importing.', 400, { rows });
    const now = new Date().toISOString();
    const collection = db.collection<Task & { _id: string; importFingerprint: string }>('tasks');
    const fingerprint = createHash('sha256').update(parsed.data.csv).digest('hex');
    const tasks = rows.map((row, index) => {
      const id = 'csv_' + createHash('sha256').update(`${auth.workspaceId}:${auth.user.uid}:${parsed.data.batchId}:${index}`).digest('hex');
      const member = byEmail.get(row.email);
      return { _id: id, id, workspaceId: auth.workspaceId, title: row.name, dueDate: new Date(row.dueDate).toISOString(), status: row.status,
        priority: 'medium' as const, creatorId: auth.user.uid, createdBy: auth.user.uid, completionPercent: row.status === 'done' ? 100 : 0,
        completedAt: null, createdAt: now, updatedAt: now, subtasks: [], tags: [], importFingerprint: fingerprint,
        ...(member ? { assigneeId: member.uid || member.id, assigneeName: member.displayName || member.email } : {}) };
    });
    const existing = await collection.find({ _id: { $in: tasks.map(task => task._id) } }, { projection: { importFingerprint: 1 } }).toArray();
    if (existing.some(task => task.importFingerprint !== fingerprint)) return apiError('This import has changed. Select the file again to start a new batch.', 409);
    // Stable row IDs make retrying this batch safe even after a partial write or a lost response.
    await collection.bulkWrite(tasks.map(task => ({ updateOne: { filter: { _id: task._id, workspaceId: auth.workspaceId }, update: { $setOnInsert: task }, upsert: true } })));
    return apiSuccess({ imported: rows.length });
  } catch (error) { return engagementFailure(error); }
}
