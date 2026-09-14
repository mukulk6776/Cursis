import { inMemoryStore } from './store';
import { Task, TaskPriority, TaskStatus, UserProfile } from './types';
import { findBestMatchingHelpers } from './team';
import { getCollection } from '@/lib/mongodb';
import { createNotification } from './notifications';

export async function getTasks(
  workspaceId: string,
  filter?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    isAtRisk?: boolean;
  }
): Promise<Task[]> {
  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const query: any = { workspaceId };
      if (filter?.projectId) query.projectId = filter.projectId;
      if (filter?.assigneeId) query.assigneeId = filter.assigneeId;
      if (filter?.status) query.status = filter.status;
      if (filter?.priority) query.priority = filter.priority;
      if (filter?.isAtRisk !== undefined) query.isAtRisk = filter.isAtRisk;
      const docs = await col.find(query).sort({ dueDate: 1 }).toArray();
      if (docs.length > 0) {
        docs.forEach((t) => inMemoryStore.tasks.set(t.id, t));
        return docs;
      }
    }
  } catch (e) {
    console.warn('MongoDB getTasks notice:', e);
  }

  return Array.from(inMemoryStore.tasks.values())
    .filter((t) => {
      if (t.workspaceId !== workspaceId) return false;
      if (filter?.projectId && t.projectId !== filter.projectId) return false;
      if (filter?.assigneeId && t.assigneeId !== filter.assigneeId) return false;
      if (filter?.status && t.status !== filter.status) return false;
      if (filter?.priority && t.priority !== filter.priority) return false;
      if (filter?.isAtRisk !== undefined && Boolean(t.isAtRisk) !== filter.isAtRisk) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function getTaskById(id: string): Promise<Task | null> {
  const task = inMemoryStore.tasks.get(id);
  if (task) return task;

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const found = await col.findOne({ id });
      if (found) {
        inMemoryStore.tasks.set(id, found);
        return found;
      }
    }
  } catch {}

  return null;
}

export async function createTask(workspaceId: string, data: Partial<Task>): Promise<Task> {
  const id = data.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Find assignee name if assigneeId is given
  let assigneeName = data.assigneeName;
  if (data.assigneeId && !assigneeName) {
    const user = inMemoryStore.users.get(data.assigneeId);
    if (user) assigneeName = user.displayName;
  }

  const dueDate = data.dueDate || new Date(Date.now() + 3 * 86400000).toISOString();
  const completionPercent = data.completionPercent ?? (data.status === 'done' ? 100 : 0);

  // Check if at risk
  const isDueSoon = new Date(dueDate).getTime() - Date.now() < 2 * 86400000;
  const isAtRisk = data.isAtRisk ?? (isDueSoon && completionPercent < 30 && data.status !== 'done');

  let suggestedHelperId = data.suggestedHelperId;
  let riskReason = data.riskReason;

  if (isAtRisk && !suggestedHelperId && data.requiredSkills && data.requiredSkills.length > 0) {
    const helpers = await findBestMatchingHelpers(workspaceId, data.requiredSkills);
    const candidate = helpers.find((h) => h.user.id !== data.assigneeId);
    if (candidate) {
      suggestedHelperId = candidate.user.id;
      riskReason = `Due soon with only ${completionPercent}% done. Suggested helper: ${candidate.user.displayName}`;
    }
  }

  const task: Task = {
    id,
    workspaceId,
    projectId: data.projectId,
    title: data.title || 'New Task',
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    assigneeId: data.assigneeId,
    assigneeName,
    creatorId: data.creatorId || 'usr_creator',
    dueDate,
    estimatedHours: data.estimatedHours || 4,
    actualHours: data.actualHours || 0,
    completionPercent,
    requiredSkills: data.requiredSkills || [],
    subtasks: data.subtasks || [],
    tags: data.tags || [],
    isAtRisk,
    riskReason,
    suggestedHelperId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.tasks.set(id, task);

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      await col.insertOne(task);
    }
  } catch (e) {
    console.warn('MongoDB insert task notice:', e);
  }

  // Send notification to the assigned team member
  if (task.assigneeId) {
    try {
      // Look up creator name
      let creatorName = 'Someone';
      const creatorUser = inMemoryStore.users.get(task.creatorId);
      if (creatorUser) {
        creatorName = creatorUser.displayName || creatorUser.email?.split('@')[0] || 'Someone';
      } else {
        // Try MongoDB
        const usersCol = await getCollection<UserProfile>('users');
        if (usersCol) {
          const creatorDoc = await usersCol.findOne({ $or: [{ id: task.creatorId }, { uid: task.creatorId }] });
          if (creatorDoc) {
            creatorName = creatorDoc.displayName || creatorDoc.email?.split('@')[0] || 'Someone';
          }
        }
      }

      // Look up assignee email for notification targeting
      let assigneeEmail: string | undefined;
      const assigneeUser = inMemoryStore.users.get(task.assigneeId);
      if (assigneeUser) {
        assigneeEmail = assigneeUser.email;
      } else {
        const usersCol = await getCollection<UserProfile>('users');
        if (usersCol) {
          const assigneeDoc = await usersCol.findOne({ $or: [{ id: task.assigneeId }, { uid: task.assigneeId }] });
          if (assigneeDoc) {
            assigneeEmail = assigneeDoc.email;
          }
        }
      }

      if (!assigneeEmail) {
        const teamCol = await getCollection<any>('workspace_teams');
        if (teamCol) {
          const teamDoc = await teamCol.findOne({
            workspaceId: task.workspaceId,
            $or: [{ userId: task.assigneeId }, { id: task.assigneeId }],
          });
          if (teamDoc?.email) assigneeEmail = teamDoc.email;
        }
      }

      await createNotification({
        userId: task.assigneeId,
        userEmail: assigneeEmail,
        workspaceId: task.workspaceId,
        type: 'task',
        text: `<strong>${creatorName}</strong> assigned you a task: <strong>${task.title}</strong>`,
        icon: 'clipboard',
      });
    } catch (e) {
      console.warn('Task notification creation notice:', e);
    }
  }

  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  let task = inMemoryStore.tasks.get(id);
  if (!task) {
    try {
      const col = await getCollection<Task>('tasks');
      if (col) {
        const found = await col.findOne({ id });
        if (found) {
          task = found;
          inMemoryStore.tasks.set(id, found);
        }
      }
    } catch (e) {
      console.warn('MongoDB fetch task notice:', e);
    }
  }

  if (!task) return null;

  if (updates.assigneeId && !updates.assigneeName) {
    const user = inMemoryStore.users.get(updates.assigneeId);
    if (user) updates.assigneeName = user.displayName;
  }

  if (updates.status === 'done' || updates.status === ('completed' as any)) {
    updates.completionPercent = 100;
    updates.isAtRisk = false;
  }

  const updated: Task = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Re-evaluate risk
  const isDueSoon = new Date(updated.dueDate).getTime() - Date.now() < 2 * 86400000;
  if (isDueSoon && updated.completionPercent < 30 && updated.status !== 'done' && updated.status !== ('completed' as any)) {
    updated.isAtRisk = true;
    if (!updated.riskReason) {
      updated.riskReason = `Deadline within 48 hours and completion is at ${updated.completionPercent}%.`;
    }
  } else if (updated.status === 'done' || updated.status === ('completed' as any) || updated.completionPercent >= 80) {
    updated.isAtRisk = false;
  }

  inMemoryStore.tasks.set(id, updated);

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      await col.updateOne({ id }, { $set: updated }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB update task notice:', e);
  }

  // Send notification if assignee changed
  if (updates.assigneeId && updates.assigneeId !== task.assigneeId) {
    try {
      let creatorName = 'Someone';
      const creatorUser = inMemoryStore.users.get(task.creatorId);
      if (creatorUser) {
        creatorName = creatorUser.displayName || creatorUser.email?.split('@')[0] || 'Someone';
      } else {
        const usersCol = await getCollection<UserProfile>('users');
        if (usersCol) {
          const creatorDoc = await usersCol.findOne({ $or: [{ id: task.creatorId }, { uid: task.creatorId }] });
          if (creatorDoc) {
            creatorName = creatorDoc.displayName || creatorDoc.email?.split('@')[0] || 'Someone';
          }
        }
      }

      let assigneeEmail: string | undefined;
      const assigneeUser = inMemoryStore.users.get(updates.assigneeId);
      if (assigneeUser) {
        assigneeEmail = assigneeUser.email;
      } else {
        const usersCol = await getCollection<UserProfile>('users');
        if (usersCol) {
          const assigneeDoc = await usersCol.findOne({ $or: [{ id: updates.assigneeId }, { uid: updates.assigneeId }] });
          if (assigneeDoc) {
            assigneeEmail = assigneeDoc.email;
          }
        }
      }

      if (!assigneeEmail) {
        const teamCol = await getCollection<any>('workspace_teams');
        if (teamCol) {
          const teamDoc = await teamCol.findOne({
            workspaceId: updated.workspaceId,
            $or: [{ userId: updates.assigneeId }, { id: updates.assigneeId }],
          });
          if (teamDoc?.email) assigneeEmail = teamDoc.email;
        }
      }

      await createNotification({
        userId: updates.assigneeId,
        userEmail: assigneeEmail,
        workspaceId: updated.workspaceId,
        type: 'task',
        text: `<strong>${creatorName}</strong> assigned you a task: <strong>${updated.title}</strong>`,
        icon: 'clipboard',
      });
    } catch (e) {
      console.warn('Task reassignment notification notice:', e);
    }
  }

  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const deletedMem = inMemoryStore.tasks.delete(id);
  let deletedMongo = false;
  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const res = await col.deleteOne({ id });
      deletedMongo = res.deletedCount > 0;
    }
  } catch (e) {
    console.warn('MongoDB delete task notice:', e);
  }
  return deletedMem || deletedMongo;
}

// Reassign task or pair helper (Real-life example from document)
export async function reassignOrPairHelper(
  taskId: string,
  newAssigneeId?: string,
  helperId?: string
): Promise<Task | null> {
  const task = inMemoryStore.tasks.get(taskId);
  if (!task) return null;

  if (newAssigneeId) {
    const user = inMemoryStore.users.get(newAssigneeId);
    task.assigneeId = newAssigneeId;
    task.assigneeName = user?.displayName || task.assigneeName;
    task.isAtRisk = false;
    task.riskReason = undefined;
  }

  if (helperId) {
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
      await col.updateOne({ id: taskId }, { $set: task });
    }
  } catch (e) {
    console.warn('MongoDB reassign task notice:', e);
  }

  return task;
}
