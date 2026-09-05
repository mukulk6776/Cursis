import { inMemoryStore } from './store';
import { Workspace, WorkspaceTier, OrdisMode } from './types';
import { adminDb } from '@/lib/auth/firebase-admin';

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const ws = inMemoryStore.workspaces.get(id);
  if (ws) return ws;

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      const doc = await adminDb.collection('workspaces').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Workspace;
      }
    } catch (e) {
      console.warn('Firestore getWorkspace error:', e);
    }
  }

  return null;
}

export async function getAllWorkspaces(): Promise<Workspace[]> {
  return Array.from(inMemoryStore.workspaces.values());
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  return Array.from(inMemoryStore.workspaces.values()).filter(
    (ws) => ws.ownerId === userId || ws.id === 'ws_cursis_demo'
  );
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

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      await adminDb.collection('workspaces').doc(id).set(newWorkspace);
    } catch (e) {
      console.warn('Firestore set workspace error:', e);
    }
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

  if (adminDb && typeof adminDb.collection === 'function' && process.env.FIREBASE_PROJECT_ID) {
    try {
      await adminDb.collection('workspaces').doc(id).set(updated, { merge: true });
    } catch (e) {
      console.warn('Firestore update workspace error:', e);
    }
  }

  return updated;
}
