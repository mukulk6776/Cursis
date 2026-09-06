'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DashboardPageType,
  User,
  Workspace,
  WorkspaceSummary,
  Department,
  Team,
  Invitation,
  Employee,
  Project,
  Task,
  TaskStatus,
  Meeting,
  NotificationItem,
  ActivityItem,
  AutomationRule,
  ChatMessage,
  DocumentItem,
  PaperworkWorkflow,
  OrgSettings,
  RolePermission,
  AuditLogItem,
  OrdisAgent,
  CustomCrm,
  CrmDeal,
  CrmContact,
  IntegrationItem,
  WebhookItem,
  ApiKeyItem,
  WorkspaceSettings,
  TeamSettings,
  NotificationSettings,
  MeetingCalendarSettings,
  OrdisSettings,
} from './types';
import {
  INITIAL_USER,
  INITIAL_WORKSPACES,
  INITIAL_WORKSPACE,
  INITIAL_WORKSPACE_SUMMARY,
  INITIAL_DEPARTMENTS,
  INITIAL_TEAMS,
  INITIAL_INVITATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_MEETINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY,
  INITIAL_AUTOMATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_WORKFLOWS,
  INITIAL_CRM,
  INITIAL_INTEGRATIONS,
  INITIAL_WEBHOOKS,
  INITIAL_API_KEYS,
  INITIAL_ORG_SETTINGS,
  INITIAL_ROLES,
  INITIAL_AUDIT_LOGS,
  INITIAL_AGENTS,
  INITIAL_WORKSPACE_SETTINGS,
  INITIAL_TEAM_SETTINGS,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_MEETING_CALENDAR_SETTINGS,
  INITIAL_ORDIS_SETTINGS,
  formatDate,
  isOverdue,
} from './data';

interface ToastItem {
  id: string;
  message: string;
}

interface GenericModalState {
  title: string;
  body: ReactNode;
}

interface DashboardContextType {
  // Navigation & Shell
  currentPage: DashboardPageType;
  setCurrentPage: (page: DashboardPageType) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Multi-Workspace
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace;
  switchWorkspace: (workspaceId: string) => void;
  workspace: WorkspaceSummary;

  // Panels & Overlays
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  notificationsOpen: boolean;
  toggleNotifications: () => void;
  closeNotifications: () => void;
  profilePanelEmployeeId: string | null;
  openProfilePanel: (employeeId: string) => void;
  closeProfilePanel: () => void;
  selectedMeetingNotes: Meeting | null;
  openMeetingNotes: (meeting: Meeting) => void;
  genericModal: GenericModalState | null;
  openGenericModal: (title: string, body: ReactNode) => void;
  closeGenericModal: () => void;

  // Toasts
  toasts: ToastItem[];
  showToast: (message: string) => void;

  // Entities & Data
  user: User;
  employees: Employee[];
  departments: Department[];
  teams: Team[];
  invitations: Invitation[];
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  notifications: NotificationItem[];
  activity: ActivityItem[];
  chatHistory: ChatMessage[];
  clearChatHistory: () => void;

  // Connected Settings State
  workspaceSettings: WorkspaceSettings;
  updateWorkspaceSettings: (updates: Partial<WorkspaceSettings>) => void;
  teamSettings: TeamSettings;
  updateTeamSettings: (updates: Partial<TeamSettings>) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  meetingCalendarSettings: MeetingCalendarSettings;
  updateMeetingCalendarSettings: (updates: Partial<MeetingCalendarSettings>) => void;
  ordisSettings: OrdisSettings;
  updateOrdisSettings: (updates: Partial<OrdisSettings>) => void;

  // Integrations & Developer Hub
  integrations: IntegrationItem[];
  toggleIntegration: (id: string) => void;
  webhooks: WebhookItem[];
  addWebhook: (wh: Omit<WebhookItem, 'id' | 'lastTriggered'>) => void;
  apiKeys: ApiKeyItem[];
  addApiKey: (name: string, scopes: string[]) => void;
  revokeApiKey: (id: string) => void;

  // Documents & Paperwork
  documents: DocumentItem[];
  addDocument: (doc: Partial<DocumentItem> & { name: string; type: DocumentItem['type'] }) => void;
  workflows: PaperworkWorkflow[];

  // Automations
  automations: AutomationRule[];
  toggleAutomation: (id: string) => void;
  addAutomation: (auto: Partial<AutomationRule> & { name: string; when: string; then: string }) => void;
  updateAutomation: (id: string, updates: Partial<AutomationRule>) => void;

  // CRM
  crm: CustomCrm;
  customCrm: CustomCrm;
  addDeal: (deal: Omit<CrmDeal, 'id' | 'lastActivity'>) => void;
  updateDealStage: (dealId: string, stage: string) => void;
  addContact: (contact: Omit<CrmContact, 'id' | 'lastContact'>) => void;
  submitAgencyRequest: (req: { company: string; email: string; solutionType: string; requirements: string }) => void;

  // Security & Org
  orgSettings: OrgSettings;
  roles: RolePermission[];
  auditLogs: AuditLogItem[];
  auditLog: AuditLogItem[];
  agents: OrdisAgent[];
  ordisAgents: OrdisAgent[];
  addAuditEntry: (actorOrAction: string, actionOrTarget: string, targetOrDetails?: string, maybeDetails?: string) => void;

  // Mutations
  addTask: (task: Partial<Task> & { name: string }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  assignTask: (taskId: string, assigneeIds: string[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleTaskComplete: (taskId: string) => void;
  addProject: (proj: Partial<Project> & { name: string }) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addMeeting: (meeting: Partial<Meeting> & { name: string }) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  addEmployee: (emp: Partial<Employee> & { name: string; role: string; department: string }) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  sendInvitation: (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null }) => void;
  revokeInvitation: (id: string) => void;
  sendOrdisMessage: (text: string) => void;
  markNotificationsRead: () => void;

  // Helper getters
  getEmployee: (id: string) => Employee | undefined;
  getProject: (id: string) => Project | undefined;
  getTasksForProject: (projectId: string) => Task[];
  getTasksForEmployee: (employeeId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getUpcomingMeetings: () => Meeting[];
  getCompletedMeetings: () => Meeting[];
  updateOrgSettings: (updates: Partial<OrgSettings>) => void;
  toggleAgent: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<DashboardPageType>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [selectedMeetingNotes, setSelectedMeetingNotes] = useState<Meeting | null>(null);
  const [genericModal, setGenericModal] = useState<GenericModalState | null>(null);
  const [profilePanelEmployeeId, setProfilePanelEmployeeId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Multi-Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws_public');
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const switchWorkspace = (workspaceId: string) => {
    if (workspaces.some((w) => w.id === workspaceId)) {
      setActiveWorkspaceId(workspaceId);
      const ws = workspaces.find((w) => w.id === workspaceId);
      showToast(`Switched to ${ws?.name || 'workspace'}`);
    }
  };

  // Base State Entities
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_INVITATIONS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activity, setActivity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [workflows] = useState<PaperworkWorkflow[]>(INITIAL_WORKFLOWS);
  const [crm, setCrm] = useState<CustomCrm>(INITIAL_CRM);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(INITIAL_WEBHOOKS);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(INITIAL_ORG_SETTINGS);
  const [roles] = useState<RolePermission[]>(INITIAL_ROLES);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [agents, setAgents] = useState<OrdisAgent[]>(INITIAL_AGENTS);

  // Connected Settings State
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>(INITIAL_WORKSPACE_SETTINGS);
  const [teamSettings, setTeamSettings] = useState<TeamSettings>(INITIAL_TEAM_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(INITIAL_NOTIFICATION_SETTINGS);
  const [meetingCalendarSettings, setMeetingCalendarSettings] = useState<MeetingCalendarSettings>(INITIAL_MEETING_CALENDAR_SETTINGS);
  const [ordisSettings, setOrdisSettings] = useState<OrdisSettings>(INITIAL_ORDIS_SETTINGS);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "⚡ **Ordis Workspace Copilot Online**\n\nI am connected to your workspace data. You can instruct me to:\n• *\"Create a task for Mukul due tomorrow\"*\n• *\"What is my team working on?\"*\n• *\"Show upcoming deadlines\"*\n• *\"Schedule a team sync for Friday\"*\n• *\"Summarize project progress\"*\n\nHow can I help you operate your day?",
    },
  ]);

  const showToast = (message: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const openModal = (modalId: string) => setActiveModal(modalId);
  const closeModal = () => setActiveModal(null);
  const openCommandPalette = () => setCommandPaletteOpen(true);
  const closeCommandPalette = () => setCommandPaletteOpen(false);
  const toggleNotifications = () => setNotificationsOpen((prev) => !prev);
  const closeNotifications = () => setNotificationsOpen(false);
  const openProfilePanel = (employeeId: string) => setProfilePanelEmployeeId(employeeId);
  const closeProfilePanel = () => setProfilePanelEmployeeId(null);
  const openMeetingNotes = (m: Meeting) => setSelectedMeetingNotes(m);
  const openGenericModal = (title: string, body: ReactNode) => setGenericModal({ title, body });
  const closeGenericModal = () => setGenericModal(null);
  const clearChatHistory = () => setChatHistory([]);

  // ---- Settings Mutation Handlers ----
  const updateWorkspaceSettings = (updates: Partial<WorkspaceSettings>) => {
    setWorkspaceSettings((prev) => {
      const next = { ...prev, ...updates };
      // Sync workspace name with active workspace and org settings
      if (updates.name) {
        setWorkspaces((ws) =>
          ws.map((w) => (w.id === activeWorkspaceId ? { ...w, name: updates.name!, shortName: updates.name! } : w))
        );
        setOrgSettings((org) => ({ ...org, name: updates.name! }));
      }
      return next;
    });
    addAuditEntry('Alex Morgan', 'workspace.settings.updated', 'Workspace Settings', 'Updated workspace customization and profile');
    showToast('Workspace settings saved ✓');
  };

  const updateTeamSettings = (updates: Partial<TeamSettings>) => {
    setTeamSettings((prev) => ({ ...prev, ...updates }));
    addAuditEntry('Alex Morgan', 'team.settings.updated', 'Team Settings', 'Updated team governance and invite policies');
    showToast('Team settings updated ✓');
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...updates }));
    addAuditEntry('Alex Morgan', 'notifications.settings.updated', 'Notifications', 'Updated notification alerts and sound');
    showToast('Notification preferences saved ✓');
  };

  const updateMeetingCalendarSettings = (updates: Partial<MeetingCalendarSettings>) => {
    setMeetingCalendarSettings((prev) => ({ ...prev, ...updates }));
    addAuditEntry('Alex Morgan', 'calendar.settings.updated', 'Meeting & Calendar', 'Updated scheduling lead times and defaults');
    showToast('Calendar preferences saved ✓');
  };

  const updateOrdisSettings = (updates: Partial<OrdisSettings>) => {
    setOrdisSettings((prev) => ({ ...prev, ...updates }));
    addAuditEntry('Alex Morgan', 'ordis.settings.updated', 'Ordis AI', 'Updated autonomous action permissions and mode');
    showToast('Ordis AI settings updated ✓');
  };

  // ---- Audit Log Mutation ----
  const addAuditEntry = (actorOrAction: string, actionOrTarget: string, targetOrDetails?: string, maybeDetails?: string) => {
    let actor = user.name;
    let action = actorOrAction;
    let target = actionOrTarget;
    let details = targetOrDetails || '';

    if (maybeDetails !== undefined) {
      actor = actorOrAction;
      action = actionOrTarget;
      target = targetOrDetails || '';
      details = maybeDetails;
    }

    const entry: AuditLogItem = {
      id: 'al_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      actor,
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // ---- Task Mutations ----
  const addTask = (taskData: Partial<Task> & { name: string }) => {
    const newTask: Task = {
      id: 't_' + Date.now(),
      name: taskData.name,
      project: taskData.project || (projects[0]?.id || 'p1'),
      assignee: taskData.assignee || user.id,
      assignees: taskData.assignees || [taskData.assignee || user.id],
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      deadline: taskData.deadline || '2026-09-15',
      tags: taskData.tags || ['General'],
      description: taskData.description || '',
      subtasks: taskData.subtasks || [],
    };

    setTasks((prev) => [newTask, ...prev]);

    // Update employee tasks count
    setEmployees((prev) =>
      prev.map((e) => (e.id === newTask.assignee ? { ...e, tasks: e.tasks + 1 } : e))
    );

    // Update project tasks count
    setProjects((prev) =>
      prev.map((p) => (p.id === newTask.project ? { ...p, tasks: p.tasks + 1 } : p))
    );

    // Add activity
    const emp = employees.find((e) => e.id === newTask.assignee);
    const actText = `Task "${newTask.name}" created for ${emp ? emp.name : 'team'}`;
    setActivity((prev) => [{ id: 'act_' + Date.now(), text: actText, time: 'Just now', dot: '#0f4cff' }, ...prev]);

    if (notificationSettings.tasksEnabled) {
      setNotifications((prev) => [
        { id: 'notif_' + Date.now(), type: 'task', text: actText, time: 'Just now', read: false, icon: '✓' },
        ...prev,
      ]);
    }

    showToast(`Task "${newTask.name}" created ✓`);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    showToast('Task updated ✓');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted');
  };

  const assignTask = (taskId: string, assigneeIds: string[]) => {
    const primary = assigneeIds[0] || user.id;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: primary, assignees: assigneeIds } : t))
    );
    showToast('Task assigned ✓');
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    showToast(`Task status moved to ${status} ✓`);
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus: TaskStatus = t.status === 'completed' ? 'in-progress' : 'completed';
          const act = `Task "${t.name}" marked as ${nextStatus === 'completed' ? 'done' : 'in progress'}`;
          setActivity((a) => [{ id: 'act_' + Date.now(), text: act, time: 'Just now', dot: '#00b341' }, ...a]);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // ---- Project Mutations ----
  const addProject = (projData: Partial<Project> & { name: string }) => {
    const newProj: Project = {
      id: 'p_' + Date.now(),
      name: projData.name,
      icon: projData.icon || '📁',
      color: projData.color || '#0f4cff',
      desc: projData.desc || 'New workspace initiative',
      progress: 0,
      status: 'Planning',
      deadline: projData.deadline || '2026-10-01',
      team: projData.team || [user.id],
      tasks: 0,
      completed: 0,
      milestones: projData.milestones || [],
    };
    setProjects((prev) => [newProj, ...prev]);
    showToast(`Project "${newProj.name}" created ✓`);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Project updated ✓');
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Project deleted');
  };

  // ---- Meeting Mutations ----
  const addMeeting = (m: Partial<Meeting> & { name: string }) => {
    const newM: Meeting = {
      id: 'm_' + Date.now(),
      name: m.name,
      title: m.name,
      platform: m.platform || meetingCalendarSettings.defaultPlatform,
      meetingUrl: m.meetingUrl || 'https://meet.google.com/crs-' + Math.random().toString(36).substring(2, 6),
      date: m.date || '2026-09-09',
      time: m.time || '14:00',
      duration: m.duration || meetingCalendarSettings.defaultDuration,
      participants: m.participants || [user.id],
      hostId: user.id,
      hostName: user.name,
      project: m.project || null,
      status: 'scheduled',
      agenda: m.agenda || '1. Overview of recent sprint tasks\n2. Open blockers discussion\n3. Action items assignment',
      notes: m.notes || '',
    };
    setMeetings((prev) => [newM, ...prev]);
    const act = `Scheduled meeting "${newM.name}" for ${newM.date} at ${newM.time}`;
    setActivity((prev) => [{ id: 'act_' + Date.now(), text: act, time: 'Just now', dot: '#ccff00' }, ...prev]);
    showToast(`Meeting "${newM.name}" scheduled ✓`);
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    showToast('Meeting updated ✓');
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    showToast('Meeting removed');
  };

  // ---- Employee & Team Mutations ----
  const addEmployee = (empData: Partial<Employee> & { name: string; role: string; department: string }) => {
    const initials = empData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    const newEmp: Employee = {
      id: 'u_' + Date.now(),
      name: empData.name,
      initials,
      role: empData.role,
      department: empData.department,
      departmentId: empData.departmentId || 'dept_engineering',
      teamIds: empData.teamIds || ['team_core'],
      workspaceRole: empData.workspaceRole || teamSettings.defaultRole,
      status: 'online',
      color: '#0f4cff',
      tasks: 0,
      projects: 0,
      email: empData.email || `${empData.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`,
      skills: empData.skills || ['General'],
      joinedAt: new Date().toISOString().split('T')[0],
      invitedBy: user.id,
    };
    setEmployees((prev) => [...prev, newEmp]);
    showToast(`Added ${newEmp.name} to team ✓`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    showToast('Team member updated ✓');
  };

  const removeEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast(`Removed ${emp?.name || 'member'} from workspace`);
  };

  const sendInvitation = (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null }) => {
    const newInv: Invitation = {
      id: 'inv_' + Date.now(),
      email: inv.email,
      name: inv.name || inv.email.split('@')[0],
      roleTitle: inv.roleTitle || 'Team Member',
      workspaceRole: inv.workspaceRole || teamSettings.defaultRole,
      department: inv.department,
      team: inv.team,
      status: 'pending',
      token: 'tok_' + Math.random().toString(36).substring(2, 10),
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      invitedBy: user.id,
    };
    setInvitations((prev) => [newInv, ...prev]);
    showToast(`Invitation sent to ${inv.email} ✓`);
  };

  const revokeInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    showToast('Invitation revoked');
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read ✓');
  };

  // ---- Ordis Natural Language Commander ----
  const sendOrdisMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text };
    const typingMsg: ChatMessage = { role: 'ai', text: null, typing: true };
    setChatHistory((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      setChatHistory((prev) => prev.filter((m) => !m.typing));
      const lower = text.toLowerCase();
      let responseText = '';

      // 1. Action: Create Task
      if (lower.includes('create task') || lower.includes('add task') || lower.includes('task for')) {
        let taskName = 'New initiative';
        let assigneeId = user.id;
        let priority: 'urgent' | 'high' | 'medium' | 'low' = 'high';

        // Extract assignee from prompt
        for (const emp of employees) {
          const firstName = emp.name.split(' ')[0].toLowerCase();
          if (lower.includes(firstName)) {
            assigneeId = emp.id;
            break;
          }
        }

        // Extract task title
        if (text.includes(':')) {
          taskName = text.split(':')[1].trim();
        } else {
          taskName = text
            .replace(/create task|add task|for mukul|for sarah|for alex|for rahul|for james/gi, '')
            .trim();
          if (!taskName) taskName = 'Follow-up task';
        }

        if (lower.includes('urgent')) priority = 'urgent';
        else if (lower.includes('low')) priority = 'low';

        // Actually create task
        const newTask: Task = {
          id: 't_' + Date.now(),
          name: taskName,
          project: projects[0]?.id || 'p1',
          assignee: assigneeId,
          assignees: [assigneeId],
          priority,
          status: 'todo',
          deadline: '2026-09-12',
          tags: ['Ordis Action'],
          description: `Created automatically by Ordis from prompt: "${text}"`,
        };

        setTasks((prev) => [newTask, ...prev]);
        const assignedEmployee = employees.find((e) => e.id === assigneeId);

        responseText = `⚡ **Task Created & Assigned**\n\n• **Title**: "${newTask.name}"\n• **Assignee**: ${assignedEmployee ? assignedEmployee.name : 'You'}\n• **Priority**: ${priority.toUpperCase()}\n• **Project**: ${projects[0]?.name || 'Core Sprint'}\n• **Deadline**: ${formatDate(newTask.deadline)}\n\n✓ Added to the active workspace queue.`;
        showToast(`Ordis created task: "${taskName}" ✓`);
      }
      // 2. Query: Team Activity / Workload
      else if (lower.includes('team working on') || lower.includes('team status') || lower.includes('team workload') || lower.includes('who is online')) {
        const onlineEmps = employees.filter((e) => e.status === 'online');
        const busyEmps = employees.filter((e) => e.status === 'busy');

        const breakdown = employees.map((emp) => {
          const empTasks = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed');
          const taskList = empTasks.map((t) => `"${t.name}"`).slice(0, 2).join(', ');
          return `• **${emp.name}** (${emp.status.toUpperCase()}): ${empTasks.length} active tasks ${taskList ? `— ${taskList}` : '(Bandwidth available)'}`;
        }).join('\n');

        responseText = `👥 **Live Team Workload & Activity**\n\n${breakdown}\n\n**Summary**: ${onlineEmps.length} online, ${busyEmps.length} busy. Overall workload is well-distributed.`;
      }
      // 3. Query: Upcoming Deadlines
      else if (lower.includes('deadline') || lower.includes('due') || lower.includes('schedule')) {
        const sortedTasks = [...tasks]
          .filter((t) => t.status !== 'completed')
          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        if (sortedTasks.length === 0) {
          responseText = '✅ **No Pending Deadlines**\n\nAll current tasks are completed! Your workspace is ahead of schedule.';
        } else {
          const list = sortedTasks.slice(0, 4).map((t, i) => {
            const emp = employees.find((e) => e.id === t.assignee);
            const overdue = isOverdue(t.deadline);
            return `${i + 1}. **${t.name}** — ${emp ? emp.name : 'Unassigned'} (Due: ${formatDate(t.deadline)}) ${overdue ? '⚠️ OVERDUE' : t.priority === 'urgent' ? '🔴 URGENT' : '🟡 ON TRACK'}`;
          }).join('\n');

          responseText = `📅 **Upcoming Deadlines (${sortedTasks.length} in progress)**\n\n${list}\n\nWould you like me to send reminders or rebalance any urgent items?`;
        }
      }
      // 4. Action: Schedule Meeting
      else if (lower.includes('schedule meeting') || lower.includes('book meeting') || lower.includes('sync')) {
        const meetingName = text.includes(':') ? text.split(':')[1].trim() : 'Team Strategy & Sprint Sync';
        const newM: Meeting = {
          id: 'm_' + Date.now(),
          name: meetingName,
          title: meetingName,
          platform: meetingCalendarSettings.defaultPlatform,
          meetingUrl: 'https://meet.google.com/crs-' + Math.random().toString(36).substring(2, 6),
          date: '2026-09-09',
          time: '14:00',
          duration: meetingCalendarSettings.defaultDuration,
          participants: employees.slice(0, 3).map((e) => e.id),
          hostId: user.id,
          hostName: user.name,
          project: projects[0]?.id || null,
          status: 'scheduled',
          agenda: '1. Auto-populated by Ordis from open milestones\n2. Blockers and priority alignment\n3. Next sprint deliverables',
        };

        setMeetings((prev) => [newM, ...prev]);
        responseText = `📅 **Meeting Booked & Synced to Calendar**\n\n• **Title**: "${newM.name}"\n• **Platform**: Google Meet\n• **Date & Time**: ${newM.date} at ${newM.time} (${newM.duration} min)\n• **Participants**: ${employees.slice(0, 3).map((e) => e.name).join(', ')}\n• **Agenda**: Auto-populated from open sprint tasks.\n\n✓ Calendar invites generated.`;
        showToast(`Meeting "${newM.name}" scheduled ✓`);
      }
      // 5. Query: Project Progress Summary
      else if (lower.includes('project') || lower.includes('summary') || lower.includes('progress')) {
        const projSummaries = projects.map((p) => {
          const pTasks = tasks.filter((t) => t.project === p.id);
          const done = pTasks.filter((t) => t.status === 'completed').length;
          return `• **${p.name}**: ${p.progress}% complete (${done}/${pTasks.length} tasks delivered)`;
        }).join('\n');

        const activeCount = tasks.filter((t) => t.status !== 'completed').length;
        responseText = `📊 **Workspace Project Progress Summary**\n\n${projSummaries}\n\n**Total Tasks in Flight**: ${activeCount} active tasks across ${projects.length} initiatives.\n**Top Velocity**: "${projects[0]?.name || 'Website Redesign'}" is leading with high momentum.`;
      }
      // 6. Action: Organize Today's Work
      else if (lower.includes('organize') || lower.includes('my day') || lower.includes('prioritize')) {
        const userTasks = tasks.filter((t) => t.assignee === user.id && t.status !== 'completed');
        responseText = `🎯 **Ordis Daily Action Plan for ${user.name}**\n\nHere is your recommended execution sequence for today:\n\n1. 🔴 **Review Q3 sprint deliverables** (Urgent leadership milestone)\n2. 🟡 **Integrate live Ordis conversational actions** (In Progress)\n3. 📅 **Weekly Product & Sprint Sync** at 2:00 PM (Google Meet)\n\nEstimated focus time: 4.5 hours. All blockers have been cleared.`;
      }
      // Default Fallback
      else {
        responseText = `I have parsed your request: "${text}".\n\nI can execute workspace operations directly — try asking me to **"Create a task for Mukul"**, **"Show upcoming deadlines"**, **"Schedule a team sync"**, or **"Summarize project progress"**.`;
      }

      setChatHistory((prev) => [...prev, { role: 'ai', text: responseText }]);
    }, 600);
  };

  // Lookups
  const getEmployee = (id: string) => employees.find((e) => e.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getTasksForProject = (projectId: string) => tasks.filter((t) => t.project === projectId);
  const getTasksForEmployee = (employeeId: string) => tasks.filter((t) => t.assignee === employeeId);
  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);
  const getUpcomingMeetings = () => meetings.filter((m) => m.status !== 'completed');
  const getCompletedMeetings = () => meetings.filter((m) => m.status === 'completed');

  const updateOrgSettings = (updates: Partial<OrgSettings>) => {
    setOrgSettings((prev) => ({ ...prev, ...updates }));
    showToast('Settings saved ✓');
  };

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    showToast('Ordis agent state toggled');
  };

  // ---- Integrations Mutations ----
  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'connected' ? 'disconnected' : 'connected',
              connectedAt: item.status === 'connected' ? null : new Date().toISOString().split('T')[0],
            }
          : item
      )
    );
  };

  const addWebhook = (whData: Omit<WebhookItem, 'id' | 'lastTriggered'>) => {
    const newWh: WebhookItem = {
      id: 'wh_' + Date.now(),
      name: whData.name,
      url: whData.url,
      events: whData.events,
      status: whData.status || 'active',
      secret: whData.secret || 'whsec_' + Math.random().toString(36).substring(2, 10),
      lastTriggered: 'Just now',
    };
    setWebhooks((prev) => [newWh, ...prev]);
    addAuditEntry('Alex Morgan', 'webhook.created', newWh.name, `Created webhook for ${newWh.url}`);
    showToast(`Webhook "${newWh.name}" created ✓`);
  };

  const addApiKey = (name: string, scopes: string[]) => {
    const randomSuffix = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    const key = `crs_live_${randomSuffix}`;
    const prefix = key.substring(0, 13);
    const newKey: ApiKeyItem = {
      id: 'key_' + Date.now(),
      name,
      key,
      prefix,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'active',
      scopes,
      permissions: scopes,
      createdBy: user.name,
    };
    setApiKeys((prev) => [newKey, ...prev]);
    addAuditEntry('Alex Morgan', 'apikey.created', name, `Generated API key with ${scopes.length} scopes`);
    showToast(`API Key "${name}" generated ✓`);
  };

  const revokeApiKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k))
    );
    showToast('API Key revoked');
  };

  // ---- Document Mutations ----
  const addDocument = (docData: Partial<DocumentItem> & { name: string; type: DocumentItem['type'] }) => {
    const newDoc: DocumentItem = {
      id: 'doc_' + Date.now(),
      name: docData.name,
      type: docData.type,
      size: docData.size || '1.2 MB',
      updated: new Date().toISOString().split('T')[0],
      author: user.name,
      project: docData.project || (projects[0]?.id || 'p1'),
      tags: docData.tags || ['Generated', 'AI'],
      version: 1,
      versions: [{ v: 1, date: new Date().toISOString().split('T')[0], author: user.name }],
      aiSummary: docData.aiSummary || 'Document automatically drafted by Cursis Document Engine.',
      keyClauses: docData.keyClauses || [],
      sharedWith: docData.sharedWith || [user.id],
      esignStatus: docData.esignStatus || null,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addAuditEntry('Alex Morgan', 'document.generated', newDoc.name, 'Generated document via paperwork engine');
    showToast(`Document "${newDoc.name}" added ✓`);
  };

  // ---- Automation Mutations ----
  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    showToast('Automation rule toggled ✓');
  };

  const addAutomation = (autoData: Partial<AutomationRule> & { name: string; when: string; then: string }) => {
    const newAuto: AutomationRule = {
      id: 'auto_' + Date.now(),
      name: autoData.name,
      active: autoData.active !== undefined ? autoData.active : true,
      when: autoData.when,
      condition: autoData.condition || null,
      then: autoData.then,
      icon: autoData.icon || '⚡',
      color: autoData.color || '#0f4cff',
      type: autoData.type || 'standard',
      executionCount: autoData.executionCount || 0,
      lastRun: autoData.lastRun || 'Never',
    };
    setAutomations((prev) => [newAuto, ...prev]);
    showToast(`Automation "${newAuto.name}" created ✓`);
  };

  const updateAutomation = (id: string, updates: Partial<AutomationRule>) => {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  // ---- CRM & Agency Mutations ----
  const addDeal = (dealData: Omit<CrmDeal, 'id' | 'lastActivity'>) => {
    const newDeal: CrmDeal = {
      id: 'd_' + Date.now(),
      title: dealData.title,
      client: dealData.client,
      value: dealData.value,
      stage: dealData.stage,
      owner: dealData.owner,
      probability: dealData.probability,
      notes: dealData.notes,
      contactEmail: dealData.contactEmail,
      lastActivity: 'Just now',
    };
    setCrm((prev) => ({
      ...prev,
      deals: [newDeal, ...prev.deals],
    }));
    addAuditEntry('Alex Morgan', 'crm.deal.created', newDeal.title, `Added deal for ${newDeal.client} valued at ${newDeal.value}`);
    showToast(`Deal "${newDeal.title}" created ✓`);
  };

  const updateDealStage = (dealId: string, stage: string) => {
    setCrm((prev) => ({
      ...prev,
      deals: prev.deals.map((d) => (d.id === dealId ? { ...d, stage, lastActivity: 'Just now' } : d)),
    }));
    showToast('Deal stage updated ✓');
  };

  const addContact = (contactData: Omit<CrmContact, 'id' | 'lastContact'>) => {
    const newContact: CrmContact = {
      id: 'c_' + Date.now(),
      name: contactData.name,
      company: contactData.company,
      email: contactData.email,
      phone: contactData.phone,
      role: contactData.role,
      status: contactData.status,
      dealId: contactData.dealId,
      notes: contactData.notes,
      lastContact: 'Just now',
    };
    setCrm((prev) => ({
      ...prev,
      contacts: [newContact, ...prev.contacts],
    }));
    showToast(`Contact "${newContact.name}" added ✓`);
  };

  const submitAgencyRequest = (req: { company: string; email: string; solutionType: string; requirements: string }) => {
    addAuditEntry('Alex Morgan', 'agency.request.submitted', req.company, `Requested ${req.solutionType}`);
    showToast(`Request submitted for ${req.company}. Our agency lead will contact you within 24 hours ✓`);
  };

  return (
    <DashboardContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        switchWorkspace,
        workspace: INITIAL_WORKSPACE_SUMMARY,
        activeModal,
        openModal,
        closeModal,
        commandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        notificationsOpen,
        toggleNotifications,
        closeNotifications,
        profilePanelEmployeeId,
        openProfilePanel,
        closeProfilePanel,
        selectedMeetingNotes,
        openMeetingNotes,
        genericModal,
        openGenericModal,
        closeGenericModal,
        toasts,
        showToast,
        user,
        employees,
        departments,
        teams,
        invitations,
        projects,
        tasks,
        meetings,
        notifications,
        activity,
        automations,
        toggleAutomation,
        addAutomation,
        updateAutomation,
        documents,
        addDocument,
        workflows,
        crm,
        customCrm: crm,
        addDeal,
        updateDealStage,
        addContact,
        submitAgencyRequest,
        integrations,
        toggleIntegration,
        webhooks,
        addWebhook,
        apiKeys,
        addApiKey,
        revokeApiKey,
        chatHistory,
        clearChatHistory,
        workspaceSettings,
        updateWorkspaceSettings,
        teamSettings,
        updateTeamSettings,
        notificationSettings,
        updateNotificationSettings,
        meetingCalendarSettings,
        updateMeetingCalendarSettings,
        ordisSettings,
        updateOrdisSettings,
        orgSettings,
        roles,
        auditLogs,
        auditLog: auditLogs,
        agents,
        ordisAgents: agents,
        addAuditEntry,
        addTask,
        updateTask,
        deleteTask,
        assignTask,
        updateTaskStatus,
        toggleTaskComplete,
        addProject,
        updateProject,
        deleteProject,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        addEmployee,
        updateEmployee,
        removeEmployee,
        sendInvitation,
        revokeInvitation,
        sendOrdisMessage,
        markNotificationsRead,
        getEmployee,
        getProject,
        getTasksForProject,
        getTasksForEmployee,
        getTasksByStatus,
        getUpcomingMeetings,
        getCompletedMeetings,
        updateOrgSettings,
        toggleAgent,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

