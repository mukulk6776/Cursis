import { getUserWorkspaceRole as resolveWorkspaceRole } from '@/lib/auth/rbac';
import { UserRole } from './types';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Enhanced workspace management with unique URLs
 * URL format: /dashboard/w/[workspaceSlug] or /dashboard/w/[workspaceId]
 */

export interface Workspace {
  _id?: ObjectId;
  id: string;
  workspaceId: string;
  name: string;
  slug: string; // URL-friendly unique identifier
  ownerId: string;
  memberCount: number;
  tier: 'free' | 'paid';
  members: Array<{
    userId: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
  }>;
  settings: {
    theme?: 'light' | 'dark';
    timezone?: string;
    language?: string;
    notifications?: boolean;
    ambientMonitoring?: boolean;
    approvalRequiredForActions?: boolean;
    simulationMode?: boolean;
    riskTolerance?: 'low' | 'medium' | 'high';
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a unique URL-friendly slug from workspace name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

/**
 * Create a new workspace
 */
export async function createWorkspace(data: {
  name: string;
  ownerId: string;
  ownerEmail: string;
}): Promise<Workspace> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) {
    throw new Error('Database unavailable');
  }

  const baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  let counter = 1;

  // Ensure slug uniqueness
  while (await workspaces.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  const workspace: Workspace = {
    id: workspaceId,
    workspaceId,
    name: data.name,
    slug,
    ownerId: data.ownerId,
    memberCount: 1,
    tier: 'free',
    members: [
      {
        userId: data.ownerId,
        email: data.ownerEmail,
        role: 'owner',
        joinedAt: now,
      },
    ],
    settings: {
      theme: 'light',
      notifications: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  await workspaces.insertOne(workspace);

  // Sync to canonical memberships collection
  try {
    const memCol = await getCollection<any>('workspace_memberships');
    if (memCol) {
      await memCol.updateOne(
        { workspaceId, userId: data.ownerId },
        { $set: { id: `mem_${workspaceId}_${data.ownerId}`, workspaceId, userId: data.ownerId, role: 'owner', createdAt: now } },
        { upsert: true }
      );
    }
  } catch {}

  return workspace;
}

/**
 * Get workspace by ID or slug
 */
export async function getWorkspace(identifier: string): Promise<Workspace | null> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return null;

  // Try finding by slug, workspaceId, or id
  const workspace = await workspaces.findOne({
    $or: [{ slug: identifier }, { workspaceId: identifier }, { id: identifier }],
  });

  return workspace;
}

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return [];

  const userWorkspaces = await workspaces
    .find({
      $or: [
        { 'members.userId': userId },
        { ownerId: userId },
      ],
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return userWorkspaces;
}

/**
 * Update workspace
 */
export async function updateWorkspace(
  identifier: string,
  updates: Partial<Pick<Workspace, 'name' | 'settings'>>
): Promise<Workspace | null> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return null;

  const now = new Date().toISOString();
  const updateData: any = {
    ...updates,
    updatedAt: now,
  };

  // If name is being updated, regenerate slug
  if (updates.name) {
    const baseSlug = generateSlug(updates.name);
    let slug = baseSlug;
    let counter = 1;

    while (await workspaces.findOne({ slug, workspaceId: { $ne: identifier } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    updateData.slug = slug;
  }

  const result = await workspaces.findOneAndUpdate(
    { $or: [{ slug: identifier }, { workspaceId: identifier }, { id: identifier }] },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Add member to workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  member: {
    userId: string;
    email: string;
    role: 'admin' | 'member';
  }
): Promise<boolean> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return false;

  const now = new Date().toISOString();
  const result = await workspaces.updateOne(
    { $or: [{ workspaceId }, { id: workspaceId }] },
    {
      $push: {
        members: {
          ...member,
          joinedAt: now,
        },
      },
      $inc: { memberCount: 1 },
      $set: { updatedAt: now },
    }
  );

  try {
    const memCol = await getCollection<any>('workspace_memberships');
    if (memCol) {
      await memCol.updateOne(
        { workspaceId, userId: member.userId },
        { $set: { id: `mem_${workspaceId}_${member.userId}`, workspaceId, userId: member.userId, role: member.role, createdAt: now } },
        { upsert: true }
      );
    }
  } catch {}

  return result.modifiedCount > 0;
}

/**
 * Remove member from workspace
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return false;

  const now = new Date().toISOString();
  const result = await workspaces.updateOne(
    { $or: [{ workspaceId }, { id: workspaceId }], ownerId: { $ne: userId } },
    {
      $pull: {
        members: { userId },
      },
      $inc: { memberCount: -1 },
      $set: { updatedAt: now },
    }
  );

  if (!result.modifiedCount) return false;
  try {
    const memCol = await getCollection<any>('workspace_memberships');
    if (memCol) {
      await memCol.deleteOne({ workspaceId, userId });
    }
  } catch {}

  return result.modifiedCount > 0;
}

/**
 * Check if user has access to workspace
 */
export async function hasWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const workspace = await getWorkspace(workspaceId);
  return !!workspace && (await resolveWorkspaceRole(userId, workspace.id || workspace.workspaceId)) !== null;
}

/**
 * Get user role in workspace
 */
export async function getUserWorkspaceRole(
  workspaceId: string,
  userId: string
): Promise<UserRole | null> {
  const workspace = await getWorkspace(workspaceId);
  return workspace ? resolveWorkspaceRole(userId, workspace.id || workspace.workspaceId) : null;
}

/**
 * Delete workspace (owner only)
 */
export async function deleteWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return false;

  const result = await workspaces.deleteOne({
    workspaceId,
    ownerId: userId,
  });

  return result.deletedCount > 0;
}
