import { inMemoryStore } from './store';
import { getCollection } from '@/lib/mongodb';
import { AuditLogEntry } from './types';

// In-memory fallback
const inMemoryAuditLogs: AuditLogEntry[] = [];

export async function getAuditLogs(workspaceId: string): Promise<AuditLogEntry[]> {
  try {
    const col = await getCollection<AuditLogEntry>('audit_logs');
    if (col) {
      const docs = await col
        .find({ workspaceId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      if (docs.length > 0) return docs;
    }
  } catch (e) {
    console.warn('MongoDB getAuditLogs notice:', e);
  }

  // Fallback: combine in-memory store + local array
  const storeEntries = Array.from(inMemoryStore.auditLogs.values())
    .filter((log) => log.workspaceId === workspaceId);
  const localEntries = inMemoryAuditLogs.filter((log) => log.workspaceId === workspaceId);
  const combined = [...storeEntries, ...localEntries];
  const uniqueMap = new Map(combined.map((e) => [e.id, e]));
  return Array.from(uniqueMap.values())
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

  // Persist to in-memory stores
  inMemoryStore.auditLogs.set(id, entry);
  inMemoryAuditLogs.unshift(entry);
  if (inMemoryAuditLogs.length > 200) inMemoryAuditLogs.pop();

  // Persist to MongoDB
  try {
    const col = await getCollection<AuditLogEntry>('audit_logs');
    if (col) {
      await col.insertOne(entry);
    }
  } catch (e) {
    console.warn('MongoDB logAuditEvent notice:', e);
  }

  return entry;
}

// Rollback an autonomous or manual action
export async function rollbackAction(
  auditId: string,
  performedByUserId: string
): Promise<{ success: boolean; message: string }> {
  // Try MongoDB first
  let entry: AuditLogEntry | null = null;
  try {
    const col = await getCollection<AuditLogEntry>('audit_logs');
    if (col) {
      entry = await col.findOne({ id: auditId }) as AuditLogEntry | null;
    }
  } catch (e) {
    console.warn('MongoDB rollbackAction find notice:', e);
  }

  // Fallback to in-memory
  if (!entry) {
    entry = inMemoryStore.auditLogs.get(auditId) || null;
  }

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

  // Update MongoDB
  try {
    const col = await getCollection<AuditLogEntry>('audit_logs');
    if (col) {
      await col.updateOne({ id: auditId }, { $set: { rolledBack: true } });
    }
  } catch (e) {
    console.warn('MongoDB rollbackAction update notice:', e);
  }

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
