import type { Task } from '@/lib/db/types';

export const CHANNELS = [
  { id: 'general', name: 'general' },
  { id: 'engineering', name: 'engineering' },
  { id: 'product-design', name: 'product-design' },
  { id: 'announcements', name: 'announcements' },
];
export interface WorkFile { id: string; name: string; size: number }
export interface WorkMessage {
  id: string; workspaceId: string; channelId: string; authorId: string; authorName: string;
  text: string; files: WorkFile[]; createdAt: string;
}
export interface ApprovalRequest {
  id: string; authorId: string; authorName: string; reviewerId: string;
  text: string; url?: string; files: WorkFile[]; createdAt: string;
  status: 'pending' | 'approved' | 'changes_requested';
  decidedBy?: string; decidedByName?: string; decidedAt?: string;
}
export interface TaskConversation {
  channelId: string; sourceMessageId?: string;
  messages: WorkMessage[]; approvals: ApprovalRequest[]; files: WorkFile[];
}
export interface DayPlan {
  _id: string; workspaceId: string; userId: string; date: string;
  items: { taskId: string; hours: number }[];
}
export interface FocusSession {
  _id: string; workspaceId: string; userId: string; taskId: string; taskTitle: string;
  startedAt: string; expectedEndAt: string; active: boolean;
  endedAt?: string; seconds?: number;
}
export interface WorkSnapshot {
  workspaceId: string; userId: string; canManage: boolean;
  tasks: Task[]; plans: DayPlan[]; focus: FocusSession[];
  loggedHours: Record<string, number>;
  otherFocus?: { id: string } | null;
}
export function taskChannel(task: Task): string {
  return task.collaboration?.channelId || (task.projectId ? `project:${task.projectId}` : 'general');
}
export function taskStage(task: Task): string {
  const approvals = task.collaboration?.approvals || [];
  const latest = approvals.at(-1);
  return task.status === 'done' && latest?.status === 'approved' && task.completedAt === latest.decidedAt ? 'approved' : task.status;
}
export function workload(hours: number) {
  return { hours, percent: Math.min(100, hours / 8 * 100), label: hours > 8 ? 'Overloaded' : hours >= 7 ? 'Full' : 'Available' };
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
