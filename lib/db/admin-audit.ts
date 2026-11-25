import { getDb, getCollection } from '@/lib/mongodb';
import type { AdminAuditLogEntry } from './types';

const COLLECTION = 'admin_audit_log';
const inMemoryAdminAuditLogs: AdminAuditLogEntry[] = [];

export async function recordAdminAuditLog(
  entry: Omit<AdminAuditLogEntry, 'id' | 'timestamp'>,
  dbSession?: any
): Promise<AdminAuditLogEntry> {
  const fullEntry: AdminAuditLogEntry = {
    id: `admaud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };

  inMemoryAdminAuditLogs.unshift(fullEntry);
  if (inMemoryAdminAuditLogs.length > 500) {
    inMemoryAdminAuditLogs.pop();
  }

  try {
    const db = await getDb();
    if (db) {
      await db.collection<AdminAuditLogEntry>(COLLECTION).insertOne(fullEntry, dbSession ? { session: dbSession } : undefined);
    }
  } catch (error) {
    console.warn('[admin-audit] Failed to persist audit entry:', error instanceof Error ? error.message : 'unknown');
  }

  return fullEntry;
}

export async function getAdminAuditLogs(options?: {
  targetUserId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ logs: AdminAuditLogEntry[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, Math.floor(options?.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options?.pageSize || 25)));
  const skip = (page - 1) * pageSize;
  const targetUserId = options?.targetUserId?.trim();

  try {
    const col = await getCollection<AdminAuditLogEntry>(COLLECTION);
    if (col) {
      const filter: Record<string, any> = targetUserId ? { targetUserId } : {};
      const [logs, total] = await Promise.all([
        col.find(filter, { projection: { _id: 0 } }).sort({ timestamp: -1 }).skip(skip).limit(pageSize).toArray(),
        col.countDocuments(filter),
      ]);
      return {
        logs,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }
  } catch (error) {
    console.warn('[admin-audit] Failed to query logs:', error instanceof Error ? error.message : 'unknown');
  }

  const filtered = targetUserId
    ? inMemoryAdminAuditLogs.filter((l) => l.targetUserId === targetUserId)
    : inMemoryAdminAuditLogs;
  const total = filtered.length;
  return {
    logs: filtered.slice(skip, skip + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
