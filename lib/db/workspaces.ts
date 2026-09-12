import { inMemoryStore } from './store';
import { Workspace } from './types';
import { getCollection } from '@/lib/mongodb';

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const ws = inMemoryStore.workspaces.get(id);
  if (ws) return ws;

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      const doc = await col.findOne({ id });
      if (doc) {
        inMemoryStore.workspaces.set(id, doc);
        return doc;
      }
    }
  } catch (e) {
    console.warn('MongoDB getWorkspace notice:', e);
  }

  return null;
}

export async function getAllWorkspaces(): Promise<Workspace[]> {
  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      const docs = await col.find({}).toArray();
      if (docs.length > 0) {
        docs.forEach((w) => inMemoryStore.workspaces.set(w.id, w));
        return docs;
      }
    }
  } catch {}
  return Array.from(inMemoryStore.workspaces.values());
}

export async function ensureWorkspaceExists(
  workspaceId: string,
  ownerIdHint?: string,
  nameHint?: string
): Promise<Workspace> {
  const cleanId = (workspaceId || '').trim();
  if (!cleanId || cleanId === 'ws_public' || cleanId === 'ws_default') {
    throw new Error('A valid workspace ID is required.');
  }

  // 1. Check in memory
  let ws = inMemoryStore.workspaces.get(cleanId) || null;

  // 2. Check MongoDB
  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      const doc = await col.findOne({ id: cleanId });
      if (doc) {
        ws = doc;
        inMemoryStore.workspaces.set(cleanId, doc);
      }
    }
  } catch {}

  if (ws) return ws;

  // 3. Needs to be created/reconstructed
  let resolvedOwnerId = ownerIdHint || '';
  let resolvedName = nameHint || '';

  if (!resolvedOwnerId && cleanId.startsWith('ws_usr_')) {
    resolvedOwnerId = cleanId.replace(/^ws_/, '');
  }

  try {
    const userCol = await getCollection<any>('users');
    if (userCol) {
      let ownerUser: any = null;
      if (resolvedOwnerId) {
        ownerUser = await userCol.findOne({ $or: [{ uid: resolvedOwnerId }, { id: resolvedOwnerId }] });
      }
      if (!ownerUser) {
        ownerUser = await userCol.findOne({
          $or: [
            { workspaceIds: cleanId },
            { activeWorkspaceId: cleanId },
            { role: 'owner' },
          ],
        });
      }
      if (ownerUser) {
        if (!resolvedOwnerId) resolvedOwnerId = ownerUser.uid || ownerUser.id;
        if (!resolvedName) resolvedName = `${ownerUser.displayName || 'Workspace'}'s Workspace`;
      }
    }
  } catch {}

  if (!resolvedOwnerId) resolvedOwnerId = 'usr_owner';
  if (!resolvedName) resolvedName = cleanId === 'ws_cursis_user' ? 'Cursis HQ' : 'Workspace';

  const newWs: Workspace = {
    id: cleanId,
    name: resolvedName,
    slug: resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    tier: 'free',
    ordisMode: 'chill',
    industry: 'Technology',
    teamSize: '1-10',
    features: ['workspace_core', 'team'],
    settings: {
      ambientMonitoring: true,
      approvalRequiredForActions: true,
      simulationMode: false,
      riskTolerance: 'medium',
    },
    ownerId: resolvedOwnerId,
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.workspaces.set(cleanId, newWs);

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      await col.updateOne({ id: cleanId }, { $set: newWs }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB ensureWorkspaceExists notice:', e);
  }

  return newWs;
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const wsMap = new Map<string, Workspace>();

  try {
    const userCol = await getCollection<any>('users');
    const memCol = await getCollection<any>('workspace_memberships');
    const wsCol = await getCollection<Workspace>('workspaces');

    // 1. Get user profile to check workspaceIds
    let userWorkspaceIds: string[] = [];
    let userName = 'User';
    let userDoc: any = null;
    if (userCol) {
      userDoc = await userCol.findOne({
        $or: [{ uid: userId }, { id: userId }],
      });
      if (userDoc) {
        userWorkspaceIds = userDoc.workspaceIds || [];
        userName = userDoc.displayName || userDoc.name || userName;
      }
    }

    // 2. Get memberships from workspace_memberships
    let membershipWsIds: string[] = [];
    if (memCol) {
      const memDocs = await memCol.find({ userId }).toArray();
      membershipWsIds = memDocs.map((m) => m.workspaceId).filter(Boolean);
    }

    const allTargetIds = Array.from(
      new Set([...userWorkspaceIds, ...membershipWsIds, userDoc?.activeWorkspaceId, `ws_${userId}`].filter(Boolean))
    );

    // 3. Query workspaces in MongoDB
    if (wsCol) {
      const query: any = {
        $or: [
          { ownerId: userId },
          { id: { $in: allTargetIds } },
        ],
      };

      const docs = await wsCol.find(query).toArray();
      docs.forEach((w) => {
        wsMap.set(w.id, w);
        inMemoryStore.workspaces.set(w.id, w);
      });

      // For any target workspace ID that was NOT found in docs, auto-ensure it exists
      for (const tId of allTargetIds) {
        if (!wsMap.has(tId) && tId !== 'ws_public' && tId !== 'ws_default') {
          try {
            const ensured = await ensureWorkspaceExists(tId, userId, `${userName}'s Workspace`);
            wsMap.set(tId, ensured);
          } catch {}
        }
      }
    }

    // 4. Also check in-memory store
    for (const ws of inMemoryStore.workspaces.values()) {
      if (ws.ownerId === userId || allTargetIds.includes(ws.id)) {
        if (!wsMap.has(ws.id)) {
          wsMap.set(ws.id, ws);
        }
      }
    }

    // 5. If user has no workspaces found at all, guarantee at least their personal workspace
    if (wsMap.size === 0) {
      const personalWsId = `ws_${userId}`;
      const defaultWs: Workspace = {
        id: personalWsId,
        name: `${userName}'s Workspace`,
        slug: `${userName.toLowerCase().replace(/\s+/g, '-')}-workspace`,
        tier: 'free',
        ordisMode: 'chill',
        industry: 'Technology',
        teamSize: '1-10',
        features: ['workspace_core', 'team'],
        settings: {
          ambientMonitoring: true,
          approvalRequiredForActions: true,
          simulationMode: false,
          riskTolerance: 'medium',
        },
        ownerId: userId,
        memberCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      wsMap.set(personalWsId, defaultWs);
      inMemoryStore.workspaces.set(personalWsId, defaultWs);
      if (wsCol) {
        wsCol.insertOne(defaultWs).catch(() => {});
        getCollection<any>('workspace_teams').then(async (teamCol) => {
          if (teamCol) {
            teamCol.updateOne(
              { workspaceId: personalWsId, userId },
              {
                $set: {
                  id: `wtm_${personalWsId}_${userId}`,
                  workspaceId: personalWsId,
                  workspaceName: defaultWs.name,
                  userId,
                  name: userName,
                  email: userDoc?.email || '',
                  role: 'owner',
                  title: userDoc?.title || 'Workspace Owner',
                  department: userDoc?.department || 'Leadership',
                  skills: userDoc?.skills || ['Leadership'],
                  photoURL: userDoc?.photoURL,
                  presence: userDoc?.presence || 'online',
                  joinedAt: defaultWs.createdAt,
                  updatedAt: defaultWs.updatedAt,
                },
              },
              { upsert: true }
            ).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    return Array.from(wsMap.values());
  } catch (e) {
    console.warn('MongoDB getUserWorkspaces error:', e);
    return Array.from(inMemoryStore.workspaces.values()).filter((ws) => ws.ownerId === userId);
  }
}

export async function createWorkspace(userId: string, data: Partial<Workspace>): Promise<string> {
  const id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newWorkspace: Workspace = {
    id,
    name: data.name || 'New Workspace',
    slug: data.slug || (data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : 'new-workspace'),
    tier: data.tier || 'free',
    ordisMode: data.tier === 'paid' ? 'full_power' : 'chill',
    industry: data.industry || 'Technology',
    teamSize: data.teamSize || '1-10',
    features: data.features || [
      'workspace_core',
      'communication',
      'tasks',
      'projects',
      'calendar',
      'meetings',
      'documents',
      'automations',
      'crm',
      'team',
      'dashboards',
      'search',
      'security',
      'ordis_ai',
      'agency_storefront',
    ],
    settings: {
      ambientMonitoring: data.settings?.ambientMonitoring ?? true,
      approvalRequiredForActions: data.tier === 'paid' ? false : true,
      simulationMode: data.settings?.simulationMode ?? (data.tier === 'paid'),
      riskTolerance: data.settings?.riskTolerance || 'medium',
      companyTone: data.settings?.companyTone || 'Professional, concise, proactive.',
      pricingFormula: data.settings?.pricingFormula || 'Standard custom tier quote formula.',
      ...data.settings,
    },
    ownerId: userId,
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.workspaces.set(id, newWorkspace);

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      await col.insertOne(newWorkspace);
    }
    const teamCol = await getCollection<any>('workspace_teams');
    const userCol = await getCollection<any>('users');
    if (teamCol && userCol) {
      const owner = await userCol.findOne({ $or: [{ uid: userId }, { id: userId }] });
      if (owner) {
        await teamCol.updateOne(
          { workspaceId: id, userId },
          {
            $set: {
              id: `wtm_${id}_${userId}`,
              workspaceId: id,
              workspaceName: newWorkspace.name,
              userId,
              name: owner.displayName || owner.name || owner.email.split('@')[0],
              email: owner.email,
              role: 'owner',
              title: owner.title || 'Workspace Owner',
              department: owner.department || 'Leadership',
              skills: owner.skills || ['Leadership'],
              photoURL: owner.photoURL,
              presence: owner.presence || 'online',
              joinedAt: newWorkspace.createdAt,
              updatedAt: newWorkspace.updatedAt,
            },
          },
          { upsert: true }
        );
      }
    }
  } catch (e) {
    console.warn('MongoDB insert workspace notice:', e);
  }

  return id;
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace | null> {
  const ws = inMemoryStore.workspaces.get(id);
  if (!ws) return null;

  const updated: Workspace = {
    ...ws,
    ...updates,
    settings: {
      ...ws.settings,
      ...updates.settings,
    },
    updatedAt: new Date().toISOString(),
  };

  // If tier is updated, auto-sync Ordis mode accordingly
  if (updates.tier) {
    updated.ordisMode = updates.tier === 'paid' ? 'full_power' : 'chill';
    if (updates.tier === 'paid') {
      updated.settings.approvalRequiredForActions = false;
    } else {
      updated.settings.approvalRequiredForActions = true;
    }
  }

  inMemoryStore.workspaces.set(id, updated);

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      await col.updateOne({ id }, { $set: updated }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB update workspace notice:', e);
  }

  return updated;
}
