import { inMemoryStore } from './store';
import { Task, TaskPriority, TaskStatus, UserProfile } from './types';
import { findBestMatchingHelpers } from './team';
import { getCollection } from '@/lib/mongodb';
import { createNotification } from './notifications';

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
  const wsAliases = Array.from(
    new Set([
      workspaceId,
      workspaceId?.replace(/^ws_/, ''),
      'ws_' + workspaceId,
      'ws_cursis_main',
      'ws_cursis_user',
    ].filter(Boolean))
  );

  try {
    const col = await getCollection<Task>('tasks');
    if (col) {
      const query: any = {
        $or: [
          { workspaceId: { $in: wsAliases } },
          { workspaceId },
        ],
      };
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

      // If no tasks exist in MongoDB for this workspace yet, auto-seed starter tasks
      if (docs.length === 0 && (!filter || Object.keys(filter).length === 0)) {
        const seedTasks: Task[] = [
          {
            id: `tsk_init_1_${Date.now()}`,
            workspaceId,
            title: 'Complete workspace onboarding and invite collaborators',
            description: 'Set up team roles, invite key stakeholders, and configure workspace channels.',
            status: 'in_progress',
            priority: 'high',
            dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
            estimatedHours: 4,
            actualHours: 1,
            completionPercent: 35,
            requiredSkills: ['Onboarding', 'Operations'],
            subtasks: [
              { id: 'st_1', title: 'Verify workspace settings', completed: true },
              { id: 'st_2', title: 'Invite team members via email', completed: false },
            ],
            tags: ['Operations', 'Onboarding'],
            isAtRisk: false,
            creatorId: 'usr_system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: `tsk_init_2_${Date.now()}`,
            workspaceId,
            title: 'Configure Ordis AI Copilot & Gemini API integration',
            description: 'Connect your Gemini API key to enable live conversational workspace command execution.',
            status: 'todo',
            priority: 'urgent',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            estimatedHours: 2,
            actualHours: 0,
            completionPercent: 0,
            requiredSkills: ['AI', 'Engineering'],
            subtasks: [
              { id: 'st_3', title: 'Add GEMINI_API_KEY to .env.local', completed: false },
              { id: 'st_4', title: 'Test natural language task creation in Ordis chat', completed: false },
            ],
            tags: ['AI', 'Setup'],
            isAtRisk: false,
            creatorId: 'usr_system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: `tsk_init_3_${Date.now()}`,
            workspaceId,
            title: 'Review Q4 deliverables and sprint velocity roadmap',
            description: 'Align quarterly milestones with engineering and design sprint schedules.',
            status: 'todo',
            priority: 'medium',
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            estimatedHours: 6,
            actualHours: 0,
            completionPercent: 0,
            requiredSkills: ['Strategy', 'Roadmap'],
            subtasks: [],
            tags: ['Sprint', 'Planning'],
            isAtRisk: false,
            creatorId: 'usr_system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        for (const st of seedTasks) {
          inMemoryStore.tasks.set(st.id, st);
          await col.updateOne({ id: st.id }, { $set: st }, { upsert: true }).catch(() => {});
        }
        return seedTasks;
      }
    }
  } catch (e) {
    console.warn('MongoDB getTasks notice:', e);
  }

  return Array.from(inMemoryStore.tasks.values())
    .filter((t) => {
      if (t.workspaceId !== workspaceId && !wsAliases.includes(t.workspaceId)) return false;
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

export async function createTask(workspaceId: string, data: Partial<Task> & Record<string, any>): Promise<Task> {
  const id = data.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Normalize title / name
  const title = (data.title || data.name || 'New Task').trim();

  // Normalize project
  const projectId = data.projectId || data.project || undefined;

  // Find assignee name if assigneeId / assignee is given
  const assigneeId = data.assigneeId || data.assignee || undefined;
  let assigneeName = data.assigneeName;
  if (assigneeId && !assigneeName) {
    const user = inMemoryStore.users.get(assigneeId);
    if (user) assigneeName = user.displayName;
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
    const helpers = await findBestMatchingHelpers(workspaceId, data.requiredSkills);
    const candidate = helpers.find((h) => h.user.id !== assigneeId);
    if (candidate) {
      suggestedHelperId = candidate.user.id;
      riskReason = `Due soon with only ${completionPercent}% done. Suggested helper: ${candidate.user.displayName}`;
    }
  }

  const task: Task = {
    id,
    workspaceId,
    projectId,
    title,
    description: data.description || '',
    status,
    priority: data.priority || 'medium',
    assigneeId,
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
      await col.updateOne({ id }, { $set: task }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB upsert task notice:', e);
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

  if (!task) {
    // If not in store or DB, create a baseline task document so updates are never lost
    task = {
      id,
      workspaceId: (updates as any).workspaceId || 'ws_cursis_main',
      title: updates.title || (updates as any).name || 'Task',
      status: 'todo',
      priority: updates.priority || 'medium',
      creatorId: 'usr_system',
      dueDate: normalizeSafeIsoDate(updates.dueDate || (updates as any).deadline),
      estimatedHours: 4,
      actualHours: 0,
      completionPercent: 0,
      requiredSkills: [],
      subtasks: [],
      tags: [],
      isAtRisk: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Normalize status if passed in frontend format
  let nextStatus = updates.status || task.status;
  const rawStatus = String(updates.status || '').toLowerCase();
  if (rawStatus === 'done' || rawStatus === 'completed') nextStatus = 'done';
  else if (rawStatus === 'in-progress' || rawStatus === 'in_progress') nextStatus = 'in_progress';
  else if (rawStatus === 'review' || rawStatus === 'in_review') nextStatus = 'in_review';
  else if (rawStatus === 'todo') nextStatus = 'todo';

  const title = (updates.title || (updates as any).name || task.title).trim();
  const dueDate = (updates.dueDate || (updates as any).deadline)
    ? normalizeSafeIsoDate(updates.dueDate || (updates as any).deadline)
    : task.dueDate;

  if (updates.assigneeId && !updates.assigneeName) {
    const user = inMemoryStore.users.get(updates.assigneeId);
    if (user) updates.assigneeName = user.displayName;
  }

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

  // Re-evaluate risk
  const isDueSoon = new Date(updated.dueDate).getTime() - Date.now() < 2 * 86400000;
  if (isDueSoon && updated.completionPercent < 30 && updated.status !== 'done') {
    updated.isAtRisk = true;
    if (!updated.riskReason) {
      updated.riskReason = `Deadline within 48 hours and completion is at ${updated.completionPercent}%.`;
    }
  } else if (updated.status === 'done' || updated.completionPercent >= 80) {
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
