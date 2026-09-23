import {
 User,
 Workspace,
 WorkspaceSummary,
 Department,
 Team,
 Invitation,
 Employee,
 Project,
 Task,
 Meeting,
 NotificationItem,
 ActivityItem,
 AutomationRule,
 DocumentItem,
 PaperworkWorkflow,
 OrgSettings,
 RolePermission,
 AuditLogItem,
 OrdisAgent,
 CustomCrm,
 AgencyService,
 AgencyCaseStudy,
 IntegrationItem,
 WebhookItem,
 ApiKeyItem,
 WorkspaceSettings,
 TeamSettings,
 NotificationSettings,
 MeetingCalendarSettings,
 OrdisSettings,
} from './types';

// Helper for personalized user workspace naming
export function getUserWorkspaceName(userName?: string): string {
  if (!userName || !userName.trim() || userName === 'Workspace Member') {
    return 'My Workspace';
  }
  const name = userName.trim();
  const suffix = name.endsWith('s') || name.endsWith('S') ? "'" : "'s";
  return `${name}${suffix} Workspace`;
}

export function getUserWorkspaceShortName(userName?: string): string {
  if (!userName || !userName.trim() || userName === 'Workspace Member') {
    return 'My Workspace';
  }
  const firstName = userName.trim().split(' ')[0];
  const suffix = firstName.endsWith('s') || firstName.endsWith('S') ? "'" : "'s";
  return `${firstName}${suffix} Workspace`;
}

// ---- Workspaces (Clean Production Default) ----
export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws_default',
    name: 'My Workspace',
    shortName: 'My Workspace',
    type: 'public',
    tagline: 'Intelligent Workspace for Modern Teams',
    description: 'Autonomous AI workspace for projects, sprint execution, and team collaboration.',
    isCustomClient: false,
    badge: 'Production',
    color: '#0f4cff',
    ownerId: 'u_owner',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export const INITIAL_WORKSPACE: Workspace = INITIAL_WORKSPACES[0];

export const INITIAL_WORKSPACE_SUMMARY: WorkspaceSummary = {
  name: 'My Workspace',
  plan: 'Production',
};

// ---- Current User (Placeholder for Unauthenticated / SSR Fallback) ----
export const INITIAL_USER: User = {
 id: 'u_member',
 name: 'Workspace Member',
 initials: 'WM',
 email: 'user@cursis.io',
 role: 'User',
 avatar: null,
 color: '#0f4cff',
 workspaceRole: 'member',
};

// ---- Functional Settings Defaults ----
export const INITIAL_WORKSPACE_SETTINGS: WorkspaceSettings = {
 name: 'My Workspace',
 tagline: 'Intelligent Workspace for Modern Teams',
 industry: 'Product & Engineering',
 timezone: 'UTC+5:30 (IST)',
 language: 'English',
 dateFormat: 'DD MMM YYYY',
 accentColor: '#0f4cff',
 density: 'comfortable',
 layoutDensity: 'comfortable',
 allowGuestAccess: true,
};

export const INITIAL_TEAM_SETTINGS: TeamSettings = {
 defaultRole: 'member',
 allowMemberInvites: true,
 autoAssignNewMembers: false,
 departmentNotifications: true,
 allowGuestAccess: true,
 requireAdminApprovalForInvites: false,
 autoAssignTasks: true,
};

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSettings = {
 tasksEnabled: true,
 projectsEnabled: true,
 meetingsEnabled: true,
 calendarEnabled: true,
 deadlinesEnabled: true,
 ordisAlertsEnabled: true,
 emailDigest: true,
 soundEnabled: true,
 browserSound: true,
};

export const INITIAL_MEETING_CALENDAR_SETTINGS: MeetingCalendarSettings = {
 defaultPlatform: 'google_meet',
 defaultDuration: 30,
 schedulingLeadTimeMinutes: 15,
 reminderLeadMinutes: 15,
 workingHoursStart: '09:00',
 workingHoursEnd: '18:00',
 syncTasksToCalendar: true,
 autoAgenda: true,
 autoGenerateAgendas: true,
 autoRecordAndSummarize: true,
};

export const INITIAL_ORDIS_SETTINGS: OrdisSettings = {
 mode: 'proactive',
 assistanceMode: 'autonomous',
 tone: 'concise',
 personality: 'direct',
 briefingTime: '09:00',
 proactiveScanner: true,
 proactiveBottleneckDetection: true,
 morningBriefing: true,
 morningBriefingEnabled: true,
 naturalLanguageActionsEnabled: true,
 allowTaskCreation: true,
 allowMeetingScheduling: true,
 allowWorkloadRebalancing: true,
 actionPermissions: {
 canCreateTasks: true,
 canScheduleMeetings: true,
 canReassignTasks: true,
 canDraftMessages: true,
 },
};

export const INITIAL_ORG_SETTINGS: OrgSettings = {
  name: 'My Workspace',
 industry: 'Technology / AI Solutions',
 timezone: 'UTC+5:30 (IST)',
 language: 'English',
 dateFormat: 'DD MMM YYYY',
 securityPolicies: {
 twoFactorRequired: true,
 sessionTimeout: 480,
 passwordMinLength: 12,
 ipWhitelisting: false,
 },
 branding: {
 primaryColor: '#0f4cff',
 accentColor: '#ccff00',
 logoUrl: '/assets/logo.svg',
 },
};

// ---- Roles & Permissions ----
export const INITIAL_ROLES: RolePermission[] = [
 { id: 'owner', name: 'Owner', description: 'Full workspace control. Can transfer ownership and manage all settings.', level: 0 },
 { id: 'admin', name: 'Admin', description: 'Workspace management with appropriate permissions on security and members.', level: 1 },
 { id: 'manager', name: 'Manager', description: 'Manages assigned teams, projects, and tasks within scope.', level: 2 },
 { id: 'member', name: 'Member', description: 'Standard workspace access to view and execute tasks.', level: 3 },
 { id: 'viewer', name: 'Viewer', description: 'Read-only access to authorized workspace content.', level: 4 },
];

// ---- Departments ----
export const INITIAL_DEPARTMENTS: Department[] = [
 { id: 'dept_leadership', name: 'Leadership', head: 'u_owner', memberCount: 1 },
 { id: 'dept_engineering', name: 'Engineering', head: 'u_owner', memberCount: 0 },
 { id: 'dept_design', name: 'Design', head: 'u_owner', memberCount: 0 },
 { id: 'dept_growth', name: 'Growth & Operations', head: 'u_owner', memberCount: 0 },
];

export const INITIAL_TEAMS: Team[] = [
 { id: 'team_core', name: 'Core Team', departmentId: 'dept_engineering', lead: 'u_owner', members: ['u_owner'] },
 { id: 'team_growth', name: 'Growth Team', departmentId: 'dept_growth', lead: 'u_owner', members: ['u_owner'] },
];

export const INITIAL_INVITATIONS: Invitation[] = [];

// ---- Clean Production Data (Zero Mock Records) ----
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_MEETINGS: Meeting[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_ACTIVITY: ActivityItem[] = [];

// ---- Ordis Autonomous Agents Blueprint ----
export const INITIAL_AGENTS: OrdisAgent[] = [
 {
 id: 'agent1',
 name: 'Bottleneck Scanner',
 role: 'Monitors workspace tasks for stalled deadlines and alerts assignees before delays happen.',
 trigger: 'hourly',
 access: ['tasks', 'projects', 'team'],
 active: true,
 lastRun: 'Never',
 actionsToday: 0,
 instructions: 'Check for tasks due within 48h with progress < 50%. Generate 1-click mitigation actions.',
 },
 {
 id: 'agent2',
 name: 'Meeting Agenda Copilot',
 role: 'Gathers active blockers and completed milestones to generate pre-meeting agendas.',
 trigger: 'on_meeting_scheduled',
 access: ['meetings', 'tasks', 'projects'],
 active: true,
 lastRun: 'Never',
 actionsToday: 0,
 instructions: 'Pull recent task activity and open deliverables into structured meeting agendas.',
 },
 {
 id: 'agent3',
 name: 'Team Bandwidth Guardian',
 role: 'Analyzes task distribution across team members and flags overload risks.',
 trigger: 'daily',
 access: ['team', 'tasks', 'analytics'],
 active: true,
 lastRun: 'Never',
 actionsToday: 0,
 instructions: 'Alert workspace lead if any team member exceeds 5 active urgent tasks.',
 },
];

// ---- Integrations Catalog ----
export const INITIAL_INTEGRATIONS: IntegrationItem[] = [
 { id: 'int_github', name: 'GitHub', category: 'Developer', status: 'disconnected', icon: '', connectedAt: null },
 { id: 'int_slack', name: 'Slack', category: 'Communication', status: 'disconnected', icon: '', connectedAt: null },
 { id: 'int_figma', name: 'Figma', category: 'Design', status: 'disconnected', icon: '', connectedAt: null },
 { id: 'int_notion', name: 'Notion', category: 'Productivity', status: 'disconnected', icon: '', connectedAt: null },
 { id: 'int_gdrive', name: 'Google Drive', category: 'Storage', status: 'disconnected', icon: '', connectedAt: null },
 { id: 'int_jira', name: 'Jira', category: 'Developer', status: 'disconnected', icon: '', connectedAt: null },
 { id: 'int_hubspot', name: 'HubSpot CRM', category: 'Marketing', status: 'disconnected', icon: '', connectedAt: null },
];

export const INITIAL_WEBHOOKS: WebhookItem[] = [];
export const INITIAL_API_KEYS: ApiKeyItem[] = [];
export const INITIAL_DOCUMENTS: DocumentItem[] = [];
export const INITIAL_AUTOMATIONS: AutomationRule[] = [];
export const INITIAL_WORKFLOWS: PaperworkWorkflow[] = [];

export const INITIAL_CRM: CustomCrm = {
 pipeline: [
 { id: 'stage_lead', name: 'Lead Qualified', color: '#8800ff' },
 { id: 'stage_discovery', name: 'Discovery Call', color: '#0f4cff' },
 { id: 'stage_proposal', name: 'Proposal Sent', color: '#ff7700' },
 { id: 'stage_won', name: 'Closed Won', color: '#00b341' },
 ],
 deals: [],
 contacts: [],
 followUps: [],
};

export const INITIAL_AGENCY_SERVICES: AgencyService[] = [
 { id: 'srv_1', name: 'Custom Autonomous Workspace Build', desc: 'Bespoke multi-agent workspace deployment with dedicated pipelines and custom integrations.', category: 'Architecture' },
 { id: 'srv_2', name: 'ORDIS Intelligence Integration', desc: 'Fine-tuned LLM agents embedded into your daily project operations and triage routines.', category: 'AI Engineering' },
 { id: 'srv_3', name: 'Enterprise Paperwork Automation', desc: 'Digital intake, OCR document intelligence, and automated e-signature workflows.', category: 'Workflow' },
];

export const INITIAL_CASE_STUDIES: AgencyCaseStudy[] = [];

// ---- Audit Log ----
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

// ---- Utilities ----
export function formatDate(dateStr?: string | null): string {
 if (!dateStr) return '';
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return dateStr;
 const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function isOverdue(dateStr?: string | null): boolean {
 if (!dateStr) return false;
 const target = new Date(dateStr);
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 return target < today;
}

export function getGreeting(): string {
 const h = new Date().getHours();
 if (h < 12) return 'Good morning';
 if (h < 17) return 'Good afternoon';
 return 'Good evening';
}

export function formatCurrency(amount: number | string): string {
 if (typeof amount === 'string' && amount.startsWith('$')) return amount;
 const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
 return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

export function formatChatMarkdown(raw?: string | null): string {
 if (!raw) return '';
 // Escape text at each rendering boundary, including quotes in link attributes.
 // Inherit the chat's text color so both the light page and dark floating chat remain readable.
 const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
 const inline = (text: string, depth = 0): string => {
  if (depth > 2) return escape(text);
  const tokens = /`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^\s)<>"']+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let html = '';
  let cursor = 0;
  for (const match of text.matchAll(tokens)) {
   const index = match.index ?? 0;
   html += escape(text.slice(cursor, index));
   if (match[1] !== undefined) {
    html += `<code style="background:rgba(127,127,127,0.12);padding:2px 5px;border-radius:4px;font-size:0.92em;color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escape(match[1])}</code>`;
   } else if (match[2] !== undefined) {
    html += `<a href="${escape(match[3])}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:3px;font-weight:500;">${escape(match[2])}</a>`;
   } else {
    const tag = match[4] !== undefined ? 'strong' : 'em';
    html += `<${tag}>${inline(match[4] ?? match[5], depth + 1)}</${tag}>`;
   }
   cursor = index + match[0].length;
  }
  return html + escape(text.slice(cursor));
 };
 const lines = raw.replace(/\r\n?/g, '\n').split('\n');
 const blocks: string[] = [];
 const paragraph: string[] = [];
 const flushParagraph = () => {
  if (paragraph.length) blocks.push(`<p style="margin:0 0 12px;">${paragraph.map(line => inline(line)).join('<br />')}</p>`);
  paragraph.length = 0;
 };
 const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
 const isDivider = (line: string) => line.includes('|') && cells(line).every(cell => /^:?-{3,}:?$/.test(cell));
 const listItem = (line: string) => line.match(/^\s*(?:(\d+)\.\s+|[-*+]\s+)(.*)$/);

 for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { flushParagraph(); continue; }

  if (/^\s*```[\w-]*\s*$/.test(line)) {
   flushParagraph();
   const code: string[] = [];
   while (++i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i]);
   blocks.push(`<pre style="background:rgba(127,127,127,0.10);border:1px solid rgba(127,127,127,0.3);padding:12px 14px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:0.92em;color:inherit;overflow-x:auto;white-space:pre;margin:8px 0 12px;line-height:1.5;"><code>${escape(code.join('\n'))}</code></pre>`);
   continue;
  }

  if (line.includes('|') && i + 1 < lines.length && isDivider(lines[i + 1])) {
   flushParagraph();
   const header = cells(line);
   const cellStyle = 'border:1px solid rgba(127,127,127,0.3);padding:8px 10px;color:inherit;text-align:left;vertical-align:top;';
   let table = `<div style="max-width:100%;overflow-x:auto;margin:8px 0 12px;"><table style="width:100%;border-collapse:collapse;font-size:inherit;color:inherit;"><thead><tr>${header.map(cell => `<th scope="col" style="${cellStyle}background:rgba(127,127,127,0.08);font-weight:600;">${inline(cell)}</th>`).join('')}</tr></thead><tbody>`;
   i++;
   while (i + 1 < lines.length && lines[i + 1].trim() && lines[i + 1].includes('|')) {
    const row = cells(lines[++i]);
    table += `<tr>${header.map((_, index) => `<td style="${cellStyle}">${inline(row[index] || '')}</td>`).join('')}</tr>`;
   }
   blocks.push(`${table}</tbody></table></div>`);
   continue;
  }

  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
   flushParagraph();
   const tag = `h${heading[1].length + 2}`;
   blocks.push(`<${tag} style="font-size:1.05em;font-weight:650;color:inherit;margin:14px 0 6px;line-height:1.5;">${inline(heading[2])}</${tag}>`);
   continue;
  }
  if (/^>\s?/.test(line)) {
   flushParagraph();
   const quote = [line.replace(/^>\s?/, '')];
   while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1])) quote.push(lines[++i].replace(/^>\s?/, ''));
   blocks.push(`<blockquote style="border-left:3px solid currentColor;margin:8px 0 12px;padding-left:12px;color:inherit;">${quote.map(value => inline(value)).join('<br />')}</blockquote>`);
   continue;
  }
  const item = listItem(line);
  if (item) {
   flushParagraph();
   const ordered = item[1] !== undefined;
   const tag = ordered ? 'ol' : 'ul';
   const items: string[] = [];
   let current: RegExpMatchArray | null = item;
   while (current && (current[1] !== undefined) === ordered) {
    const check = current[2].match(/^\[([ xX])\]\s+(.*)$/);
    const content = check ? `<span role="img" aria-label="${check[1] === ' ' ? 'Not completed' : 'Completed'}">${check[1] === ' ' ? '&#9744;' : '&#9745;'}</span> ${inline(check[2])}` : inline(current[2]);
    items.push(`<li style="margin:4px 0;${check ? 'list-style:none;' : ''}">${content}</li>`);
    current = i + 1 < lines.length ? listItem(lines[i + 1]) : null;
    if (!current || (current[1] !== undefined) !== ordered) break;
    i++;
   }
   blocks.push(`<${tag}${ordered ? ` start="${Number(item[1]) || 1}"` : ''} style="margin:6px 0 12px;padding-left:22px;list-style-type:${ordered ? 'decimal' : 'disc'};">${items.join('')}</${tag}>`);
   continue;
  }
  paragraph.push(line);
 }
 flushParagraph();
 return blocks.join('');
}
