export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed';
export type ProjectStatus = 'Planning' | 'In Progress' | 'Completed';
export type EmployeeStatus = 'online' | 'busy' | 'offline';
export type MeetingStatus = 'upcoming' | 'scheduled' | 'completed' | 'in-progress' | 'cancelled';

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  avatar: string | null;
  color: string;
  workspaceRole?: string;
  photoURL?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  shortName: string;
  type: 'public' | 'custom_client';
  tagline: string;
  description: string;
  isCustomClient: boolean;
  badge: string;
  color: string;
  ownerId: string;
  createdAt: string;
  clientDetails?: {
    industry: string;
    customModules: string[];
    integrations: string[];
    dedicatedAgents: string[];
  };
}

export interface WorkspaceSummary {
  name: string;
  plan: string;
}

export interface Department {
  id: string;
  name: string;
  head: string | null;
  memberCount: number;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  lead: string;
  members: string[];
}

export interface Invitation {
  id: string;
  email: string;
  name: string;
  role?: string;
  roleTitle?: string;
  workspaceRole: string;
  department: string;
  team: string | null;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  sentAt: string;
  expiresAt: string;
  invitedBy: string;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  departmentId?: string;
  teamIds?: string[];
  workspaceRole?: string;
  status: EmployeeStatus;
  color: string;
  tasks: number;
  projects: number;
  email?: string;
  skills?: string[];
  joinedAt?: string;
  invitedBy?: string | null;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  progress: number;
  status: ProjectStatus;
  deadline: string;
  team: string[]; // employee ids
  tasks: number;
  completed: number;
  milestones?: { id: string; name: string; date: string; completed: boolean }[];
}

export interface Task {
  id: string;
  name: string;
  project: string; // project id
  assignee: string; // employee id
  assignees?: string[];
  priority: PriorityLevel;
  status: TaskStatus;
  deadline: string;
  tags?: string[];
  description?: string;
  subtasks?: { id: string; name: string; done: boolean }[];
  blockedBy?: string[];
  recurrence?: string | null;
  comments?: { author: string; text: string; time: string }[];
  attachments?: string[];
}

export interface AIMeetingSummary {
  summary: string;
  decisions: string[];
  actionItems: {
    task: string;
    assignee: string;
    deadline: string;
  }[];
  followUps: string[];
}

export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | 'other';

export interface Meeting {
  id: string;
  name: string;
  title?: string;
  platform: MeetingPlatform;
  meetingUrl: string;
  date: string;
  time: string;
  duration: number; // in minutes
  durationMinutes?: number;
  participants: string[]; // employee ids
  attendees?: string[];
  hostId?: string;
  hostName?: string;
  project: string | null;
  projectId?: string | null;
  status: MeetingStatus;
  agenda?: string;
  aiSummary?: AIMeetingSummary | null;
  notes?: string;
  summary?: string;
}

export interface NotificationItem {
  id: string;
  type: 'task' | 'mention' | 'meeting' | 'deadline' | 'ai' | 'project' | 'team' | 'automation' | 'agent' | 'security' | 'system';
  text: string;
  time: string;
  read: boolean;
  icon: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  dot: string;
}


export interface AutomationRule {
  id: string;
  name: string;
  active: boolean;
  when: string;
  condition: string | null;
  then: string;
  icon: string;
  color: string;
  type?: string;
  executionCount?: number;
  lastRun?: string | null;
}

export interface ChatActionCard {
  type: 'task' | 'project' | 'meeting' | 'deal' | 'doc' | 'automation' | 'apikey' | 'theme' | 'navigation' | 'team';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  meta?: Record<string, any>;
  primaryAction?: {
    label: string;
    actionType: 'navigate' | 'toggle_status' | 'open_modal' | 'copy' | 'link';
    target?: string;
  };
  secondaryAction?: {
    label: string;
    actionType: 'navigate' | 'toggle_status' | 'open_modal' | 'copy' | 'link';
    target?: string;
  };
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'ai';
  text: string | null;
  typing?: boolean;
  time?: string;
  actionCard?: ChatActionCard;
  suggestedFollowUps?: string[];
}

// ---- Communication & Messaging Types ----
export interface MsgChannel {
  id: string;
  name: string;
  desc: string;
  unread: number;
  linkedProject?: string | null;
}

export interface DirectMessage {
  id: string;
  name: string;
  user: string;
  status: 'online' | 'busy' | 'offline';
  unread: number;
}

export interface TeamMessageThread {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface TeamMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  threads?: TeamMessageThread[];
  attachments?: string[];
  isTaskCandidate?: boolean;
  proposedTask?: {
    name: string;
    project: string;
    assignee: string;
    deadline: string;
  };
  isVoiceNote?: boolean;
}

// ---- Documents & Paperwork Engine Types ----
export interface DocumentVersion {
  v: number;
  date: string;
  author: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'contract' | 'proposal' | 'design' | 'hr' | 'technical' | 'knowledge' | 'generated';
  size: string;
  updated: string;
  author: string;
  project: string;
  tags: string[];
  version: number;
  versions: DocumentVersion[];
  aiSummary: string;
  keyClauses: string[];
  sharedWith: string[];
  esignStatus: 'signed' | 'pending' | null;
}

export interface PaperworkPipelineStep {
  name: string;
  desc: string;
  status: 'completed' | 'active' | 'pending';
}

export interface PaperworkWorkflow {
  id: string;
  title: string;
  trigger: string;
  steps: PaperworkPipelineStep[];
  lastRun: string;
  successRate: string;
  timesRun: number;
}


// ---- Integrations & Security Types ----
export interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected';
  icon: string;
  connectedAt: string | null;
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret: string;
  lastTriggered: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'revoked';
  scopes: string[];
  permissions?: string[];
  createdBy: string;
}

// ---- CRM & Agency Types ----
export interface CrmPipelineStage {
  id: string;
  name: string;
  color: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  client: string;
  value: string;
  stage: string;
  owner: string;
  probability: number;
  lastActivity: string;
  notes: string;
  contactEmail: string;
}

export interface CrmContact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  dealId?: string;
  lastContact: string;
  notes: string;
}

export interface CrmFollowUp {
  id: string;
  contactId: string;
  dealId?: string;
  dueDate: string;
  note: string;
  status: 'pending' | 'completed';
}

export interface CustomCrm {
  pipeline: CrmPipelineStage[];
  deals: CrmDeal[];
  contacts: CrmContact[];
  followUps: CrmFollowUp[];
}

export interface AgencyService {
  id: string;
  name: string;
  desc: string;
  category: string;
}

export interface AgencyCaseStudy {
  id: string;
  client: string;
  industry: string;
  solution: string;
  outcome: string;
  value: string;
}

// ---- Settings & Organization Types ----
export interface WorkspaceSettings {
  name: string;
  tagline: string;
  industry: string;
  timezone: string;
  language: string;
  dateFormat: string;
  accentColor: string;
  density: 'compact' | 'comfortable' | 'spacious';
  layoutDensity?: 'comfortable' | 'compact' | 'spacious';
  allowGuestAccess?: boolean;
}

export interface TeamSettings {
  defaultRole: string;
  allowMemberInvites: boolean;
  autoAssignNewMembers: boolean;
  departmentNotifications: boolean;
  allowGuestAccess: boolean;
  requireAdminApprovalForInvites: boolean;
  autoAssignTasks: boolean;
}

export interface NotificationSettings {
  tasksEnabled: boolean;
  projectsEnabled: boolean;
  meetingsEnabled: boolean;
  calendarEnabled: boolean;
  deadlinesEnabled: boolean;
  ordisAlertsEnabled: boolean;
  emailDigest: boolean;
  soundEnabled: boolean;
  browserSound?: boolean;
}

export interface MeetingCalendarSettings {
  defaultPlatform: MeetingPlatform;
  defaultDuration: number;
  schedulingLeadTimeMinutes: number;
  reminderLeadMinutes?: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  syncTasksToCalendar: boolean;
  autoAgenda: boolean;
  autoGenerateAgendas?: boolean;
  autoRecordAndSummarize: boolean;
}

export interface OrdisSettings {
  mode: 'proactive' | 'collaborative' | 'manual';
  assistanceMode?: 'autonomous' | 'confirmation' | 'silent' | 'proactive' | 'collaborative' | 'manual';
  tone: 'concise' | 'executive' | 'detailed' | 'friendly';
  personality?: 'direct' | 'collaborative' | 'detailed' | 'concise' | 'executive' | 'friendly';
  briefingTime: string;
  proactiveScanner: boolean;
  proactiveBottleneckDetection?: boolean;
  morningBriefing: boolean;
  morningBriefingEnabled?: boolean;
  naturalLanguageActionsEnabled?: boolean;
  allowTaskCreation: boolean;
  allowMeetingScheduling: boolean;
  allowWorkloadRebalancing: boolean;
  actionPermissions?: {
    canCreateTasks: boolean;
    canScheduleMeetings: boolean;
    canReassignTasks: boolean;
    canDraftMessages: boolean;
  };
}

export interface OrgSettings {
  name: string;
  industry: string;
  timezone: string;
  language: string;
  dateFormat: string;
  securityPolicies: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    ipWhitelisting: boolean;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
  };
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  level: number;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface OrdisAgent {
  id: string;
  name: string;
  role: string;
  trigger: string;
  triggers?: string[];
  access: string[];
  active: boolean;
  lastRun?: string | null;
  actionsToday: number;
  executionCount?: number;
  instructions: string;
  icon?: string;
  status?: string;
  description?: string;
}

export type DashboardPageType =
  | 'home'
  | 'ordis'
  | 'tasks'
  | 'projects'
  | 'team'
  | 'calendar'
  | 'meetings'
  | 'analytics'
  | 'workspace'
  | 'automations'
  | 'documents'
  | 'messages'
  | 'integrations'
  | 'settings';


