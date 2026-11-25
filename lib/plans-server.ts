import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getWorkspace } from '@/lib/db/workspaces';
import { getProjects } from '@/lib/db/projects';
import { getTasks } from '@/lib/db/tasks';
import { inMemoryStore } from '@/lib/db/store';
import type { Workspace } from '@/lib/db/types';
import { getPlanLimits, type PlanKey, type PlanLimits } from '@/lib/plans';

/**
 * Resolves effective plan limits for a workspace from persistent storage.
 */
export async function getWorkspacePlanLimits(
  workspaceId: string,
  userEmail?: string | null
): Promise<PlanLimits> {
  const cleanId = (workspaceId || '').trim();
  const ws = cleanId ? await getWorkspace(cleanId).catch(() => null) : null;
  return getPlanLimits(ws?.tier, userEmail);
}

/**
 * Upgrades a workspace to a verified plan tier upon successful payment or activation.
 */
export async function upgradeWorkspacePlan(
  workspaceId: string,
  planKey: PlanKey
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
    inMemoryStore.workspaces.set(cleanId, existing);
  }

  try {
    const col = await getCollection<Workspace>('workspaces');
    if (col) {
      const updated = await col.findOneAndUpdate(
        { id: cleanId },
        {
          $set: {
            tier: planKey,
            ordisMode: nextOrdisMode,
            updatedAt: now,
          },
        },
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
