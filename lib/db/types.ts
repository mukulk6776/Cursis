// Master Type Definitions for Cursis OS and Ordis AI Engine
// Covering all 17 Core Modules and Free vs Paid Capabilities

export type WorkspaceTier = 'free' | 'paid';
export type OrdisMode = 'chill' | 'full_power'; // Chill Mode = Free (Cards/Approval), Full Power = Paid (Autonomous)
export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'guest' | 'client';

// ==========================================
// 1. WORKSPACE CORE MODULE
// ==========================================
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  tier: WorkspaceTier;
  ordisMode: OrdisMode;
  industry: string;
  teamSize: string;
  features: string[]; // Active module IDs
  settings: {
    ambientMonitoring: boolean;
    approvalRequiredForActions: boolean;
    simulationMode: boolean; // Shadow mode before full autonomy
    riskTolerance: 'low' | 'medium' | 'high';
    companyTone?: string;
    pricingFormula?: string;
    customDomain?: string;
    theme?: string;
  };
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. USERS & TEAM MODULE
// ==========================================
export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  passwordHash?: string;
  salt?: string;
  department?: string;
  title?: string;
  skills: string[]; // e.g. ["Next.js", "UI/UX", "Copywriting", "Sales", "Accounting"]
  workspaceIds: string[];
  activeWorkspaceId?: string;
  planTier?: 'standard';
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  onboardingChecklist: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  presence: 'online' | 'busy' | 'away' | 'offline';
  providerData?: any[];
  lastActiveAt: string;
  createdAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  name?: string;
  roleTitle?: string;
  workspaceRole: UserRole | string;
  department: string;
  team?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  token: string;
  note?: string;
  sentAt: string;
  expiresAt: string;
  invitedBy: string;
  planTier?: 'standard';
}


// ==========================================
// 4. TASK MANAGEMENT MODULE
// ==========================================
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';

export interface Task {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  creatorId: string;
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  completionPercent: number; // 0 to 100
  requiredSkills?: string[];
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  tags: string[];
  isAtRisk?: boolean;
  riskReason?: string;
  suggestedHelperId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. PROJECT MANAGEMENT MODULE
// ==========================================
export type ProjectHealth = 'on_track' | 'at_risk' | 'delayed' | 'completed';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  clientName?: string;
  clientId?: string;
  leadId?: string;
  budget: number; // e.g. 500000 (₹5L)
  spent: number;
  currency: string;
  startDate: string;
  deadline: string;
  health: ProjectHealth;
  healthReason?: string;
  progressPercent: number;
  ownerId: string;
  teamMemberIds: string[];
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }[];
  linkedDocIds: string[];
  linkedMeetingIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. CALENDAR & SCHEDULING MODULE
// ==========================================
export interface CalendarEvent {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  attendeeIds: string[];
  attendeeEmails?: string[];
  location?: string;
  meetLink?: string;
  type: 'meeting' | 'task_deadline' | 'milestone' | 'call' | 'reminder';
  linkedTaskId?: string;
  linkedProjectId?: string;
  createdAt: string;
}

export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | 'other';
export type MeetingStatus = 'upcoming' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  name?: string;
  platform: MeetingPlatform;
  meetingUrl: string;
  scheduledAt: string;
  date?: string;
  time?: string;
  durationMinutes: number;
  duration?: number;
  hostId: string;
  hostName?: string;
  attendees: string[];
  participants?: string[];
  status?: MeetingStatus;
  agenda?: string;
  transcript?: string;
  notes?: string;
  summary?: string;
  actionItems: {
    id: string;
    text: string;
    assigneeName?: string;
    assigneeId?: string;
    dueDate?: string;
    createdTaskId?: string;
  }[];
  followUpEmailDraft?: {
    to: string[];
    subject: string;
    body: string;
    status: 'draft' | 'sent';
  };
  processedByOrdis: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 8. DOCUMENTS & KNOWLEDGE MODULE
// ==========================================
export interface DocumentItem {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  content: string; // Markdown or rich text
  category: 'proposal' | 'kickoff' | 'sow' | 'spec' | 'knowledge' | 'report' | 'general' | string;
  tags: string[];
  authorId: string;
  authorName: string;
  version: number;
  isCompanyBrainResource?: boolean; // Ingested for Ordis memory
  summary?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 8B. DEPARTMENT MANAGEMENT MODULE
// ==========================================
export interface Department {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  lead?: string | null;
  head?: string | null;
  membersCount?: number;
  memberCount?: number;
  budget?: string | number;
  color?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 9. AUTOMATION MODULE (No-Code If-This-Then-That)
// ==========================================
export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    type: 'lead_created' | 'task_overdue' | 'task_status_changed' | 'meeting_ended' | 'payment_received' | 'webhook';
    config?: Record<string, any>;
  };
  conditions?: {
    field: string;
    operator: 'equals' | 'greater_than' | 'contains' | 'is_at_risk';
    value: any;
  }[];
  actions: {
    type: 'assign_task' | 'send_email' | 'notify_channel' | 'create_crm_deal' | 'trigger_ordis_agent' | 'call_webhook';
    config: Record<string, any>;
  }[];
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
}

// ==========================================
// 10. BUILT-IN CRM MODULE
// ==========================================
export type LeadStatus = 'new' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  workspaceId: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  budget?: number;
  currency?: string;
  status: LeadStatus;
  source: 'website_form' | 'cold_outreach' | 'referral' | 'inbound_email' | 'manual';
  notes?: string;
  assignedToId?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  renewalDate?: string;
  usageScore?: number; // 0 to 100 for renewal tracking
  drafts?: {
    id: string;
    type: 'email' | 'proposal' | 'call_slots';
    content: string;
    status: 'pending_approval' | 'approved' | 'sent';
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  workspaceId: string;
  leadId?: string;
  title: string;
  company: string;
  value: number;
  currency: string;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost';
  probability: number; // 0 to 100
  expectedCloseDate: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 11. DASHBOARDS & REPORTING MODULE
// ==========================================
export interface MetricSummary {
  activeProjects: number;
  overdueTasks: number;
  tasksAtRisk: number;
  totalPipelineValue: number;
  wonDealsValue: number;
  teamWorkloadAverage: number; // percentage
  ordisActionsSavedHours: number;
  pendingApprovalsCount: number;
}

export interface ExecutiveReport {
  id: string;
  workspaceId: string;
  title: string;
  generatedAt: string;
  summary: string;
  risksIdentified: {
    projectId?: string;
    projectName?: string;
    risk: string;
    impact: 'low' | 'medium' | 'high';
    proposedAction: string;
  }[];
  workloadRebalancing: {
    overloadedUserId: string;
    overloadedUserName: string;
    suggestedHelperId: string;
    suggestedHelperName: string;
    tasksToReassign: string[];
  }[];
  financialHealth: {
    monthlyPipeline: number;
    atRiskRevenue: number;
  };
}

// ==========================================
// 12. GLOBAL SEARCH MODULE
// ==========================================
export interface SearchResultItem {
  id: string;
  type: 'task' | 'project' | 'message' | 'document' | 'lead' | 'meeting' | 'tool';
  title: string;
  snippet: string;
  url: string;
  metadata?: Record<string, any>;
  updatedAt: string;
}

// ==========================================
// 13. SECURITY & AUDIT MODULE
// ==========================================
export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorType: 'user' | 'ordis_autonomous' | 'ordis_assisted' | 'automation_rule';
  actorId: string;
  actorName: string;
  action: string; // e.g. "task.created", "invoice.sent", "project.rebalanced"
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  isRollbackable: boolean;
  rollbackState?: Record<string, any>;
  rolledBack?: boolean;
  createdAt: string;
}

// ==========================================
// 14. ORDIS AI LAYER (ALL 9 CAPABILITIES & CHILL VS FULL POWER)
// ==========================================

// Proactive Notice Card ("Ordis noticed...")
export interface OrdisNoticeCard {
  id: string;
  workspaceId: string;
  type: 'risk_detected' | 'draft_prepared' | 'meeting_finished' | 'workload_imbalance' | 'renewal_opportunity';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  contextData: Record<string, any>;
  suggestedAction: {
    label: string;
    actionType: string;
    payload: Record<string, any>;
  };
  status: 'pending' | 'approved' | 'dismissed' | 'executed';
  createdAt: string;
}

// Approval Queue (For Chill Mode and High-Risk Full Power Actions)
export interface ApprovalQueueItem {
  id: string;
  workspaceId: string;
  capability:
    | 'notices_problems'
    | 'drafts_work'
    | 'turns_meetings_to_work'
    | 'runs_entire_process'
    | 'builds_new_tools'
    | 'works_toward_goal'
    | 'audits_business'
    | 'takes_outside_action';
  actionName: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  payload: Record<string, any>;
  autoExecutableIfPaid: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  executedResult?: Record<string, any>;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Risk Radar (Monitored Items)
export interface RiskRadarItem {
  id: string;
  workspaceId: string;
  targetType: 'project' | 'task' | 'deal' | 'workload' | 'integration';
  targetId: string;
  targetName: string;
  riskScore: number; // 0 to 100
  reason: string;
  watchingSince: string;
  suggestedMitigation: string;
  status: 'monitoring' | 'mitigated' | 'escalated';
}

// Simulation / Shadow Mode Item
export interface SimulationItem {
  id: string;
  workspaceId: string;
  triggeredBy: string;
  actionPlanned: string;
  predictedOutcome: string;
  confidenceScore: number; // 0 to 100
  simulatedAt: string;
}

// Dynamic Custom Built Tool (On-the-spot UI + Schema)
export interface DynamicTool {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  prompt: string;
  description: string;
  schema: {
    fields: {
      name: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'select' | 'currency' | 'status' | 'badge';
      options?: string[];
      required?: boolean;
    }[];
  };
  records: Record<string, any>[];
  statsSummary?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Goal-Driven Multi-Step Plan
export interface GoalPlan {
  id: string;
  workspaceId: string;
  goal: string;
  status: 'planning' | 'in_progress' | 'completed' | 'failed';
  steps: {
    id: string;
    stepNumber: number;
    title: string;
    action: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    output?: any;
  }[];
  insightsLearned: string[];
  finalOutcome?: string;
  createdAt: string;
  updatedAt: string;
}

// Company Brain Knowledge Item
export interface CompanyBrainMemory {
  id: string;
  workspaceId: string;
  category: 'tone_of_voice' | 'pricing_formula' | 'vip_client_rule' | 'past_deal_pattern' | 'operational_standard';
  key: string;
  value: string;
  confidence: number;
  sourceDocId?: string;
  createdAt: string;
}

// ==========================================
// 15. EXTERNAL INTEGRATIONS MODULE
// ==========================================
export interface ExternalIntegration {
  id: string;
  workspaceId: string;
  provider: 'salesforce' | 'quickbooks' | 'stripe' | 'docusign' | 'google_calendar' | 'slack' | 'custom_webhook';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: {
    webhookUrl?: string;
    apiKeyMasked?: string;
    targetAccount?: string;
    syncEnabled?: boolean;
    preApprovedActions?: string[]; // e.g. ["send_invoice", "sync_crm", "send_docusign"]
  };
  lastSyncedAt?: string;
  createdAt: string;
}

// ==========================================
// 16. CURSIS AGENCY STOREFRONT & CUSTOM BUILDS
// ==========================================
export interface AgencyServiceItem {
  id: string;
  title: string;
  category: 'custom_ai_agent' | 'bespoke_workspace' | 'deep_integration' | 'enterprise_brain';
  description: string;
  estimatedTimeline: string;
  startingPrice: string;
  deliverables: string[];
  badge?: string;
}

export interface CustomBuildRequest {
  id: string;
  workspaceId: string;
  companyName: string;
  contactEmail: string;
  requestedService: string;
  budgetRange: string;
  requirements: string;
  status: 'received' | 'reviewing' | 'proposal_generated' | 'building' | 'delivered';
  timelineEstimate?: string;
  assignedEngineer?: string;
  proposalDocId?: string;
  milestones?: {
    title: string;
    completed: boolean;
    targetDate: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DbNotification {
  id: string;
  userId?: string;
  userEmail?: string;
  workspaceId?: string;
  type: 'task' | 'mention' | 'meeting' | 'deadline' | 'ai' | 'project' | 'team' | 'automation' | 'agent' | 'security' | 'system';
  text: string;
  time?: string;
  read: boolean;
  icon?: string;
  createdAt: string;
}
