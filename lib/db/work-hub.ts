import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { getCollection } from '@/lib/mongodb';
import { isWorkspaceMember, getUserWorkspaceRole } from '@/lib/auth/rbac';
import type { WorkspaceAuthResult } from '@/lib/auth/rbac';
import type { Task } from './types';
import type { WorkMessage, WorkFile, DayPlan, FocusSession, TaskConversation, ApprovalRequest } from '@/lib/work-hub/types';
import { CHANNELS, taskChannel } from '@/lib/work-hub/types';
import { inMemoryStore } from './store';

export class WorkError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const id = z.string().min(1).max(180).regex(/^[\w:-]+$/);
const text = z.string().trim().max(4000);
const files = z.array(id).max(5).default([]);
const hours = z.number().finite().min(0.5).max(24).multipleOf(0.5);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(value); return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
const due = z.string().max(40).refine(value => day.safeParse(value).success || (value[10] === 'T' && day.safeParse(value.slice(0, 10)).success && !isNaN(Date.parse(value))), 'Invalid due date');
const safeLink = z.string().url().max(2048).refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'Use an HTTP or HTTPS link');
export const workCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('send'), channelId: id, text, files }),
  z.object({ action: z.literal('dock'), messageId: id, assigneeId: id, dueDate: due, estimatedHours: z.union([z.literal(1), z.literal(2), z.literal(4)]) }),
  z.object({ action: z.literal('reply'), taskId: id, text, files }),
  z.object({ action: z.literal('request_approval'), taskId: id, reviewerId: id, text: text.min(1), url: safeLink.optional(), files }),
  z.object({ action: z.literal('decide'), taskId: id, approvalId: id, decision: z.enum(['approved', 'changes_requested']) }),
  z.object({ action: z.literal('plan'), date: day, items: z.array(z.object({ taskId: id, hours })).max(5) }),
  z.object({ action: z.literal('start'), taskId: id, date: day }),
  z.object({ action: z.literal('stop'), sessionId: id }),
  z.object({ action: z.literal('edit'), taskId: id, assigneeId: id.optional(), dueDate: due.optional(), estimatedHours: hours.optional(), status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'blocked']).optional() }),
]);
export type WorkCommand = z.infer<typeof workCommand>;
type StoredTask = Task & { _id: string };
const manager = (auth: WorkspaceAuthResult) => ['owner', 'admin', 'manager'].includes(auth.role);
const assigned = (task: Task, uid: string) => task.assigneeId === uid || task.assignees?.includes(uid);

export async function workCollections() {
  const [tasks, messages, plans, sessions, uploads] = await Promise.all([
    getCollection<StoredTask>('tasks'), getCollection<WorkMessage & { _id: string }>('channel_messages'),
    getCollection<DayPlan>('day_plans'), getCollection<FocusSession>('focus_sessions'),
    getCollection<WorkFile & { _id: string; workspaceId: string; data: Buffer }>('work_files'),
  ]);
  if (!tasks || !messages || !plans || !sessions || !uploads) throw new WorkError('The workspace could not be saved. Please retry when the database is available.', 503);
  return { tasks, messages, plans, sessions, uploads };
}
export async function validChannel(channelId: string, workspaceId: string) {
  if (CHANNELS.some(channel => channel.id === channelId)) return;
  if (channelId.startsWith('project:')) {
    const projects = await getCollection('projects');
    if (await projects?.findOne({ id: channelId.slice(8), workspaceId })) return;
  }
  throw new WorkError('Channel not found.', 404);
}
const conversation = (task: Task): TaskConversation => task.collaboration || { channelId: taskChannel(task), messages: [], approvals: [], files: [] };

export async function workSnapshot(auth: WorkspaceAuthResult, date: string) {
  const parsed = day.safeParse(date);
  if (!parsed.success) throw new WorkError('Invalid calendar date.');
  const { tasks, plans, sessions } = await workCollections();
  const ws = { workspaceId: auth.workspaceId };
  const [allTasks, allPlans, focus, totals, ownFocus] = await Promise.all([
    tasks.find(ws, { projection: { _id: 0 } }).toArray(),
    plans.find({ ...ws, date, ...(!manager(auth) ? { userId: auth.user.uid } : {}) }).toArray(),
    sessions.find({ ...ws, active: true }).toArray(),
    sessions.aggregate<{ _id: string; seconds: number }>([
      { $match: { ...ws, active: false } }, { $group: { _id: '$taskId', seconds: { $sum: '$seconds' } } },
    ]).toArray(),
    sessions.findOne({ userId: auth.user.uid, active: true }),
  ]);
  return { workspaceId: auth.workspaceId, userId: auth.user.uid, canManage: manager(auth), tasks: allTasks, plans: allPlans, focus,
    otherFocus: ownFocus && ownFocus.workspaceId !== auth.workspaceId ? { id: ownFocus._id } : null,
    loggedHours: Object.fromEntries(totals.map(total => [total._id, total.seconds / 3600])) };
}

export async function executeWork(auth: WorkspaceAuthResult, command: WorkCommand) {
  const { tasks, messages, plans, sessions, uploads } = await workCollections();
  const { workspaceId, user } = auth;
  const now = new Date().toISOString();
  const actor = { authorId: user.uid, authorName: user.displayName || user.email };
  const member = async (uid: string) => {
    if (!await isWorkspaceMember(uid, workspaceId)) throw new WorkError('Select an active workspace member.');
  };
  const loadTask = async (taskId: string) => {
    const task = await tasks.findOne({ id: taskId, workspaceId });
    if (!task) throw new WorkError('Task not found.', 404);
    return task;
  };
  const loadFiles = async (ids: string[]) => {
    if (!ids.length) return [];
    const result = await uploads.find({ _id: { $in: ids }, workspaceId }, { projection: { data: 0 } }).toArray();
    if (result.length !== new Set(ids).size) throw new WorkError('An attachment is unavailable in this workspace.');
    return result.map(({ id, name, size }) => ({ id, name, size }));
  };
  const saveCache = (task: Task | null) => { if (task) inMemoryStore.tasks.set(task.id, task); };
  const taskEditor = (task: Task) => {
    if (!manager(auth) && !assigned(task, user.uid) && task.creatorId !== user.uid) throw new WorkError('Only the task owner, creator, or a manager can change this task.', 403);
  };
  if (command.action === 'send') {
    await validChannel(command.channelId, workspaceId);
    const attachments = await loadFiles(command.files);
    if (!command.text && !attachments.length) throw new WorkError('Write a message or attach a file.');
    const message: WorkMessage & { _id: string } = { _id: randomUUID(), id: `msg_${Date.now()}_${randomUUID()}`, workspaceId, channelId: command.channelId, ...actor, text: command.text, files: attachments, createdAt: now };
    await messages.insertOne(message);
    return { message };
  }
  if (command.action === 'dock') {
    const message = await messages.findOne({ id: command.messageId, workspaceId });
    if (!message) throw new WorkError('Message not found.', 404);
    await member(command.assigneeId);
    const taskId = 'dock_' + createHash('sha256').update(`${workspaceId}:${message.id}`).digest('hex').slice(0, 32);
    const task: StoredTask = {
      _id: taskId, id: taskId, workspaceId, title: (message.text || message.files[0]?.name || 'Shared file').slice(0, 160),
      description: message.text, status: 'todo', priority: 'medium', assigneeId: command.assigneeId, assignees: [command.assigneeId],
      creatorId: user.uid, dueDate: new Date(command.dueDate).toISOString(), estimatedHours: command.estimatedHours,
      actualHours: 0, completionPercent: 0, subtasks: [], tags: ['from-chat'], createdAt: now, updatedAt: now,
      ...(message.channelId.startsWith('project:') ? { projectId: message.channelId.slice(8) } : {}),
      collaboration: { channelId: message.channelId, sourceMessageId: message.id, messages: [], approvals: [], files: message.files },
    };
    // A deterministic Mongo _id makes repeat clicks and concurrent docking idempotent.
    try { await tasks.updateOne({ _id: taskId }, { $setOnInsert: task }, { upsert: true }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
    const saved = await loadTask(taskId); saveCache(saved);
    return { task: saved };
  }
  if (command.action === 'plan') {
    if (new Set(command.items.map(item => item.taskId)).size !== command.items.length) throw new WorkError('A task can only appear once in your day.');
    const existingPlan = await plans.findOne({ _id: `${workspaceId}:${user.uid}:${command.date}` });
    for (const item of command.items) {
      const task = await loadTask(item.taskId);
      if (!assigned(task, user.uid)) throw new WorkError('Only tasks assigned to you can go into My Day.', 403);
      if (task.status === 'done' && !existingPlan?.items.some(entry => entry.taskId === task.id)) throw new WorkError('Completed tasks cannot be added to My Day.');
    }
    const plan: DayPlan = { _id: `${workspaceId}:${user.uid}:${command.date}`, workspaceId, userId: user.uid, date: command.date, items: command.items };
    await plans.replaceOne({ _id: plan._id }, plan, { upsert: true });
    return { plan };
  }
  if (command.action === 'stop') {
    // A person can stop their own timer after switching or losing access to its workspace.
    const session = await sessions.findOne({ _id: command.sessionId, userId: user.uid });
    if (!session) throw new WorkError('Focus session not found.', 404);
    const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000));
    await sessions.updateOne({ _id: session._id, userId: user.uid, active: true }, { $set: { active: false, endedAt: now, seconds } });
    return { stopped: true };
  }
  let task = await loadTask(command.taskId);
  if (['reply', 'request_approval'].includes(command.action) && !task.collaboration) {
    await tasks.updateOne({ id: task.id, workspaceId, collaboration: { $exists: false } }, { $set: { collaboration: conversation(task) } });
    task = await loadTask(task.id);
  }
  const thread = conversation(task);
  if (command.action === 'start') {
    if (!assigned(task, user.uid)) throw new WorkError('Only the assignee can start this timer.', 403);
    if (task.status === 'done') throw new WorkError('This task is already complete.');
    const plan = await plans.findOne({ _id: `${workspaceId}:${user.uid}:${command.date}` });
    const item = plan?.items.find(item => item.taskId === task.id);
    if (!item) throw new WorkError('Add this task to today’s tray first.');
    await sessions.createIndex({ userId: 1 }, { unique: true, partialFilterExpression: { active: true } });
    const session: FocusSession = { _id: randomUUID(), workspaceId, userId: user.uid, taskId: task.id, taskTitle: task.title,
      startedAt: now, expectedEndAt: new Date(Date.now() + item.hours * 3600000).toISOString(), active: true };
    try { await sessions.insertOne(session); }
    catch (error) { if ((error as { code?: number }).code === 11000) throw new WorkError('A focus timer is already running. Stop it before starting another, including in another workspace.', 409); throw error; }
    return { session };
  }
  if (command.action === 'reply') {
    const attachments = await loadFiles(command.files);
    if (!command.text && !attachments.length) throw new WorkError('Write a reply or attach a file.');
    const message: WorkMessage = { id: randomUUID(), workspaceId, channelId: thread.channelId, ...actor, text: command.text, files: attachments, createdAt: now };
    // shortcut: threads hold 500 entries per task; use a paginated message collection before increasing this cap.
    if (thread.messages.length >= 500 || thread.files.length + attachments.length > 100) throw new WorkError('This thread has reached its message or attachment limit.', 409);
    const result = await tasks.findOneAndUpdate({ id: task.id, workspaceId, 'collaboration.messages.499': { $exists: false } },
      task.collaboration ? { $push: { 'collaboration.messages': message }, $addToSet: { 'collaboration.files': { $each: attachments } }, $set: { updatedAt: now } }
        : { $set: { collaboration: { ...thread, messages: [message], files: attachments }, updatedAt: now } }, { returnDocument: 'after' });
    if (!result) throw new WorkError('The thread changed. Refresh and retry.', 409);
    saveCache(result); return { task: result };
  }
  if (command.action === 'request_approval') {
    taskEditor(task); await member(command.reviewerId);
    if (await getUserWorkspaceRole(command.reviewerId, workspaceId) === 'viewer') throw new WorkError('Choose a reviewer with permission to respond.');
    if (command.reviewerId === user.uid) throw new WorkError('Choose someone else to review your work.');
    const attachments = await loadFiles(command.files);
    if (!command.url && !attachments.length) throw new WorkError('Attach a file or provide a link to review.');
    if (thread.approvals.some(request => request.status === 'pending')) throw new WorkError('Resolve the pending approval before requesting another.', 409);
    if (thread.approvals.length >= 50) throw new WorkError('This task has reached its approval history limit.', 409);
    const approval: ApprovalRequest = { id: randomUUID(), ...actor, reviewerId: command.reviewerId, text: command.text, url: command.url, files: attachments, createdAt: now, status: 'pending' };
    const next = await tasks.findOneAndUpdate({ id: task.id, workspaceId, 'collaboration.approvals': { $not: { $elemMatch: { status: 'pending' } } } },
      task.collaboration ? { $push: { 'collaboration.approvals': approval }, $addToSet: { 'collaboration.files': { $each: attachments } }, $set: { status: 'in_review', completionPercent: 0, completedAt: null, updatedAt: now } }
        : { $set: { collaboration: { ...thread, approvals: [approval], files: attachments }, status: 'in_review', completionPercent: 0, completedAt: null, updatedAt: now } }, { returnDocument: 'after' });
    if (!next) throw new WorkError('An approval is already pending. Refresh to see it.', 409);
    saveCache(next); return { task: next };
  }
  if (command.action === 'decide') {
    const approval = thread.approvals.find(request => request.id === command.approvalId);
    if (!approval) throw new WorkError('Approval request not found.', 404);
    if (approval.authorId === user.uid || (approval.reviewerId !== user.uid && !manager(auth))) throw new WorkError('Only the designated reviewer or a manager can sign off; requesters cannot approve their own work.', 403);
    const next = await tasks.findOneAndUpdate({ id: task.id, workspaceId, 'collaboration.approvals': { $elemMatch: { id: approval.id, status: 'pending' } } },
      { $set: { 'collaboration.approvals.$.status': command.decision, 'collaboration.approvals.$.decidedBy': user.uid,
        'collaboration.approvals.$.decidedByName': actor.authorName, 'collaboration.approvals.$.decidedAt': now,
        status: command.decision === 'approved' ? 'done' : 'in_progress', completionPercent: command.decision === 'approved' ? 100 : 0,
        completedAt: command.decision === 'approved' ? now : null, isAtRisk: false, updatedAt: now } }, { returnDocument: 'after' });
    if (!next) throw new WorkError('This approval has already been resolved.', 409);
    saveCache(next); return { task: next };
  }
  taskEditor(task);
  if (command.assigneeId) await member(command.assigneeId);
  if (command.status === 'done' && thread.approvals.some(request => request.status === 'pending')) throw new WorkError('Resolve the approval gate before completing this task.', 409);
  const updates: Partial<Task> = { updatedAt: now };
  if (command.assigneeId) { updates.assigneeId = command.assigneeId; updates.assignees = [command.assigneeId]; }
  if (command.dueDate) updates.dueDate = new Date(command.dueDate).toISOString();
  if (command.estimatedHours !== undefined) updates.estimatedHours = command.estimatedHours;
  if (command.status) { updates.status = command.status; updates.completedAt = command.status === 'done' ? now : null; updates.completionPercent = command.status === 'done' ? 100 : 0; }
  const next = await tasks.findOneAndUpdate({ id: task.id, workspaceId, ...(command.status === 'done' ? { 'collaboration.approvals': { $not: { $elemMatch: { status: 'pending' } } } } : {}) }, { $set: updates }, { returnDocument: 'after' });
  if (!next) throw new WorkError('The task changed. Refresh and retry.', 409);
  saveCache(next); return { task: next };
}
