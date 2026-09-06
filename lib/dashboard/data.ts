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

// ---- Workspaces ----
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
    name: 'Acme Studio Workspace',
    shortName: 'Acme Studio',
    type: 'custom_client',
    tagline: 'Custom Studio Workspace',
    description: 'Product design and engineering workspace for Acme Studio clients and internal sprints.',
    isCustomClient: true,
    badge: 'Client Workspace',
    color: '#3b82f6',
    ownerId: 'u1',
    createdAt: '2026-06-01',
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
  role: 'Founder & Workspace Lead',
  avatar: null,
  color: '#0f4cff',
  workspaceRole: 'owner',
};

// ---- Functional Settings Defaults ----
export const INITIAL_WORKSPACE_SETTINGS: WorkspaceSettings = {
  name: 'Cursis HQ',
  tagline: 'Intelligent Workspace for Modern Teams',
  industry: 'Product Design & Engineering',
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

// ---- Roles & Permissions ----
export const INITIAL_ROLES: RolePermission[] = [
  { id: 'owner',   name: 'Owner',   description: 'Full workspace control. Can transfer ownership and manage all settings.', level: 0 },
  { id: 'admin',   name: 'Admin',   description: 'Workspace management with appropriate permissions on security and members.', level: 1 },
  { id: 'manager', name: 'Manager', description: 'Manages assigned teams, projects, and tasks within scope.', level: 2 },
  { id: 'member',  name: 'Member',  description: 'Standard workspace access to view and execute tasks.', level: 3 },
  { id: 'viewer',  name: 'Viewer',  description: 'Read-only access to authorized workspace content.', level: 4 },
];

// ---- Departments ----
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept_leadership',  name: 'Leadership',  head: 'u1', memberCount: 1 },
  { id: 'dept_engineering', name: 'Engineering', head: 'u2', memberCount: 2 },
  { id: 'dept_design',      name: 'Design',      head: 'u3', memberCount: 1 },
  { id: 'dept_growth',      name: 'Growth & Operations', head: 'u5', memberCount: 1 },
];

export const INITIAL_TEAMS: Team[] = [
  { id: 'team_core', name: 'Core Product Team', departmentId: 'dept_engineering', lead: 'u2', members: ['u1', 'u2', 'u3', 'u4'] },
  { id: 'team_growth', name: 'Growth Team', departmentId: 'dept_growth', lead: 'u5', members: ['u1', 'u5'] },
];

export const INITIAL_INVITATIONS: Invitation[] = [];

// ---- Employees / Active Members ----
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'u1',
    name: 'Alex Morgan',
    initials: 'AM',
    email: 'alex@cursis.io',
    role: 'Founder & Workspace Lead',
    department: 'Leadership',
    departmentId: 'dept_leadership',
    teamIds: ['team_core', 'team_growth'],
    workspaceRole: 'owner',
    status: 'online',
    color: '#0f4cff',
    tasks: 2,
    projects: 3,
    skills: ['Product Strategy', 'Architecture', 'Operations'],
    joinedAt: '2026-01-15',
    invitedBy: null,
  },
  {
    id: 'u2',
    name: 'Mukul Kumar',
    initials: 'MK',
    email: 'mukul@cursis.io',
    role: 'Lead Product Engineer',
    department: 'Engineering',
    departmentId: 'dept_engineering',
    teamIds: ['team_core'],
    workspaceRole: 'admin',
    status: 'online',
    color: '#0f4cff',
    tasks: 4,
    projects: 2,
    skills: ['Next.js', 'React', 'TypeScript', 'AI Engineering'],
    joinedAt: '2026-02-01',
    invitedBy: 'u1',
  },
  {
    id: 'u3',
    name: 'Sarah Taylor',
    initials: 'ST',
    email: 'sarah@cursis.io',
    role: 'Lead Product Designer',
    department: 'Design',
    departmentId: 'dept_design',
    teamIds: ['team_core'],
    workspaceRole: 'member',
    status: 'online',
    color: '#ccff00',
    tasks: 3,
    projects: 2,
    skills: ['UI/UX Design', 'Design Systems', 'Figma', 'Prototyping'],
    joinedAt: '2026-02-10',
    invitedBy: 'u1',
  },
  {
    id: 'u4',
    name: 'Rahul Sharma',
    initials: 'RS',
    email: 'rahul@cursis.io',
    role: 'Senior Fullstack Dev',
    department: 'Engineering',
    departmentId: 'dept_engineering',
    teamIds: ['team_core'],
    workspaceRole: 'member',
    status: 'busy',
    color: '#ff7700',
    tasks: 5,
    projects: 2,
    skills: ['Backend APIs', 'PostgreSQL', 'Realtime Sync', 'DevOps'],
    joinedAt: '2026-03-01',
    invitedBy: 'u1',
  },
  {
    id: 'u5',
    name: 'James Wilson',
    initials: 'JW',
    email: 'james@cursis.io',
    role: 'Operations & Growth Lead',
    department: 'Growth & Operations',
    departmentId: 'dept_growth',
    teamIds: ['team_growth'],
    workspaceRole: 'manager',
    status: 'online',
    color: '#00b341',
    tasks: 2,
    projects: 1,
    skills: ['Analytics', 'Client Success', 'Workflows', 'Scheduling'],
    joinedAt: '2026-03-15',
    invitedBy: 'u1',
  },
];

// ---- Projects ----
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign & Launch',
    icon: '⚡',
    color: '#0f4cff',
    desc: 'Complete redesign of Cursis landing page, product experience, and brand styling.',
    progress: 82,
    status: 'In Progress',
    deadline: '2026-09-15',
    team: ['u1', 'u2', 'u3'],
    tasks: 8,
    completed: 6,
    milestones: [
      { id: 'm1', name: 'Information Architecture & Wireframes', date: '2026-08-20', completed: true },
      { id: 'm2', name: 'Design System & Typography Overhaul', date: '2026-09-01', completed: true },
      { id: 'm3', name: 'Interactive Ordis Console Integration', date: '2026-09-10', completed: false },
    ],
  },
  {
    id: 'p2',
    name: 'Mobile Experience Optimization',
    icon: '📱',
    color: '#ccff00',
    desc: 'Responsive touch navigation, command palette optimizations, and fast mobile viewports.',
    progress: 60,
    status: 'In Progress',
    deadline: '2026-09-25',
    team: ['u2', 'u4'],
    tasks: 6,
    completed: 3,
    milestones: [
      { id: 'm4', name: 'Mobile Sidebar & Drawer Navigation', date: '2026-09-05', completed: true },
      { id: 'm5', name: 'Gesture & Touch Fluidity Audit', date: '2026-09-18', completed: false },
    ],
  },
  {
    id: 'p3',
    name: 'Design System Tokens v2',
    icon: '🎨',
    color: '#8800ff',
    desc: 'Consolidated CSS custom properties, button variants, and sharp neo-brutalist cards.',
    progress: 90,
    status: 'In Progress',
    deadline: '2026-09-12',
    team: ['u1', 'u3'],
    tasks: 4,
    completed: 3,
    milestones: [
      { id: 'm6', name: 'Color tokens & contrast standards', date: '2026-08-28', completed: true },
      { id: 'm7', name: 'Interactive component states', date: '2026-09-12', completed: false },
    ],
  },
];

// ---- Tasks ----
export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    name: 'Finalize brand design system and tokens',
    project: 'p3',
    assignee: 'u3',
    priority: 'high',
    status: 'in-progress',
    deadline: '2026-09-10',
    tags: ['Design', 'Tokens'],
    description: 'Verify colors, sharp borders, and responsive button sizing across all viewports.',
    subtasks: [
      { id: 'st1', name: 'Review button hover and focus states', done: true },
      { id: 'st2', name: 'Check card shadow offsets', done: true },
      { id: 'st3', name: 'Audit mobile typography line-heights', done: false },
    ],
  },
  {
    id: 't2',
    name: 'Integrate live Ordis conversational actions',
    project: 'p1',
    assignee: 'u2',
    priority: 'urgent',
    status: 'in-progress',
    deadline: '2026-09-08',
    tags: ['AI', 'Engineering'],
    description: 'Ensure natural language prompts mutate live state (task creation, meeting scheduling, team scans).',
    subtasks: [
      { id: 'st4', name: 'Wire NLP dispatch engine', done: true },
      { id: 'st5', name: 'Add task creation confirm cards', done: true },
      { id: 'st6', name: 'Connect meeting scheduler parser', done: true },
    ],
  },
  {
    id: 't3',
    name: 'Review Q3 sprint deliverables with stakeholders',
    project: 'p1',
    assignee: 'u1',
    priority: 'high',
    status: 'todo',
    deadline: '2026-09-09',
    tags: ['Leadership', 'Sprint'],
    description: 'Prepare milestone review deck and review completion velocity.',
  },
  {
    id: 't4',
    name: 'Implement mobile drawer gesture handling',
    project: 'p2',
    assignee: 'u4',
    priority: 'medium',
    status: 'in-progress',
    deadline: '2026-09-14',
    tags: ['Mobile', 'Frontend'],
    description: 'Add smooth swipe-to-close behavior on mobile viewport.',
  },
  {
    id: 't5',
    name: 'Audit database index performance',
    project: 'p1',
    assignee: 'u4',
    priority: 'low',
    status: 'completed',
    deadline: '2026-09-04',
    tags: ['Database', 'Optimization'],
    description: 'Optimized query latency down to 24ms across all workspace tables.',
  },
  {
    id: 't6',
    name: 'Prepare weekly growth and velocity report',
    project: 'p1',
    assignee: 'u5',
    priority: 'medium',
    status: 'todo',
    deadline: '2026-09-11',
    tags: ['Growth', 'Analytics'],
    description: 'Compile active member counts, task velocity, and completed milestones.',
  },
];

// ---- Meetings ----
export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm_sync1',
    name: 'Weekly Product & Sprint Sync',
    title: 'Weekly Product & Sprint Sync',
    platform: 'google_meet',
    meetingUrl: 'https://meet.google.com/crs-sync-demo',
    date: '2026-09-08',
    time: '14:00',
    duration: 30,
    participants: ['u1', 'u2', 'u3', 'u4'],
    hostId: 'u1',
    hostName: 'Alex Morgan',
    project: 'p1',
    projectId: 'p1',
    status: 'scheduled',
    agenda: '1. Review redesign progress (82% done)\n2. Demo Ordis natural language actions\n3. Address mobile viewport blockers\n4. Assign remaining milestone deliverables',
    notes: 'Auto-populated by Ordis from open sprint tasks.',
  },
  {
    id: 'm_design1',
    name: 'Design System & Token Review',
    title: 'Design System & Token Review',
    platform: 'google_meet',
    meetingUrl: 'https://meet.google.com/crs-ds-demo',
    date: '2026-09-10',
    time: '11:00',
    duration: 45,
    participants: ['u1', 'u3'],
    hostId: 'u3',
    hostName: 'Sarah Taylor',
    project: 'p3',
    projectId: 'p3',
    status: 'upcoming',
    agenda: '1. Finalize token naming schema\n2. Review contrast scores on dark mode surfaces\n3. Confirm badge and modal corner radius standards',
  },
];

// ---- Notifications ----
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif1',
    type: 'ai',
    text: 'Ordis noticed: Task "Integrate live Ordis conversational actions" is due in 48h and is marked Urgent.',
    time: '10m ago',
    read: false,
    icon: '⚡',
  },
  {
    id: 'notif2',
    type: 'meeting',
    text: 'Upcoming: Weekly Product & Sprint Sync starts tomorrow at 2:00 PM.',
    time: '1h ago',
    read: false,
    icon: '📅',
  },
  {
    id: 'notif3',
    type: 'task',
    text: 'Mukul Kumar updated progress on "Website Redesign & Launch" to 82%.',
    time: '3h ago',
    read: true,
    icon: '✓',
  },
];

// ---- Activity Feed ----
export const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: 'act1', text: 'Mukul Kumar created task "Integrate live Ordis conversational actions"', time: '15m ago', dot: '#0f4cff' },
  { id: 'act2', text: 'Sarah Taylor completed milestone "Design System & Typography Overhaul"', time: '2h ago', dot: '#00b341' },
  { id: 'act3', text: 'Ordis generated meeting agenda for "Weekly Product & Sprint Sync"', time: '4h ago', dot: '#ccff00' },
  { id: 'act4', text: 'Alex Morgan updated Workspace Settings', time: '1d ago', dot: '#ff7700' },
];

// ---- Ordis Mini-Agents ----
export const INITIAL_AGENTS: OrdisAgent[] = [
  {
    id: 'agent1',
    name: 'Bottleneck Scanner',
    role: 'Monitors workspace tasks for stalled deadlines and alerts assignees before delays happen.',
    trigger: 'hourly',
    access: ['tasks', 'projects', 'team'],
    active: true,
    lastRun: '10m ago',
    actionsToday: 3,
    instructions: 'Check for tasks due within 48h with progress < 50%. Generate 1-click mitigation actions.',
  },
  {
    id: 'agent2',
    name: 'Meeting Agenda Copilot',
    role: 'Gathers active blockers and completed milestones to generate pre-meeting agendas.',
    trigger: 'on_meeting_scheduled',
    access: ['meetings', 'tasks', 'projects'],
    active: true,
    lastRun: '1h ago',
    actionsToday: 2,
    instructions: 'Pull recent task activity and open bugs into structured meeting agendas.',
  },
  {
    id: 'agent3',
    name: 'Team Bandwidth Guardian',
    role: 'Analyzes task distribution across team members and flags burnout risks.',
    trigger: 'daily',
    access: ['team', 'tasks', 'analytics'],
    active: true,
    lastRun: 'Today 9:00 AM',
    actionsToday: 1,
    instructions: 'Alert workspace lead if any team member exceeds 5 active urgent tasks.',
  },
];

// ---- Integrations, Webhooks, API Keys ----
export const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  { id: 'int_github', name: 'GitHub', category: 'Developer', status: 'connected', icon: '🐙', connectedAt: '2026-02-15' },
  { id: 'int_slack', name: 'Slack', category: 'Communication', status: 'connected', icon: '💬', connectedAt: '2026-03-01' },
  { id: 'int_figma', name: 'Figma', category: 'Design', status: 'connected', icon: '🎨', connectedAt: '2026-02-20' },
  { id: 'int_notion', name: 'Notion', category: 'Productivity', status: 'disconnected', icon: '📝', connectedAt: null },
  { id: 'int_gdrive', name: 'Google Drive', category: 'Storage', status: 'connected', icon: '📁', connectedAt: '2026-01-20' },
  { id: 'int_jira', name: 'Jira', category: 'Developer', status: 'disconnected', icon: '📊', connectedAt: null },
  { id: 'int_hubspot', name: 'HubSpot CRM', category: 'Marketing', status: 'disconnected', icon: '🎯', connectedAt: null },
];

export const INITIAL_WEBHOOKS: WebhookItem[] = [
  { id: 'wh_1', name: 'Task Completed Dispatcher', url: 'https://api.acmestudio.io/webhooks/tasks', events: ['task.completed', 'task.created'], status: 'active', secret: 'whsec_99482710398', lastTriggered: '10m ago' },
  { id: 'wh_2', name: 'Meeting Notes Sync', url: 'https://sync.internal-corp.net/cursis', events: ['meeting.summary.generated'], status: 'active', secret: 'whsec_38291048123', lastTriggered: '2h ago' },
];

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  { id: 'key_1', name: 'Production Backend Worker', key: 'crs_live_83920194829103948291', prefix: 'crs_live_8392', created: '2026-03-01', lastUsed: '5m ago', status: 'active', scopes: ['read:tasks', 'write:tasks', 'read:projects', 'write:projects'], createdBy: 'Alex Morgan' },
  { id: 'key_2', name: 'CI/CD Deployment Pipeline', key: 'crs_live_10928374659283746501', prefix: 'crs_live_1092', created: '2026-03-10', lastUsed: '1d ago', status: 'active', scopes: ['read:documents', 'write:automations'], createdBy: 'Mukul Kumar' },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_1',
    name: 'Master Services Agreement — Acme Global.pdf',
    type: 'contract',
    size: '1.4 MB',
    updated: '2026-09-04',
    author: 'Alex Morgan',
    project: 'p1',
    tags: ['Legal', 'Contract', 'Enterprise'],
    version: 2,
    versions: [
      { v: 1, date: '2026-08-20', author: 'Alex Morgan' },
      { v: 2, date: '2026-09-04', author: 'Alex Morgan' },
    ],
    aiSummary: 'Standard enterprise services contract covering custom Ordis deployment, IP assignment, and Net 30 payment terms.',
    keyClauses: ['Section 4.2: Full IP Assignment to Client', 'Section 8.1: 99.9% Uptime SLA Guarantee', 'Section 12: Mutual NDA and Confidentiality'],
    sharedWith: ['u1', 'u2', 'u5'],
    esignStatus: 'signed',
  },
  {
    id: 'doc_2',
    name: 'AI Agent Architecture Blueprint v2.pdf',
    type: 'technical',
    size: '3.8 MB',
    updated: '2026-09-02',
    author: 'Mukul Kumar',
    project: 'p1',
    tags: ['Architecture', 'AI', 'Engineering'],
    version: 1,
    versions: [{ v: 1, date: '2026-09-02', author: 'Mukul Kumar' }],
    aiSummary: 'Technical specifications for ORDIS LLM router, memory vectors, and event triggers.',
    keyClauses: ['Subsystem: Async Event Queue', 'Subsystem: Session Context Memory'],
    sharedWith: ['u1', 'u2', 'u3', 'u4'],
    esignStatus: null,
  },
  {
    id: 'doc_3',
    name: 'Design System Guidelines & Tokens.pdf',
    type: 'design',
    size: '2.1 MB',
    updated: '2026-09-01',
    author: 'Sarah Taylor',
    project: 'p3',
    tags: ['Design', 'Tokens', 'UI'],
    version: 3,
    versions: [
      { v: 1, date: '2026-08-15', author: 'Sarah Taylor' },
      { v: 2, date: '2026-08-25', author: 'Sarah Taylor' },
      { v: 3, date: '2026-09-01', author: 'Sarah Taylor' },
    ],
    aiSummary: 'Comprehensive UI design token manual covering typography, color contrast, and dark mode layouts.',
    keyClauses: ['Design Standard: Neo-brutalist high-contrast cards', 'WCAG AAA Color Contrast Compliance'],
    sharedWith: ['u1', 'u2', 'u3'],
    esignStatus: null,
  },
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto_1',
    name: 'Auto-Assign Urgent Tasks to Lead Engineer',
    active: true,
    when: 'Task Created with Priority = "Urgent"',
    condition: 'Department == "Engineering"',
    then: 'Assign to Mukul Kumar & Ping Ordis Alert',
    icon: '⚡',
    color: '#0f4cff',
    type: 'standard',
    executionCount: 14,
    lastRun: '1h ago',
  },
  {
    id: 'auto_2',
    name: 'Post-Meeting Summary & Task Extractor',
    active: true,
    when: 'Meeting Status changes to "Completed"',
    condition: 'Notes contain Action Items',
    then: 'Generate Task Drafts & Notify Host',
    icon: '📝',
    color: '#00b341',
    type: 'standard',
    executionCount: 8,
    lastRun: 'Yesterday',
  },
  {
    id: 'auto_3',
    name: 'Client Intake Paperwork Pipeline Trigger',
    active: true,
    when: 'New Client Workspace Created',
    condition: 'Workspace Type == "custom_client"',
    then: 'Dispatch Welcome Form & Provision Shared Drive',
    icon: '🚀',
    color: '#8800ff',
    type: 'agency_custom',
    executionCount: 5,
    lastRun: '3d ago',
  },
];

export const INITIAL_WORKFLOWS: PaperworkWorkflow[] = [
  {
    id: 'wf_1',
    title: 'Enterprise Client Intake & Legal Onboarding',
    trigger: 'New Enterprise Deal Closed Won',
    steps: [
      { name: 'Form Dispatch', desc: 'Send tailored client questionnaire', status: 'completed' },
      { name: 'OCR Clause Extraction', desc: 'Scan vendor agreements & extract SLAs', status: 'completed' },
      { name: 'Contract PDF Generation', desc: 'Compile MSA & Statement of Work', status: 'active' },
      { name: 'E-Signature Request', desc: 'Route to executive signers', status: 'pending' },
      { name: 'Workspace Provisioning', desc: 'Spin up dedicated client portal', status: 'pending' },
    ],
    lastRun: '2h ago',
    successRate: '98.5%',
    timesRun: 24,
  },
];

export const INITIAL_CRM: CustomCrm = {
  pipeline: [
    { id: 'stage_lead', name: 'Lead Qualified', color: '#8800ff' },
    { id: 'stage_discovery', name: 'Discovery Call', color: '#0f4cff' },
    { id: 'stage_proposal', name: 'Proposal Sent', color: '#ff7700' },
    { id: 'stage_won', name: 'Closed Won', color: '#00b341' },
  ],
  deals: [
    { id: 'd1', title: 'Enterprise AI Workspace Rollout', client: 'Acme Global Corp', value: '$48,000', stage: 'stage_proposal', owner: 'Alex Morgan', probability: 75, lastActivity: '2h ago', notes: 'Legal approved MSA clauses. Pending budget sign-off.', contactEmail: 'david@acmeglobal.com' },
    { id: 'd2', title: 'Automated Intake & Document Engine', client: 'Apex Industries', value: '$32,000', stage: 'stage_discovery', owner: 'James Wilson', probability: 50, lastActivity: '1d ago', notes: 'Showcased OCR clause extraction demo.', contactEmail: 'clara@apexind.com' },
    { id: 'd3', title: 'Custom Ordis Mini-Agent Tier', client: 'HyperScale AI', value: '$65,000', stage: 'stage_won', owner: 'Alex Morgan', probability: 100, lastActivity: '3d ago', notes: 'Contract executed. Workspace provisioned.', contactEmail: 'rachel@hyperscale.ai' },
  ],
  contacts: [
    { id: 'c1', name: 'David Vance', company: 'Acme Global Corp', email: 'david@acmeglobal.com', phone: '+1 555 0192', role: 'VP Engineering', status: 'Active Evaluation', dealId: 'd1', lastContact: '2h ago', notes: 'Primary decision maker for Q3.' },
    { id: 'c2', name: 'Clara Oswald', company: 'Apex Industries', email: 'clara@apexind.com', phone: '+1 555 0184', role: 'Head of Operations', status: 'Proposal Review', dealId: 'd2', lastContact: '1d ago', notes: 'Requested HIPAA compliance review.' },
  ],
  followUps: [
    { id: 'f1', contactId: 'c1', dealId: 'd1', dueDate: '2026-09-09', note: 'Send updated enterprise SLA addendum', status: 'pending' },
    { id: 'f2', contactId: 'c2', dealId: 'd2', dueDate: '2026-09-12', note: 'Follow up on security audit paperwork', status: 'pending' },
  ],
};

export const INITIAL_AGENCY_SERVICES: AgencyService[] = [
  { id: 'srv_1', name: 'Custom Autonomous Workspace Build', desc: 'Bespoke multi-agent workspace deployment with dedicated pipelines and custom integrations.', category: 'Architecture' },
  { id: 'srv_2', name: 'ORDIS Intelligence Integration', desc: 'Fine-tuned LLM agents embedded into your daily project operations and triage routines.', category: 'AI Engineering' },
  { id: 'srv_3', name: 'Enterprise Paperwork Automation', desc: 'Digital intake, OCR document intelligence, and automated e-signature workflows.', category: 'Workflow' },
];

export const INITIAL_CASE_STUDIES: AgencyCaseStudy[] = [
  { id: 'cs_1', client: 'Acme Global Corp', industry: 'Enterprise SaaS', solution: 'Autonomous Project & Paperwork Hub', outcome: '70% reduction in status meetings, 4.2x faster contract turnarounds', value: '$1.4M saved' },
  { id: 'cs_2', client: 'HyperScale AI', industry: 'AI Infrastructure', solution: 'Dedicated Agent Operations Matrix', outcome: 'Zero-touch daily standup and bottleneck triage for 45 engineers', value: '18 hrs/wk saved per lead' },
];


// ---- Audit Log ----
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'al1', actor: 'Alex Morgan', action: 'workspace.initialized', target: 'Cursis HQ', details: 'Production workspace initialized with Ordis Intelligence', timestamp: new Date().toISOString() },
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
