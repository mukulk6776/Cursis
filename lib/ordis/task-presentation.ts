import type { ActionResult } from './workspace-actions';

const statuses: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  review: 'In review',
  done: 'Done',
  completed: 'Done',
  blocked: 'Blocked',
};

const priorities: Record<string, string> = {
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
  urgent: 'Urgent',
};

// Keep record text literal inside the chat's Markdown renderer.
function text(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&')
    : '';
}

function formatTaskItems(tasks: Record<string, unknown>[]): string[] {
  return tasks.map((task) => {
    const rawStatus = String(task.status || '').toLowerCase().replace(/[\s-]+/g, '_');
    const statusLabel = statuses[rawStatus] || 'To do';

    const rawPriority = String(task.priority || '').toLowerCase();
    const priorityLabel = priorities[rawPriority] || (task.priority ? `${task.priority} priority` : 'Medium priority');

    const assignee =
      text(task.assigneeName) ||
      text(task.assignee) ||
      text(task.ownerName) ||
      (task.assigneeId ? 'Assigned' : 'Unassigned');

    const details = [statusLabel, priorityLabel, assignee];

    const rawDate = typeof task.dueDate === 'string' ? task.dueDate : typeof task.deadline === 'string' ? task.deadline : '';
    const date = rawDate ? rawDate.slice(0, 10) : '';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
    if (parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
      details.push(
        `Due ${parsed.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        })}`
      );
    } else {
      details.push('No due date');
    }

    const title = text(task.title || task.name) || 'Untitled task';
    return `- **${title}** — ${details.filter(Boolean).join(' · ')}`;
  });
}

/**
 * Predictable, clean presentation for task lists.
 * Tolerant to typos (e.g., "taks", "onging") and ensures raw database IDs and squished tables
 * are never presented to the user.
 */
export function presentTaskList(message: string, actions: ActionResult[]): string | undefined {
  const mentionsTasks = /\b(tasks?|taks?|todos?|deliverables?|backlog|work)\b/i.test(message);
  const mentionsListing = /\b(list|show|ongoing|onging|ongoig|active|current|unfinished|pending|open|get|view|display|what|all)\b/i.test(message);
  const wantsRawData = /\b(raw|json|csv|export|code|sql|api)\b/i.test(message);
  const wantsExplicitTable = /\b(as\s+a\s+table|in\s+a\s+table|table\s+format)\b/i.test(message);
  const wantsAnalysis = /\b(compare|why|analy[sz]e|count|how many|summari[sz]e|summary)\b/i.test(message);

  if (!mentionsTasks && !mentionsListing) return;
  if (wantsRawData || wantsExplicitTable || wantsAnalysis) return;

  if (actions.some((action) => !action.ok)) return;

  const taskAction = [...actions].reverse().find((action) => action.ok && action.operation === 'list_tasks');
  if (!taskAction) return;

  const data = taskAction.data as { tasks?: unknown } | undefined;
  if (!Array.isArray(data?.tasks)) return;

  const ongoing =
    /\b(ongoing|onging|ongoig|active|current|unfinished|pending|open|in[ -]?progress)\b/i.test(message) &&
    !/\b(done|completed|finished)\b/i.test(message);

  const isDone = (status: unknown) => {
    const s = String(status || '').toLowerCase().replace(/[\s-]+/g, '_');
    return s === 'done' || s === 'completed';
  };

  const tasks = data.tasks.filter(
    (task): task is Record<string, unknown> =>
      !!task && typeof task === 'object' && !Array.isArray(task) && (!ongoing || !isDone(task.status))
  );

  const label = ongoing ? 'ongoing task' : 'task';
  if (!tasks.length) return `No ${label}s found for this request.`;

  const lines = formatTaskItems(tasks);
  return `You have ${tasks.length} ${label}${tasks.length === 1 ? '' : 's'}:\n\n${lines.join('\n')}`;
}

/**
 * Defense-in-depth: If the AI model generated a response containing a raw markdown table with
 * database IDs (e.g. `| ID | Title | Status |`), convert it into a clean task list.
 */
export function sanitizeTaskTable(content: string | undefined | null, actions: ActionResult[]): string | undefined {
  if (!content) return undefined;

  const hasTaskTableWithIds =
    /\|\s*(?:ID|Task ID|id)\s*\|.*?(?:Title|Task|Name).*?\|/i.test(content) &&
    /\|[-:\s|]+\|/.test(content);

  if (!hasTaskTableWithIds) return content;

  // If we have task data from list_tasks, use the clean formatter
  const taskAction = [...actions].reverse().find((action) => action.ok && action.operation === 'list_tasks');
  const data = taskAction?.data as { tasks?: unknown } | undefined;
  if (Array.isArray(data?.tasks) && data.tasks.length > 0) {
    const tasks = data.tasks.filter((t): t is Record<string, unknown> => !!t && typeof t === 'object' && !Array.isArray(t));
    if (tasks.length > 0) {
      const lines = formatTaskItems(tasks);
      return `Here are your ${tasks.length} active tasks:\n\n${lines.join('\n')}`;
    }
  }

  // Otherwise, strip the raw ID column from the markdown table lines
  const lines = content.split('\n');
  const sanitizedLines: string[] = [];

  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|');
      // If the first cell after leading pipe is an ID column or values like t_... or dock_...
      if (parts.length >= 4) {
        const col1 = parts[1].trim();
        if (/^(?:id|task\s*id|t_\w+|dock_\w+)$/i.test(col1)) {
          sanitizedLines.push(['', ...parts.slice(2)].join('|'));
          continue;
        }
      }
    }
    sanitizedLines.push(line);
  }

  return sanitizedLines.join('\n');
}
