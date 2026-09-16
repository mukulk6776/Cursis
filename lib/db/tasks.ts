import { inMemoryStore } from './store';
import { Task, TaskPriority, TaskStatus } from './types';
import { findBestMatchingHelpers } from './team';
import { getCollection } from '@/lib/mongodb';
import { createNotification } from './notifications';
import { isWorkspaceMember } from '@/lib/auth/rbac';
import { getDepartmentById } from './departments';

export function normalizeSafeIsoDate(val?: string | null): string {
  if (!val) return new Date(Date.now() + 3 * 86400000).toISOString();
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  const lower = String(val).toLowerCase();
  if (lower.includes('today')) return new Date().toISOString();
  if (lower.includes('tomorrow')) return new Date(Date.now() + 86400000).toISOString();
  if (lower.includes('week') || lower.includes('friday')) return new Date(Date.now() + 5 * 86400000).toISOString();
  return new Date(Date.now() + 3 * 86400000).toISOString();
}

/**
 * Retrieves tasks strictly for the given workspace.
 * Prevents cross-workspace task leakage.
 */
export async function getTasks(
  workspaceId: string,
  filter?: {
    projectId?: string;
    assigneeId?: string;
    departmentId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    isAtRisk?: boolean;
  }
): Promise<Task[]> {
  const cleanWsId = (workspaceId || '').trim();
  if (!cleanWsId) return [];

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const query: any = { workspaceId: cleanWsId };
      if (filter?.projectId) query.projectId = filter.projectId;
      if (filter?.assigneeId) query.assigneeId = filter.assigneeId;
      if (filter?.departmentId) query.departmentId = filter.departmentId;
      if (filter?.status) query.status = filter.status;
      if (filter?.priority) query.priority = filter.priority;
      if (filter?.isAtRisk !== undefined) query.isAtRisk = filter.isAtRisk;

      const docs = await col.find(query).sort({ dueDate: 1 }).toArray();
      docs.forEach((t) => inMemoryStore.tasks.set(t.id, t));
      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getTasks error:', e);
  }

  // Strictly filter inMemoryStore by workspaceId
  return Array.from(inMemoryStore.tasks.values())
    .filter((t) => {
      if (t.workspaceId !== cleanWsId) return false;
      if (filter?.projectId && t.projectId !== filter.projectId) return false;
      if (filter?.assigneeId && t.assigneeId !== filter.assigneeId) return false;
      if (filter?.departmentId && t.departmentId !== filter.departmentId) return false;
      if (filter?.status && t.status !== filter.status) return false;
      if (filter?.priority && t.priority !== filter.priority) return false;
      if (filter?.isAtRisk !== undefined && Boolean(t.isAtRisk) !== filter.isAtRisk) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Retrieves a task by ID, optionally verifying workspace ownership.
 */
export async function getTaskById(id: string, workspaceId?: string): Promise<Task | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  const task = inMemoryStore.tasks.get(cleanId);
  if (task) {
    if (workspaceId && task.workspaceId !== workspaceId) return null;
    return task;
  }

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const query: any = { id: cleanId };
      if (workspaceId) query.workspaceId = workspaceId;
      const found = await col.findOne(query);
      if (found) {
        inMemoryStore.tasks.set(cleanId, found);
        return found;
      }
    }
  } catch {}

  return null;
}

/**
 * Creates a task strictly bound to the specified workspace.
 * Validates that assignee and department belong to the target workspace.
 */
export async function createTask(
  workspaceId: string,
  data: Partial<Task> & Record<string, any>
): Promise<Task> {
  const cleanWsId = (workspaceId || '').trim();
  if (!cleanWsId) {
    throw new Error('Workspace context is required to create a task.');
  }

  const title = (data.title || data.name || '').trim();
  if (!title) {
    throw new Error('Task title is required.');
  }

  // 1. Assignee validation: Must belong to workspace
  const assigneeId = data.assigneeId || data.assignee || undefined;
  let assigneeName = data.assigneeName;

  if (assigneeId) {
    const isMember = await isWorkspaceMember(assigneeId, cleanWsId);
    if (!isMember) {
      throw new Error('The selected assignee is not an active member of this workspace.');
    }
    if (!assigneeName) {
      const user = inMemoryStore.users.get(assigneeId);
      if (user) assigneeName = user.displayName;
    }
  }

  // 2. Department validation: Must belong to workspace
  const departmentId = data.departmentId || data.department || undefined;
  if (departmentId) {
    const dept = await getDepartmentById(departmentId, cleanWsId);
    if (!dept) {
      throw new Error('The selected department does not belong to this workspace.');
    }
  }

  // Normalize status
  let status: TaskStatus = 'todo';
  const rawStatus = (data.status || '').toLowerCase();
  if (rawStatus === 'done' || rawStatus === 'completed') status = 'done';
  else if (rawStatus === 'in-progress' || rawStatus === 'in_progress') status = 'in_progress';
  else if (rawStatus === 'review' || rawStatus === 'in_review') status = 'in_review';
  else if (rawStatus === 'blocked') status = 'blocked';

  const dueDate = normalizeSafeIsoDate(data.dueDate || data.deadline);
  const completionPercent = data.completionPercent ?? (status === 'done' ? 100 : 0);

  // Check if at risk
  const isDueSoon = new Date(dueDate).getTime() - Date.now() < 2 * 86400000;
  const isAtRisk = data.isAtRisk ?? (isDueSoon && completionPercent < 30 && status !== 'done');

  let suggestedHelperId = data.suggestedHelperId;
  let riskReason = data.riskReason;

  if (isAtRisk && !suggestedHelperId && data.requiredSkills && data.requiredSkills.length > 0) {
    try {
      const helpers = await findBestMatchingHelpers(cleanWsId, data.requiredSkills);
      const candidate = helpers.find((h) => h.user.id !== assigneeId);
      if (candidate) {
        suggestedHelperId = candidate.user.id;
        riskReason = `Due soon with only ${completionPercent}% done. Suggested helper: ${candidate.user.displayName}`;
      }
    } catch {}
  }

  const id = data.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const task: Task = {
    id,
    workspaceId: cleanWsId,
    projectId: data.projectId || data.project || undefined,
    departmentId,
    title,
    description: (data.description || '').trim(),
    status,
    priority: data.priority || 'medium',
    assigneeId,
    assigneeName,
    creatorId: data.creatorId || data.createdBy || 'usr_system',
    createdBy: data.createdBy || data.creatorId || 'usr_system',
    dueDate,
    estimatedHours: data.estimatedHours || 4,
    actualHours: data.actualHours || 0,
    completionPercent,
    requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
    subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    isAtRisk,
    riskReason,
    suggestedHelperId,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryStore.tasks.set(id, task);

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      await col.updateOne({ id }, { $set: task }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB upsert task error:', e);
  }

  // Send notification if assignee is set
  if (task.assigneeId) {
    try {
      let creatorName = 'Team Lead';
      const creatorUser = inMemoryStore.users.get(task.creatorId);
      if (creatorUser) {
        creatorName = creatorUser.displayName || 'Team Lead';
      }

      await createNotification({
        userId: task.assigneeId,
        workspaceId: task.workspaceId,
        type: 'task',
        text: `<strong>${creatorName}</strong> assigned you a task: <strong>${task.title}</strong>`,
        icon: 'clipboard',
      });
    } catch {}
  }

  return task;
}

/**
 * Updates an existing task with workspace isolation.
 */
export async function updateTask(
  id: string,
  updates: Partial<Task>,
  workspaceId?: string
): Promise<Task | null> {
  const task = await getTaskById(id, workspaceId);
  if (!task) return null;

  // Validate assignee if updated
  if (updates.assigneeId && updates.assigneeId !== task.assigneeId) {
    const isMember = await isWorkspaceMember(updates.assigneeId, task.workspaceId);
    if (!isMember) {
      throw new Error('The updated assignee is not an active member of this workspace.');
    }
    if (!updates.assigneeName) {
      const user = inMemoryStore.users.get(updates.assigneeId);
      if (user) updates.assigneeName = user.displayName;
    }
  }

  // Validate department if updated
  if (updates.departmentId && updates.departmentId !== task.departmentId) {
    const dept = await getDepartmentById(updates.departmentId, task.workspaceId);
    if (!dept) {
      throw new Error('The updated department does not belong to this workspace.');
    }
  }

  // Normalize status
  let nextStatus = updates.status || task.status;
  const rawStatus = String(updates.status || '').toLowerCase();
  if (rawStatus === 'done' || rawStatus === 'completed') nextStatus = 'done';
  else if (rawStatus === 'in-progress' || rawStatus === 'in_progress') nextStatus = 'in_progress';
  else if (rawStatus === 'review' || rawStatus === 'in_review') nextStatus = 'in_review';
  else if (rawStatus === 'todo') nextStatus = 'todo';

  const title = (updates.title || (updates as any).name || task.title).trim();
  const dueDate = updates.dueDate ? normalizeSafeIsoDate(updates.dueDate) : task.dueDate;

  let completionPercent = updates.completionPercent ?? task.completionPercent;
  let isAtRisk = updates.isAtRisk ?? task.isAtRisk;

  if (nextStatus === 'done') {
    completionPercent = 100;
    isAtRisk = false;
  }

  const updated: Task = {
    ...task,
    ...updates,
    title,
    dueDate,
    status: nextStatus,
    completionPercent,
    isAtRisk,
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.tasks.set(id, updated);

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      await col.updateOne({ id, workspaceId: task.workspaceId }, { $set: updated });
    }
  } catch (e) {
    console.warn('MongoDB update task error:', e);
  }

  return updated;
}

/**
 * Deletes a task with workspace isolation.
 */
export async function deleteTask(id: string, workspaceId?: string): Promise<boolean> {
  const task = await getTaskById(id, workspaceId);
  if (!task) return false;

  const deletedMem = inMemoryStore.tasks.delete(id);
  let deletedMongo = false;

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const res = await col.deleteOne({ id, workspaceId: task.workspaceId });
      deletedMongo = res.deletedCount > 0;
    }
  } catch (e) {
    console.warn('MongoDB delete task error:', e);
  }

  return deletedMem || deletedMongo;
}

/**
 * Reassigns task or pairs helper with workspace validation.
 */
export async function reassignOrPairHelper(
  taskId: string,
  newAssigneeId?: string,
  helperId?: string,
  workspaceId?: string
): Promise<Task | null> {
  const task = await getTaskById(taskId, workspaceId);
  if (!task) return null;

  if (newAssigneeId) {
    const isMember = await isWorkspaceMember(newAssigneeId, task.workspaceId);
    if (!isMember) {
      throw new Error('The new assignee is not a member of this workspace.');
    }
    const user = inMemoryStore.users.get(newAssigneeId);
    task.assigneeId = newAssigneeId;
    task.assigneeName = user?.displayName || task.assigneeName;
    task.isAtRisk = false;
    task.riskReason = undefined;
  }

  if (helperId) {
    const isMember = await isWorkspaceMember(helperId, task.workspaceId);
    if (!isMember) {
      throw new Error('The helper is not a member of this workspace.');
    }
    task.suggestedHelperId = helperId;
    const helperUser = inMemoryStore.users.get(helperId);
    task.description = `${task.description}\n\n[Ordis Pair]: Assigned helper ${helperUser?.displayName || helperId} to finish before deadline.`;
    task.isAtRisk = false;
  }

  task.updatedAt = new Date().toISOString();
  inMemoryStore.tasks.set(taskId, task);

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      await col.updateOne({ id: taskId, workspaceId: task.workspaceId }, { $set: task });
    }
  } catch (e) {
    console.warn('MongoDB reassign task error:', e);
  }

  return task;
}
