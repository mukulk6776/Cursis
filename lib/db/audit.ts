import { inMemoryStore } from './store';
import { AuditLogEntry } from './types';

export async function getAuditLogs(workspaceId: string): Promise<AuditLogEntry[]> {
  return Array.from(inMemoryStore.auditLogs.values())
    .filter((log) => log.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function logAuditEvent(
  workspaceId: string,
  entryData: {
    actorType: 'user' | 'ordis_autonomous' | 'ordis_assisted' | 'automation_rule';
    actorId: string;
    actorName: string;
    action: string;
    targetType: string;
    targetId: string;
    details: Record<string, any>;
    isRollbackable?: boolean;
    rollbackState?: Record<string, any>;
  }
): Promise<AuditLogEntry> {
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const entry: AuditLogEntry = {
    id,
    workspaceId,
    actorType: entryData.actorType,
    actorId: entryData.actorId,
    actorName: entryData.actorName,
    action: entryData.action,
    targetType: entryData.targetType,
    targetId: entryData.targetId,
    details: entryData.details,
    isRollbackable: entryData.isRollbackable ?? false,
    rollbackState: entryData.rollbackState,
    rolledBack: false,
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.auditLogs.set(id, entry);
  return entry;
}

// Rollback an autonomous or manual action
export async function rollbackAction(
  auditId: string,
  performedByUserId: string
): Promise<{ success: boolean; message: string }> {
  const entry = inMemoryStore.auditLogs.get(auditId);
  if (!entry) {
    return { success: false, message: 'Audit entry not found' };
  }

  if (!entry.isRollbackable || !entry.rollbackState) {
    return { success: false, message: 'This action is not marked as rollbackable' };
  }

  if (entry.rolledBack) {
    return { success: false, message: 'This action has already been rolled back' };
  }

  // Perform state restoration based on targetType
  if (entry.targetType === 'task') {
    const task = inMemoryStore.tasks.get(entry.targetId);
    if (task && entry.rollbackState) {
      Object.assign(task, entry.rollbackState);
      task.updatedAt = new Date().toISOString();
      inMemoryStore.tasks.set(task.id, task);
    }
  } else if (entry.targetType === 'project') {
    const project = inMemoryStore.projects.get(entry.targetId);
    if (project && entry.rollbackState) {
      Object.assign(project, entry.rollbackState);
      project.updatedAt = new Date().toISOString();
      inMemoryStore.projects.set(project.id, project);
    }
  }

  entry.rolledBack = true;
  inMemoryStore.auditLogs.set(auditId, entry);

  // Log the rollback itself
  await logAuditEvent(entry.workspaceId, {
    actorType: 'user',
    actorId: performedByUserId,
    actorName: 'Audit Admin',
    action: 'action.rolled_back',
    targetType: 'audit_entry',
    targetId: auditId,
    details: { originalAction: entry.action, targetId: entry.targetId },
    isRollbackable: false,
  });

  return { success: true, message: `Action "${entry.action}" on ${entry.targetType} ${entry.targetId} successfully rolled back.` };
}
