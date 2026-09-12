'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
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
 DynamicFeature,
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
 getUserWorkspaceName,
 getUserWorkspaceShortName,
} from './data';
import { executeOrdisCommand, OrdisContextState } from '@/lib/ordis/engine';
import { isFounderEmail } from '@/lib/auth/founder';

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
 updateDocument: (id: string, updates: Partial<DocumentItem>) => void;
 deleteDocument: (id: string) => void;
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
 fetchAuditLogs: () => Promise<void>;

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
 removeEmployee: (id: string) => Promise<void> | void;
 sendInvitation: (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null; planTier?: 'standard' }) => void;
 revokeInvitation: (id: string) => void;
 acceptInvitation: (invitationIdOrToken: string) => void;
 sendOrdisMessage: (text: string) => void;
 markNotificationsRead: () => void;

  // Department Management
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  addDepartment: (dept: { name: string; description?: string; lead?: string; budget?: string; color?: string; tags?: string[] }) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => boolean;
  assignEmployeeDepartment: (employeeId: string, departmentId: string, departmentName: string) => void;

  // Dynamic Features
  dynamicFeatures: DynamicFeature[];
  setDynamicFeatures: React.Dispatch<React.SetStateAction<DynamicFeature[]>>;

  // Ordis AI Engine State & Settings
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  ordisModel: string;
  setOrdisModel: (model: string) => void;
  aiEngineStatus: 'gemini' | 'local_fallback';

  // Enterprise Directory & Vouchers
  seedEnterpriseDirectory: (targetCount?: number) => void;
  resetEnterpriseDirectory: () => void;
  redeemedCodes: string[];
  redeemCode: (code: string) => Promise<{ success: boolean; message: string; perks?: string[] }>;

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
      'home', 'ordis', 'tasks', 'projects', 'team', 'departments', 'documents', 'calendar',
      'meetings', 'analytics', 'settings'
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
 
 // Ordis Floating & Voice State
 const [ordisFloatingOpen, setOrdisFloatingOpen] = useState(false);
 const [voiceMode, setVoiceMode] = useState(false);

  // Dynamic Features State
  const [dynamicFeatures, setDynamicFeatures] = useState<DynamicFeature[]>([
 {
 id: 'feat_csat_enterprise',
 name: 'Client CSAT & Feedback Collector',
 category: 'Client Experience & CRM',
 description: 'Collects NPS and 5-star feedback ratings from clients upon project milestone completion.',
 icon: '',
 fields: [
 { name: 'Client Email', type: 'email', placeholder: 'client@company.com' },
 { name: 'CSAT Rating (1-5)', type: 'number', placeholder: '5' },
 { name: 'Feedback Notes', type: 'textarea', placeholder: 'Client remarks...' },
 ],
 actions: [
 { label: 'Submit CSAT Review', actionKey: 'submit', style: 'primary' },
 { label: 'Export Report', actionKey: 'export', style: 'secondary' },
 ],
 status: 'active',
 createdAt: new Date().toISOString(),
 builtBy: 'ordis_pro',
 },
 ]);



 // Ordis AI Engine State & Persistent Settings
 const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
 if (typeof window !== 'undefined') {
 return localStorage.getItem('cursis_gemini_api_key') || '';
 }
 return '';
 });

 const setGeminiApiKey = (key: string) => {
 setGeminiApiKeyState(key);
 if (typeof window !== 'undefined') {
 localStorage.setItem('cursis_gemini_api_key', key);
 }
 };

 const [ordisModel, setOrdisModelState] = useState<string>(() => {
 if (typeof window !== 'undefined') {
 return localStorage.getItem('cursis_ordis_model') || 'gemini-2.5-flash';
 }
 return 'gemini-2.5-flash';
 });

 const setOrdisModel = (m: string) => {
 setOrdisModelState(m);
 if (typeof window !== 'undefined') {
 localStorage.setItem('cursis_ordis_model', m);
 }
 };

 const [aiEngineStatus, setAiEngineStatus] = useState<'gemini' | 'local_fallback'>('local_fallback');

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
  const removedMemberIdsRef = useRef<Set<string>>(new Set());
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
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



 const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('cursis_redeemed_codes');
      if (saved) setRedeemedCodes(JSON.parse(saved));
    } catch {}

    fetch('/api/redeem')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.redeemedCodes)) {
          setRedeemedCodes((prev) => Array.from(new Set([...prev, ...data.redeemedCodes])));
        }
      })
      .catch(() => {});
  }, []);

 const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
 {
 role: 'ai',
 text: "**Ordis Workspace Copilot Online**\n\nI am connected to your live workspace. You can instruct me to:\n• *\"Create a task: Complete sprint review due Friday\"*\n• *\"What is my team working on?\"*\n• *\"Show upcoming deadlines\"*\n• *\"Schedule a team sync for tomorrow\"*\n• *\"Summarize project progress\"*\n\nHow can I help you operate your workspace today?",
 },
 ]);

  // Dynamically keep default workspace name in sync with user's name
  useEffect(() => {
    if (!user?.name || user.name === 'Workspace Member') return;

    // Check if user set a custom workspace name in setup wizard
    const customWsName = typeof window !== 'undefined' ? localStorage.getItem('cursis_custom_workspace_name') : null;
    if (customWsName) {
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === 'ws_default' || w.id === 'ws_public' || !w.isCustomClient) {
            return {
              ...w,
              name: customWsName,
              shortName: customWsName.slice(0, 3).toUpperCase(),
            };
          }
          return w;
        })
      );
      setWorkspaceSettings((prev) => ({ ...prev, name: customWsName }));
      setOrgSettings((prev) => ({ ...prev, name: customWsName }));
      return;
    }

    const userWsName = getUserWorkspaceName(user.name);
    const userWsShortName = getUserWorkspaceShortName(user.name);

    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === 'ws_default' || w.id === 'ws_public' || !w.isCustomClient) {
          if (
            w.name === 'Cursis Workspace' ||
            w.name === 'Cursis HQ' ||
            w.name === 'My Workspace' ||
            w.name.endsWith("'s Workspace") ||
            w.name.endsWith("' Workspace")
          ) {
            return {
              ...w,
              name: userWsName,
              shortName: userWsShortName,
            };
          }
        }
        return w;
      })
    );

    setWorkspaceSettings((prev) => {
      if (
        !prev.name ||
        prev.name === 'Cursis HQ' ||
        prev.name === 'Cursis Workspace' ||
        prev.name === 'My Workspace' ||
        prev.name.endsWith("'s Workspace") ||
        prev.name.endsWith("' Workspace")
      ) {
        return { ...prev, name: userWsName };
      }
      return prev;
    });

    setOrgSettings((prev) => {
      if (
        !prev.name ||
        prev.name === 'Cursis HQ' ||
        prev.name === 'Cursis Workspace' ||
        prev.name === 'My Workspace' ||
        prev.name.endsWith("'s Workspace") ||
        prev.name.endsWith("' Workspace")
      ) {
        return { ...prev, name: userWsName };
      }
      return prev;
    });
  }, [user.name]);

  // Persistent Team & Notifications Synchronization with MongoDB
  const syncTeamAndNotifications = async (wsId?: string) => {
    const targetWsId = wsId || activeWorkspaceId || 'ws_public';
    try {
      // 1. Fetch live team members and invitations from MongoDB
      const teamRes = await fetch(`/api/team?workspaceId=${encodeURIComponent(targetWsId)}`, {
        credentials: 'include',
      });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        const serverTeam = teamData.data?.team || teamData.team;
        const serverInvs = teamData.data?.invitations || teamData.invitations;

        if (Array.isArray(serverTeam) && serverTeam.length > 0) {
          setEmployees((prev) => {
            const mappedServer = serverTeam
              .filter((u: any) => {
                const uId = u.id || u.uid;
                const cleanEmail = (u.email || '').trim().toLowerCase();
                if (uId && removedMemberIdsRef.current.has(uId)) return false;
                if (cleanEmail && removedMemberIdsRef.current.has(cleanEmail)) return false;
                return true;
              })
              .map((u: any): Employee => {
                const cleanEmail = (u.email || '').trim().toLowerCase();
                const isMemFounder = isFounderEmail(cleanEmail);
                const displayName = u.displayName || u.name || (cleanEmail ? cleanEmail.split('@')[0] : 'Team Member');
                const initials = displayName
                  .split(' ')
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2) || 'CU';

                const roleTitle = isMemFounder ? 'Founder & CEO' : (u.title || u.role || 'Team Member');
                const deptName = isMemFounder ? 'Leadership' : (u.department || 'Engineering');
                const deptId = isMemFounder ? 'dept_leadership' : ('dept_' + deptName.toLowerCase().replace(/\s+/g, '_'));
                const wsRole = isMemFounder ? 'owner' : (u.role === 'owner' ? 'member' : (u.role || 'member'));
                const tier = (u.planTier as 'standard') || 'standard';

                return {
                  id: u.id || u.uid || 'u_' + Math.random().toString(36).substring(2, 8),
                  name: displayName,
                  initials,
                  role: roleTitle,
                  department: deptName,
                  departmentId: deptId,
                  teamIds: u.teamIds || ['team_core'],
                  workspaceRole: wsRole,
                  status: u.presence || 'online',
                  color: u.color || (isMemFounder ? '#0f4cff' : '#f59e0b'),
                  tasks: typeof u.tasks === 'number' ? u.tasks : 0,
                  projects: typeof u.projects === 'number' ? u.projects : 0,
                  email: cleanEmail,
                  skills: u.skills && u.skills.length > 0 ? u.skills : (isMemFounder ? ['Strategy', 'Leadership', 'Architecture'] : ['General']),
                  joinedAt: u.createdAt ? u.createdAt.split('T')[0] : (u.joinedAt || new Date().toISOString().split('T')[0]),
                  invitedBy: u.invitedBy || null,
                  planTier: tier,
                };
              });

            // Merge with local state to preserve any optimistic items without duplicates
            const combined = [...mappedServer];
            for (const p of prev) {
              const pEmail = (p.email || '').trim().toLowerCase();
              if (
                !removedMemberIdsRef.current.has(p.id) &&
                (!pEmail || !removedMemberIdsRef.current.has(pEmail)) &&
                !p.id.startsWith('u_std_') &&
                !p.id.startsWith('u_pro_') &&
                !p.id.startsWith('emp_') &&
                !combined.some((c) => c.id === p.id || (c.email && p.email && c.email.toLowerCase() === p.email.toLowerCase()))
              ) {
                combined.push(p);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(serverInvs)) {
          setInvitations(serverInvs);
        }
      }

      // 2. Fetch user's persistent notifications from MongoDB
      const notifRes = await fetch(`/api/notifications?workspaceId=${encodeURIComponent(targetWsId)}`, {
        credentials: 'include',
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        const serverNotifs = notifData.data?.notifications || notifData.notifications;
        if (Array.isArray(serverNotifs)) {
          setNotifications(
            serverNotifs.map((n: any): NotificationItem => {
              let timeStr = 'Just now';
              if (n.createdAt) {
                const diffMs = Date.now() - new Date(n.createdAt).getTime();
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) timeStr = 'Just now';
                else if (diffMin < 60) timeStr = `${diffMin}m ago`;
                else {
                  const diffHr = Math.floor(diffMin / 60);
                  if (diffHr < 24) timeStr = `${diffHr}h ago`;
                  else timeStr = `${Math.floor(diffHr / 24)}d ago`;
                }
              }
              return {
                id: n.id || 'notif_' + Math.random().toString(36).substring(2, 8),
                type: n.type || 'team',
                text: n.text || n.message || 'Notification',
                time: timeStr,
                read: Boolean(n.read),
                icon: n.icon || 'bell',
              };
            })
          );
        }
      }
    } catch (e) {
      console.warn('Notice: Background sync error:', e);
    }
  };

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

        const isFounder = isFounderEmail(sessUser.email);
        const userRoleTitle = isFounder ? 'Founder & CEO' : (sessUser.title || 'User');
        const userWorkspaceRole = isFounder ? 'owner' : (sessUser.role === 'owner' ? 'member' : (sessUser.role || 'member'));
        const userDept = isFounder ? 'Leadership' : (sessUser.department || 'Engineering');
        const userDeptId = isFounder ? 'dept_leadership' : ('dept_' + userDept.toLowerCase().replace(/\s+/g, '_'));
        const userSkills = isFounder ? ['Strategy', 'Leadership', 'Architecture'] : (sessUser.skills || ['General']);

        const userPlanTier = 'standard';
        const activeUser: User = {
          id: sessUser.uid || 'u1',
          name: displayName,
          email: sessUser.email,
          initials,
          role: userRoleTitle,
          avatar: sessUser.photoURL || null,
          color: isFounder ? '#0f4cff' : '#f59e0b',
          photoURL: sessUser.photoURL,
          planTier: userPlanTier,
        };

        setUser(activeUser);

        // Dynamically name default workspace based on authenticated user or custom setup name
        const customWsName = typeof window !== 'undefined' ? localStorage.getItem('cursis_custom_workspace_name') : null;
        const userWsName = customWsName || getUserWorkspaceName(activeUser.name);
        const userWsShortName = customWsName ? customWsName.slice(0, 3).toUpperCase() : getUserWorkspaceShortName(activeUser.name);

        setWorkspaces((prev) =>
          prev.map((w) => {
            if (w.id === 'ws_default' || w.id === 'ws_public' || !w.isCustomClient) {
              return {
                ...w,
                name: userWsName,
                shortName: userWsShortName,
              };
            }
            return w;
          })
        );

        setWorkspaceSettings((prev) => {
          if (!prev.name || prev.name === 'Cursis HQ' || prev.name === 'Cursis Workspace' || prev.name === 'My Workspace') {
            return { ...prev, name: userWsName };
          }
          return prev;
        });

        setOrgSettings((prev) => {
          if (!prev.name || prev.name === 'Cursis HQ' || prev.name === 'Cursis Workspace' || prev.name === 'My Workspace') {
            return { ...prev, name: userWsName };
          }
          return prev;
        });

        // Ensure current user is in employees list and purge any fake simulated members
        setEmployees((prev) => {
          const cleanPrev = prev.filter((e) => !e.id.startsWith('u_std_') && !e.id.startsWith('u_pro_') && !e.id.startsWith('emp_'));
          const existingIdx = cleanPrev.findIndex((e) => e.id === activeUser.id || (e.email && activeUser.email && e.email.toLowerCase() === activeUser.email.toLowerCase()) || e.id === 'u1');
          if (existingIdx !== -1) {
            const updated = [...cleanPrev];
            const prevEmp = updated[existingIdx];
            const targetIsFounder = isFounderEmail(activeUser.email);
            updated[existingIdx] = {
              ...prevEmp,
              id: activeUser.id,
              name: activeUser.name,
              email: activeUser.email,
              initials: activeUser.initials,
              role: targetIsFounder ? 'Founder & CEO' : (!/founder|ceo/i.test(prevEmp.role) ? prevEmp.role : (activeUser.role || 'User')),
              department: targetIsFounder ? 'Leadership' : (prevEmp.department === 'Leadership' ? 'Engineering' : (prevEmp.department || 'Engineering')),
              departmentId: targetIsFounder ? 'dept_leadership' : (prevEmp.departmentId === 'dept_leadership' ? 'dept_engineering' : (prevEmp.departmentId || 'dept_engineering')),
              workspaceRole: targetIsFounder ? 'owner' : (prevEmp.workspaceRole === 'owner' ? 'member' : (prevEmp.workspaceRole || 'member')),
              planTier: prevEmp.planTier || userPlanTier,
            };
            return updated;
          } else {
            return [
              {
                id: activeUser.id,
                name: activeUser.name,
                initials: activeUser.initials,
                role: userRoleTitle,
                department: userDept,
                departmentId: userDeptId,
                teamIds: ['team_core'],
                workspaceRole: userWorkspaceRole,
                status: 'online',
                color: isFounder ? '#0f4cff' : '#f59e0b',
                tasks: 0,
                projects: 0,
                email: activeUser.email,
                skills: userSkills,
                joinedAt: new Date().toISOString().split('T')[0],
                planTier: userPlanTier,
              },
              ...cleanPrev,
            ];
          }
        });

        // Hydrate team and notifications from MongoDB
        syncTeamAndNotifications(sessUser.workspaceId || 'ws_public');
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

  // Real-time polling & window focus synchronization for multi-user dashboard updates
  useEffect(() => {
    const interval = setInterval(() => {
      syncTeamAndNotifications(activeWorkspaceId);
    }, 15000);

    let focusTimer: NodeJS.Timeout | null = null;
    const handleFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        syncTeamAndNotifications(activeWorkspaceId);
      }, 1000);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      if (focusTimer) clearTimeout(focusTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeWorkspaceId]);

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
 if (parsed.name === 'Cursis HQ' || parsed.name === 'Cursis Workspace' || parsed.name === 'My Workspace') {
 delete parsed.name;
 }
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

 // Fetch audit logs from backend on mount
 useEffect(() => {
 if (typeof window === 'undefined') return;
 const token = localStorage.getItem('cursis_token');
 fetch('/api/security/audit-logs', {
 headers: token ? { Authorization: `Bearer ${token}` } : {},
 credentials: 'include',
 })
 .then((res) => res.ok ? res.json() : null)
 .then((data) => {
 if (data?.auditLogs && Array.isArray(data.auditLogs)) {
 const mapped: AuditLogItem[] = data.auditLogs.map((log: any) => ({
 id: log.id,
 actor: log.actorName || log.actor || 'System',
 action: log.action || '',
 target: log.targetType || log.target || '',
 details: typeof log.details === 'object' ? (log.details?.summary || JSON.stringify(log.details)) : String(log.details || ''),
 timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
 }));
 if (mapped.length > 0) setAuditLogs(mapped);
 }
 })
 .catch(() => {});
 }, []);

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
 showToast('Workspace settings saved ');
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
 showToast('Team settings updated ');
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
 showToast('Notification preferences saved ');
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
 showToast('Calendar preferences saved ');
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
 showToast('Ordis AI settings updated ');
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
 showToast(`Reset ${category || 'all'} preferences to defaults `);
 };

 const sendTestNotification = (title?: string, message?: string) => {
 const text = title ? `${title}: ${message || ''}` : 'Test alert: Workspace notifications are working seamlessly!';
 setNotifications((prev) => [
 { id: 'notif_' + Date.now(), type: 'system', text, time: 'Just now', read: false, icon: '' },
 ...prev,
 ]);
 if (notificationSettings.soundEnabled) {
 playNotificationChime();
 }
 showToast(' Test notification sent to drawer!');
 };

 // ---- Audit Log Mutation ----
 const fetchAuditLogs = async () => {
 try {
 const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
 const res = await fetch('/api/security/audit-logs', {
 headers: token ? { Authorization: `Bearer ${token}` } : {},
 credentials: 'include',
 });
 if (res.ok) {
 const data = await res.json();
 if (data.auditLogs && Array.isArray(data.auditLogs)) {
 const mapped: AuditLogItem[] = data.auditLogs.map((log: any) => ({
 id: log.id,
 actor: log.actorName || log.actor || 'System',
 action: log.action || '',
 target: log.targetType || log.target || '',
 details: typeof log.details === 'object' ? (log.details?.summary || JSON.stringify(log.details)) : String(log.details || ''),
 timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
 }));
 setAuditLogs(mapped);
 }
 }
 } catch (e) {
 console.warn('fetchAuditLogs notice:', e);
 }
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

 // Persist to backend
 const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
 fetch('/api/security/audit-logs', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { Authorization: `Bearer ${token}` } : {}),
 },
 credentials: 'include',
 body: JSON.stringify({ action, target, details }),
 }).catch(() => {});
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
 { id: 'notif_' + Date.now(), type: 'task', text: actText, time: 'Just now', read: false, icon: '' },
 ...prev,
 ]);
 }

 showToast(`Task "${newTask.name}" created `);
 };

 const updateTask = (id: string, updates: Partial<Task>) => {
 setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
 showToast('Task updated ');
 };

  const deleteTask = (id: string) => {
    const existing = tasks.find((t) => t.id === id);
    if (existing) {
      // Decrement employee task count
      if (existing.assignee) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === existing.assignee ? { ...e, tasks: Math.max(0, e.tasks - 1) } : e))
        );
      }
      // Decrement project task count
      if (existing.project) {
        setProjects((prev) =>
          prev.map((p) => (p.id === existing.project ? { ...p, tasks: Math.max(0, p.tasks - 1) } : p))
        );
      }
      // Add audit entry
      addAuditEntry(user.name, 'task.deleted', existing.name, `Deleted task "${existing.name}"`);
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));

    // Async persist to API
    try {
      fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    showToast('Task deleted successfully');
  };

 const assignTask = (taskId: string, assigneeIds: string[]) => {
 const primary = assigneeIds[0] || user.id;
 setTasks((prev) =>
 prev.map((t) => (t.id === taskId ? { ...t, assignee: primary, assignees: assigneeIds } : t))
 );
 showToast('Task assigned ');
 };

 const updateTaskStatus = (taskId: string, status: TaskStatus) => {
 setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
 showToast(`Task status moved to ${status} `);
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
 icon: projData.icon || '',
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
 showToast(`Project "${newProj.name}" created `);
 };

 const updateProject = (id: string, updates: Partial<Project>) => {
 setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
 showToast('Project updated ');
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
 showToast(`Meeting "${newM.name}" scheduled `);
 };

 const updateMeeting = (id: string, updates: Partial<Meeting>) => {
 setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
 showToast('Meeting updated ');
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

 const assignedTier = 'standard';

    const cleanEmpEmail = empData.email ? empData.email.trim().toLowerCase() : `${empData.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`;
    const isEmpFounder = isFounderEmail(cleanEmpEmail);
    let sanitizedRole = empData.role || 'Team Member';
    let sanitizedWorkspaceRole = empData.workspaceRole || teamSettings.defaultRole;

    if (!isEmpFounder) {
      if (/founder|ceo/i.test(sanitizedRole)) {
        sanitizedRole = 'Team Member';
      }
      if (sanitizedWorkspaceRole === 'owner') {
        sanitizedWorkspaceRole = 'member';
      }
    } else {
      sanitizedRole = 'Founder & CEO';
      sanitizedWorkspaceRole = 'owner';
    }

    const newEmp: Employee = {
      id: 'u_' + Date.now(),
      name: empData.name,
      initials,
      role: sanitizedRole,
      department: isEmpFounder ? 'Leadership' : empData.department,
      departmentId: isEmpFounder ? 'dept_leadership' : (empData.departmentId || 'dept_' + empData.department.toLowerCase().replace(/\s+/g, '_')),
      teamIds: empData.teamIds || ['team_core'],
      workspaceRole: sanitizedWorkspaceRole,
      status: empData.status || 'online',
      color: empData.color || '#0f4cff',
      tasks: 0,
      projects: 0,
      email: cleanEmpEmail,
      skills: isEmpFounder ? ['Founder & CEO', 'Strategy', 'Architecture'] : (empData.skills && empData.skills.length > 0 ? empData.skills : ['General']),
      joinedAt: new Date().toISOString().split('T')[0],
      invitedBy: user.id,
      planTier: assignedTier,
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
          planTier: newEmp.planTier,
        }),
      })
        .then(() => {
          syncTeamAndNotifications(activeWorkspaceId);
        })
        .catch(() => {});
    } catch {}

    showToast(`Added ${newEmp.name} to team `);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const existing = employees.find((e) => e.id === id);
    const targetEmail = updates.email || existing?.email;
    const isTargetFounder = isFounderEmail(targetEmail);

    const sanitizedUpdates = { ...updates };
    if (!isTargetFounder) {
      if (sanitizedUpdates.role && /founder|ceo/i.test(sanitizedUpdates.role)) {
        sanitizedUpdates.role = 'User';
      }
      if (sanitizedUpdates.workspaceRole === 'owner') {
        sanitizedUpdates.workspaceRole = 'member';
      }
    }

    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...sanitizedUpdates } : e)));
    const emp = employees.find((e) => e.id === id);
    addAuditEntry(user.name, 'team.member.updated', emp?.name || id, `Updated profile / role details`);

    try {
      fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, updates: sanitizedUpdates }),
      }).catch(() => {});
    } catch {}

    showToast('Team member updated ');
  };

  const removeEmployee = async (id: string) => {
    const emp = employees.find((e) => e.id === id);
    const empEmail = (emp?.email || '').trim().toLowerCase();

    // Blacklist immediately from any incoming background syncs
    removedMemberIdsRef.current.add(id);
    if (empEmail) {
      removedMemberIdsRef.current.add(empEmail);
    }

    setEmployees((prev) =>
      prev.filter((e) => e.id !== id && (!empEmail || (e.email || '').trim().toLowerCase() !== empEmail))
    );
    if (profilePanelEmployeeId === id) {
      setProfilePanelEmployeeId(null);
    }
    addAuditEntry(user.name, 'team.member.removed', emp?.name || id, `Removed member from workspace`);
    showToast(`Removed ${emp?.name || 'member'} from workspace`);

    try {
      const queryParams = new URLSearchParams({
        userId: id,
        workspaceId: activeWorkspaceId,
      });
      if (empEmail) {
        queryParams.set('email', empEmail);
      }

      await fetch(`/api/team?${queryParams.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Notice: Error removing member:', err);
    }
  };

  const seedEnterpriseDirectory = () => {
    showToast('Enterprise directory is active. Team members are managed via invitations.');
  };

  const resetEnterpriseDirectory = () => {
    setEmployees((prev) => {
      const genuine = prev.filter((e) => !e.id.startsWith('u_std_') && !e.id.startsWith('u_pro_') && !e.id.startsWith('emp_'));
      return genuine.length > 0
        ? genuine
        : (user.email
          ? [
              {
                id: user.id || 'u_owner',
                name: user.name || 'Founder',
                initials: user.initials || 'FC',
                role: user.role || 'Founder & CEO',
                department: 'Leadership',
                departmentId: 'dept_leadership',
                teamIds: ['team_core'],
                workspaceRole: user.workspaceRole || 'owner',
                status: 'online',
                color: '#0f4cff',
                tasks: 0,
                projects: 0,
                email: user.email,
                skills: ['Leadership', 'Strategy'],
                joinedAt: new Date().toISOString().split('T')[0],
                planTier: 'standard',
              },
            ]
          : []);
    });
    showToast('Enterprise directory cleaned: zero mock records');
  };

  const redeemCode = async (rawCode: string): Promise<{ success: boolean; message: string; perks?: string[] }> => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { success: false, message: 'Please enter a valid redeem code.' };
    }

    if (redeemedCodes.includes(code)) {
      return { success: false, message: `Code "${code}" has already been redeemed and can only be used once.` };
    }

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user.id, email: user.email, workspaceId: activeWorkspaceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.alreadyRedeemed) {
          setRedeemedCodes((prev) => Array.from(new Set([...prev, code])));
          try {
            const cur = JSON.parse(localStorage.getItem('cursis_redeemed_codes') || '[]');
            localStorage.setItem('cursis_redeemed_codes', JSON.stringify(Array.from(new Set([...cur, code]))));
          } catch {}
        }
        return {
          success: false,
          message: data.message || `Code "${code}" could not be redeemed.`,
        };
      }
    } catch (err) {
      console.warn('Backend redeem check error:', err);
    }

    let perks: string[] = [];
    let isSpecialFeatureUnlock = false;

    if (code === 'CURSIS-PRO-2026') {
      perks = [
        'Executive Autonomous Copilot Unlocked',
        '⚡ Real-Time Bottleneck Detection',
        '🚀 Unlimited Multi-Agent Execution',
      ];
    } else if (code === 'ENTERPRISE-SCALE-4') {
      perks = [
        '🏢 Enterprise Feature Pack Granted',
        '🤖 Ordis Autonomous Copilot & Ambient Scanner Active',
        '🌐 Full 2,000-User Enterprise Scale Support',
        '📊 Instant Enterprise Telemetry Synthesis',
      ];
    } else if (code === 'ORDIS-VIP-ACCESS') {
      perks = [
        '👑 Executive VIP Access Activated',
        '🤖 Ordis Autonomous Agents Active (Bottleneck Scanner & Copilot)',
        '🔒 SOC-2 Audit Telemetry Access',
      ];
    } else if (code === 'FEATURE-STUDIO-PRO') {
      perks = [
        '✨ Dynamic Feature Builder Studio Unlocked',
        '📈 Executive KPI Telemetry Synthesized',
        '🛡️ AI Code Review & Deployment Gatekeeper Active',
      ];
      isSpecialFeatureUnlock = true;
    } else if (code === 'SPECIAL-FOUNDER') {
      perks = [
        '👑 Sovereign Founder Tier Activated',
        '🌟 VIP Founder Badge Unlocked',
        '⚡ Unlimited Ambient Copilot Cycles',
        '🚀 Zero Rate-Limit Autonomy',
      ];
    } else if (code.startsWith('CURSIS-') || code.startsWith('VIP-') || code.startsWith('PRO-')) {
      perks = [
        'Executive Autonomous Copilot Active',
        '🏢 Enterprise Feature Entitlement',
      ];
    } else {
      return {
        success: false,
        message: 'Invalid or expired redeem code. Please check your voucher and try again.',
      };
    }

    setUser((prev) => ({ ...prev, planTier: 'standard' }));
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === activeWorkspaceId ? { ...w, tier: 'paid' } : w))
    );

    if (isSpecialFeatureUnlock || code === 'CURSIS-PRO-2026' || code === 'ENTERPRISE-SCALE-4') {
      const specialTelemetryFeature: DynamicFeature = {
        id: 'feat_exec_telemetry_' + Date.now(),
        name: 'Executive KPI Telemetry Studio',
        category: 'Analytics & Strategy',
        description: 'Autonomous ambient scanner that computes company-wide sprint velocity, cost optimization, and bottleneck risks.',
        icon: '',
        fields: [
          { name: 'targetQuarter', type: 'text', placeholder: 'Q3 / Q4 2026' },
          { name: 'riskThreshold', type: 'select', placeholder: 'High Risk (>3 Blockers)' },
        ],
        actions: [
          { label: 'Run Ambient Diagnostics', actionKey: 'run_diagnostics', style: 'primary' },
          { label: 'Export Board Deck', actionKey: 'export_deck', style: 'secondary' },
        ],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        builtBy: 'ordis_pro',
      };

      const specialCodeReviewFeature: DynamicFeature = {
        id: 'feat_code_guard_' + Date.now(),
        name: 'Autonomous Code Review & QA Pipeline',
        category: 'Engineering & DevOps',
        description: 'Auto-scans PRs and task commits for regression vulnerabilities, performance regressions, and architectural invariants.',
        icon: '',
        fields: [
          { name: 'repositoryBranch', type: 'text', placeholder: 'main / production' },
          { name: 'coverageGoal', type: 'text', placeholder: '90%' },
        ],
        actions: [
          { label: 'Trigger Full Codebase Audit', actionKey: 'audit_codebase', style: 'primary' },
          { label: 'Sync CI/CD Webhook', actionKey: 'sync_webhook', style: 'accent' },
        ],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        builtBy: 'ordis_pro',
      };

      setDynamicFeatures((prev) => {
        const hasTelemetry = prev.some((f) => f.name.includes('Executive KPI'));
        const additions = [];
        if (!hasTelemetry) additions.push(specialTelemetryFeature);
        additions.push(specialCodeReviewFeature);
        return [...additions, ...prev];
      });
    }

    const nextRedeemed = [...redeemedCodes, code];
    setRedeemedCodes(nextRedeemed);
    try {
      localStorage.setItem('cursis_redeemed_codes', JSON.stringify(nextRedeemed));
    } catch {}

    addAuditEntry(user.name, 'voucher.code.redeemed', code, `Claimed ${perks.length} enterprise features via voucher`);
    showToast(` Code "${code}" redeemed! Executive and Special Features unlocked.`);

    try {
      fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, updates: { planTier: 'standard' } }),
      }).catch(() => {});
    } catch {}

    return {
      success: true,
      message: `Code "${code}" successfully redeemed!`,
      perks,
    };
  };

  const sendInvitation = (inv: { email: string; name?: string; roleTitle?: string; workspaceRole: string; department: string; team: string | null; planTier?: 'standard' }) => {
    const token = 'tok_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const assignedTier = 'standard';
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
      planTier: assignedTier,
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
          planTier: assignedTier,
        }),
      })
        .then(() => {
          syncTeamAndNotifications(activeWorkspaceId);
        })
        .catch(() => {});
    } catch {}

    showToast(`Invitation sent to ${inv.email} `);
  };

  const revokeInvitation = (id: string) => {
    const inv = invitations.find((i) => i.id === id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    addAuditEntry(user.name, 'team.invitation.revoked', inv?.email || id, `Revoked invitation token`);

    try {
      fetch(`/api/team?invitationId=${id}&workspaceId=${activeWorkspaceId}`, {
        method: 'DELETE',
      })
        .then(() => {
          syncTeamAndNotifications(activeWorkspaceId);
        })
        .catch(() => {});
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
      planTier: inv.planTier || 'standard',
    };

    setEmployees((prev) => [...prev, newEmp]);
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    addAuditEntry(inv.name, 'team.invitation.accepted', inv.email, `Accepted workspace invitation as ${newEmp.role}`);

    try {
      fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', token: inv.token }),
      })
        .then(() => {
          syncTeamAndNotifications(activeWorkspaceId);
        })
        .catch(() => {});
    } catch {}

    showToast(`Welcome ${newEmp.name} to the team! `);
  };

  const markNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    } catch {}
    showToast('All notifications marked as read ');
  };

 // ---- Ordis Natural Language Commander & Conversational AI Chatbot ----
 const sendOrdisMessage = async (text: string) => {
 if (!text.trim()) return;
 const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 const userMsg: ChatMessage = { role: 'user', text, time: nowStr };
 const typingMsg: ChatMessage = { role: 'ai', text: null, typing: true };
 setChatHistory((prev) => [...prev, userMsg, typingMsg]);

 const ordisState: OrdisContextState = {
 plan: 'basic',
 user,
 workspace: { name: activeWorkspace.name, plan: 'Cursis Starter Basic' },
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

 const applyResult = (result: any, source: 'gemini' | 'local_fallback') => {
 setChatHistory((prev) => prev.filter((m) => !m.typing));
 setAiEngineStatus(source);

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
 if (m.createdDynamicFeature) {
 setDynamicFeatures((prev) => [m.createdDynamicFeature!, ...prev]);
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
 };

 try {
 const response = await fetch('/api/ordis/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 message: text,
 history: chatHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
 state: ordisState,
 apiKey: geminiApiKey,
 model: ordisModel,
 }),
 });

 if (response.ok) {
 const payload = await response.json();
 if (payload.success && payload.data) {
 applyResult(payload.data, payload.source || 'gemini');
 return;
 }
 }

 // If API route failed or returned error, failover smoothly to local engine
 const localResult = executeOrdisCommand(text, ordisState);
 applyResult(localResult, 'local_fallback');
 } catch (err) {
 console.warn('Live AI chat failed, running local Ordis engine:', err);
 const localResult = executeOrdisCommand(text, ordisState);
 applyResult(localResult, 'local_fallback');
 }
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
 showToast('Security & compliance settings saved ');
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
 showToast(`Webhook "${newWh.name}" created `);
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
 showToast(`API Key "${name}" generated `);
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
      fileUrl: docData.fileUrl,
      fileType: docData.fileType,
      fileSize: docData.fileSize,
      category: docData.category || 'General',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addAuditEntry(user.name, 'document.generated', newDoc.name, 'Generated document via paperwork engine');
    showToast(`Document "${newDoc.name}" added `);
  };

  const updateDocument = (id: string, updates: Partial<DocumentItem>) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        const newVersion = updates.version !== undefined ? updates.version : (doc.version || 1) + 1;
        const updatedVersions = doc.versions ? [...doc.versions] : [{ v: doc.version || 1, date: doc.updated, author: doc.author }];
        if (updates.name && updates.name !== doc.name) {
          updatedVersions.push({
            v: newVersion,
            date: new Date().toISOString().split('T')[0],
            author: user.name,
          });
        }
        return {
          ...doc,
          ...updates,
          version: newVersion,
          versions: updatedVersions,
          updated: new Date().toISOString().split('T')[0],
        };
      })
    );
    const doc = documents.find((d) => d.id === id);
    addAuditEntry(user.name, 'document.updated', doc?.name || id, `Updated document metadata`);
    showToast('Document updated successfully');

    try {
      fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      }).catch(() => {});
    } catch {}
  };

  const deleteDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    addAuditEntry(user.name, 'document.deleted', doc?.name || id, `Deleted document`);
    showToast('Document deleted');

    try {
      fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}
  };

  // ---- Department Mutations ----
  const addDepartment = (deptData: { name: string; description?: string; lead?: string; budget?: string; color?: string; tags?: string[] }) => {
    const newDept: Department = {
      id: 'dept_' + deptData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 6),
      name: deptData.name,
      description: deptData.description || `${deptData.name} strategic operational unit.`,
      lead: deptData.lead || user.name,
      membersCount: 0,
      budget: deptData.budget || '$150,000 / yr',
      color: deptData.color || '#0f4cff',
      tags: deptData.tags || ['Core Team'],
    };
    setDepartments((prev) => [...prev, newDept]);
    addAuditEntry(user.name, 'department.created', newDept.name, `Created department ${newDept.name} led by ${newDept.lead}`);
    showToast(`Department "${newDept.name}" created `);

    try {
      fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept),
      }).catch(() => {});
    } catch {}
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    const dept = departments.find((d) => d.id === id);
    addAuditEntry(user.name, 'department.updated', dept?.name || id, `Updated department parameters`);
    showToast('Department updated');

    try {
      fetch('/api/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      }).catch(() => {});
    } catch {}
  };

  const deleteDepartment = (id: string): boolean => {
    const dept = departments.find((d) => d.id === id);
    if (!dept) return false;

    const memberCount = employees.filter((e) => e.departmentId === id || e.department === dept.name).length;
    if (memberCount > 0) {
      showToast(`Cannot delete "${dept.name}" while ${memberCount} members are assigned. Reassign them first.`);
      return false;
    }

    setDepartments((prev) => prev.filter((d) => d.id !== id));
    addAuditEntry(user.name, 'department.deleted', dept.name, `Deleted department`);
    showToast(`Department "${dept.name}" removed`);

    try {
      fetch(`/api/departments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}

    return true;
  };

  const assignEmployeeDepartment = (employeeId: string, departmentId: string, departmentName: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? { ...e, departmentId, department: departmentName }
          : e
      )
    );
    setDepartments((prev) =>
      prev.map((d) => {
        const count = employees.filter((e) =>
          e.id === employeeId ? d.id === departmentId : (e.departmentId === d.id || e.department === d.name)
        ).length;
        return { ...d, membersCount: count };
      })
    );
    const emp = employees.find((e) => e.id === employeeId);
    addAuditEntry(user.name, 'member.reassigned', emp?.name || employeeId, `Assigned to ${departmentName}`);
    showToast(`Reassigned ${emp?.name || 'Member'} to ${departmentName}`);

    try {
      fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: employeeId,
          updates: { departmentId, department: departmentName },
        }),
      }).catch(() => {});
    } catch {}
  };

 // ---- Automation Mutations ----
 const toggleAutomation = (id: string) => {
 setAutomations((prev) =>
 prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
 );
 showToast('Automation rule toggled ');
 };

 const addAutomation = (autoData: Partial<AutomationRule> & { name: string; when: string; then: string }) => {
 const newAuto: AutomationRule = {
 id: 'auto_' + Date.now(),
 name: autoData.name,
 active: autoData.active !== undefined ? autoData.active : true,
 when: autoData.when,
 condition: autoData.condition || null,
 then: autoData.then,
 icon: autoData.icon || '',
 color: autoData.color || '#0f4cff',
 type: autoData.type || 'standard',
 executionCount: autoData.executionCount || 0,
 lastRun: autoData.lastRun || 'Never',
 };
 setAutomations((prev) => [newAuto, ...prev]);
 showToast(`Automation "${newAuto.name}" created `);
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
 showToast(`Deal "${newDeal.title}" created `);
 };

 const updateDealStage = (dealId: string, stage: string) => {
 setCrm((prev) => ({
 ...prev,
 deals: prev.deals.map((d) => (d.id === dealId ? { ...d, stage, lastActivity: 'Just now' } : d)),
 }));
 showToast('Deal stage updated ');
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
 showToast(`Contact "${newContact.name}" added `);
 };

 const submitAgencyRequest = (req: { company: string; email: string; solutionType: string; requirements: string }) => {
 addAuditEntry('Alex Morgan', 'agency.request.submitted', req.company, `Requested ${req.solutionType}`);
 showToast(`Request submitted for ${req.company}. Our agency lead will contact you within 24 hours `);
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
 updateDocument,
 deleteDocument,
 setDepartments,
 addDepartment,
 updateDepartment,
 deleteDepartment,
 assignEmployeeDepartment,
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
 fetchAuditLogs,
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
 geminiApiKey,
 setGeminiApiKey,
 ordisModel,
 setOrdisModel,
 aiEngineStatus,
 dynamicFeatures,
 setDynamicFeatures,
 seedEnterpriseDirectory,
 resetEnterpriseDirectory,
 redeemedCodes,
 redeemCode,
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

