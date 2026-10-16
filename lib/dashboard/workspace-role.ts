import type { User, Workspace } from './types';

export function userForWorkspace(profile: User, workspaces: Workspace[], workspaceId: string): User {
  const role = workspaces.find(workspace => workspace.id === workspaceId)?.workspaceRole || 'member';
  return { ...profile, workspaceRole: role, role: role === 'owner' ? 'Workspace Owner' : role };
}
