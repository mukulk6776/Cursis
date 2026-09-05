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
  IntegrationItem,
  WebhookItem,
  ApiKeyItem,
  OrgSettings,
  RolePermission,
  AuditLogItem,
  OrdisAgent,
  CustomCrm,
  CrmDeal,
  CrmContact,
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
  automations: AutomationRule[];
  chatHistory: ChatMessage[];

  // Expanded Modules State
  documents: DocumentItem[];
  workflows: PaperworkWorkflow[];
  crm: CustomCrm;
  integrations: IntegrationItem[];
  webhooks: WebhookItem[];
  apiKeys: ApiKeyItem[];
  orgSettings: OrgSettings;
  roles: RolePermission[];
  auditLogs: AuditLogItem[];
  auditLog: AuditLogItem[];
  agents: OrdisAgent[];
  ordisAgents: OrdisAgent[];
  customCrm: CustomCrm;
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
  sendInvitation: (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null }) => void;
  revokeInvitation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  addAutomation: (rule: Omit<AutomationRule, 'id' | 'active'>) => void;
  updateAutomation: (id: string, updates: Partial<AutomationRule>) => void;
  deleteAutomation: (id: string) => void;
  sendOrdisMessage: (text: string) => void;
  markNotificationsRead: () => void;

  // CRM & Agency Mutations
  addDeal: (deal: Omit<CrmDeal, 'id' | 'lastActivity'>) => void;
  updateDealStage: (dealId: string, stage: string) => void;
  addContact: (contact: Omit<CrmContact, 'id' | 'lastContact'>) => void;
  submitAgencyRequest: (req: { company: string; email: string; solutionType: string; requirements: string }) => void;

  addDocument: (doc: Partial<DocumentItem> & { name: string }) => void;
  updateDocument: (id: string, updates: Partial<DocumentItem>) => void;
  toggleIntegration: (id: string) => void;
  addWebhook: (webhook: Omit<WebhookItem, 'id' | 'lastTriggered'>) => void;
  addApiKey: (name: string, scopes: string[]) => void;
  revokeApiKey: (id: string) => void;
  updateOrgSettings: (updates: Partial<OrgSettings>) => void;
  addAuditLog: (action: string, target: string, details: string) => void;
  toggleAgent: (id: string) => void;

  // Helper getters
  getEmployee: (id: string) => Employee | undefined;
  getProject: (id: string) => Project | undefined;
  getTasksForProject: (projectId: string) => Task[];
  getTasksForEmployee: (employeeId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getUpcomingMeetings: () => Meeting[];
  getCompletedMeetings: () => Meeting[];
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

  // Base State entities
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [teams] = useState<Team[]>(INITIAL_TEAMS);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_INVITATIONS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activity, setActivity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [crm, setCrm] = useState<CustomCrm>(INITIAL_CRM);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "Greetings Alex. I am **ORDIS**, the operational intelligence layer of Cursis.\n\nI have active memory across your workspace and connected integrations. I can directly execute actions on your behalf, run multi-agent workflows, and keep your organization moving with zero administrative overhead.\n\nHow may I assist you right now?",
    },
  ]);

  // Expanded Modules State
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [workflows] = useState<PaperworkWorkflow[]>(INITIAL_WORKFLOWS);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(INITIAL_WEBHOOKS);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(INITIAL_ORG_SETTINGS);
  const [roles] = useState<RolePermission[]>(INITIAL_ROLES);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [agents, setAgents] = useState<OrdisAgent[]>(INITIAL_AGENTS);

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const u = json?.user || json?.data?.user;
        if (u) {
          const name = u.displayName || (u.email ? u.email.split('@')[0] : 'Cursis User');
          const initials =
            name
              .split(' ')
              .map((p: string) => p[0])
              .join('')
              .toUpperCase()
              .substring(0, 2) || 'CU';

          setUser((prev) => ({
            ...prev,
            id: u.uid || prev.id,
            name,
            email: u.email || prev.email,
            role: u.role === 'owner' ? 'Workspace Owner' : u.role || prev.role,
            initials,
          }));

          // Sync active user into employee list
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === 'u1' || emp.email === 'alex@cursis.io' || emp.id === u.uid
                ? {
                    ...emp,
                    id: u.uid || emp.id,
                    name,
                    email: u.email || emp.email,
                    initials,
                  }
                : emp
            )
          );

          // Sync tasks assigned to owner 'u1' to the logged in user
          if (u.uid) {
            setTasks((prev) =>
              prev.map((t) => ({
                ...t,
                assignee: t.assignee === 'u1' ? u.uid : t.assignee,
                assignees: t.assignees?.map((a) => (a === 'u1' ? u.uid : a)) || [t.assignee === 'u1' ? u.uid : t.assignee],
              }))
            );
            setProjects((prev) =>
              prev.map((p) => ({
                ...p,
                team: p.team?.map((memberId) => (memberId === 'u1' ? u.uid : memberId)) || [u.uid],
              }))
            );
          }

          // Update initial ORDIS greeting
          const firstName = name.split(' ')[0];
          setChatHistory((prev) => {
            if (prev.length > 0 && prev[0].role === 'ai') {
              return [
                {
                  role: 'ai',
                  text: `Greetings ${firstName}. I am **ORDIS**, the operational intelligence layer of Cursis.\n\nI have active memory across your workspace and connected integrations. I can directly execute actions on your behalf, run multi-agent workflows, and keep your organization moving with zero administrative overhead.\n\nHow may I assist you right now?`,
                },
                ...prev.slice(1),
              ];
            }
            return prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Toast dispatch
  const showToast = (message: string) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Keyboard shortcut for ⌘K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setActiveModal(null);
        setNotificationsOpen(false);
        setProfilePanelEmployeeId(null);
        setSelectedMeetingNotes(null);
        setGenericModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openModal = (modalId: string) => setActiveModal(modalId);
  const closeModal = () => {
    setActiveModal(null);
    setSelectedMeetingNotes(null);
  };

  const openGenericModal = (title: string, body: ReactNode) => {
    setGenericModal({ title, body });
  };
  const closeGenericModal = () => {
    setGenericModal(null);
  };

  const openCommandPalette = () => setCommandPaletteOpen(true);
  const closeCommandPalette = () => setCommandPaletteOpen(false);

  const toggleNotifications = () => setNotificationsOpen((prev) => !prev);
  const closeNotifications = () => setNotificationsOpen(false);

  const openProfilePanel = (employeeId: string) => setProfilePanelEmployeeId(employeeId);
  const closeProfilePanel = () => setProfilePanelEmployeeId(null);

  const openMeetingNotes = (meeting: Meeting) => {
    setSelectedMeetingNotes(meeting);
    setActiveModal('meeting-notes-modal');
  };

  // Task Mutations
  const addTask = (taskInput: Partial<Task> & { name: string }) => {
    const primaryAssignee = taskInput.assignee || (taskInput.assignees && taskInput.assignees[0]) || 'u1';
    const newTask: Task = {
      id: 't_' + Date.now(),
      name: taskInput.name,
      project: taskInput.project || 'p1',
      assignee: primaryAssignee,
      assignees: taskInput.assignees || [primaryAssignee],
      priority: taskInput.priority || 'medium',
      status: taskInput.status || 'todo',
      deadline: taskInput.deadline || '2026-09-10',
      tags: taskInput.tags || ['task'],
      description: taskInput.description || '',
      subtasks: taskInput.subtasks || [],
      blockedBy: taskInput.blockedBy || [],
      comments: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    setActivity((prev) => [
      {
        id: 'act_' + Date.now(),
        text: `<strong>You</strong> created task "${newTask.name}"`,
        time: 'Just now',
        dot: '#0f4cff',
      },
      ...prev,
    ]);
    addAuditLog('task.created', newTask.name, `Created task ${newTask.id}`);
    showToast(`Task "${newTask.name}" created`);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    showToast('Task updated');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted');
  };

  const assignTask = (taskId: string, assigneeIds: string[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const first = assigneeIds[0] || t.assignee;
          return { ...t, assignee: first, assignees: assigneeIds };
        }
        return t;
      })
    );
    addAuditLog('task.reassigned', taskId, `Assigned to ${assigneeIds.join(', ')}`);
    showToast('Task assignees updated');
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask) {
      addAuditLog('task.status_changed', targetTask.name, `Moved to ${status}`);
    }
    showToast(`Task status updated to ${status}`);
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = t.status === 'completed';
          const newStatus: TaskStatus = isDone ? 'in-progress' : 'completed';
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
    const target = tasks.find((t) => t.id === taskId);
    showToast(target ? `Toggled status for "${target.name}"` : 'Task updated');
  };

  const addProject = (projInput: Partial<Project> & { name: string }) => {
    const newProj: Project = {
      id: 'p_' + Date.now(),
      name: projInput.name,
      icon: projInput.icon || 'P' + (projects.length + 1),
      color: projInput.color || '#3b82f6',
      desc: projInput.desc || '',
      progress: 0,
      status: projInput.status || 'In Progress',
      deadline: projInput.deadline || '2026-10-01',
      team: projInput.team || ['u1'],
      tasks: 0,
      completed: 0,
      milestones: [],
    };
    setProjects((prev) => [...prev, newProj]);
    addAuditLog('project.created', newProj.name, `Created project ${newProj.id}`);
    showToast(`Project "${newProj.name}" created`);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Project updated');
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Project deleted');
  };

  const addMeeting = (mInput: Partial<Meeting> & { name: string }) => {
    const title = mInput.name || mInput.title || 'Untitled Meeting';
    const platform = mInput.platform || 'google_meet';
    const defaultUrl = platform === 'zoom'
      ? 'https://zoom.us/j/new'
      : platform === 'teams'
      ? 'https://teams.microsoft.com'
      : 'https://meet.google.com/new';

    const newM: Meeting = {
      id: 'm_' + Date.now(),
      name: title,
      title,
      platform,
      meetingUrl: mInput.meetingUrl?.trim() || defaultUrl,
      date: mInput.date || new Date().toISOString().split('T')[0],
      time: mInput.time || '10:00',
      duration: mInput.duration || 30,
      durationMinutes: mInput.durationMinutes || mInput.duration || 30,
      participants: mInput.participants || ['u1'],
      attendees: mInput.attendees || mInput.participants || ['founder@cursis.ai'],
      project: mInput.project || null,
      status: mInput.status || 'scheduled',
      agenda: mInput.agenda || '',
      aiSummary: null,
      notes: mInput.notes || '',
    };
    setMeetings((prev) => [newM, ...prev]);
    addAuditLog('meeting.scheduled', newM.name, `Scheduled meeting ${newM.id}`);
    showToast(`Meeting "${newM.name}" scheduled`);
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    showToast('Meeting updated');
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    showToast('Meeting deleted');
  };

  const addEmployee = (empInput: Partial<Employee> & { name: string; role: string; department: string }) => {
    const newEmp: Employee = {
      id: 'u_' + Date.now(),
      name: empInput.name,
      initials: empInput.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      role: empInput.role,
      department: empInput.department,
      status: 'online',
      color: '#0f4cff',
      tasks: 0,
      projects: 0,
      email: empInput.email || `${empInput.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`,
      joinedAt: new Date().toISOString().split('T')[0],
      workspaceRole: 'member',
    };
    setEmployees((prev) => [...prev, newEmp]);
    addAuditLog('member.added', newEmp.name, `Added employee ${newEmp.role}`);
    showToast(`Team member "${newEmp.name}" added`);
  };

  const sendInvitation = (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null }) => {
    const newInv: Invitation = {
      id: 'inv_' + Date.now(),
      email: inv.email,
      name: inv.name || inv.email.split('@')[0],
      roleTitle: inv.roleTitle || 'Workspace Member',
      workspaceRole: inv.workspaceRole,
      department: inv.department,
      team: inv.team,
      status: 'pending',
      token: 'inv_tk_' + Math.random().toString(36).substring(2, 10),
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: user.id,
    };
    setInvitations((prev) => [newInv, ...prev]);
    addAuditLog('member.invited', inv.email, `Sent invitation with 7-day token as ${inv.workspaceRole}`);
    showToast(`Workspace invitation sent to ${inv.email}`);
  };

  const revokeInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    addAuditLog('member.invite_revoked', id, 'Revoked workspace invitation');
    showToast('Invitation revoked');
  };


  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    const target = automations.find((a) => a.id === id);
    showToast(target ? `Automation ${target.active ? 'disabled' : 'enabled'}` : 'Automation updated');
  };

  const addAutomation = (rule: Omit<AutomationRule, 'id' | 'active'>) => {
    const newA: AutomationRule = {
      ...rule,
      id: 'auto_' + Date.now(),
      active: true,
      executionCount: 0,
    };
    setAutomations((prev) => [...prev, newA]);
    addAuditLog('automation.created', newA.name, `Created automation ${newA.id}`);
    showToast(`Automation "${newA.name}" created`);
  };

  const updateAutomation = (id: string, updates: Partial<AutomationRule>) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    showToast('Automation updated');
  };

  const deleteAutomation = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    showToast('Automation deleted');
  };

  // CRM Mutations
  const addDeal = (deal: Omit<CrmDeal, 'id' | 'lastActivity'>) => {
    const newDeal: CrmDeal = {
      ...deal,
      id: 'd_' + Date.now(),
      lastActivity: new Date().toISOString().split('T')[0],
    };
    setCrm((prev) => ({
      ...prev,
      deals: [newDeal, ...prev.deals],
    }));
    addAuditLog('crm.deal.created', newDeal.title, `Added deal for ${newDeal.client}`);
    showToast(`Deal "${newDeal.title}" added`);
  };

  const updateDealStage = (dealId: string, stage: string) => {
    setCrm((prev) => ({
      ...prev,
      deals: prev.deals.map((d) => (d.id === dealId ? { ...d, stage } : d)),
    }));
    addAuditLog('crm.deal.updated', dealId, `Moved deal to ${stage}`);
    showToast('Deal stage updated');
  };

  const addContact = (contact: Omit<CrmContact, 'id' | 'lastContact'>) => {
    const newC: CrmContact = {
      ...contact,
      id: 'ct_' + Date.now(),
      lastContact: new Date().toISOString().split('T')[0],
    };
    setCrm((prev) => ({
      ...prev,
      contacts: [newC, ...prev.contacts],
    }));
    addAuditLog('crm.contact.created', newC.name, `Added contact at ${newC.company}`);
    showToast(`Contact "${newC.name}" added`);
  };

  const submitAgencyRequest = (req: { company: string; email: string; solutionType: string; requirements: string }) => {
    addAuditLog('agency.solution_requested', req.company, `Requested ${req.solutionType}`);
    showToast(`Solution request submitted for ${req.company}. Cursis AI Agency will respond within 24h.`);
  };

  // Documents Mutations
  const addDocument = (docInput: Partial<DocumentItem> & { name: string }) => {
    const newDoc: DocumentItem = {
      id: 'doc_' + Date.now(),
      name: docInput.name,
      type: docInput.type || 'technical',
      size: docInput.size || '1.2 MB',
      updated: new Date().toISOString().split('T')[0],
      author: user.name,
      project: docInput.project || 'p1',
      tags: docInput.tags || ['document'],
      version: 1,
      versions: [{ v: 1, date: new Date().toISOString().split('T')[0], author: user.name }],
      aiSummary: docInput.aiSummary || 'Document processed and indexed by ORDIS Knowledge Engine.',
      keyClauses: docInput.keyClauses || ['Standard workspace compliance active'],
      sharedWith: ['u1'],
      esignStatus: docInput.esignStatus || null,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addAuditLog('document.uploaded', newDoc.name, `Uploaded version 1 of ${newDoc.id}`);
    showToast(`Document "${newDoc.name}" uploaded`);
  };

  const updateDocument = (id: string, updates: Partial<DocumentItem>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    showToast('Document updated');
  };


  // Integrations Mutations
  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const nextStatus = i.status === 'connected' ? 'disconnected' : 'connected';
          return { ...i, status: nextStatus, connectedAt: nextStatus === 'connected' ? '2026-08-29' : null };
        }
        return i;
      })
    );
    showToast('Integration status updated');
  };

  const addWebhook = (webhook: Omit<WebhookItem, 'id' | 'lastTriggered'>) => {
    const newW: WebhookItem = {
      ...webhook,
      id: 'wh_' + Date.now(),
      lastTriggered: 'Never',
    };
    setWebhooks((prev) => [...prev, newW]);
    addAuditLog('webhook.created', newW.name, `Added endpoint ${newW.url}`);
    showToast(`Webhook "${newW.name}" registered`);
  };

  const addApiKey = (name: string, scopes: string[]) => {
    const newKey: ApiKeyItem = {
      id: 'ak_' + Date.now(),
      name,
      key: 'crs_live_' + Math.random().toString(36).substring(2, 8) + '...',
      prefix: 'crs_live_',
      created: '2026-08-29',
      lastUsed: 'Never',
      status: 'active',
      scopes,
      createdBy: user.id,
    };
    setApiKeys((prev) => [...prev, newKey]);
    addAuditLog('apikey.generated', newKey.name, `Created API key with ${scopes.length} scopes`);
    showToast(`API Key "${name}" generated`);
  };

  const revokeApiKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revoked' } : k))
    );
    addAuditLog('apikey.revoked', id, 'Revoked API key');
    showToast('API Key revoked');
  };

  // Settings & Audit Mutations
  const updateOrgSettings = (updates: Partial<OrgSettings>) => {
    setOrgSettings((prev) => ({ ...prev, ...updates }));
    addAuditLog('workspace.settings.updated', activeWorkspace.name, 'Updated organization settings');
    showToast('Organization settings saved');
  };

  const addAuditLog = (action: string, target: string, details: string) => {
    const entry: AuditLogItem = {
      id: 'al_' + Date.now(),
      actor: user.name,
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

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

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    showToast('ORDIS Agent updated');
  };

  // Chat message
  const sendOrdisMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text };
    const typingMsg: ChatMessage = { role: 'ai', text: null, typing: true };
    setChatHistory((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      setChatHistory((prev) => prev.filter((m) => !m.typing));
      const lower = text.toLowerCase();
      let responseText = '';

      if (lower.includes('summary') || lower.includes('summarize')) {
        const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const overdue = tasks.filter((t) => isOverdue(t.deadline) && t.status !== 'completed').length;
        responseText = `📊 **Workspace Summary (${activeWorkspace.name})**\n\n• ${tasks.length} total tasks (${completed} completed, ${inProgress} in progress, ${overdue} overdue)\n• ${projects.length} active projects\n• ${employees.filter((e) => e.status === 'online').length} team members currently online\n• ${meetings.filter((m) => m.status !== 'completed').length} upcoming meetings\n\nThe Website Redesign project is leading at 80% completion.`;
      } else if (lower.includes('overdue')) {
        const overdue = tasks.filter((t) => isOverdue(t.deadline) && t.status !== 'completed');
        if (overdue.length === 0) {
          responseText = '✅ Great news! There are no overdue tasks right now. Your team is on track.';
        } else {
          responseText = `⚠️ **Overdue Tasks (${overdue.length})**\n\n${overdue
            .map((t) => {
              const assignee = employees.find((e) => e.id === t.assignee);
              return `• "${t.name}" — assigned to ${assignee ? assignee.name : 'Unknown'} (due ${formatDate(t.deadline)})`;
            })
            .join('\n')}\n\nWould you like me to send reminders to the assigned team members?`;
        }
      } else if (lower.includes('blocking') || lower.includes('block') || lower.includes('risk')) {
        responseText = `🔍 **Team Blockers & Risks**\n\n• **Rahul Sharma** has 8 active tasks — workload caution\n• "Implement offline sync" and "Fix push notification bugs" are urgent mobile app milestones\n• Recommendation: Redistribute 2 non-critical tasks to James Wilson.`;
      } else if (lower.includes('crm') || lower.includes('deal')) {
        responseText = `💼 **Active Deals Pipeline**\n\n• 4 active enterprise deals ($315,000 total pipeline value)\n• Won: Enterprise Supply Chain AI Engine ($120,000 for Acme Global)\n• Next Follow-up: Horizon Logistics proposal on Sept 1`;
      } else {
        responseText = `I understand your request for "${text}". I have logged the action across ${activeWorkspace.name}.\n\nYou can ask me to create tasks, inspect overdue items, draft client responses, or query paperwork workflows.`;
      }

      setChatHistory((prev) => [...prev, { role: 'ai', text: responseText }]);
    }, 1000);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  // Lookups
  const getEmployee = (id: string) => employees.find((e) => e.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getTasksForProject = (projectId: string) => tasks.filter((t) => t.project === projectId);
  const getTasksForEmployee = (employeeId: string) => tasks.filter((t) => t.assignee === employeeId);
  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);
  const getUpcomingMeetings = () => meetings.filter((m) => m.status !== 'completed');
  const getCompletedMeetings = () => meetings.filter((m) => m.status === 'completed');

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
        workspace: { name: activeWorkspace.name, plan: activeWorkspace.badge },
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
        chatHistory,
        documents,
        workflows,
        crm,
        integrations,
        webhooks,
        apiKeys,
        orgSettings,
        roles,
        auditLogs,
        auditLog: auditLogs,
        agents,
        ordisAgents: agents,
        customCrm: crm,
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
        sendInvitation,
        revokeInvitation,
        toggleAutomation,
        addAutomation,
        updateAutomation,
        deleteAutomation,
        sendOrdisMessage,
        markNotificationsRead,
        addDeal,
        updateDealStage,
        addContact,
        submitAgencyRequest,
        addDocument,
        updateDocument,
        toggleIntegration,
        addWebhook,
        addApiKey,
        revokeApiKey,
        updateOrgSettings,
        addAuditLog,
        toggleAgent,
        getEmployee,
        getProject,
        getTasksForProject,
        getTasksForEmployee,
        getTasksByStatus,
        getUpcomingMeetings,
        getCompletedMeetings,
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
