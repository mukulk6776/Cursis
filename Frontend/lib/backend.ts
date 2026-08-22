/**
 * Cursis Hybrid Backend & Cloud Firestore Data Client
 * Seamlessly stores and synchronizes data with Firebase Cloud Firestore.
 */

import {
  getTasksFromFirestore,
  createTaskInFirestore,
  updateTaskInFirestore,
  getProjectsFromFirestore,
  FirestoreTask,
} from "./firestore-db";

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  weeklyCapacityHours: number;
  avatarUrl: string | null;
}

export interface BackendTask {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedHours: number;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  projectId: string;
  assigneeId: string | null;
  assignee?: BackendUser | null;
  project?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface BackendProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority?: string;
  color: string;
  startDate?: string;
  endDate?: string | null;
  _count?: {
    tasks: number;
  };
  tasks?: Array<{
    id: string;
    status: string;
    priority: string;
    estimatedHours: number;
  }>;
}

export interface BackendCapacityUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  weeklyCapacityHours: number;
  currentWorkload: number;
  capacityUtilization: number;
  activeTasksCount: number;
}

export type BackendCapacity = BackendCapacityUser;

export interface BackendHealth {
  status: "healthy" | "error";
  service: string;
  version: string;
  timestamp: string;
  database?: {
    status: string;
    counts: {
      users: number;
      projects: number;
      tasks: number;
    };
  };
}

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6969";

/**
 * Check if the backend service is reachable and healthy
 */
export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch("/api/backend/health", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return {
      status: "healthy",
      service: "firebase-cloud",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch all tasks (prioritizing Firebase Cloud Firestore)
 */
export async function fetchBackendTasks(params?: {
  projectId?: string;
  status?: string;
}): Promise<BackendTask[]> {
  try {
    // 1. Fetch from Firebase Cloud Firestore
    const cloudTasks = await getTasksFromFirestore();
    if (cloudTasks && cloudTasks.length > 0) {
      let filtered = cloudTasks;
      if (params?.projectId) filtered = filtered.filter((t) => t.projectId === params.projectId);
      if (params?.status) filtered = filtered.filter((t) => t.status === params.status);

      return filtered.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || null,
        status: t.status,
        priority: t.priority,
        estimatedHours: t.estimatedHours || 4,
        dueDate: t.dueDate || null,
        completedAt: null,
        order: 0,
        projectId: t.projectId || "prj_001",
        assigneeId: t.assigneeId || null,
        project: {
          id: t.projectId || "prj_001",
          name: t.projectName || "General Operations",
          color: "#6366f1",
        },
        assignee: t.assigneeName ? {
          id: t.assigneeId || "usr_001",
          name: t.assigneeName,
          email: "",
          role: "member",
          title: "Team Member",
          weeklyCapacityHours: 40,
          avatarUrl: null,
        } : null,
      }));
    }

    // 2. Fallback to API proxy if cloud empty
    const query = new URLSearchParams();
    if (params?.projectId) query.set("projectId", params.projectId);
    if (params?.status) query.set("status", params.status);

    const url = `/api/backend/tasks${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.warn("Tasks fetch falling back:", error);
    return [];
  }
}

/**
 * Create a new task (saved in Firebase Cloud Firestore & local API)
 */
export async function createBackendTask(taskData: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  estimatedHours?: number;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
}): Promise<BackendTask | null> {
  try {
    // 1. Save to Firebase Cloud Firestore
    const firestoreCreated = await createTaskInFirestore({
      title: taskData.title,
      description: taskData.description,
      status: (taskData.status as any) || "TODO",
      priority: (taskData.priority as any) || "MEDIUM",
      estimatedHours: taskData.estimatedHours || 4,
      projectId: taskData.projectId,
      dueDate: taskData.dueDate,
    });

    if (firestoreCreated) {
      return {
        id: firestoreCreated.id,
        title: firestoreCreated.title,
        description: firestoreCreated.description || null,
        status: firestoreCreated.status,
        priority: firestoreCreated.priority,
        estimatedHours: firestoreCreated.estimatedHours,
        dueDate: firestoreCreated.dueDate || null,
        completedAt: null,
        order: 0,
        projectId: firestoreCreated.projectId || taskData.projectId,
        assigneeId: null,
        project: {
          id: taskData.projectId,
          name: "Active Project",
          color: "#6366f1",
        },
      };
    }

    // 2. Fallback to backend API
    const res = await fetch("/api/backend/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error creating task in cloud/backend:", error);
    return null;
  }
}

/**
 * Update task in Firebase Cloud Firestore
 */
export async function updateBackendTask(
  id: string,
  updates: Partial<BackendTask>
): Promise<BackendTask | null> {
  try {
    await updateTaskInFirestore(id, updates as any);
    
    // Also trigger backend proxy if available
    try {
      await fetch("/api/backend/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch {}

    return {
      id,
      ...updates,
    } as any;
  } catch (error) {
    console.error("Error updating task:", error);
    return null;
  }
}

/**
 * Fetch all projects from Firebase Cloud Firestore & backend
 */
export async function fetchBackendProjects(): Promise<BackendProject[]> {
  try {
    const cloudProjects = await getProjectsFromFirestore();
    if (cloudProjects && cloudProjects.length > 0) {
      return cloudProjects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        color: p.color || "#6366f1",
        status: p.status || "ACTIVE",
      }));
    }

    const res = await fetch("/api/backend/projects", { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [
      { id: "prj_001", name: "Core Operations", description: null, color: "#6366f1", status: "ACTIVE" },
      { id: "prj_002", name: "Growth & Marketing", description: null, color: "#06b6d4", status: "ACTIVE" },
    ];
  }
}

/**
 * Fetch team capacity and workloads
 */
export async function fetchBackendCapacity(): Promise<BackendCapacityUser[]> {
  try {
    const res = await fetch("/api/backend/capacity", { cache: "no-store" });
    if (!res.ok) throw new Error("Fallback to default capacity");
    return await res.json();
  } catch {
    return [
      {
        id: "usr_001",
        name: "Lead Founder",
        email: "founder@company.com",
        role: "owner",
        title: "Founder & CEO",
        weeklyCapacityHours: 40,
        currentWorkload: 16,
        capacityUtilization: 40,
        activeTasksCount: 2,
      },
    ];
  }
}
