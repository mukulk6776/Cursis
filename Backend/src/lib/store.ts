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
import { useMemo } from "react";
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
import * as serverActions from "@/app/actions";

interface PlatformState {
  currentUser: User | null;
  organization: Organization | null;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeStore: (data: any) => void;
  setActiveView: (view: ActiveView) => void;
  setActiveProject: (projectId: string | null) => void;
  setSelectedTask: (taskId: string | null) => void;
  toggleSidebar: () => void;

  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "order" | "completedAt">) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;

  addComment: (taskId: string, content: string, authorId: string) => Promise<void>;
  updateUserCapacity: (userId: string, weeklyCapacityHours: number) => Promise<void>;

  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  applyOnboardingWorkflow: (userId: string) => Promise<void>;

  resetStore: () => void;
}

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
];

function createInitialState() {
  return {
    currentUser: null,
    organization: null,
    users: [],
    projects: [],
    tasks: [],
    comments: [],
    files: [],
    activeView: "dashboard" as ActiveView,
    activeProjectId: null as string | null,
    selectedTaskId: null as string | null,
    sidebarCollapsed: false,
  };
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      initializeStore: (data) => {
        set({
          currentUser: data.currentUser || null,
          organization: data.organizations?.[0] || null,
          users: data.users || [],
          projects: data.projects,
          tasks: data.tasks,
          comments: data.comments,
          files: data.files,
          activeProjectId: data.projects[0]?.id || null,
        });
      },

      setActiveView: (view: ActiveView) => set({ activeView: view }),
      setActiveProject: (projectId: string | null) => set({ activeProjectId: projectId }),
      setSelectedTask: (taskId: string | null) => set({ selectedTaskId: taskId }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      addTask: async (taskData) => {
        const state = get();
        const maxOrder = state.tasks
          .filter((t) => t.projectId === taskData.projectId && t.status === taskData.status)
          .reduce((max, t) => Math.max(max, t.order), -1);

        const created = await serverActions.createTask({
          ...taskData,
          order: maxOrder + 1,
        });

        set((s) => ({ tasks: [...s.tasks, created] }));
      },

      updateTask: async (taskId, updates) => {
        const updated = await serverActions.updateTask(taskId, updates);
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      },

      deleteTask: async (taskId) => {
        await serverActions.deleteTask(taskId);
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
          comments: s.comments.filter((c) => c.taskId !== taskId),
          files: s.files.filter((f) => f.taskId !== taskId),
        }));
      },

      moveTaskStatus: async (taskId, newStatus) => {
        const completedAt = newStatus === "DONE" ? new Date().toISOString() : null;
        const updated = await serverActions.moveTaskStatus(taskId, newStatus, completedAt);
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      },

      addComment: async (taskId, content, authorId) => {
        const comment = await serverActions.createComment(taskId, content, authorId);
        set((s) => ({ comments: [...s.comments, comment] }));
      },

      updateUserCapacity: async (userId, weeklyCapacityHours) => {
        const user = await serverActions.updateUserCapacity(userId, weeklyCapacityHours);
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? user : u)),
        }));
      },

      addProject: async (projectData) => {
        const created = await serverActions.createProject(projectData);
        set((s) => ({
          projects: [...s.projects, created],
          activeProjectId: created.id,
        }));
      },

      deleteProject: async (projectId) => {
        await serverActions.deleteProject(projectId);
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== projectId);
          return {
            projects: remaining,
            tasks: s.tasks.filter((t) => t.projectId !== projectId),
            activeProjectId: s.activeProjectId === projectId ? (remaining[0]?.id || null) : s.activeProjectId,
          };
        });
      },

      applyOnboardingWorkflow: async (userId) => {
        const state = get();
        const activeProjectId = state.activeProjectId || state.projects[0]?.id;
        if (!activeProjectId) return;

        const tasksData = ONBOARDING_TASK_TEMPLATES.map((template, index) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + template.daysUntilDue);
          return {
            title: template.title,
            description: template.description,
            status: "TODO" as TaskStatus,
            priority: template.priority,
            estimatedHours: template.estimatedHours,
            dueDate: dueDate.toISOString(),
            order: state.tasks.length + index,
            projectId: activeProjectId,
            assigneeId: userId,
          };
        });

        const createdTasks = await serverActions.createTasks(tasksData);
        set((s) => ({ tasks: [...s.tasks, ...createdTasks] }));
      },

      resetStore: () => set(createInitialState()),
    }),
    {
      name: "cursis-platform-store",
      version: 2,
      partialize: (state) => ({
        activeView: state.activeView,
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
      }), // only persist UI state
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
  const users = usePlatformStore((state) => state.users);
  const tasks = usePlatformStore((state) => state.tasks);

  return useMemo(() => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { workload: 0, capacity: 0, ratio: 0, isOverloaded: false };

    const workload = tasks
      .filter((t) => t.assigneeId === userId && t.status !== "DONE")
      .reduce((sum, t) => sum + t.estimatedHours, 0);

    const ratio = user.weeklyCapacityHours > 0 ? workload / user.weeklyCapacityHours : 0;

    return {
      workload,
      capacity: user.weeklyCapacityHours,
      ratio,
      isOverloaded: ratio > 1.0,
    };
  }, [users, tasks, userId]);
}

/**
 * Selector: tasks for a given project, optionally filtered by status.
 */
export function useProjectTasks(projectId: string | null, status?: TaskStatus): Task[] {
  const tasks = usePlatformStore((state) => state.tasks);
  
  return useMemo(() => {
    return tasks
      .filter((t) => {
        if (projectId && t.projectId !== projectId) return false;
        if (status && t.status !== status) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [tasks, projectId, status]);
}

/**
 * Selector: comments for a specific task, sorted chronologically.
 */
export function useTaskComments(taskId: string): Comment[] {
  const comments = usePlatformStore((state) => state.comments);

  return useMemo(() => {
    return comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments, taskId]);
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
