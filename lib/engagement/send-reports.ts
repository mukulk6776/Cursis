import { createHash, randomUUID } from 'crypto';
import type { Db } from 'mongodb';
import type { Task } from '@/lib/db/types';
import { accountBlocked } from '@/lib/privacy/core';
import { sendProgressEmail } from '@/lib/email/notifications';
import { SITE_URL } from '@/lib/site';
import { reportPeriod, reportsPaused, summarizeTasks } from './reports';

interface Delivery {
  _id: string; workspaceId: string; userId: string; kind: string; period: string;
  payload: { to: string; subject: string; text: string };
  createdAt: Date; attemptedAt?: Date; sentAt?: Date; leaseUntil?: Date; leaseId?: string; needsReview?: boolean;
}

async function deliver(db: Db, delivery: Delivery, now: Date) {
  const collection = db.collection<Delivery>('workspace_email_deliveries');
  await collection.updateOne({ _id: delivery._id }, { $setOnInsert: delivery }, { upsert: true });
  const leaseId = randomUUID();
  const claimed = await collection.findOneAndUpdate({ _id: delivery._id, sentAt: { $exists: false }, needsReview: { $ne: true },
    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lt: now } }],
  }, { $set: { leaseUntil: new Date(+now + 10 * 60000), leaseId } }, { returnDocument: 'after' });
  if (!claimed) return { sent: 0, review: Number(Boolean((await collection.findOne({ _id: delivery._id }))?.needsReview)) };
  // Resend remembers keys for 24h; older ambiguous attempts need operator review, not a possible duplicate.
  if (claimed.attemptedAt && +now - +claimed.attemptedAt >= 23 * 3600000) {
    await collection.updateOne({ _id: claimed._id, leaseId }, { $set: { needsReview: true }, $unset: { leaseUntil: '', leaseId: '' } });
    return { sent: 0, review: 1 };
  }
  await collection.updateOne({ _id: claimed._id, leaseId }, { $set: { attemptedAt: claimed.attemptedAt || now } });
  try {
    await sendProgressEmail(claimed.payload, claimed._id);
    await collection.updateOne({ _id: claimed._id, leaseId }, { $set: { sentAt: now }, $unset: { leaseUntil: '', leaseId: '' } });
    return { sent: 1, review: 0 };
  } catch {
    await collection.updateOne({ _id: claimed._id, leaseId }, { $unset: { leaseUntil: '', leaseId: '' } });
    throw new Error('Progress email needs retry');
  }
}

export async function sendWorkspaceReports(db: Db, now = new Date()) {
  await db.collection('workspace_email_deliveries').createIndex({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });
  const period = reportPeriod(now);
  const result = { sent: 0, failed: 0, review: 0 };
  // shortcut: one streamed invocation processes workspaces; move to a queue when job duration exceeds the host limit.
  for await (const workspace of db.collection('workspaces').find({ ownerId: { $exists: true } })) {
    try {
      const user = await db.collection('users').findOne({ $or: [{ uid: workspace.ownerId }, { id: workspace.ownerId }] });
      if (!user?.email || await accountBlocked(workspace.ownerId, user.email)) continue;
      const preferences = await db.collection('workspace_email_preferences').findOne({ workspaceId: workspace.id, userId: workspace.ownerId });
      const unsubscribe = await db.collection('unsubscribes').findOne({ email: user.email.trim().toLowerCase() });
      if (reportsPaused(unsubscribe?.unsubscribedAt, preferences?.consentAt) || preferences?.weekly === false) continue;
      if (!workspace.createdAt || Date.parse(workspace.createdAt) >= Date.parse(period.end)) continue;
      const tasks = await db.collection<Task>('tasks').find({ workspaceId: workspace.id }).toArray();
      const summary = summarizeTasks(tasks, period.start, period.end, now, preferences?.capacityHours ?? null);
      const overload = summary.overloaded === null ? 'Overload not assessed: no open-work limit configured.'
        : summary.overloaded.length ? `Overloaded above your ${preferences?.capacityHours}h open-work limit:\n${summary.overloaded.map(person => `${person.name}: ${person.hours.toFixed(1)} estimated hours across ${person.tasks} open tasks`).join('\n')}` : 'No one exceeds your configured open-work limit.';
      const base = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, '');
      const text = `${workspace.name || 'Your workspace'} — weekly progress\n${period.start.slice(0, 10)} through ${new Date(Date.parse(period.end) - 1).toISOString().slice(0, 10)} (UTC)\n\nTasks completed in this period: ${summary.completed}\nCompleted tasks with no recorded completion date (excluded): ${summary.unknownCompletionDates}\nOpen tasks currently at risk or overdue: ${summary.atRisk.length}\n${overload}\n\nOpen-work hours use saved task estimates, split evenly for shared assignments. Risk and workload are current snapshots.\n\nOpen workspace: ${base}/dashboard\nTurn off reports: Dashboard → Settings → Notifications → Progress emails\nUnsubscribe from non-transactional email: ${base}/unsubscribe?email=${encodeURIComponent(user.email)}`;
      const id = createHash('sha256').update(`weekly:${workspace.id}:${workspace.ownerId}:${period.start}`).digest('hex');
      const delivered = await deliver(db, { _id: id, workspaceId: workspace.id, userId: workspace.ownerId, kind: 'weekly', period: period.start,
        payload: { to: user.email, subject: 'Your Cursis weekly progress report', text }, createdAt: now }, now);
      result.sent += delivered.sent; result.review += delivered.review;
    } catch { result.failed++; }
  }
  for await (const preferences of db.collection('workspace_email_preferences').find({ daily: true })) {
    try {
      const workspace = await db.collection('workspaces').findOne({ id: preferences.workspaceId });
      if (!workspace) continue;
      const user = await db.collection('users').findOne({ $or: [{ uid: preferences.userId }, { id: preferences.userId }] });
      if (!user?.email || await accountBlocked(preferences.userId, user.email)) continue;
      if (workspace.ownerId !== preferences.userId && !await db.collection('workspace_memberships').findOne({ workspaceId: workspace.id, userId: preferences.userId })) continue;
      const unsubscribe = await db.collection('unsubscribes').findOne({ email: user.email.trim().toLowerCase() });
      if (reportsPaused(unsubscribe?.unsubscribedAt, preferences.consentAt)) continue;
      const tasks = await db.collection<Task>('tasks').find({ workspaceId: workspace.id, $or: [{ assigneeId: preferences.userId }, { assignees: preferences.userId }] }).toArray();
      const summary = summarizeTasks(tasks, period.start, period.end, now, null);
      if (!summary.dueToday.length && !summary.atRisk.length) continue;
      const list = (values: Task[]) => values.slice(0, 20).map(task => `- ${task.title} (due ${task.dueDate?.slice(0, 10) || 'date not set'})`).join('\n') || 'None';
      const base = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, '');
      const day = now.toISOString().slice(0, 10);
      const text = `${workspace.name || 'Your workspace'} — Ordis daily digest\n${day} (UTC)\nYour assigned tasks\n\nDue today: ${summary.dueToday.length}\n${list(summary.dueToday)}\n\nAt risk or overdue: ${summary.atRisk.length}\n${list(summary.atRisk)}\n\nUp to 20 tasks per list. Tasks can appear in both lists. Open your workspace for all tasks: ${base}/dashboard\nTurn off this digest: Dashboard → Settings → Notifications → Progress emails\nUnsubscribe from non-transactional email: ${base}/unsubscribe?email=${encodeURIComponent(user.email)}`;
      const id = createHash('sha256').update(`daily:${workspace.id}:${preferences.userId}:${day}`).digest('hex');
      const delivered = await deliver(db, { _id: id, workspaceId: workspace.id, userId: preferences.userId, kind: 'daily', period: day,
        payload: { to: user.email, subject: 'Your Ordis daily task digest', text }, createdAt: now }, now);
      result.sent += delivered.sent; result.review += delivered.review;
    } catch { result.failed++; }
  }
  return result;
}
