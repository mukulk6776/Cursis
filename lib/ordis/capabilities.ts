import type { DashboardPageType } from '@/lib/dashboard/types';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export interface Capability {
  resource: string;
  method: Method;
  description: string;
  required?: string[];
  page: DashboardPageType;
}
const capability = (resource: string, method: Method, page: DashboardPageType, description: string, required: string[] = []): Capability =>
  ({ resource, method, page, description, required });

// Only implemented API operations belong here. UI-only features are navigable.
export const capabilities: Record<string, Capability> = {
  list_tasks: capability('tasks', 'GET', 'tasks', 'List tasks; optional status, priority, projectId, assigneeId, departmentId.'),
  create_task: capability('tasks', 'POST', 'tasks', 'Create task: title, description, priority (low/medium/high/urgent), dueDate (ISO), assigneeId, departmentId, projectId.', ['title']),
  update_task: capability('tasks', 'PATCH', 'tasks', 'Update task: id plus title, description, status (todo/in_progress/in_review/done/blocked), priority, dueDate, assigneeId, departmentId, projectId.', ['id']),
  delete_task: capability('tasks', 'DELETE', 'tasks', 'Delete task by id.', ['id']),
  list_projects: capability('projects', 'GET', 'projects', 'List projects.'),
  create_project: capability('projects', 'POST', 'projects', 'Create project: name, description, clientName, deadline, budget.', ['name']),
  update_project: capability('projects', 'PATCH', 'projects', 'Update project: id, name, description, deadline, budget, progressPercent, teamMemberIds, milestones.', ['id']),
  delete_project: capability('projects', 'DELETE', 'projects', 'Delete project: id.', ['id']),
  list_departments: capability('departments', 'GET', 'departments', 'List departments; optional q.'),
  create_department: capability('departments', 'POST', 'departments', 'Create department: name, description, lead, head, color, tags. Preserve names such as UI/UX.', ['name']),
  update_department: capability('departments', 'PATCH', 'departments', 'Update department: id, name, description, lead, head, color, tags.', ['id']),
  delete_department: capability('departments', 'DELETE', 'departments', 'Delete department: id. If active tasks exist, ask whether to reassign or unassign; taskAction and targetDepartmentId specify that choice.', ['id']),
  list_team: capability('team', 'GET', 'team', 'List actual members and pending invitations.'),
  invite_member: capability('team', 'POST', 'team', 'Invite by email; optional workspaceRole (member/admin), department, team, note. Preserve the exact email. If missing a domain suffix, ask for the complete email; never guess. Invitation acceptance is required for membership.', ['email']),
  remove_member: capability('team', 'DELETE', 'team', 'Remove userId or revoke invitationId; first list team to resolve the target.'),
  list_meetings: capability('meetings', 'GET', 'meetings', 'List meetings.'),
  create_meeting: capability('meetings', 'POST', 'meetings', 'Schedule meeting: title, date (YYYY-MM-DD), time (HH:mm), agenda, platform, attendeeIds. Ask for missing date/time.', ['title', 'date', 'time']),
  update_meeting: capability('meetings', 'PATCH', 'meetings', 'Update meeting: id plus title, date, time, agenda, status.', ['id']),
  delete_meeting: capability('meetings', 'DELETE', 'meetings', 'Delete meeting: id.', ['id']),
  list_events: capability('calendar/events', 'GET', 'calendar', 'List calendar events; optional startDate, endDate.'),
  create_event: capability('calendar/events', 'POST', 'calendar', 'Create calendar event: title, startTime, endTime (ISO with timezone), description, allDay, type, attendeeIds.', ['title', 'startTime', 'endTime']),
  delete_event: capability('calendar/events', 'DELETE', 'calendar', 'Delete event: id.', ['id']),
  list_documents: capability('documents', 'GET', 'documents', 'List documents and files; optional q, category, projectId.'),
  create_document: capability('documents', 'POST', 'documents', 'Create document only when explicitly requested: title, content, category, tags, projectId.', ['title', 'content']),
  update_document: capability('documents', 'PATCH', 'documents', 'Update document: id, title, content, category, tags.', ['id']),
  delete_document: capability('documents', 'DELETE', 'documents', 'Delete document: id.', ['id']),
  list_automations: capability('automations', 'GET', 'automations', 'List automation rules.'),
  create_automation: capability('automations', 'POST', 'automations', 'Save automation rule (execution is not implemented): name, trigger object {type: lead_created/task_overdue/task_status_changed/meeting_ended/payment_received/webhook}, actions array of {type: assign_task/send_email/notify_channel/create_crm_deal/trigger_ordis_agent/call_webhook, config: object}, conditions. Ask for missing trigger/action details. Do not claim this executes external actions.', ['name', 'trigger', 'actions']),
  list_deals: capability('crm/deals', 'GET', 'workspace', 'List CRM deals.'),
  create_deal: capability('crm/deals', 'POST', 'workspace', 'Create deal: title, company, value, stage, contactEmail, notes.', ['title', 'company']),
  list_leads: capability('crm/leads', 'GET', 'workspace', 'List CRM leads; optional status.'),
  create_lead: capability('crm/leads', 'POST', 'workspace', 'Create lead: name, company, email, phone, source, notes.', ['name', 'company', 'email']),
  list_contacts: capability('crm/contacts', 'GET', 'workspace', 'List CRM contacts.'),
  list_integrations: capability('integrations', 'GET', 'integrations', 'List integrations. Open integrations page to configure credentials.'),
  list_notifications: capability('notifications', 'GET', 'home', 'List your notifications.'),
  read_notifications: capability('notifications', 'POST', 'home', 'Mark your notifications read.'),
  read_brain: capability('ordis/brain', 'GET', 'ordis', 'Read saved company knowledge.'),
  remember_fact: capability('ordis/brain', 'POST', 'ordis', 'Save company knowledge: category, key, value.', ['category', 'key', 'value']),
  workspace_stats: capability('dashboards/stats', 'GET', 'analytics', 'Read workspace dashboard metrics.'),
  search_workspace: capability('search', 'GET', 'home', 'Search workspace using q.', ['q']),
};

export const pages: DashboardPageType[] = ['home', 'ordis', 'tasks', 'projects', 'team', 'departments', 'calendar', 'meetings', 'analytics', 'workspace', 'automations', 'documents', 'messages', 'integrations', 'settings'];

export function validateAction(operation: string, input: Record<string, unknown>): string | null {
  const spec = Object.hasOwn(capabilities, operation) ? capabilities[operation] : undefined;
  if (!spec) return 'Unsupported workspace action.';
  for (const key of spec.required || []) {
    if (input[key] === undefined || input[key] === null || input[key] === '') return `Please provide ${key} for ${operation.replaceAll('_', ' ')}.`;
  }
  if (operation === 'invite_member' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(input.email))) {
    return `Please provide the complete email address for ${String(input.email)} (for example, name@gmail.com). I haven't sent an invitation.`;
  }
  if (operation === 'remove_member' && !input.userId && !input.invitationId) return 'Choose a member or invitation first.';
  return null;
}

/** Narrow offline support: never infer unrelated actions from keyword matches. */
export function parseDirectAction(message: string): { operation: string; input: Record<string, unknown> } | null {
  const department = message.trim().match(/^(?:add|create|make)\s+(?:a\s+)?(?:new\s+)?department\s+(?:named\s+|called\s+)?["']?(.+?)["']?\s*$/i);
  if (department && !/\b(and|then)\b/i.test(department[1])) return { operation: 'create_department', input: { name: department[1] } };
  const invite = message.trim().match(/^(?:add|invite)\s+(?:a\s+)?(?:team\s+)?(?:member\s+)?([^\s]+@[^\s]+)(?:\s+(?:in|into|to)\s+(?:the\s+)?team)?(?:\s+asap)?[.!]?$/i);
  if (invite) return { operation: 'invite_member', input: { email: invite[1].replace(/[.,!]$/, '') } };
  return null;
}
