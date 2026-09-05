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
  IntegrationItem,
  WebhookItem,
  ApiKeyItem,
  OrgSettings,
  RolePermission,
  AuditLogItem,
  OrdisAgent,
  CustomCrm,
  AgencyService,
  AgencyCaseStudy,
} from './types';

// ---- Workspaces (Multi-Workspace Architecture) ----
export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws_public',
    name: 'Cursis Public Workspace',
    shortName: 'Cursis HQ',
    type: 'public',
    tagline: 'Free Public AI Workplace',
    description: 'Full-featured, free public AI workspace for teams, projects, tasks, and collaboration with zero subscription locks.',
    isCustomClient: false,
    badge: 'Public (Free)',
    color: '#0f4cff',
    ownerId: 'u1',
    createdAt: '2026-01-15',
  },
  {
    id: 'ws_client',
    name: 'Acme Global — Custom Client Workspace',
    shortName: 'Acme Global',
    type: 'custom_client',
    tagline: 'Custom Implementation by Cursis AI Agency',
    description: 'Tailored enterprise workspace engineered with custom CRM, paperwork automation, dedicated AI agents, and internal system integrations.',
    isCustomClient: true,
    badge: 'Agency Client Implementation',
    color: '#3b82f6',
    ownerId: 'u1',
    createdAt: '2026-06-01',
    clientDetails: {
      industry: 'Supply Chain & Manufacturing',
      customModules: ['Client CRM', 'Paperwork Engine', 'Logistics AI', 'Vendor Portal'],
      integrations: ['Salesforce', 'QuickBooks', 'Slack', 'DocuSign'],
      dedicatedAgents: ['Lead Qualifier AI', 'Contract Extractor AI', 'Vendor Dispatcher AI'],
    },
  },
];

export const INITIAL_WORKSPACE: Workspace = INITIAL_WORKSPACES[0];

export const INITIAL_WORKSPACE_SUMMARY: WorkspaceSummary = {
  name: 'Cursis HQ',
  plan: 'Public Free',
};

// ---- Current User ----
export const INITIAL_USER: User = {
  id: 'u1',
  name: 'Alex Morgan',
  initials: 'AM',
  email: 'alex@cursis.io',
  role: 'Founder & CEO',
  avatar: null,
  color: '#0f4cff',
  workspaceRole: 'owner',
};

// ---- Roles & Permissions Matrix ----
export const INITIAL_ROLES: RolePermission[] = [
  { id: 'owner',   name: 'Owner',   description: 'Full workspace control. Can transfer ownership, delete workspace, and manage all settings.', level: 0 },
  { id: 'admin',   name: 'Admin',   description: 'Organization management with appropriate restrictions on the highest-risk ownership actions.', level: 1 },
  { id: 'manager', name: 'Manager', description: 'Manages assigned teams, projects, and members within their scope.', level: 2 },
  { id: 'member',  name: 'Member',  description: 'Normal workspace access based on assigned permissions.', level: 3 },
  { id: 'viewer',  name: 'Viewer',  description: 'Limited read-only access to authorized content.', level: 4 },
];

export const ROLE_PERMISSIONS_MATRIX: Record<string, Record<string, boolean>> = {
  owner:   { manage_workspace: true, manage_billing: true, delete_workspace: true, manage_roles: true, manage_members: true, invite_members: true, remove_members: true, suspend_members: true, manage_integrations: true, view_audit_logs: true, manage_security: true, create_project: true, delete_project: true, create_task: true, delete_task: true, manage_automations: true, manage_documents: true, manage_crm: true, manage_agents: true, view_analytics: true, export_data: true },
  admin:   { manage_workspace: true, manage_billing: false, delete_workspace: false, manage_roles: true, manage_members: true, invite_members: true, remove_members: true, suspend_members: true, manage_integrations: true, view_audit_logs: true, manage_security: true, create_project: true, delete_project: true, create_task: true, delete_task: true, manage_automations: true, manage_documents: true, manage_crm: true, manage_agents: true, view_analytics: true, export_data: true },
  manager: { manage_workspace: false, manage_billing: false, delete_workspace: false, manage_roles: false, manage_members: false, invite_members: true, remove_members: false, suspend_members: false, manage_integrations: false, view_audit_logs: false, manage_security: false, create_project: true, delete_project: false, create_task: true, delete_task: true, manage_automations: true, manage_documents: true, manage_crm: true, manage_agents: false, view_analytics: true, export_data: true },
  member:  { manage_workspace: false, manage_billing: false, delete_workspace: false, manage_roles: false, manage_members: false, invite_members: false, remove_members: false, suspend_members: false, manage_integrations: false, view_audit_logs: false, manage_security: false, create_project: false, delete_project: false, create_task: true, delete_task: false, manage_automations: false, manage_documents: true, manage_crm: false, manage_agents: false, view_analytics: false, export_data: false },
  viewer:  { manage_workspace: false, manage_billing: false, delete_workspace: false, manage_roles: false, manage_members: false, invite_members: false, remove_members: false, suspend_members: false, manage_integrations: false, view_audit_logs: false, manage_security: false, create_project: false, delete_project: false, create_task: false, delete_task: false, manage_automations: false, manage_documents: false, manage_crm: false, manage_agents: false, view_analytics: true, export_data: false },
};

// ---- Organization Settings ----
export const INITIAL_ORG_SETTINGS: OrgSettings = {
  name: 'Cursis HQ',
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

// ---- Departments ----
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept_leadership',  name: 'Leadership',  head: 'u1', memberCount: 1 },
  { id: 'dept_engineering', name: 'Engineering', head: null, memberCount: 0 },
  { id: 'dept_design',      name: 'Design',      head: null, memberCount: 0 },
  { id: 'dept_marketing',   name: 'Marketing',   head: null, memberCount: 0 },
  { id: 'dept_product',     name: 'Product',     head: null, memberCount: 0 },
  { id: 'dept_operations',  name: 'Operations',  head: null, memberCount: 0 },
  { id: 'dept_analytics',   name: 'Analytics',   head: null, memberCount: 0 },
  { id: 'dept_sales',       name: 'Sales',       head: null, memberCount: 0 },
];

// ---- Teams ----
export const INITIAL_TEAMS: Team[] = [];

// ---- Invitations ----
export const INITIAL_INVITATIONS: Invitation[] = [];

// ---- Employees / Active Members ----
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'u1',
    name: 'Alex Morgan',
    initials: 'AM',
    email: 'alex@cursis.io',
    role: 'Founder & CEO',
    department: 'Leadership',
    departmentId: 'dept_leadership',
    teamIds: [],
    workspaceRole: 'owner',
    status: 'online',
    color: '#0f4cff',
    tasks: 0,
    projects: 0,
    skills: ['Strategy', 'Product', 'Operations'],
    joinedAt: '2026-01-15',
    invitedBy: null,
  },
];

// ---- Projects ----
export const INITIAL_PROJECTS: Project[] = [];

// ---- Tasks ----
export const INITIAL_TASKS: Task[] = [];

// ---- Meetings ----
export const INITIAL_MEETINGS: Meeting[] = [];

// ---- Documents & Files Repository ----
export const INITIAL_DOCUMENTS: DocumentItem[] = [];

// ---- Paperwork Automation Pipelines ----
export const INITIAL_WORKFLOWS: PaperworkWorkflow[] = [];


// ---- CRM Data ----
export const INITIAL_CRM: CustomCrm = {
  pipeline: [
    { id: 'stage_qual',  name: 'Qualification', color: '#64748b' },
    { id: 'stage_prop',  name: 'Proposal',      color: '#3b82f6' },
    { id: 'stage_neg',   name: 'Negotiation',   color: '#f59e0b' },
    { id: 'stage_won',   name: 'Won',           color: '#22c55e' },
    { id: 'stage_lost',  name: 'Lost',          color: '#ef4444' },
  ],
  deals: [],
  contacts: [],
  followUps: [],
};

// ---- Cursis Agency Services ----
export const INITIAL_AGENCY_SERVICES: AgencyService[] = [
  { id: 's1', name: 'Custom AI Workflows & Automation', desc: 'Eliminate manual paperwork with multi-step triggers, document parsing, and approval chains.', category: 'AI Automation' },
  { id: 's2', name: 'Dedicated Company AI Agents', desc: 'Bespoke operational agents trained on your business documents, policies, and systems.', category: 'AI Agents' },
  { id: 's3', name: 'Custom Business Dashboards', desc: 'Tailored KPIs, executive scorecards, live operational tracking, and custom data tables.', category: 'Custom Dashboards' },
  { id: 's4', name: 'Custom CRM & Pipeline Systems', desc: 'Built around your exact sales process with automated follow-ups and client intelligence.', category: 'Integrations' },
  { id: 's5', name: 'Enterprise Software & API Integrations', desc: 'Deep bidirectional integrations with ERP, accounting, communication, and storage systems.', category: 'Custom Software' },
  { id: 's6', name: 'Internal Tools & Client Portals', desc: 'Secure custom web applications and branded client intake environments.', category: 'Internal Tools' },
];

export const INITIAL_CASE_STUDIES: AgencyCaseStudy[] = [
  { id: 'cs1', client: 'Acme Global Corp', industry: 'Supply Chain', solution: 'Custom CRM + AI Lead Qualifier + Paperwork Engine', outcome: '85% reduction in manual data entry, 3x faster client onboarding', value: '$120k/yr' },
  { id: 'cs2', client: 'Horizon Logistics', industry: 'Freight & Logistics', solution: 'Automated Invoice Processing + Vendor Portal', outcome: '320 invoices auto-processed per month with 98.8% accuracy', value: '$65k/yr' },
  { id: 'cs3', client: 'TechStart Inc', industry: 'SaaS', solution: 'Custom AI Customer Support Agent', outcome: '60% reduction in support ticket response time', value: '$45k/yr' },
];

// ---- Integrations ----
export const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  { id: 'int1', name: 'Google Calendar', category: 'Calendar', status: 'disconnected', icon: 'GC', connectedAt: null },
  { id: 'int2', name: 'Slack', category: 'Communication', status: 'disconnected', icon: 'SL', connectedAt: null },
  { id: 'int3', name: 'Google Drive', category: 'Cloud Storage', status: 'disconnected', icon: 'GD', connectedAt: null },
  { id: 'int4', name: 'Outlook Calendar', category: 'Calendar', status: 'disconnected', icon: 'OC', connectedAt: null },
  { id: 'int5', name: 'Salesforce', category: 'CRM', status: 'disconnected', icon: 'SF', connectedAt: null },
  { id: 'int6', name: 'GitHub', category: 'Development', status: 'disconnected', icon: 'GH', connectedAt: null },
  { id: 'int7', name: 'Jira', category: 'Project Management', status: 'disconnected', icon: 'JR', connectedAt: null },
  { id: 'int8', name: 'Notion', category: 'Knowledge Base', status: 'disconnected', icon: 'NT', connectedAt: null },
];

// ---- Webhooks ----
export const INITIAL_WEBHOOKS: WebhookItem[] = [];

// ---- API Keys ----
export const INITIAL_API_KEYS: ApiKeyItem[] = [];

// ---- Ordis Mini-Agents ----
export const INITIAL_AGENTS: OrdisAgent[] = [
  { id: 'agent1', name: 'Follow-up Agent', role: 'Tracks and reminds about follow-ups across CRM, tasks, and meetings.', trigger: 'daily', access: ['crm', 'tasks', 'meetings'], active: true, lastRun: null, actionsToday: 0, instructions: 'Check all pending follow-ups. Send reminders 24h before due date. Escalate overdue follow-ups to the deal owner.' },
  { id: 'agent2', name: 'Meeting Agent', role: 'Processes completed meetings, generates summaries, and extracts action items into tasks.', trigger: 'on_meeting_end', access: ['meetings', 'tasks', 'projects'], active: true, lastRun: null, actionsToday: 0, instructions: 'After every meeting, generate an AI summary. Extract action items with assignees and deadlines. Create tasks and notify relevant members.' },
  { id: 'agent3', name: 'Reporting Agent', role: 'Creates recurring weekly reports on team productivity, project progress, and deadlines.', trigger: 'weekly', access: ['tasks', 'projects', 'analytics', 'team'], active: true, lastRun: null, actionsToday: 0, instructions: 'Every Monday at 9 AM, generate a weekly summary report. Include: completed tasks, project progress, upcoming deadlines, team workload distribution.' },
  { id: 'agent4', name: 'Onboarding Agent', role: 'Automates the new member onboarding workflow when someone joins the workspace.', trigger: 'on_member_join', access: ['tasks', 'documents', 'meetings', 'team'], active: true, lastRun: null, actionsToday: 0, instructions: 'When a new member joins: create onboarding checklist, assign required documents, and schedule orientation meeting with their manager.' },
];

// ---- Notifications ----
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

// ---- Activity Feed ----
export const INITIAL_ACTIVITY: ActivityItem[] = [];


// ---- Automations ----
export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  { id: 'auto1', name: 'Deadline Reminder', active: true, when: 'Task deadline is tomorrow', condition: 'Task is not completed', then: 'Notify assigned employee', icon: '⏱', color: '#f59e0b', type: 'standard', executionCount: 0, lastRun: null },
  { id: 'auto2', name: 'New Employee Onboarding', active: true, when: 'New employee is added', condition: null, then: 'Create onboarding task list', icon: '👤', color: '#3b82f6', type: 'standard', executionCount: 0, lastRun: null },
  { id: 'auto3', name: 'Task Completion Alert', active: true, when: 'Task is completed', condition: null, then: 'Notify project manager', icon: '✓', color: '#22c55e', type: 'standard', executionCount: 0, lastRun: null },
  { id: 'auto4', name: 'Overdue Task Escalation', active: false, when: 'Task becomes overdue', condition: 'Priority is High or Urgent', then: 'Notify team lead and escalate', icon: '⚠️', color: '#ef4444', type: 'standard', executionCount: 0, lastRun: null },
  { id: 'auto5', name: 'Meeting Notes Distribution', active: true, when: 'Meeting ends', condition: 'ORDIS notes are generated', then: 'Send notes to all participants', icon: '📝', color: '#8b5cf6', type: 'standard', executionCount: 0, lastRun: null },
];

// ---- Audit Log ----
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'al1', actor: 'Alex Morgan', action: 'workspace.initialized', target: 'Cursis HQ', details: 'Production workspace initialized', timestamp: new Date().toISOString() },
];

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
