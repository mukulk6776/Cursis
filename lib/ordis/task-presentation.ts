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
  const wantsRawData = /\b(raw|json|csv|export|code|sql|api)\b/i.test(message);
  const wantsExplicitTable = /\b(as\s+a\s+table|in\s+a\s+table|table\s+format)\b/i.test(message);
  const wantsAnalysis = /\b(compare|why|analy[sz]e|count|how many|summari[sz]e|summary)\b/i.test(message);

  if (wantsRawData || wantsExplicitTable || wantsAnalysis) return;

  if (actions.some((action) => !action.ok)) return;

  const taskAction = [...actions].reverse().find((action) => action.ok && action.operation === 'list_tasks');
  if (!taskAction) return;

  const data = taskAction.data as { tasks?: unknown } | undefined;
  if (!Array.isArray(data?.tasks)) return;

  const mentionsTasks = /\b(tasks?|taks?|todos?|deliverables?|backlog|work|items?)\b/i.test(message);
  const mentionsListing = /\b(list|show|ongoing|onging|ongoig|active|current|unfinished|pending|open|get|view|display|what|all|see)\b/i.test(message);

  // If list_tasks was called and it wasn't an explicit query for something else, present the task list
  if (!mentionsTasks && !mentionsListing && message.trim().length > 60) return;

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
  return `Here are your ${tasks.length} ${label}${tasks.length === 1 ? '' : 's'}:\n\n${lines.join('\n')}`;
}

/**
 * Defense-in-depth: If the AI model generated a response containing a markdown table
 * (with or without raw database IDs), convert it into a clean bullet-point task list.
 *
 * This catches:
 *  - Tables with an ID/Task ID column header
 *  - Tables containing raw IDs (t_..., dock_...) in any cell
 *  - Any markdown table that appears alongside list_tasks action results
 */
export function sanitizeTaskTable(content: string | undefined | null, actions: ActionResult[]): string | undefined {
  if (!content) return undefined;

  const hasMarkdownTable =
    /\|[-:\s]+\|/.test(content) && /\|.*\|.*\|/.test(content);

  if (!hasMarkdownTable) return content;

  // Detect task-related tables: either has ID header, raw IDs in cells, or task-like columns
  const hasIdColumn = /\|\s*(?:ID|Task\s*ID|id)\s*\|/i.test(content);
  const hasRawIds = /\|\s*(?:t_\w+|dock_\w+)\s*\|/i.test(content);
  const hasTaskColumns = /\|\s*(?:Title|Task|Name)\s*\|.*?(?:Status|Priority|Due|Assignee)/i.test(content);
  const isTaskTable = hasIdColumn || hasRawIds || hasTaskColumns;

  // If we have task data from list_tasks, always prefer the clean formatter
  const taskAction = [...actions].reverse().find((action) => action.ok && action.operation === 'list_tasks');
  const data = taskAction?.data as { tasks?: unknown } | undefined;
  if (Array.isArray(data?.tasks) && data.tasks.length > 0) {
    const tasks = data.tasks.filter((t): t is Record<string, unknown> => !!t && typeof t === 'object' && !Array.isArray(t));
    if (tasks.length > 0) {
      const lines = formatTaskItems(tasks);
      // Preserve any non-table text before/after the table
      const beforeTable = content.split(/\n\s*\|/)[0].trim();
      const afterTableMatch = content.match(/(?:\n[^|][^\n]*)+$/);
      const afterTable = afterTableMatch ? afterTableMatch[0].trim() : '';
      const intro = beforeTable || `Here are your ${tasks.length} active tasks:`;
      const parts = [intro, '', ...lines];
      if (afterTable) parts.push('', afterTable);
      return parts.join('\n');
    }
  }

  if (!isTaskTable) return content;

  // Fallback: convert the markdown table rows into bullet points, stripping ID columns
  const outputLines: string[] = [];
  const tableLines: string[] = [];
  let headerCells: string[] = [];
  let inTable = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.includes('|') && trimmed.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        headerCells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        continue;
      }
      // Skip divider rows
      if (/^[|\s:-]+$/.test(trimmed)) continue;
      // Data row
      const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      // Build a bullet point, skipping ID-like columns
      const parts: string[] = [];
      let title = '';
      for (let ci = 0; ci < cells.length && ci < headerCells.length; ci++) {
        const header = headerCells[ci].toLowerCase();
        const value = cells[ci];
        if (!value) continue;
        // Skip ID columns and raw ID values
        if (/^(?:id|task\s*id|#)$/i.test(header)) continue;
        if (/^(?:t_|dock_)\w+$/i.test(value)) continue;
        if (/^(?:title|task|name)$/i.test(header)) {
          title = value;
        } else {
          const statusLabel = statuses[value.toLowerCase().replace(/[\s-]+/g, '_')];
          const priorityLabel = priorities[value.toLowerCase()];
          parts.push(statusLabel || priorityLabel || value);
        }
      }
      if (title || parts.length) {
        tableLines.push(`- **${title || 'Untitled task'}**${parts.length ? ` — ${parts.join(' · ')}` : ''}`);
      }
    } else {
      if (inTable && tableLines.length) {
        outputLines.push(...tableLines);
        tableLines.length = 0;
      }
      inTable = false;
      headerCells = [];
      outputLines.push(line);
    }
  }
  if (tableLines.length) outputLines.push(...tableLines);

  return outputLines.join('\n');
}
