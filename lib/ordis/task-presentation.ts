import type { ActionResult } from './workspace-actions';

const statuses: Record<string, string> = {
  todo: 'To do', in_progress: 'In progress', in_review: 'In review',
  done: 'Done', blocked: 'Blocked',
};
const priorities: Record<string, string> = {
  low: 'Low priority', medium: 'Medium priority', high: 'High priority', urgent: 'Urgent',
};

// Keep record text literal inside the chat's Markdown renderer.
function text(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&')
    : '';
}

/** A predictable presentation for simple task lists; analytical/custom requests stay with the model. */
export function presentTaskList(message: string, actions: ActionResult[]): string | undefined {
  if (!/\btasks?\b/i.test(message)
    || !/\b(list|show|ongoing|active|current|unfinished|pending)\b/i.test(message)
    || /\b(ids?|json|raw|table|csv|export|compare|why|analy[sz]e|count|how many|summari[sz]e|summary)\b/i.test(message)
    || actions.length !== 1 || actions.some(action => !action.ok || action.operation !== 'list_tasks')) return;

  const latest = actions.at(-1)!;
  const data = latest.data as { tasks?: unknown } | undefined;
  if (!Array.isArray(data?.tasks)) return;
  const ongoing = /\b(ongoing|active|current|unfinished|pending)\b/i.test(message)
    && !/\b(done|completed|finished)\b/i.test(message);
  const tasks = data.tasks.filter((task): task is Record<string, unknown> =>
    !!task && typeof task === 'object' && !Array.isArray(task)
    && (!ongoing || task.status !== 'done'));
  const label = ongoing ? 'ongoing task' : 'task';
  if (!tasks.length) return `No ${label}s found for this request.`;

  const lines = tasks.map(task => {
    const details = [statuses[String(task.status)] || 'Status not set', priorities[String(task.priority)]];
    details.push(text(task.assigneeName) || (task.assigneeId ? 'Owner name unavailable' : 'Unassigned'));
    const date = typeof task.dueDate === 'string' ? task.dueDate.slice(0, 10) : '';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
    if (parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
      details.push(`Due ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`);
    } else details.push('No due date');
    return `- **${text(task.title) || 'Untitled task'}** — ${details.filter(Boolean).join(' · ')}`;
  });
  return `You have ${tasks.length} ${label}${tasks.length === 1 ? '' : 's'}:\n\n${lines.join('\n')}`;
}
