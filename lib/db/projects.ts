import { inMemoryStore } from './store';
import { Project } from './types';
import { getCollection } from '@/lib/mongodb';

export async function getProjects(workspaceId: string): Promise<Project[]> {
  try {
    const col = await getCollection<Project>('projects');
    if (col) {
      const docs = await col.find({ workspaceId }).sort({ createdAt: -1 }).toArray();
      docs.forEach((p) => inMemoryStore.projects.set(p.id, p));
      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getProjects notice:', e);
  }

  return Array.from(inMemoryStore.projects.values())
    .filter((p) => p.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getProjectById(id: string, workspaceId?: string): Promise<Project | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  const project = inMemoryStore.projects.get(cleanId);
  if (project) {
    if (workspaceId && project.workspaceId !== workspaceId) return null;
    return project;
  }

  try {
    const col = await getCollection<Project>('projects');
    if (col) {
      const query: any = { id: cleanId };
      if (workspaceId) query.workspaceId = workspaceId;
      const found = await col.findOne(query);
      if (found) {
        inMemoryStore.projects.set(cleanId, found);
        return found;
      }
    }
  } catch {}

  return null;
}


export async function createProject(workspaceId: string, data: Partial<Project>): Promise<Project> {
  const id = `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const project: Project = {
    id,
    workspaceId,
    name: data.name || 'Untitled Project',
    description: data.description || '',
    clientName: data.clientName || 'Direct Client',
    clientId: data.clientId,
    leadId: data.leadId,
    budget: data.budget || 500000,
    spent: data.spent || 0,
    currency: data.currency || 'INR',
    startDate: data.startDate || new Date().toISOString(),
    deadline: data.deadline || new Date(Date.now() + 42 * 86400000).toISOString(), // 6 weeks default
    health: data.health || 'on_track',
    healthReason: data.healthReason,
    progressPercent: data.progressPercent || 0,
    ownerId: data.ownerId || 'usr_owner',
    teamMemberIds: data.teamMemberIds || [],
    milestones: data.milestones || [
      { id: 'ms_1', title: 'Discovery & Spec Alignment', dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), completed: false },
      { id: 'ms_2', title: 'Alpha Milestone Delivery', dueDate: new Date(Date.now() + 21 * 86400000).toISOString(), completed: false },
      { id: 'ms_3', title: 'Beta & Final Handover', dueDate: new Date(Date.now() + 42 * 86400000).toISOString(), completed: false },
    ],
    linkedDocIds: data.linkedDocIds || [],
    linkedMeetingIds: data.linkedMeetingIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.projects.set(id, project);

  try {
    const col = await getCollection<Project>('projects');
    if (col) {
      await col.insertOne(project);
    }
  } catch (e) {
    console.warn('MongoDB insert project notice:', e);
  }

  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>,
  workspaceId?: string
): Promise<Project | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  let project = inMemoryStore.projects.get(cleanId);

  if (!project) {
    try {
      const col = await getCollection<Project>('projects');
      if (col) {
        const query: any = { id: cleanId };
        if (workspaceId) query.workspaceId = workspaceId;
        const found = await col.findOne(query);
        if (found) project = found;
      }
    } catch {}
  }

  if (!project || (workspaceId && project.workspaceId !== workspaceId)) return null;

  // Sanitize update keys against NoSQL operator injection
  if (Object.keys(updates).some((key) => key.includes('.') || key.startsWith('$'))) {
    throw new Error('Invalid project update field');
  }

  const safeUpdates = { ...updates };
  delete (safeUpdates as any).id;
  delete (safeUpdates as any)._id;
  delete (safeUpdates as any).workspaceId;
  delete (safeUpdates as any).createdAt;

  const updated: Project = {
    ...project,
    ...safeUpdates,
    id: project.id,
    workspaceId: project.workspaceId,
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate health based on linked tasks
  const projectTasks = Array.from(inMemoryStore.tasks.values()).filter((t) => t.projectId === cleanId);
  if (projectTasks.length > 0) {
    const atRiskCount = projectTasks.filter((t) => t.isAtRisk).length;
    const completedCount = projectTasks.filter((t) => t.status === 'done').length;
    updated.progressPercent = Math.round((completedCount / projectTasks.length) * 100);

    if (atRiskCount >= 2 || (atRiskCount > 0 && updated.progressPercent < 30)) {
      updated.health = 'at_risk';
      updated.healthReason = `${atRiskCount} task(s) currently flagged at critical risk.`;
    } else if (new Date(updated.deadline).getTime() < Date.now() && updated.progressPercent < 100) {
      updated.health = 'delayed';
      updated.healthReason = 'Past scheduled deadline with unfinished deliverables.';
    } else if (updated.progressPercent === 100) {
      updated.health = 'completed';
    } else {
      updated.health = 'on_track';
      updated.healthReason = 'Milestones progress aligned with timeline.';
    }
  }

  inMemoryStore.projects.set(cleanId, updated);

  try {
    const col = await getCollection<Project>('projects');
    if (col) {
      await col.updateOne(
        { id: cleanId, workspaceId: project.workspaceId },
        {
          $set: {
            ...safeUpdates,
            progressPercent: updated.progressPercent,
            health: updated.health,
            healthReason: updated.healthReason,
            updatedAt: updated.updatedAt,
          },
        }
      );
    }
  } catch (e) {
    console.warn('MongoDB update project notice:', e);
  }

  return updated;
}

export async function deleteProject(id: string, workspaceId?: string): Promise<boolean> {
  const cleanId = (id || '').trim();
  if (!cleanId) return false;

  if (workspaceId) {
    const project = await getProjectById(cleanId, workspaceId);
    if (!project) return false;
  }

  const deleted = inMemoryStore.projects.delete(cleanId);
  try {
    const col = await getCollection<Project>('projects');
    if (col) {
      const query: any = { id: cleanId };
      if (workspaceId) query.workspaceId = workspaceId;
      await col.deleteOne(query);
    }
  } catch (e) {
    console.warn('MongoDB delete project notice:', e);
  }
  return deleted;
}
