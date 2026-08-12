// =============================================================================
// Cursis Platform — Global Zustand Store with Persist Middleware
// =============================================================================
// Architecture Notes:
// - User workload is NEVER stored as a static field. It is dynamically derived
//   via the `useUserWorkload` selector by summing estimatedHours of active tasks.
// - State is persisted to localStorage via Zustand persist middleware.
// - Onboarding workflows auto-generate predefined tasks for new team members.
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Organization,
  User,
  Project,
  Task,
  Comment,
  FileAttachment,
  ActiveView,
  TaskStatus,
  Priority,
} from "./types";

// ---------------------------------------------------------------------------
// State Interface
// ---------------------------------------------------------------------------
interface PlatformState {
  organization: Organization;
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  files: FileAttachment[];

  activeView: ActiveView;
  activeProjectId: string | null;
  selectedTaskId: string | null;
  sidebarCollapsed: boolean;

  // Actions
  setActiveView: (view: ActiveView) => void;
  setActiveProject: (projectId: string | null) => void;
  setSelectedTask: (taskId: string | null) => void;
  toggleSidebar: () => void;

  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "order" | "completedAt">) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
  deleteTask: (taskId: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;

  addComment: (taskId: string, content: string, authorId: string) => void;
  updateUserCapacity: (userId: string, weeklyCapacityHours: number) => void;

  applyOnboardingWorkflow: (userId: string) => void;

  resetStore: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const ORG_ID = "org_cursis_001";
const USER_IDS = { sarah: "usr_001", marcus: "usr_002", priya: "usr_003" } as const;
const PROJECT_IDS = { mvp: "prj_001", infra: "prj_002" } as const;

const SEED_ORGANIZATION: Organization = {
  id: ORG_ID,
  name: "Cursis Labs",
  slug: "cursis-labs",
  logoUrl: null,
  createdAt: "2026-01-15T08:00:00.000Z",
  updatedAt: "2026-01-15T08:00:00.000Z",
};

const SEED_USERS: User[] = [
  {
    id: USER_IDS.sarah,
    email: "sarah.chen@cursis.io",
    name: "Sarah Chen",
    avatarUrl: null,
    role: "owner",
    title: "CEO & Co-Founder",
    weeklyCapacityHours: 45,
    isActive: true,
    organizationId: ORG_ID,
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: USER_IDS.marcus,
    email: "marcus.wright@cursis.io",
    name: "Marcus Wright",
    avatarUrl: null,
    role: "admin",
    title: "Lead Engineer",
    weeklyCapacityHours: 40,
    isActive: true,
    organizationId: ORG_ID,
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-02-01T08:00:00.000Z",
  },
  {
    id: USER_IDS.priya,
    email: "priya.sharma@cursis.io",
    name: "Priya Sharma",
    avatarUrl: null,
    role: "member",
    title: "Product Designer",
    weeklyCapacityHours: 35,
    isActive: true,
    organizationId: ORG_ID,
    createdAt: "2026-03-10T08:00:00.000Z",
    updatedAt: "2026-03-10T08:00:00.000Z",
  },
];

const SEED_PROJECTS: Project[] = [
  {
    id: PROJECT_IDS.mvp,
    name: "MVP Launch",
    description: "Core product build for initial launch — dashboard, auth, billing.",
    status: "ACTIVE",
    priority: "CRITICAL",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-09-30T00:00:00.000Z",
    color: "#6366f1",
    organizationId: ORG_ID,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: PROJECT_IDS.infra,
    name: "Infrastructure & DevOps",
    description: "CI/CD pipelines, monitoring, staging environments, security hardening.",
    status: "ACTIVE",
    priority: "HIGH",
    startDate: "2026-07-01T00:00:00.000Z",
    endDate: "2026-12-31T00:00:00.000Z",
    color: "#06b6d4",
    organizationId: ORG_ID,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

const SEED_TASKS: Task[] = [
  {
    id: "tsk_001",
    title: "Design system & component library",
    description: "Build a comprehensive design system with tokens, primitives, and composite components. Include dark/light mode, spacing scale, and typography.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    estimatedHours: 12,
    dueDate: "2026-08-20T00:00:00.000Z",
    completedAt: null,
    order: 0,
    projectId: PROJECT_IDS.mvp,
    assigneeId: USER_IDS.priya,
    createdAt: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-10T08:00:00.000Z",
  },
  {
    id: "tsk_002",
    title: "Auth flow — OAuth + email/password",
    description: "Implement NextAuth.js with Google OAuth and credential providers. Include signup, login, password reset, and session management.",
    status: "TODO",
    priority: "CRITICAL",
    estimatedHours: 16,
    dueDate: "2026-08-25T00:00:00.000Z",
    completedAt: null,
    order: 1,
    projectId: PROJECT_IDS.mvp,
    assigneeId: USER_IDS.marcus,
    createdAt: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-10T08:00:00.000Z",
  },
  {
    id: "tsk_003",
    title: "Setup CI/CD pipeline",
    description: "Configure GitHub Actions for lint, test, build, and deploy stages. Add preview deployments for PRs on Vercel.",
    status: "REVIEW",
    priority: "HIGH",
    estimatedHours: 8,
    dueDate: "2026-08-18T00:00:00.000Z",
    completedAt: null,
    order: 0,
    projectId: PROJECT_IDS.infra,
    assigneeId: USER_IDS.marcus,
    createdAt: "2026-07-15T08:00:00.000Z",
    updatedAt: "2026-07-15T08:00:00.000Z",
  },
  {
    id: "tsk_004",
    title: "User research interviews",
    description: "Conduct 8 user interviews with early-stage founders. Document pain points around tool fragmentation and team coordination.",
    status: "DONE",
    priority: "MEDIUM",
    estimatedHours: 10,
    dueDate: "2026-08-10T00:00:00.000Z",
    completedAt: "2026-08-09T16:00:00.000Z",
    order: 0,
    projectId: PROJECT_IDS.mvp,
    assigneeId: USER_IDS.sarah,
    createdAt: "2026-07-05T08:00:00.000Z",
    updatedAt: "2026-08-09T16:00:00.000Z",
  },
  {
    id: "tsk_005",
    title: "Dashboard wireframes & prototype",
    description: "Create high-fidelity wireframes for the main dashboard, capacity view, and task board. Build interactive Figma prototype for stakeholder review.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    estimatedHours: 8,
    dueDate: "2026-08-22T00:00:00.000Z",
    completedAt: null,
    order: 1,
    projectId: PROJECT_IDS.mvp,
    assigneeId: USER_IDS.priya,
    createdAt: "2026-07-12T08:00:00.000Z",
    updatedAt: "2026-07-12T08:00:00.000Z",
  },
  {
    id: "tsk_006",
    title: "Investor pitch deck updates",
    description: "Revise Series A deck with new traction metrics, product screenshots, and updated financial projections.",
    status: "TODO",
    priority: "HIGH",
    estimatedHours: 6,
    dueDate: "2026-08-28T00:00:00.000Z",
    completedAt: null,
    order: 2,
    projectId: PROJECT_IDS.mvp,
    assigneeId: USER_IDS.sarah,
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-01T08:00:00.000Z",
  },
];

const SEED_COMMENTS: Comment[] = [
  {
    id: "cmt_001",
    content: "I've finished the color palette and typography scale. Moving on to component primitives now.",
    taskId: "tsk_001",
    authorId: USER_IDS.priya,
    createdAt: "2026-07-15T14:30:00.000Z",
    updatedAt: "2026-07-15T14:30:00.000Z",
  },
  {
    id: "cmt_002",
    content: "Great progress Priya! Make sure we align on the dark mode tokens before building out the cards.",
    taskId: "tsk_001",
    authorId: USER_IDS.sarah,
    createdAt: "2026-07-15T15:00:00.000Z",
    updatedAt: "2026-07-15T15:00:00.000Z",
  },
  {
    id: "cmt_003",
    content: "Pipeline is green on main. Preview deploys are working. Ready for review.",
    taskId: "tsk_003",
    authorId: USER_IDS.marcus,
    createdAt: "2026-08-05T10:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Onboarding Workflow Templates
// ---------------------------------------------------------------------------
const ONBOARDING_TASK_TEMPLATES: Array<{
  title: string;
  description: string;
  estimatedHours: number;
  priority: Priority;
  daysUntilDue: number;
}> = [
  {
    title: "Review Security Policies & Compliance Docs",
    description: "Read through the company security handbook, acceptable use policy, and data handling guidelines. Sign the acknowledgment form.",
    estimatedHours: 2,
    priority: "HIGH",
    daysUntilDue: 2,
  },
  {
    title: "Setup Local Development Environment",
    description: "Clone all repositories, install dependencies, configure environment variables, and verify the dev server runs locally. Follow the README setup guide.",
    estimatedHours: 4,
    priority: "CRITICAL",
    daysUntilDue: 3,
  },
  {
    title: "Complete Team Introductions & Shadow Sessions",
    description: "Schedule 1:1 meetings with each team member. Shadow at least two planning sessions and one code review to understand team workflows.",
    estimatedHours: 3,
    priority: "MEDIUM",
    daysUntilDue: 5,
  },
  {
    title: "Review Codebase Architecture & Technical Docs",
    description: "Study the system architecture diagrams, API documentation, database schema, and deployment pipeline. Prepare 3 questions for the architecture review session.",
    estimatedHours: 5,
    priority: "HIGH",
    daysUntilDue: 7,
  },
];

// ---------------------------------------------------------------------------
// Initial State Factory (used for reset)
// ---------------------------------------------------------------------------
function createInitialState() {
  return {
    organization: SEED_ORGANIZATION,
    users: SEED_USERS,
    projects: SEED_PROJECTS,
    tasks: SEED_TASKS,
    comments: SEED_COMMENTS,
    files: [] as FileAttachment[],
    activeView: "dashboard" as ActiveView,
    activeProjectId: PROJECT_IDS.mvp as string | null,
    selectedTaskId: null as string | null,
    sidebarCollapsed: false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // -- Navigation -------------------------------------------------------
      setActiveView: (view: ActiveView) => set({ activeView: view }),

      setActiveProject: (projectId: string | null) => set({ activeProjectId: projectId }),

      setSelectedTask: (taskId: string | null) => set({ selectedTaskId: taskId }),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // -- Task CRUD --------------------------------------------------------
      addTask: (taskData) => {
        const now = nowISO();
        const state = get();
        const maxOrder = state.tasks
          .filter((t) => t.projectId === taskData.projectId && t.status === taskData.status)
          .reduce((max, t) => Math.max(max, t.order), -1);

        const newTask: Task = {
          ...taskData,
          id: generateId(),
          completedAt: null,
          order: maxOrder + 1,
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({ tasks: [...s.tasks, newTask] }));
      },

      updateTask: (taskId, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates, updatedAt: nowISO() } : t
          ),
        }));
      },

      deleteTask: (taskId) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
          comments: s.comments.filter((c) => c.taskId !== taskId),
          files: s.files.filter((f) => f.taskId !== taskId),
        }));
      },

      moveTaskStatus: (taskId, newStatus) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              status: newStatus,
              completedAt: newStatus === "DONE" ? nowISO() : null,
              updatedAt: nowISO(),
            };
          }),
        }));
      },

      // -- Comments ---------------------------------------------------------
      addComment: (taskId, content, authorId) => {
        const now = nowISO();
        const newComment: Comment = {
          id: generateId(),
          content,
          taskId,
          authorId,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ comments: [...s.comments, newComment] }));
      },

      // -- User Capacity ----------------------------------------------------
      updateUserCapacity: (userId, weeklyCapacityHours) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, weeklyCapacityHours, updatedAt: nowISO() } : u
          ),
        }));
      },

      // -- Onboarding Workflow ----------------------------------------------
      applyOnboardingWorkflow: (userId) => {
        const state = get();
        const now = nowISO();
        const activeProjectId = state.activeProjectId || state.projects[0]?.id;
        if (!activeProjectId) return;

        const onboardingTasks: Task[] = ONBOARDING_TASK_TEMPLATES.map((template, index) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + template.daysUntilDue);

          return {
            id: generateId(),
            title: template.title,
            description: template.description,
            status: "TODO" as TaskStatus,
            priority: template.priority,
            estimatedHours: template.estimatedHours,
            dueDate: dueDate.toISOString(),
            completedAt: null,
            order: state.tasks.length + index,
            projectId: activeProjectId,
            assigneeId: userId,
            createdAt: now,
            updatedAt: now,
          };
        });

        set((s) => ({ tasks: [...s.tasks, ...onboardingTasks] }));
      },

      // -- Reset ------------------------------------------------------------
      resetStore: () => set(createInitialState()),
    }),
    {
      name: "cursis-platform-store",
      version: 1,
    }
  )
);

// =============================================================================
// DYNAMIC SELECTORS
// =============================================================================
// These are pure selector functions. They derive computed values from state
// rather than storing them, preventing state desync.
// =============================================================================

/**
 * Dynamically calculates a user's current workload by summing
 * estimatedHours of all assigned tasks where status !== 'DONE'.
 */
export function useUserWorkload(userId: string): number {
  return usePlatformStore((state) =>
    state.tasks
      .filter((t) => t.assigneeId === userId && t.status !== "DONE")
      .reduce((sum, t) => sum + t.estimatedHours, 0)
  );
}

/**
 * Returns capacity utilization as a ratio (0 to 1+).
 * Values > 1.0 indicate the user is overloaded.
 */
export function useUserUtilization(userId: string): {
  workload: number;
  capacity: number;
  ratio: number;
  isOverloaded: boolean;
} {
  return usePlatformStore((state) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { workload: 0, capacity: 0, ratio: 0, isOverloaded: false };

    const workload = state.tasks
      .filter((t) => t.assigneeId === userId && t.status !== "DONE")
      .reduce((sum, t) => sum + t.estimatedHours, 0);

    const ratio = user.weeklyCapacityHours > 0 ? workload / user.weeklyCapacityHours : 0;

    return {
      workload,
      capacity: user.weeklyCapacityHours,
      ratio,
      isOverloaded: ratio > 1.0,
    };
  });
}

/**
 * Selector: tasks for a given project, optionally filtered by status.
 */
export function useProjectTasks(projectId: string | null, status?: TaskStatus): Task[] {
  return usePlatformStore((state) =>
    state.tasks
      .filter((t) => {
        if (projectId && t.projectId !== projectId) return false;
        if (status && t.status !== status) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order)
  );
}

/**
 * Selector: comments for a specific task, sorted chronologically.
 */
export function useTaskComments(taskId: string): Comment[] {
  return usePlatformStore((state) =>
    state.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
}

/**
 * Non-hook utility: calculates workload without React hook rules.
 * Use inside event handlers or action logic.
 */
export function getUserWorkloadStatic(userId: string): number {
  const state = usePlatformStore.getState();
  return state.tasks
    .filter((t) => t.assigneeId === userId && t.status !== "DONE")
    .reduce((sum, t) => sum + t.estimatedHours, 0);
}
