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

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const wsMap = new Map<string, Workspace>();

  try {
    const userCol = await getCollection<any>('users');
    const memCol = await getCollection<any>('workspace_memberships');
    const wsCol = await getCollection<Workspace>('workspaces');

    // 1. Get user profile to check workspaceIds
    let userWorkspaceIds: string[] = [];
    let userName = 'User';
    if (userCol) {
      const userDoc = await userCol.findOne({
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
      new Set([...userWorkspaceIds, ...membershipWsIds, `ws_${userId}`])
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
