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

 let html = raw;

 // 1. Escape HTML entities
 html = html
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;');

 // 2. Multi-line code blocks
 html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
 return `<pre style="background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.15);padding:10px 12px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11.5px;color:#38bdf8;overflow-x:auto;margin:8px 0;line-height:1.45;"><code>${code.trim()}</code></pre>`;
 });

 // 3. Inline code
 html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.12);padding:2px 5px;border-radius:4px;font-size:11.5px;color:#38bdf8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">$1</code>');

 // 4. Blockquotes (> text)
 html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote style="border-left:3px solid #38bdf8;margin:6px 0;padding-left:10px;color:#d1d5db;font-style:italic;">$1</blockquote>');

 // 5. Headers (###, ##, #)
 html = html.replace(/^### (.*$)/gm, '<div style="font-size:13px;font-weight:700;color:#f3f4f6;margin-top:10px;margin-bottom:4px;">$1</div>');
 html = html.replace(/^## (.*$)/gm, '<div style="font-size:14px;font-weight:700;color:#ffffff;margin-top:12px;margin-bottom:6px;">$1</div>');
 html = html.replace(/^# (.*$)/gm, '<div style="font-size:15px;font-weight:800;color:#ffffff;margin-top:14px;margin-bottom:8px;">$1</div>');

 // 6. Checklists (- [x], - [ ])
 html = html.replace(/^- \[x\] (.*$)/gim, '<div style="display:flex;align-items:center;gap:6px;margin:3px 0;"><span style="color:#10b981;font-weight:bold;"></span> <span>$1</span></div>');
 html = html.replace(/^- \[ \] (.*$)/gim, '<div style="display:flex;align-items:center;gap:6px;margin:3px 0;"><span style="color:#9ca3af;"></span> <span>$1</span></div>');

 // 7. Bold & Italic
 html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
 html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

 // 8. Markdown Links [text](url)
 html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:underline;font-weight:500;">$1</a>');

 // 9. Tables (| col | col |)
 if (html.includes('|')) {
 const lines = html.split('\n');
 let inTable = false;
 let tableHtml = '';
 const newLines: string[] = [];

 for (let i = 0; i < lines.length; i++) {
 const line = lines[i].trim();
 if (line.startsWith('|') && line.endsWith('|')) {
 if (!inTable) {
 inTable = true;
 tableHtml = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:11.5px;border:1px solid rgba(255,255,255,0.1);">';
 }
 if (line.includes('---')) {
 continue; // divider
 }
 const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
 tableHtml += '<tr>';
 cells.forEach((cell) => {
 tableHtml += `<td style="border:1px solid rgba(255,255,255,0.08);padding:5px 8px;color:#e5e7eb;">${cell.trim()}</td>`;
 });
 tableHtml += '</tr>';
 } else {
 if (inTable) {
 tableHtml += '</table>';
 newLines.push(tableHtml);
 inTable = false;
 tableHtml = '';
 }
 newLines.push(lines[i]);
 }
 }
 if (inTable) {
 tableHtml += '</table>';
 newLines.push(tableHtml);
 }
 html = newLines.join('\n');
 }

 // 10. Newlines to <br /> (preserving block elements)
 html = html.replace(/\n/g, '<br />');
 html = html.replace(/<\/pre><br \/>/g, '</pre>');
 html = html.replace(/<\/div><br \/>/g, '</div>');
 html = html.replace(/<\/table><br \/>/g, '</table>');
 html = html.replace(/<\/blockquote><br \/>/g, '</blockquote>');

 return html;
}

