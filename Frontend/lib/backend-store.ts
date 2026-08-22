/**
 * In-memory fallback datastore for local development when Firebase Admin
 * service account credentials are not configured in .env.local.
 */

export interface LocalTask {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedHours: number;
  dueDate?: string | null;
  completedAt?: string | null;
  order?: number;
  projectId: string;
  projectName?: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority?: string;
  color: string;
  startDate?: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  weeklyCapacityHours: number;
  avatarUrl?: string | null;
}

// Global in-memory singleton across hot-reloads
const globalStore = globalThis as unknown as {
  __cursisLocalProjects?: LocalProject[];
  __cursisLocalTasks?: LocalTask[];
  __cursisLocalUsers?: LocalUser[];
};

if (!globalStore.__cursisLocalProjects) {
  globalStore.__cursisLocalProjects = [
    {
      id: "prj_001",
      name: "Core Operations",
      description: "Core startup operations, dashboards, and daily workflows.",
      status: "ACTIVE",
      priority: "CRITICAL",
      color: "#6366f1",
      startDate: "2026-06-01T00:00:00.000Z",
      endDate: "2026-12-31T00:00:00.000Z",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "prj_002",
      name: "Growth & Marketing",
      description: "Customer acquisition, content pipeline, and lead generation.",
      status: "ACTIVE",
      priority: "HIGH",
      color: "#06b6d4",
      startDate: "2026-07-01T00:00:00.000Z",
      endDate: "2026-12-31T00:00:00.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "prj_003",
      name: "Infrastructure & DevOps",
      description: "CI/CD automation, security audits, and cloud provisioning.",
      status: "ACTIVE",
      priority: "HIGH",
      color: "#10b981",
      startDate: "2026-07-15T00:00:00.000Z",
      endDate: "2026-12-31T00:00:00.000Z",
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    },
  ];
}

if (!globalStore.__cursisLocalUsers) {
  globalStore.__cursisLocalUsers = [
    {
      id: "usr_001",
      name: "Sarah Chen",
      email: "sarah.chen@cursis.io",
      role: "owner",
      title: "CEO & Founder",
      weeklyCapacityHours: 45,
      avatarUrl: null,
    },
    {
      id: "usr_002",
      name: "Marcus Wright",
      email: "marcus.wright@cursis.io",
      role: "admin",
      title: "Lead Engineer",
      weeklyCapacityHours: 40,
      avatarUrl: null,
    },
    {
      id: "usr_003",
      name: "Priya Sharma",
      email: "priya.sharma@cursis.io",
      role: "member",
      title: "Product Designer",
      weeklyCapacityHours: 35,
      avatarUrl: null,
    },
  ];
}

if (!globalStore.__cursisLocalTasks) {
  globalStore.__cursisLocalTasks = [
    {
      id: "tsk_001",
      title: "Design system & component library",
      description: "Build token system, UI primitives, and responsive layout shells.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      estimatedHours: 12,
      dueDate: "2026-08-28T00:00:00.000Z",
      projectId: "prj_001",
      projectName: "Core Operations",
      assigneeId: "usr_003",
      assigneeName: "Priya Sharma",
      order: 0,
      createdAt: "2026-08-01T08:00:00.000Z",
      updatedAt: "2026-08-01T08:00:00.000Z",
    },
    {
      id: "tsk_002",
      title: "Auth flow — Google OAuth & Session Management",
      description: "Implement popup authentication with role-based dashboard redirects.",
      status: "TODO",
      priority: "CRITICAL",
      estimatedHours: 16,
      dueDate: "2026-08-30T00:00:00.000Z",
      projectId: "prj_001",
      projectName: "Core Operations",
      assigneeId: "usr_002",
      assigneeName: "Marcus Wright",
      order: 1,
      createdAt: "2026-08-02T08:00:00.000Z",
      updatedAt: "2026-08-02T08:00:00.000Z",
    },
    {
      id: "tsk_003",
      title: "Setup CI/CD deployment pipeline",
      description: "Configure GitHub Actions, health monitors, and Vercel triggers.",
      status: "REVIEW",
      priority: "HIGH",
      estimatedHours: 8,
      dueDate: "2026-08-25T00:00:00.000Z",
      projectId: "prj_003",
      projectName: "Infrastructure & DevOps",
      assigneeId: "usr_002",
      assigneeName: "Marcus Wright",
      order: 0,
      createdAt: "2026-08-05T08:00:00.000Z",
      updatedAt: "2026-08-05T08:00:00.000Z",
    },
    {
      id: "tsk_004",
      title: "Founder user research interviews",
      description: "Conduct 10 feedback interviews on daily operations bottlenecks.",
      status: "DONE",
      priority: "MEDIUM",
      estimatedHours: 10,
      dueDate: "2026-08-15T00:00:00.000Z",
      completedAt: "2026-08-14T16:00:00.000Z",
      projectId: "prj_001",
      projectName: "Core Operations",
      assigneeId: "usr_001",
      assigneeName: "Sarah Chen",
      order: 0,
      createdAt: "2026-08-01T08:00:00.000Z",
      updatedAt: "2026-08-14T16:00:00.000Z",
    },
  ];
}

export const localStore = {
  getProjects: () => globalStore.__cursisLocalProjects || [],
  addProject: (p: Omit<LocalProject, "id" | "createdAt" | "updatedAt">) => {
    const newProject: LocalProject = {
      ...p,
      id: `prj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.__cursisLocalProjects = [...(globalStore.__cursisLocalProjects || []), newProject];
    return newProject;
  },
  getUsers: () => globalStore.__cursisLocalUsers || [],
  getTasks: (filter?: { projectId?: string; status?: string; assigneeId?: string }) => {
    let list = globalStore.__cursisLocalTasks || [];
    if (filter?.projectId) list = list.filter((t) => t.projectId === filter.projectId);
    if (filter?.status) list = list.filter((t) => t.status === filter.status);
    if (filter?.assigneeId) list = list.filter((t) => t.assigneeId === filter.assigneeId);
    return list;
  },
  addTask: (t: Omit<LocalTask, "id" | "createdAt" | "updatedAt">) => {
    const newTask: LocalTask = {
      ...t,
      id: `tsk_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.__cursisLocalTasks = [...(globalStore.__cursisLocalTasks || []), newTask];
    return newTask;
  },
  updateTask: (id: string, updates: Partial<LocalTask>) => {
    const list = globalStore.__cursisLocalTasks || [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    globalStore.__cursisLocalTasks = list;
    return updated;
  },
  deleteTask: (id: string) => {
    const list = globalStore.__cursisLocalTasks || [];
    globalStore.__cursisLocalTasks = list.filter((t) => t.id !== id);
    return true;
  },
};
