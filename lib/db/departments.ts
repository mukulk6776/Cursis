import { inMemoryStore } from './store';
import { Department, Task } from './types';
import { getCollection } from '@/lib/mongodb';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Retrieves all departments strictly for the given workspace.
 * Automatically computes live member counts and active task counts.
 */
export async function getDepartments(workspaceId: string): Promise<Department[]> {
  const cleanWsId = (workspaceId || '').trim();
  if (!cleanWsId) return [];

  let departments: Department[] = [];

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      departments = await col.find({ workspaceId: cleanWsId }).sort({ createdAt: 1 }).toArray();
      departments.forEach((d) => inMemoryStore.departments.set(d.id, d));
    }
  } catch (e) {
    console.warn('MongoDB getDepartments error:', e);
  }

  // Fallback to inMemoryStore
  if (departments.length === 0) {
    departments = Array.from(inMemoryStore.departments.values()).filter((d) => d.workspaceId === cleanWsId);
  }

  // Live count enrichment: active tasks and assigned members
  try {
    const tasksCol = await getCollection<Task>('tasks');
    const usersCol = await getCollection<any>('users');
    const teamsCol = await getCollection<any>('workspace_teams');

    for (const d of departments) {
      if (tasksCol) {
        const taskCount = await tasksCol.countDocuments({
          workspaceId: cleanWsId,
          departmentId: d.id,
          status: { $ne: 'done' },
        });
        d.activeTaskCount = taskCount;
      } else {
        // In-memory count
        d.activeTaskCount = Array.from(inMemoryStore.tasks.values()).filter(
          (t) => t.workspaceId === cleanWsId && t.departmentId === d.id && t.status !== 'done'
        ).length;
      }

      // Member count
      if (teamsCol) {
        const memberCount = await teamsCol.countDocuments({
          workspaceId: cleanWsId,
          $or: [{ departmentId: d.id }, { department: d.name }],
        });
        d.memberCount = memberCount;
        d.membersCount = memberCount;
      } else if (usersCol) {
        const memberCount = await usersCol.countDocuments({
          $or: [{ workspaceIds: cleanWsId }, { activeWorkspaceId: cleanWsId }],
          $and: [{ $or: [{ departmentId: d.id }, { department: d.name }] }],
        });
        d.memberCount = memberCount;
        d.membersCount = memberCount;
      }
    }
  } catch (err) {
    console.warn('Department telemetry enrichment error:', err);
  }

  return departments;
}

/**
 * Retrieves a single department by ID, verifying workspace context if specified.
 */
export async function getDepartmentById(id: string, workspaceId?: string): Promise<Department | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  const dept = inMemoryStore.departments.get(cleanId);
  if (dept) {
    if (workspaceId && dept.workspaceId !== workspaceId) return null;
    return dept;
  }

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      const query: any = { id: cleanId };
      if (workspaceId) query.workspaceId = workspaceId;
      const found = await col.findOne(query);
      if (found) {
        inMemoryStore.departments.set(found.id, found);
        return found;
      }
    }
  } catch (e) {
    console.warn('MongoDB getDepartmentById error:', e);
  }

  return null;
}

/**
 * Creates a new department inside the specified workspace.
 * Enforces name validation, trims whitespace, and prevents duplicate names in the same workspace.
 */
export async function createDepartment(
  workspaceId: string,
  data: {
    name: string;
    description?: string;
    lead?: string | null;
    head?: string | null;
    createdBy?: string;
    color?: string;
    tags?: string[];
  }
): Promise<Department> {
  const cleanWsId = (workspaceId || '').trim();
  if (!cleanWsId) {
    throw new Error('Workspace context is required to create a department.');
  }

  const cleanName = (data.name || '').trim();
  if (!cleanName) {
    throw new Error('Department name is required.');
  }

  if (cleanName.length > 80) {
    throw new Error('Department name must be 80 characters or fewer.');
  }

  // Duplicate name check inside this workspace
  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      const existing = await col.findOne({
        workspaceId: cleanWsId,
        name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') },
      });
      if (existing) {
        throw new Error(`A department named "${cleanName}" already exists in this workspace.`);
      }
    }
  } catch (e: any) {
    if (e.message?.includes('already exists')) throw e;
  }

  // In-memory duplicate check
  const memExisting = Array.from(inMemoryStore.departments.values()).find(
    (d) => d.workspaceId === cleanWsId && d.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (memExisting) {
    throw new Error(`A department named "${cleanName}" already exists in this workspace.`);
  }

  const id = `dept_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const dept: Department = {
    id,
    workspaceId: cleanWsId,
    name: cleanName,
    description: (data.description || '').trim(),
    lead: data.lead || data.head || null,
    head: data.head || data.lead || null,
    createdBy: data.createdBy || 'usr_system',
    membersCount: 0,
    memberCount: 0,
    activeTaskCount: 0,
    color: data.color || '#0f4cff',
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: now,
    updatedAt: now,
  };

  inMemoryStore.departments.set(id, dept);

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      await col.insertOne(dept);
    }
  } catch (e) {
    console.warn('MongoDB insert department error:', e);
  }

  return dept;
}

/**
 * Updates a department inside a workspace.
 */
export async function updateDepartment(
  id: string,
  workspaceId: string,
  updates: {
    name?: string;
    description?: string;
    lead?: string | null;
    head?: string | null;
    color?: string;
    tags?: string[];
  }
): Promise<Department> {
  const existing = await getDepartmentById(id, workspaceId);
  if (!existing) {
    throw new Error('Department not found in this workspace.');
  }

  let nextName = existing.name;
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (!trimmed) {
      throw new Error('Department name cannot be empty.');
    }
    if (trimmed.toLowerCase() !== existing.name.toLowerCase()) {
      // Duplicate check
      const col = await getCollection<Department>('departments');
      if (col) {
        const dup = await col.findOne({
          workspaceId,
          name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
          id: { $ne: id },
        });
        if (dup) {
          throw new Error(`A department named "${trimmed}" already exists in this workspace.`);
        }
      }
    }
    nextName = trimmed;
  }

  const updated: Department = {
    ...existing,
    name: nextName,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    lead: updates.lead !== undefined ? updates.lead : existing.lead,
    head: updates.head !== undefined ? updates.head : existing.head,
    color: updates.color || existing.color,
    tags: updates.tags || existing.tags,
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.departments.set(id, updated);

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      await col.updateOne({ id, workspaceId }, { $set: updated });
    }
  } catch (e) {
    console.warn('MongoDB update department error:', e);
  }

  return updated;
}

export interface SafeDepartmentDeletionResult {
  success: boolean;
  activeTasksHandled?: number;
  membersHandled?: number;
}

/**
 * Safely deletes a department from a workspace.
 * If active tasks exist and no handling strategy is provided, throws an actionable error.
 */
export async function deleteDepartment(
  id: string,
  workspaceId: string,
  options?: {
    taskAction?: 'reassign' | 'unassign';
    targetDepartmentId?: string;
  }
): Promise<SafeDepartmentDeletionResult> {
  const dept = await getDepartmentById(id, workspaceId);
  if (!dept) {
    throw new Error('Department not found in this workspace.');
  }

  // 1. Check active tasks belonging to this department
  const tasksCol = await getCollection<Task>('tasks');
  let activeTaskCount = 0;
  if (tasksCol) {
    activeTaskCount = await tasksCol.countDocuments({
      workspaceId,
      departmentId: id,
      status: { $ne: 'done' },
    });
  } else {
    activeTaskCount = Array.from(inMemoryStore.tasks.values()).filter(
      (t) => t.workspaceId === workspaceId && t.departmentId === id && t.status !== 'done'
    ).length;
  }

  if (activeTaskCount > 0 && !options?.taskAction) {
    const err: any = new Error(
      `"${dept.name}" has ${activeTaskCount} active task(s). Choose how to handle them before deleting.`
    );
    err.code = 'ACTIVE_TASKS_EXIST';
    err.activeTaskCount = activeTaskCount;
    err.departmentName = dept.name;
    throw err;
  }

  // 2. Handle tasks if requested
  if (options?.taskAction === 'reassign') {
    if (!options.targetDepartmentId || options.targetDepartmentId === id) {
      throw new Error('A valid target department is required to reassign tasks.');
    }
    const targetDept = await getDepartmentById(options.targetDepartmentId, workspaceId);
    if (!targetDept) {
      throw new Error('Target department for reassignment does not exist in this workspace.');
    }

    if (tasksCol) {
      await tasksCol.updateMany(
        { workspaceId, departmentId: id },
        { $set: { departmentId: targetDept.id, updatedAt: new Date().toISOString() } }
      );
    }
    for (const t of inMemoryStore.tasks.values()) {
      if (t.workspaceId === workspaceId && t.departmentId === id) {
        t.departmentId = targetDept.id;
      }
    }
  } else if (options?.taskAction === 'unassign') {
    if (tasksCol) {
      await tasksCol.updateMany(
        { workspaceId, departmentId: id },
        { $unset: { departmentId: '' }, $set: { updatedAt: new Date().toISOString() } }
      );
    }
    for (const t of inMemoryStore.tasks.values()) {
      if (t.workspaceId === workspaceId && t.departmentId === id) {
        delete t.departmentId;
      }
    }
  }

  // 3. Reassign members
  try {
    const teamsCol = await getCollection<any>('workspace_teams');
    if (teamsCol) {
      await teamsCol.updateMany(
        { workspaceId, departmentId: id },
        { $set: { departmentId: '', department: 'General' } }
      );
    }
  } catch {}

  // 4. Delete department record
  inMemoryStore.departments.delete(id);

  try {
    const col = await getCollection<Department>('departments');
    if (col) {
      await col.deleteOne({ id, workspaceId });
    }
  } catch (e) {
    console.warn('MongoDB delete department error:', e);
  }

  return {
    success: true,
    activeTasksHandled: activeTaskCount,
  };
}
