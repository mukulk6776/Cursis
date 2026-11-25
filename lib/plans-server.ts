import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getWorkspace } from '@/lib/db/workspaces';
import { getProjects } from '@/lib/db/projects';
import { getTasks } from '@/lib/db/tasks';
import { inMemoryStore } from '@/lib/db/store';
import type { PlanAssignmentSource, UserProfile, Workspace } from '@/lib/db/types';
import { getPlanLimits, resolveActiveUserPlan, type PlanKey, type PlanLimits } from '@/lib/plans';

/**
 * Resolves effective plan limits for a workspace from persistent storage,
 * honoring owner's active subscription (including expiry/revocation) and workspace tier.
 */
export async function getWorkspacePlanLimits(
  workspaceId: string,
  userEmail?: string | null
): Promise<PlanLimits> {
  const cleanId = (workspaceId || '').trim();
  const ws = cleanId ? await getWorkspace(cleanId).catch(() => null) : null;

  let ownerActivePlan = null;
  let ownerHasRevokedOrExpiredSub = false;
  const ownerId = ws?.ownerId || (cleanId.startsWith('ws_usr_') ? cleanId.replace(/^ws_/, '') : '');

  if (ownerId) {
    try {
      const usersCol = await getCollection<UserProfile>('users');
      const ownerDoc = usersCol
        ? await usersCol.findOne({ $or: [{ uid: ownerId }, { id: ownerId }] })
        : inMemoryStore.users.get(ownerId);
      if (ownerDoc?.subscription) {
        ownerActivePlan = resolveActiveUserPlan(ownerDoc.subscription);
        if (!ownerActivePlan) {
          ownerHasRevokedOrExpiredSub = true;
        }
      }
    } catch {}
  }

  let effectiveTier = ws?.tier;
  if (ownerActivePlan) {
    effectiveTier = ownerActivePlan.plan;
  } else if (ownerHasRevokedOrExpiredSub) {
    effectiveTier = 'free';
  } else if (ws?.planExpiresAt) {
    const exp = Date.parse(ws.planExpiresAt);
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      effectiveTier = 'free';
    }
  }

  return getPlanLimits(effectiveTier, userEmail, ownerActivePlan);
}

/**
 * Upgrades or sets a workspace tier upon successful payment or admin assignment.
 */
export async function upgradeWorkspacePlan(
  workspaceId: string,
  planKey: PlanKey,
  options?: {
    source?: PlanAssignmentSource;
    startedAt?: string;
    expiresAt?: string | null;
  }
): Promise<Workspace | null> {
  const cleanId = (workspaceId || '').trim();
  if (!cleanId) return null;

  const limits = getPlanLimits(planKey);
  const nextOrdisMode = limits.hasOrdisAi ? 'full_power' : 'chill';
  const now = new Date().toISOString();

  const existing = inMemoryStore.workspaces.get(cleanId);
  if (existing) {
    existing.tier = planKey;
    existing.ordisMode = nextOrdisMode;
    existing.updatedAt = now;
    if (options?.source) existing.planSource = options.source;
    if (options?.startedAt !== undefined) existing.planStartedAt = options.startedAt;
    if (options?.expiresAt !== undefined) existing.planExpiresAt = options.expiresAt;
    inMemoryStore.workspaces.set(cleanId, existing);
  }

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      const setPayload: Record<string, any> = {
        tier: planKey,
        ordisMode: nextOrdisMode,
        updatedAt: now,
      };
      if (options?.source) setPayload.planSource = options.source;
      if (options?.startedAt !== undefined) setPayload.planStartedAt = options.startedAt;
      if (options?.expiresAt !== undefined) setPayload.planExpiresAt = options.expiresAt;

      const updated = await col.findOneAndUpdate(
        { id: cleanId },
        { $set: setPayload },
        { returnDocument: 'after' }
      );
      if (updated) {
        inMemoryStore.workspaces.set(cleanId, updated);
        return updated;
      }
    }
  } catch (error) {
    console.warn('[Plans] Failed to persist workspace upgrade:', error);
  }

  return existing || null;
}

/**
 * Synchronizes plan tier across all workspaces owned by a user.
 */
export async function syncUserOwnedWorkspacesPlan(
  ownerUserId: string,
  planKey: PlanKey,
  options?: {
    source?: PlanAssignmentSource;
    startedAt?: string;
    expiresAt?: string | null;
  }
): Promise<string[]> {
  const cleanUid = (ownerUserId || '').trim();
  if (!cleanUid) return [];

  const limits = getPlanLimits(planKey);
  const nextOrdisMode = limits.hasOrdisAi ? 'full_power' : 'chill';
  const now = new Date().toISOString();
  const touchedIds = new Set<string>([`ws_${cleanUid}`]);

  for (const ws of inMemoryStore.workspaces.values()) {
    if (ws.ownerId === cleanUid || ws.id === `ws_${cleanUid}`) {
      ws.tier = planKey;
      ws.ordisMode = nextOrdisMode;
      ws.updatedAt = now;
      if (options?.source) ws.planSource = options.source;
      if (options?.startedAt !== undefined) ws.planStartedAt = options.startedAt;
      if (options?.expiresAt !== undefined) ws.planExpiresAt = options.expiresAt;
      inMemoryStore.workspaces.set(ws.id, ws);
      touchedIds.add(ws.id);
    }
  }

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      const filter = { $or: [{ ownerId: cleanUid }, { id: `ws_${cleanUid}` }] };
      const existingDocs = await col.find(filter, { projection: { id: 1 } }).toArray();
      for (const doc of existingDocs) {
        if (doc.id) touchedIds.add(doc.id);
      }

      const setPayload: Record<string, any> = {
        tier: planKey,
        ordisMode: nextOrdisMode,
        updatedAt: now,
      };
      if (options?.source) setPayload.planSource = options.source;
      if (options?.startedAt !== undefined) setPayload.planStartedAt = options.startedAt;
      if (options?.expiresAt !== undefined) setPayload.planExpiresAt = options.expiresAt;

      await col.updateMany(filter, { $set: setPayload });
    }
  } catch (error) {
    console.warn('[Plans] Failed to sync owned workspaces:', error);
  }

  return Array.from(touchedIds);
}

/**
 * Blocks access to Pro-only features (Ordis AI or My Day) for lower tiers.
 */
export async function requirePlanFeature(
  workspaceId: string,
  feature: 'ordis' | 'myday',
  userEmail?: string | null
): Promise<NextResponse | null> {
  const limits = await getWorkspacePlanLimits(workspaceId, userEmail);
  const allowed = feature === 'ordis' ? limits.hasOrdisAi : limits.hasMyDay;
  if (allowed) return null;

  const featureName = feature === 'ordis' ? 'Ordis AI' : 'My Day';
  return NextResponse.json(
    {
      success: false,
      error: `${featureName} is included on the Pro Plan ($20/mo). Upgrade your workspace to unlock ${featureName}.`,
      code: 'PLAN_UPGRADE_REQUIRED',
      requiredPlan: 'pro',
    },
    { status: 403 }
  );
}

/**
 * Checks whether creating another project exceeds the workspace plan cap.
 */
export async function checkProjectCreationLimit(
  workspaceId: string,
  userEmail?: string | null
): Promise<NextResponse | null> {
  const limits = await getWorkspacePlanLimits(workspaceId, userEmail);
  if (limits.maxProjects === null) return null;

  const projects = await getProjects(workspaceId).catch(() => []);
  if (projects.length >= limits.maxProjects) {
    return NextResponse.json(
      {
        success: false,
        error: `Project limit reached (${limits.maxProjects} projects max on ${limits.name}). Upgrade to Pro ($20/mo) for unlimited projects.`,
        code: 'PLAN_LIMIT_REACHED',
        requiredPlan: 'pro',
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Checks whether adding a task under a specific project exceeds the plan's per-project cap.
 * Standalone tasks (no projectId) are unrestricted per Starter/Pro rules.
 */
export async function checkTaskPerProjectLimit(
  workspaceId: string,
  projectId?: string | null,
  userEmail?: string | null
): Promise<NextResponse | null> {
  const cleanProjId = (projectId || '').trim();
  if (!cleanProjId) return null;

  const limits = await getWorkspacePlanLimits(workspaceId, userEmail);
  if (limits.maxTasksPerProject === null) return null;

  const projectTasks = await getTasks(workspaceId, { projectId: cleanProjId }).catch(() => []);
  if (projectTasks.length >= limits.maxTasksPerProject) {
    return NextResponse.json(
      {
        success: false,
        error: `Task limit reached (${limits.maxTasksPerProject} tasks per project max on ${limits.name}). Upgrade to Pro ($20/mo) for unlimited tasks.`,
        code: 'PLAN_LIMIT_REACHED',
        requiredPlan: 'pro',
      },
      { status: 403 }
    );
  }
  return null;
}
