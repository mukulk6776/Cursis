import { type Db, type Document } from 'mongodb';
import { inMemoryStore } from '@/lib/db/store';
import { inMemoryMemberships } from '@/lib/db/memberships';
import { inMemoryInvitations } from '@/lib/db/invitations';
import { privacyDb, PrivacyError, subjectKey } from './core';

// Explicit scopes: never export another member's document because it shares a workspace.
export const personalScopes = (uid: string, email: string): Record<string, Document> => ({
  users: { $or: [{ uid }, { id: uid }] },
  workspace_memberships: { userId: uid }, workspace_teams: { userId: uid },
  invitations: { $or: [{ inviteeUserId: uid }, { email }] },
  notifications: { $or: [{ userId: uid }, { userEmail: email }] },
  ordis_conversations: { userId: uid },
  workspace_activation: { userId: uid }, workspace_email_preferences: { userId: uid }, workspace_email_deliveries: { userId: uid },
  agency_requests: { contactEmail: email },
  privacy_consents: { $or: [{ uid }, { email }] }, privacy_nominees: { uid }, privacy_requests: { uid },
  marketing_contacts: { email }, marketing_subscribers: { email },
  unsubscribes: { email },
});

const allowed: Record<string, readonly string[]> = {
  users: ['id', 'uid', 'email', 'displayName', 'photoURL', 'title', 'department', 'skills', 'workspaceIds', 'createdAt', 'ageConfirmed', 'signupSource', 'signupSourceConsentAt'],
  workspace_activation: ['workspaceId', 'dismissedAt'],
  workspace_email_preferences: ['workspaceId', 'weekly', 'daily', 'capacityHours', 'consentAt'],
  workspace_email_deliveries: ['workspaceId', 'kind', 'period', 'createdAt', 'attemptedAt', 'sentAt', 'needsReview'],
  workspace_memberships: ['workspaceId', 'role', 'createdAt'],
  workspace_teams: ['workspaceId', 'workspaceName', 'name', 'email', 'title', 'department', 'skills', 'joinedAt'],
  invitations: ['id', 'workspaceId', 'email', 'name', 'status', 'sentAt', 'expiresAt'],
  notifications: ['id', 'type', 'text', 'read', 'createdAt'],
  ordis_conversations: ['id', 'workspaceId', 'title', 'messages', 'createdAt', 'updatedAt'],
  agency_requests: ['id', 'companyName', 'contactEmail', 'requestedService', 'budgetRange', 'requirements', 'status', 'createdAt'],
  privacy_consents: ['purpose', 'granted', 'analytics', 'functional', 'version', 'source', 'age18Attested', 'at'],
  privacy_nominees: ['name', 'email', 'updatedAt'],
  privacy_requests: ['id', 'kind', 'message', 'status', 'receivedAt', 'acknowledgedAt', 'acknowledgeBy', 'resolveBy'],
  marketing_contacts: ['name', 'email', 'message', 'consentAt', 'createdAt'],
  marketing_subscribers: ['email', 'consentAt', 'consentVersion', 'source'],
  unsubscribes: ['email', 'unsubscribedAt', 'ip', 'userAgent'],
};
// Defense in depth for nested conversation/tool metadata: no provider credentials in downloads.
export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/password|salt|secret|token|credential|api.?key|authorization|cookie/i.test(key))
    .map(([key, item]) => [key, redactSecrets(item)]));
  return value;
}
export async function exportAccount(uid: string, email: string) {
  const db = await privacyDb();
  const records: Record<string, unknown[]> = {};
  for (const [name, scope] of Object.entries(personalScopes(uid, email))) {
    const projection = Object.fromEntries(allowed[name].map(key => [key, 1]));
    const rows = await db.collection(name).find(scope, { projection: { ...projection, _id: 0 } }).limit(10001).toArray();
    if (rows.length > 10000) throw new PrivacyError('Large export requires assisted delivery. Submit an access request in the privacy centre.', 413);
    records[name] = rows.map(row => redactSecrets(row));
  }
  return { generatedAt: new Date().toISOString(), records,
    scope: 'Account-scoped records only. Shared workspace content, free-text references, provider logs and backups require an assisted access review to protect other people. This download is not a complete Section 11 response.',
    accessRequest: '/privacy/rights' };
}

export const workspaceCollections = ['tasks', 'projects', 'calendar_events', 'meetings', 'documents', 'departments',
  'automations', 'contacts', 'crm_deals', 'crm_leads', 'deals', 'leads', 'messages', 'integrations', 'settings', 'workflows',
  'ordis_brain', 'ordis_cards', 'ordis_approvals', 'dynamic_tools', 'goal_plans', 'ordis_conversations', 'agency_requests',
  'workspace_activation', 'workspace_email_preferences', 'workspace_email_deliveries'];

export async function requestErasure(uid: string, email: string) {
  const db = await privacyDb();
  // Persist job before blocking, so an interrupted request always remains recoverable.
  const id = subjectKey(`erasure:${uid}`);
  await db.collection('privacy_erasures').createIndex({ id: 1 }, { unique: true });
  await db.collection('privacy_erasures').updateOne({ id }, { $setOnInsert: {
    id, uid, email, status: 'pending', requestedAt: new Date(), dueAt: new Date(Date.now() + 90 * 86400000),
    reviewBy: new Date(Date.now() + 30 * 86400000),
    externalTasks: ['Firebase identity/revocation', 'Resend recipient and message retention', 'Google Gemini retention',
      'Groq retention', 'Host/CDN logs', 'Backups and restore suppression', 'Customer integrations and shared content',
      'Legal retention assessment (Rules 6/8, CERT-In, tax)', 'Other process caches/browser storage'],
  } }, { upsert: true });
  for (const value of [uid, email]) await db.collection('privacy_blocks').updateOne(
    { _id: subjectKey(value) as never }, { $set: { blockedAt: new Date(), jobId: id } }, { upsert: true });
  return { id, status: 'pending', message: 'Account access stopped. Active data cleanup is queued; provider, shared-content and legal-retention review remain open. Target: 90 days, subject to required legal retention.' };
}

export async function eraseActiveData(db: Db, uid: string, email: string) {
  const owned = await db.collection('workspaces').find({ ownerId: uid }).toArray();
  const deletedWorkspaces: string[] = [];
  const sharedWorkspaces: string[] = [];
  for (const ws of owned) {
    const otherMember = await db.collection('workspace_memberships').findOne({ workspaceId: ws.id, userId: { $ne: uid } });
    const otherTeam = await db.collection('workspace_teams').findOne({ workspaceId: ws.id, userId: { $ne: uid } });
    // Missing or stale membership information must not authorize destruction of tenant data.
    const otherUser = await db.collection('users').findOne({ workspaceIds: ws.id, uid: { $ne: uid } });
    if (otherMember || otherTeam || otherUser || ws.memberCount > 1) { sharedWorkspaces.push(ws.id); continue; }
    deletedWorkspaces.push(ws.id);
    for (const name of workspaceCollections) await db.collection(name).deleteMany({ workspaceId: ws.id });
    for (const name of ['workspace_memberships', 'workspace_teams', 'invitations']) await db.collection(name).deleteMany({ workspaceId: ws.id });
    await db.collection('workspaces').deleteOne({ id: ws.id, ownerId: uid });
  }
  // Delete public inquiry proposal copies, which have no uid on the document itself.
  const inquiries = await db.collection('agency_requests').find({ contactEmail: email }).toArray();
  for (const item of inquiries) if (item.workspaceId === 'ws_public_inquiry' && item.proposalDocId) {
    await db.collection('documents').deleteOne({ id: item.proposalDocId, workspaceId: 'ws_public_inquiry' });
  }
  for (const [name, scope] of Object.entries(personalScopes(uid, email))) await db.collection(name).deleteMany(scope);
  // Account identifiers in shared tasks, logs, billing and free text need fiduciary/legal review.
  // Do not erase the erasure ledger or claim processor completion here.
  for (const value of Object.values(inMemoryStore)) if (value instanceof Map) {
    for (const [key, row] of value) {
      if (row && (row.uid === uid || row.userId === uid || row.email === email ||
        row.contactEmail === email || row.userEmail === email || deletedWorkspaces.includes(row.workspaceId) || deletedWorkspaces.includes(row.id))) value.delete(key);
    }
  }
  for (const [key, row] of inMemoryMemberships) if (row.userId === uid || deletedWorkspaces.includes(row.workspaceId)) inMemoryMemberships.delete(key);
  for (const [key, row] of inMemoryInvitations) if (row.email === email || row.inviteeUserId === uid || deletedWorkspaces.includes(row.workspaceId)) inMemoryInvitations.delete(key);
  return { deletedWorkspaces, sharedWorkspaces };
}
