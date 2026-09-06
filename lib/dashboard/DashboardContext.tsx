'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOutUser } from '@/lib/auth/firebase';
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
} from './data';
import { executeOrdisCommand, OrdisContextState } from '@/lib/ordis/engine';

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
  ordisFloatingOpen: boolean;
  setOrdisFloatingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOrdisFloating: () => void;
  voiceMode: boolean;
  toggleVoiceMode: () => void;
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
  resetSettingsToDefault: (category?: 'workspace' | 'team' | 'notifications' | 'meetings' | 'ordis' | 'security' | 'all') => void;
  sendTestNotification: (title?: string, message?: string) => void;

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
  acceptInvitation: (invitationIdOrToken: string) => void;
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
  signOut: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const getPageFromPathname = (path: string | null): DashboardPageType => {
    if (!path || path === '/dashboard' || path === '/dashboard/') return 'home';
    const segment = path.replace(/^\/dashboard\/?/, '').split('/')[0];
    const validPages: DashboardPageType[] = [
      'home', 'ordis', 'tasks', 'projects', 'team', 'calendar',
      'meetings', 'analytics', 'documents', 'messages', 'settings'
    ];
    if (validPages.includes(segment as DashboardPageType)) {
      return segment as DashboardPageType;
    }
    return 'home';
  };

  const currentPage = getPageFromPathname(pathname);

  const setCurrentPage = (page: DashboardPageType) => {
    const target = page === 'home' ? '/dashboard' : `/dashboard/${page}`;
    router.push(target);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [ordisFloatingOpen, setOrdisFloatingOpen] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(false);
  const [selectedMeetingNotes, setSelectedMeetingNotes] = useState<Meeting | null>(null);
  const [genericModal, setGenericModal] = useState<GenericModalState | null>(null);
  const [profilePanelEmployeeId, setProfilePanelEmployeeId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toggleOrdisFloating = () => setOrdisFloatingOpen((prev) => !prev);
  const toggleVoiceMode = () => setVoiceMode((prev) => !prev);

  // Global Ctrl+J / Cmd+J shortcut for Ordis floating assistant
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOrdisFloatingOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

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
  const [teams] = useState<Team[]>(INITIAL_TEAMS);
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
      text: "⚡ **Ordis Workspace Copilot Online**\n\nI am connected to your live workspace. You can instruct me to:\n• *\"Create a task: Complete sprint review due Friday\"*\n• *\"What is my team working on?\"*\n• *\"Show upcoming deadlines\"*\n• *\"Schedule a team sync for tomorrow\"*\n• *\"Summarize project progress\"*\n\nHow can I help you operate your workspace today?",
    },
  ]);

  // Sync authenticated user from session on mount
  useEffect(() => {
    let isMounted = true;
    async function loadAuthSession() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const sessUser = data.data?.user || data.user;
          if (sessUser && isMounted) {
            const displayName = sessUser.displayName || sessUser.email.split('@')[0];
            const initials = displayName
              .split(' ')
              .filter(Boolean)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2) || 'CU';

            const activeUser: User = {
              id: sessUser.uid || 'u1',
              name: displayName,
              email: sessUser.email,
              initials,
              role: sessUser.role === 'owner' ? 'Founder & CEO' : 'Team Member',
              avatar: sessUser.photoURL || null,
              color: '#0f4cff',
              photoURL: sessUser.photoURL,
            };

            setUser(activeUser);

            // Ensure current user is in employees list
            setEmployees((prev) => {
              const existingIdx = prev.findIndex((e) => e.id === activeUser.id || e.email === activeUser.email || e.id === 'u1');
              if (existingIdx !== -1) {
                const updated = [...prev];
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  id: activeUser.id,
                  name: activeUser.name,
                  email: activeUser.email,
                  initials: activeUser.initials,
                };
                return updated;
              } else {
                return [
                  {
                    id: activeUser.id,
                    name: activeUser.name,
                    initials: activeUser.initials,
                    role: activeUser.role,
                    department: 'Leadership',
                    departmentId: 'dept_leadership',
                    teamIds: ['team_core'],
                    workspaceRole: 'owner',
                    status: 'online',
                    color: '#0f4cff',
                    tasks: 0,
                    projects: 0,
                    email: activeUser.email,
                    skills: ['Strategy', 'Leadership'],
                    joinedAt: new Date().toISOString().split('T')[0],
                  },
                  ...prev,
                ];
              }
            });
          }
        }
      } catch (err) {
        console.warn('Session sync notice:', err);
      }
    }
    loadAuthSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    showToast('Signing out of workspace...');
    await signOutUser('/login?logout=true');
  };

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

  // Helper to play notification chime
  const playNotificationChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore audio autoplay restrictions
    }
  };

  // Hydrate settings from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedWs = localStorage.getItem('cursis_workspace_settings');
      if (savedWs) {
        const parsed = JSON.parse(savedWs);
        setWorkspaceSettings((prev) => ({ ...prev, ...parsed }));
      }
      const savedTeam = localStorage.getItem('cursis_team_settings');
      if (savedTeam) {
        const parsed = JSON.parse(savedTeam);
        setTeamSettings((prev) => ({ ...prev, ...parsed }));
      }
      const savedNotif = localStorage.getItem('cursis_notification_settings');
      if (savedNotif) {
        const parsed = JSON.parse(savedNotif);
        setNotificationSettings((prev) => ({ ...prev, ...parsed }));
      }
      const savedMeet = localStorage.getItem('cursis_meeting_calendar_settings');
      if (savedMeet) {
        const parsed = JSON.parse(savedMeet);
        setMeetingCalendarSettings((prev) => ({ ...prev, ...parsed }));
      }
      const savedOrdis = localStorage.getItem('cursis_ordis_settings');
      if (savedOrdis) {
        const parsed = JSON.parse(savedOrdis);
        setOrdisSettings((prev) => ({ ...prev, ...parsed }));
      }
      const savedOrg = localStorage.getItem('cursis_org_settings');
      if (savedOrg) {
        const parsed = JSON.parse(savedOrg);
        setOrgSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Notice: Could not load cached settings:', e);
    }
  }, []);

  // Dynamically apply workspace accent color & layout density to DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (workspaceSettings.accentColor) {
      root.style.setProperty('--c-brand', workspaceSettings.accentColor);
      root.style.setProperty('--c-brand-hover', workspaceSettings.accentColor);
      root.style.setProperty('--c-info', workspaceSettings.accentColor);
    }
    if (workspaceSettings.density) {
      root.setAttribute('data-density', workspaceSettings.density);
    }
  }, [workspaceSettings.accentColor, workspaceSettings.density]);

  // ---- Settings Mutation Handlers with Persistence ----
  const updateWorkspaceSettings = (updates: Partial<WorkspaceSettings>) => {
    setWorkspaceSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('cursis_workspace_settings', JSON.stringify(next));
      } catch {}

      // Sync active workspace attributes (name, tagline, accentColor)
      setWorkspaces((wsList) =>
        wsList.map((w) => {
          if (w.id === activeWorkspaceId) {
            return {
              ...w,
              ...(updates.name ? { name: updates.name, shortName: updates.name } : {}),
              ...(updates.tagline ? { tagline: updates.tagline } : {}),
              ...(updates.accentColor ? { color: updates.accentColor } : {}),
            };
          }
          return w;
        })
      );

      if (updates.name || updates.industry || updates.timezone || updates.language || updates.dateFormat) {
        setOrgSettings((org) => {
          const nextOrg: OrgSettings = {
            ...org,
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.industry ? { industry: updates.industry } : {}),
            ...(updates.timezone ? { timezone: updates.timezone } : {}),
            ...(updates.language ? { language: updates.language } : {}),
            ...(updates.dateFormat ? { dateFormat: updates.dateFormat } : {}),
          };
          try {
            localStorage.setItem('cursis_org_settings', JSON.stringify(nextOrg));
          } catch {}
          return nextOrg;
        });
      }

      return next;
    });
    addAuditEntry(user.name, 'workspace.settings.updated', 'Workspace Settings', 'Updated workspace customization, identity, and theme');
    showToast('Workspace settings saved ✓');
  };

  const updateTeamSettings = (updates: Partial<TeamSettings>) => {
    setTeamSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('cursis_team_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
    addAuditEntry(user.name, 'team.settings.updated', 'Team Settings', 'Updated team governance, member permissions, and invite policies');
    showToast('Team settings updated ✓');
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('cursis_notification_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
    addAuditEntry(user.name, 'notifications.settings.updated', 'Notifications', 'Updated notification alerts and sound channels');
    showToast('Notification preferences saved ✓');
  };

  const updateMeetingCalendarSettings = (updates: Partial<MeetingCalendarSettings>) => {
    setMeetingCalendarSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('cursis_meeting_calendar_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
    addAuditEntry(user.name, 'calendar.settings.updated', 'Meeting & Calendar', 'Updated scheduling lead times, platform, and defaults');
    showToast('Calendar preferences saved ✓');
  };

  const updateOrdisSettings = (updates: Partial<OrdisSettings>) => {
    setOrdisSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('cursis_ordis_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
    addAuditEntry(user.name, 'ordis.settings.updated', 'Ordis AI', 'Updated autonomous action permissions, mode, and briefing');
    showToast('Ordis AI settings updated ✓');
  };

  const resetSettingsToDefault = (category?: 'workspace' | 'team' | 'notifications' | 'meetings' | 'ordis' | 'security' | 'all') => {
    if (!category || category === 'all' || category === 'workspace') {
      setWorkspaceSettings(INITIAL_WORKSPACE_SETTINGS);
      try { localStorage.removeItem('cursis_workspace_settings'); } catch {}
    }
    if (!category || category === 'all' || category === 'team') {
      setTeamSettings(INITIAL_TEAM_SETTINGS);
      try { localStorage.removeItem('cursis_team_settings'); } catch {}
    }
    if (!category || category === 'all' || category === 'notifications') {
      setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
      try { localStorage.removeItem('cursis_notification_settings'); } catch {}
    }
    if (!category || category === 'all' || category === 'meetings') {
      setMeetingCalendarSettings(INITIAL_MEETING_CALENDAR_SETTINGS);
      try { localStorage.removeItem('cursis_meeting_calendar_settings'); } catch {}
    }
    if (!category || category === 'all' || category === 'ordis') {
      setOrdisSettings(INITIAL_ORDIS_SETTINGS);
      try { localStorage.removeItem('cursis_ordis_settings'); } catch {}
    }
    if (!category || category === 'all' || category === 'security') {
      setOrgSettings(INITIAL_ORG_SETTINGS);
      try { localStorage.removeItem('cursis_org_settings'); } catch {}
    }
    addAuditEntry(user.name, 'settings.reset', 'Settings', `Reset ${category || 'all'} preferences to system defaults`);
    showToast(`Reset ${category || 'all'} preferences to defaults ✓`);
  };

  const sendTestNotification = (title?: string, message?: string) => {
    const text = title ? `${title}: ${message || ''}` : 'Test alert: Workspace notifications are working seamlessly!';
    setNotifications((prev) => [
      { id: 'notif_' + Date.now(), type: 'system', text, time: 'Just now', read: false, icon: '🔔' },
      ...prev,
    ]);
    if (notificationSettings.soundEnabled) {
      playNotificationChime();
    }
    showToast('🔔 Test notification sent to drawer!');
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
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'CU';

    const newEmp: Employee = {
      id: 'u_' + Date.now(),
      name: empData.name,
      initials,
      role: empData.role || 'Team Member',
      department: empData.department,
      departmentId: empData.departmentId || 'dept_' + empData.department.toLowerCase().replace(/\s+/g, '_'),
      teamIds: empData.teamIds || ['team_core'],
      workspaceRole: empData.workspaceRole || teamSettings.defaultRole,
      status: empData.status || 'online',
      color: empData.color || '#0f4cff',
      tasks: 0,
      projects: 0,
      email: empData.email || `${empData.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`,
      skills: empData.skills && empData.skills.length > 0 ? empData.skills : ['General'],
      joinedAt: new Date().toISOString().split('T')[0],
      invitedBy: user.id,
    };

    setEmployees((prev) => [...prev, newEmp]);
    addAuditEntry(user.name, 'team.member.added', newEmp.name, `Added ${newEmp.name} as ${newEmp.role} in ${newEmp.department}`);

    // Asynchronously persist to MongoDB
    try {
      fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          name: newEmp.name,
          displayName: newEmp.name,
          email: newEmp.email,
          role: newEmp.workspaceRole,
          department: newEmp.department,
          title: newEmp.role,
          skills: newEmp.skills,
          presence: newEmp.status,
        }),
      }).catch(() => {});
    } catch {}

    showToast(`Added ${newEmp.name} to team ✓`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    const emp = employees.find((e) => e.id === id);
    addAuditEntry(user.name, 'team.member.updated', emp?.name || id, `Updated profile / role details`);

    try {
      fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, updates }),
      }).catch(() => {});
    } catch {}

    showToast('Team member updated ✓');
  };

  const removeEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    addAuditEntry(user.name, 'team.member.removed', emp?.name || id, `Removed member from workspace`);

    try {
      fetch(`/api/team?userId=${id}&workspaceId=${activeWorkspaceId}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}

    showToast(`Removed ${emp?.name || 'member'} from workspace`);
  };

  const sendInvitation = (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null }) => {
    const token = 'tok_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const newInv: Invitation = {
      id: 'inv_' + Date.now(),
      email: inv.email.toLowerCase(),
      name: inv.name || inv.email.split('@')[0],
      roleTitle: inv.roleTitle || 'Team Member',
      workspaceRole: inv.workspaceRole || teamSettings.defaultRole,
      department: inv.department,
      team: inv.team,
      status: 'pending',
      token,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      invitedBy: user.id,
    };

    setInvitations((prev) => [newInv, ...prev]);
    addAuditEntry(user.name, 'team.invitation.sent', newInv.email, `Dispatched 7-day invite to ${newInv.email} (${newInv.workspaceRole})`);

    try {
      fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          workspaceId: activeWorkspaceId,
          email: newInv.email,
          name: newInv.name,
          roleTitle: newInv.roleTitle,
          workspaceRole: newInv.workspaceRole,
          department: newInv.department,
          team: newInv.team,
        }),
      }).catch(() => {});
    } catch {}

    showToast(`Invitation sent to ${inv.email} ✓`);
  };

  const revokeInvitation = (id: string) => {
    const inv = invitations.find((i) => i.id === id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    addAuditEntry(user.name, 'team.invitation.revoked', inv?.email || id, `Revoked invitation token`);

    try {
      fetch(`/api/team?invitationId=${id}&workspaceId=${activeWorkspaceId}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}

    showToast('Invitation revoked');
  };

  const acceptInvitation = (invitationIdOrToken: string) => {
    const inv = invitations.find((i) => i.id === invitationIdOrToken || i.token === invitationIdOrToken);
    if (!inv) {
      showToast('Invitation not found or expired');
      return;
    }

    const initials = inv.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'CU';

    const newEmp: Employee = {
      id: 'u_' + Date.now(),
      name: inv.name,
      initials,
      role: inv.roleTitle || 'Team Member',
      department: inv.department,
      departmentId: 'dept_' + inv.department.toLowerCase().replace(/\s+/g, '_'),
      teamIds: inv.team ? [inv.team] : ['team_core'],
      workspaceRole: inv.workspaceRole || teamSettings.defaultRole,
      status: 'online',
      color: '#10b981',
      tasks: 0,
      projects: 0,
      email: inv.email,
      skills: ['Collaboration', 'Cursis'],
      joinedAt: new Date().toISOString().split('T')[0],
      invitedBy: inv.invitedBy || user.id,
    };

    setEmployees((prev) => [...prev, newEmp]);
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    addAuditEntry(inv.name, 'team.invitation.accepted', inv.email, `Accepted workspace invitation as ${newEmp.role}`);

    try {
      fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', token: inv.token }),
      }).catch(() => {});
    } catch {}

    showToast(`Welcome ${newEmp.name} to the team! 🎉`);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read ✓');
  };

  // ---- Ordis Natural Language Commander ----
  const sendOrdisMessage = (text: string) => {
    if (!text.trim()) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { role: 'user', text, time: nowStr };
    const typingMsg: ChatMessage = { role: 'ai', text: null, typing: true };
    setChatHistory((prev) => [...prev, userMsg, typingMsg]);

    const ordisState: OrdisContextState = {
      user,
      workspace: { name: activeWorkspace.name, plan: 'Enterprise Pro' },
      activeWorkspace,
      employees,
      projects,
      tasks,
      meetings,
      notifications,
      activity,
      automations,
      documents,
      crm,
      integrations,
      webhooks,
      apiKeys,
      workspaceSettings,
      teamSettings,
      notificationSettings,
      meetingCalendarSettings,
      ordisSettings,
    };

    setTimeout(() => {
      setChatHistory((prev) => prev.filter((m) => !m.typing));
      const result = executeOrdisCommand(text, ordisState);

      // In-app navigation if requested
      if (result.navigateToPage) {
        setCurrentPage(result.navigateToPage);
      }

      // Apply any state mutations returned by Ordis
      if (result.stateMutations) {
        const m = result.stateMutations;
        if (m.createdTask) {
          setTasks((prev) => [m.createdTask!, ...prev]);
        }
        if (m.updatedTasks) {
          setTasks(m.updatedTasks);
        }
        if (m.createdProject) {
          setProjects((prev) => [m.createdProject!, ...prev]);
        }
        if (m.updatedProjects) {
          setProjects(m.updatedProjects);
        }
        if (m.createdMeeting) {
          setMeetings((prev) => [m.createdMeeting!, ...prev]);
        }
        if (m.createdDocument) {
          setDocuments((prev) => [m.createdDocument!, ...prev]);
        }
        if (m.createdAutomation) {
          setAutomations((prev) => [m.createdAutomation!, ...prev]);
        }
        if (m.updatedAutomations) {
          setAutomations(m.updatedAutomations);
        }
        if (m.createdDeal) {
          setCrm((prev) => ({
            ...prev,
            deals: [m.createdDeal!, ...prev.deals],
          }));
        }
        if (m.createdContact) {
          setCrm((prev) => ({
            ...prev,
            contacts: [m.createdContact!, ...prev.contacts],
          }));
        }
        if (m.createdInvitation) {
          setInvitations((prev) => [m.createdInvitation!, ...prev]);
        }
        if (m.createdEmployee) {
          setEmployees((prev) => [...prev, m.createdEmployee!]);
        }
        if (m.updatedEmployees) {
          setEmployees(m.updatedEmployees);
        }
        if (m.createdApiKey) {
          setApiKeys((prev) => [m.createdApiKey!, ...prev]);
        }
        if (m.createdWebhook) {
          setWebhooks((prev) => [m.createdWebhook!, ...prev]);
        }
        if (m.updatedWorkspaceSettings) {
          updateWorkspaceSettings(m.updatedWorkspaceSettings);
        }
        if (m.updatedNotificationSettings) {
          updateNotificationSettings(m.updatedNotificationSettings);
        }
        if (m.updatedMeetingCalendarSettings) {
          updateMeetingCalendarSettings(m.updatedMeetingCalendarSettings);
        }
        if (m.updatedOrdisSettings) {
          updateOrdisSettings(m.updatedOrdisSettings);
        }
        if (m.updatedTeamSettings) {
          updateTeamSettings(m.updatedTeamSettings);
        }
      }

      if (result.toastMessage) {
        showToast(result.toastMessage);
      }

      if (result.auditEntry) {
        addAuditEntry(
          result.auditEntry.actor,
          result.auditEntry.action,
          result.auditEntry.target,
          result.auditEntry.details
        );
      }

      // Add AI response to chat history
      const aiTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          text: result.responseText,
          time: aiTimeStr,
          actionCard: result.actionCard,
          suggestedFollowUps: result.suggestedFollowUps,
        },
      ]);

      // Asynchronously log execution to MongoDB audit trail endpoint
      try {
        fetch('/api/ordis/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: text,
            workspaceId: activeWorkspaceId,
            userId: user.id,
            userName: user.name,
            context: {
              taskCount: tasks.length,
              projectCount: projects.length,
              meetingCount: meetings.length,
            },
          }),
        }).catch(() => {});
      } catch {}
    }, 400);
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
    setOrgSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('cursis_org_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
    addAuditEntry(user.name, 'security.settings.updated', 'Security Policies', 'Updated workspace security policies and organization settings');
    showToast('Security & compliance settings saved ✓');
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
        ordisFloatingOpen,
        setOrdisFloatingOpen,
        toggleOrdisFloating,
        voiceMode,
        toggleVoiceMode,
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
        resetSettingsToDefault,
        sendTestNotification,
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
        acceptInvitation,
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
        signOut: handleSignOut,
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

