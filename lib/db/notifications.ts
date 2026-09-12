import { inMemoryStore } from './store';
import { getCollection } from '@/lib/mongodb';
import { DbNotification } from './types';

// In-memory fallback notification store
const inMemoryNotifications: DbNotification[] = [];

export async function createNotification(params: {
  userId?: string;
  userEmail?: string;
  workspaceId?: string;
  type?: 'task' | 'mention' | 'meeting' | 'deadline' | 'ai' | 'project' | 'team' | 'automation' | 'agent' | 'security' | 'system';
  text: string;
  icon?: string;
}): Promise<DbNotification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanEmail = params.userEmail ? params.userEmail.trim().toLowerCase() : undefined;

  const notif: DbNotification = {
    id,
    userId: params.userId,
    userEmail: cleanEmail,
    workspaceId: params.workspaceId || 'ws_public',
    type: params.type || 'system',
    text: params.text,
    time: 'Just now',
    read: false,
    icon: params.icon || 'bell',
    createdAt: new Date().toISOString(),
  };

  inMemoryNotifications.unshift(notif);
  if (inMemoryNotifications.length > 200) {
    inMemoryNotifications.pop();
  }

  try {
    const col = await getCollection<DbNotification>('notifications');
    if (col) {
      await col.insertOne(notif);
    }
  } catch (e) {
    console.warn('MongoDB createNotification notice:', e);
  }

  return notif;
}

export async function getUserNotifications(params: {
  userId?: string;
  userEmail?: string;
  workspaceId?: string;
}): Promise<DbNotification[]> {
  const cleanEmail = params.userEmail ? params.userEmail.trim().toLowerCase() : undefined;
  const uid = params.userId;
  const wsId = params.workspaceId;

  try {
    const col = await getCollection<DbNotification>('notifications');
    if (col) {
      const orClauses: any[] = [];
      if (cleanEmail) orClauses.push({ userEmail: cleanEmail });
      if (uid) orClauses.push({ userId: uid });
      if (wsId) {
        orClauses.push({ workspaceId: wsId, userEmail: { $exists: false } });
        orClauses.push({ workspaceId: { $in: ['ws_public', 'ws_default', 'ws_cursis_user'] }, userEmail: { $exists: false } });
      }

      const query = orClauses.length > 0 ? { $or: orClauses } : {};
      const docs = await col.find(query).sort({ createdAt: -1 }).limit(50).toArray();
      if (docs.length > 0) {
        // Enrich invitation status dynamically from invitations collection
        try {
          const invCol = await getCollection<any>('invitations');
          if (invCol) {
            const invIds = docs
              .filter((d) => d.type === 'workspace_invite' && d.referenceId)
              .map((d) => d.referenceId);
            if (invIds.length > 0) {
              const liveInvs = await invCol.find({ id: { $in: invIds } }).toArray();
              const invMap = new Map<string, any>(liveInvs.map((i: any) => [i.id, i]));
              docs.forEach((d) => {
                if (d.referenceId && invMap.has(d.referenceId)) {
                  const liveInv = invMap.get(d.referenceId);
                  d.invitationData = {
                    ...(d.invitationData || {}),
                    status: liveInv.status,
                    role: liveInv.workspaceRole || liveInv.roleTitle,
                  };
                }
              });
            }
          }
        } catch {}
        return docs;
      }
    }
  } catch (e) {
    console.warn('MongoDB getUserNotifications notice:', e);
  }

  // Fallback to in-memory notifications
  return inMemoryNotifications.filter((n) => {
    if (cleanEmail && n.userEmail === cleanEmail) return true;
    if (uid && n.userId === uid) return true;
    if (wsId && n.workspaceId === wsId && !n.userEmail) return true;
    return false;
  });
}

export async function markAllNotificationsRead(params: {
  userId?: string;
  userEmail?: string;
}): Promise<boolean> {
  const cleanEmail = params.userEmail ? params.userEmail.trim().toLowerCase() : undefined;
  const uid = params.userId;

  try {
    const col = await getCollection<DbNotification>('notifications');
    if (col) {
      const orClauses: any[] = [];
      if (cleanEmail) orClauses.push({ userEmail: cleanEmail });
      if (uid) orClauses.push({ userId: uid });
      if (orClauses.length > 0) {
        await col.updateMany({ $or: orClauses }, { $set: { read: true } });
      }
    }
  } catch (e) {
    console.warn('MongoDB markAllNotificationsRead notice:', e);
  }

  inMemoryNotifications.forEach((n) => {
    if ((cleanEmail && n.userEmail === cleanEmail) || (uid && n.userId === uid)) {
      n.read = true;
    }
  });

  return true;
}
