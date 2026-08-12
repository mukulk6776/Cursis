// =============================================================================
// Cursis Platform — Strict TypeScript Domain Types
// =============================================================================

export type UserRole = "owner" | "admin" | "member";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  title: string | null;
  weeklyCapacityHours: number;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  endDate: string | null;
  color: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  estimatedHours: number;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  taskId: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export type ActiveView = "dashboard" | "capacity" | "tasks" | "settings";

export const TASK_STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dotColor: string }> = {
  LOW: { label: "Low", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", dotColor: "bg-slate-400" },
  MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", dotColor: "bg-blue-400" },
  HIGH: { label: "High", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", dotColor: "bg-amber-400" },
  CRITICAL: { label: "Critical", color: "bg-red-500/20 text-red-300 border-red-500/30", dotColor: "bg-red-400" },
};
