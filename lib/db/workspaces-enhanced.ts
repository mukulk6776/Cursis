import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Enhanced workspace management with unique URLs
 * URL format: /dashboard/w/[workspaceSlug] or /dashboard/w/[workspaceId]
 */

export interface Workspace {
  _id?: ObjectId;
  workspaceId: string;
  name: string;
  slug: string; // URL-friendly unique identifier
  ownerId: string;
  members: Array<{
    userId: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  }>;
  settings: {
    theme?: 'light' | 'dark';
    timezone?: string;
    language?: string;
    notifications?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
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

  const workspace: Workspace = {
    workspaceId,
    name: data.name,
    slug,
    ownerId: data.ownerId,
    members: [
      {
        userId: data.ownerId,
        email: data.ownerEmail,
        role: 'owner',
        joinedAt: new Date(),
      },
    ],
    settings: {
      theme: 'light',
      notifications: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await workspaces.insertOne(workspace);
  return workspace;
}

/**
 * Get workspace by ID or slug
 */
export async function getWorkspace(identifier: string): Promise<Workspace | null> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return null;

  // Try finding by slug first, then by workspaceId
  const workspace = await workspaces.findOne({
    $or: [{ slug: identifier }, { workspaceId: identifier }],
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
      'members.userId': userId,
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

  const updateData: any = {
    ...updates,
    updatedAt: new Date(),
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
    { $or: [{ slug: identifier }, { workspaceId: identifier }] },
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

  const result = await workspaces.updateOne(
    { workspaceId },
    {
      $push: {
        members: {
          ...member,
          joinedAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    }
  );

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

  const result = await workspaces.updateOne(
    { workspaceId },
    {
      $pull: {
        members: { userId },
      },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Check if user has access to workspace
 */
export async function hasWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return false;

  const workspace = await workspaces.findOne({
    $or: [{ slug: workspaceId }, { workspaceId }],
    'members.userId': userId,
  });

  return !!workspace;
}

/**
 * Get user role in workspace
 */
export async function getUserWorkspaceRole(
  workspaceId: string,
  userId: string
): Promise<'owner' | 'admin' | 'member' | null> {
  const workspaces = await getCollection<Workspace>('workspaces');
  if (!workspaces) return null;

  const workspace = await workspaces.findOne({
    $or: [{ slug: workspaceId }, { workspaceId }],
  });

  if (!workspace) return null;

  const member = workspace.members.find((m) => m.userId === userId);
  return member?.role || null;
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
