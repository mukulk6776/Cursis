import { WorkspaceMembership, UserRole } from './types';
export const inMemoryMemberships = new Map<string, WorkspaceMembership>();
/** Invitations and ordinary member edits cannot transfer ownership. */
export function invitationRole(value: unknown): Exclude<UserRole, 'owner'> {
  return ['admin', 'manager', 'member', 'viewer', 'guest', 'client'].includes(String(value))
    ? value as Exclude<UserRole, 'owner'> : 'member';
}
