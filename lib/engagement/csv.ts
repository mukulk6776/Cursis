import type { TaskStatus } from '@/lib/db/types';

export const CSV_TEMPLATE = 'name,assignee email,due date,status\nPlan the launch,,2026-12-01,todo\n';
const statuses: Record<string, TaskStatus> = { todo: 'todo', 'in-progress': 'in_progress', in_progress: 'in_progress', review: 'in_review', in_review: 'in_review', completed: 'done', done: 'done', blocked: 'blocked' };
export interface TaskImportRow { line: number; name: string; email: string; dueDate: string; status: TaskStatus; errors: string[] }

export function parseTaskCsv(input: string, memberEmails: string[]): TaskImportRow[] {
  if (new TextEncoder().encode(input).length > 64000) throw new Error('CSV must be 64 KB or smaller.');
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  const text = input.replace(/^\uFEFF/, '');
  function finishField() { row.push(field); field = ''; closed = false; }
  function finishRow() { finishField(); if (row.some(value => value.trim())) rows.push(row); row = []; if (rows.length > 101) throw new Error('Import up to 100 tasks at a time.'); }
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character !== '"') field += character;
      else if (text[index + 1] === '"') { field += '"'; index++; }
      else { quoted = false; closed = true; }
    } else if (character === '"') {
      if (field || closed) throw new Error('Unexpected quote in CSV.');
      quoted = true;
    } else if (character === ',') finishField();
    else if (character === '\r' || character === '\n') { finishRow(); if (character === '\r' && text[index + 1] === '\n') index++; }
    else if (closed && !/\s/.test(character)) throw new Error('Unexpected text after a closing quote.');
    else if (!closed) field += character;
  }
  if (quoted) throw new Error('CSV has an unclosed quote.');
  if (field || row.length || closed) finishRow();
  const headers = rows.shift()?.map(value => value.trim().toLowerCase()) || [];
  const required = ['name', 'assignee email', 'due date', 'status'];
  if (headers.length !== 4 || new Set(headers).size !== 4 || required.some(name => !headers.includes(name))) throw new Error('Use exactly these headers: name, assignee email, due date, status.');
  if (!rows.length) throw new Error('CSV has no task rows.');
  const members = new Set(memberEmails.map(email => email.trim().toLowerCase()));
  return rows.map((values, index) => {
    const get = (key: string) => (values[headers.indexOf(key)] || '').trim();
    const name = get('name'), email = get('assignee email').toLowerCase(), dueDate = get('due date'), rawStatus = get('status').toLowerCase();
    const errors: string[] = [];
    if (values.length !== 4) errors.push('Expected four columns');
    if (!name || name.length > 200) errors.push('Name must be 1–200 characters');
    if (email && !members.has(email)) errors.push('Assignee email must belong to a current workspace member');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0, 10) !== dueDate) errors.push('Due date must be a valid YYYY-MM-DD date');
    if (!Object.hasOwn(statuses, rawStatus)) errors.push('Status must be todo, in-progress, review, completed or blocked');
    return { line: index + 2, name, email, dueDate, status: Object.hasOwn(statuses, rawStatus) ? statuses[rawStatus] : 'todo', errors };
  });
}
