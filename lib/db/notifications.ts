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

      // Dynamically guarantee all pending invitations for this user's email are present
      try {
        const invCol = await getCollection<any>('invitations');
        if (invCol && cleanEmail) {
          const pendingInvs = await invCol.find({ email: cleanEmail, status: 'pending' }).toArray();
          for (const pinv of pendingInvs) {
            const existingIdx = docs.findIndex((d) => d.referenceId === pinv.id);
            if (existingIdx === -1) {
              docs.unshift({
                id: `notif_inv_${pinv.id}`,
                userId: uid || pinv.inviteeUserId,
                userEmail: cleanEmail,
                workspaceId: pinv.workspaceId,
                type: 'workspace_invite',
                referenceId: pinv.id,
                text: `<strong>${pinv.invitedBy || 'Workspace Admin'}</strong> invited you to join <strong>${pinv.workspaceName || 'a workspace'}</strong> as <strong>${pinv.workspaceRole === 'admin' ? 'Admin' : 'Member'}</strong>.`,
                read: false,
                icon: 'mail',
                createdAt: pinv.createdAt || new Date().toISOString(),
                invitationData: {
                  workspaceId: pinv.workspaceId,
                  workspaceName: pinv.workspaceName || 'Workspace',
                  inviterName: pinv.invitedBy || 'Workspace Admin',
                  role: pinv.workspaceRole || 'member',
                  status: 'pending',
                },
              } as any);
            } else {
              docs[existingIdx].invitationData = {
                ...(docs[existingIdx].invitationData || {}),
                status: pinv.status,
                role: pinv.workspaceRole || pinv.roleTitle || 'member',
                workspaceName: pinv.workspaceName || docs[existingIdx].invitationData?.workspaceName,
              };
            }
          }
        }
      } catch (e) {
        console.warn('MongoDB invitation enrichment notice:', e);
      }

      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getUserNotifications notice:', e);
  }

  // Fallback to in-memory notifications and in-memory invitations
  const resultNotifs = inMemoryNotifications.filter((n) => {
    if (cleanEmail && n.userEmail === cleanEmail) return true;
    if (uid && n.userId === uid) return true;
    if (wsId && n.workspaceId === wsId && !n.userEmail) return true;
    return false;
  });

  try {
    const { inMemoryInvitations } = await import('./invitations');
    if (cleanEmail && inMemoryInvitations) {
      for (const pinv of inMemoryInvitations.values()) {
        if (pinv.email === cleanEmail && pinv.status === 'pending') {
          if (!resultNotifs.some((d) => d.referenceId === pinv.id)) {
            resultNotifs.unshift({
              id: `notif_inv_${pinv.id}`,
              userId: uid,
              userEmail: cleanEmail,
              workspaceId: pinv.workspaceId,
              type: 'workspace_invite',
              referenceId: pinv.id,
              text: `<strong>Workspace Admin</strong> invited you to join <strong>Workspace</strong> as <strong>${pinv.workspaceRole === 'admin' ? 'Admin' : 'Member'}</strong>.`,
              read: false,
              icon: 'mail',
              createdAt: pinv.createdAt || new Date().toISOString(),
              invitationData: {
                workspaceId: pinv.workspaceId,
                workspaceName: 'Workspace',
                inviterName: 'Workspace Admin',
                role: pinv.workspaceRole || 'member',
                status: 'pending',
              },
            });
          }
        }
      }
    }
  } catch {}

  return resultNotifs;
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
