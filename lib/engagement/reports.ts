import type { Task } from '@/lib/db/types';

export function reportPeriod(now: Date) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - (end.getUTCDay() + 6) % 7);
  return { start: new Date(+end - 7 * 86400000).toISOString(), end: end.toISOString() };
}

export function summarizeTasks(tasks: Task[], start: string, end: string, now: Date, capacityHours: number | null) {
  const open = tasks.filter(task => task.status !== 'done');
  const today = now.toISOString().slice(0, 10);
  const workloads = new Map<string, { name: string; hours: number; tasks: number }>();
  for (const task of open) {
    const ids = [...new Set(task.assignees?.length ? task.assignees : task.assigneeId ? [task.assigneeId] : [])];
    for (const id of ids) {
      const current = workloads.get(id) || { name: id === task.assigneeId && task.assigneeName ? task.assigneeName : id, hours: 0, tasks: 0 };
      current.hours += Math.max(0, Number(task.estimatedHours) || 0) / ids.length;
      current.tasks++;
      workloads.set(id, current);
    }
  }
  return {
    completed: tasks.filter(task => task.status === 'done' && task.completedAt && task.completedAt >= start && task.completedAt < end).length,
    unknownCompletionDates: tasks.filter(task => task.status === 'done' && !task.completedAt).length,
    atRisk: open.filter(task => task.isAtRisk || (task.dueDate && task.dueDate.slice(0, 10) < today)),
    dueToday: open.filter(task => task.dueDate?.slice(0, 10) === today),
    overloaded: capacityHours ? [...workloads.values()].filter(person => person.hours > capacityHours) : null,
  };
}

export function reportsPaused(unsubscribedAt?: string, consentAt?: string) {
  return Boolean(unsubscribedAt && (!consentAt || Date.parse(consentAt) <= Date.parse(unsubscribedAt)));
}
