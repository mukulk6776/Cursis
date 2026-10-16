const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
let database = null;
const mock = (file, exports) => {
  const filename = path.join(root, file);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
mock('lib/mongodb.ts', { getCollection: async name => database?.collection(name) || null, getDb: async () => database });
let acting = { uid: 'invitee', email: 'invitee@example.com', role: 'owner', workspaceId: 'ws_A' };
mock('lib/auth/session.ts', { getAuthenticatedUser: async () => acting });
mock('lib/email/notifications.ts', { sendWorkspaceInvitationEmail: async () => {} });
const { inMemoryStore } = require('../lib/db/store.ts');
const { inMemoryMemberships } = require('../lib/db/memberships.ts');
const { getUserWorkspaceRole, authorizeWorkspaceAccess } = require('../lib/auth/rbac.ts');
const { inMemoryInvitations, acceptWorkspaceInvitation } = require('../lib/db/invitations.ts');

test('frontend role changes immediately with the active workspace and ignores profile titles', () => {
  const { userForWorkspace } = require('../lib/dashboard/workspace-role.ts');
  const profile = { id: 'invitee', role: 'Founder & CEO', workspaceRole: 'owner' };
  const workspaces = [{ id: 'A', workspaceRole: 'owner' }, { id: 'B', workspaceRole: 'member' }, { id: 'C', workspaceRole: 'admin' }, { id: 'D', workspaceRole: 'viewer' }];
  assert.equal(userForWorkspace(profile, workspaces, 'A').workspaceRole, 'owner');
  assert.equal(userForWorkspace(profile, workspaces, 'B').workspaceRole, 'member');
  assert.equal(userForWorkspace(profile, workspaces, 'B').role, 'member');
  assert.equal(userForWorkspace(profile, workspaces, 'C').workspaceRole, 'admin');
  assert.equal(userForWorkspace(profile, workspaces, 'D').workspaceRole, 'viewer');
  assert.equal(userForWorkspace(profile, workspaces, 'unknown').workspaceRole, 'member');
  assert.equal(userForWorkspace(profile, workspaces, 'A').workspaceRole, 'owner');
});

test('invitation roles, workspace switching, server guards, and creator ownership', async () => {
  inMemoryStore.workspaces.clear(); inMemoryStore.users.clear(); inMemoryMemberships.clear();
  inMemoryStore.workspaces.set('ws_A', { id: 'ws_A', ownerId: 'creator', memberCount: 1 });
  inMemoryStore.workspaces.set('ws_B', { id: 'ws_B', ownerId: 'invitee', memberCount: 1 });
  inMemoryStore.users.set('invitee', { id: 'invitee', uid: 'invitee', email: acting.email, role: 'owner', workspaceIds: ['ws_B'] });
  for (const [index, requested] of ['member', 'admin', 'viewer', undefined, 'owner', 'invalid'].entries()) {
    inMemoryInvitations.set(`inv_${index}`, { id: `inv_${index}`, workspaceId: 'ws_A', inviterUserId: 'creator', inviteeUserId: 'invitee', email: acting.email, workspaceRole: requested, status: 'pending', expiresAt: new Date(Date.now() + 60000).toISOString() });
    const result = await acceptWorkspaceInvitation(`inv_${index}`, acting);
    const expected = ['member', 'admin', 'viewer'].includes(requested) ? requested : 'member';
    assert.equal(result.role, expected);
    assert.equal(await getUserWorkspaceRole('invitee', 'ws_A'), expected);
    assert.equal(await getUserWorkspaceRole('invitee', 'ws_B'), 'owner');
    assert.equal(await getUserWorkspaceRole('creator', 'ws_A'), 'owner');
    assert.equal(inMemoryStore.users.get('invitee').role, 'owner');
    assert.equal(inMemoryStore.workspaces.get('ws_A').ownerId, 'creator');
    await assert.rejects(() => acceptWorkspaceInvitation(`inv_${index}`, acting));
  }
  for (const required of [['owner'], ['owner', 'admin']]) {
    const auth = await authorizeWorkspaceAccess(new Request('http://localhost', { method: 'PATCH' }), 'ws_A', required);
    assert.equal(auth.errorResponse.status, 403);
  }
  assert.equal(await getUserWorkspaceRole('outsider', 'ws_A', 'founder@cursis.in'), null);
  assert.equal(await getUserWorkspaceRole('invitee', 'ws_missing'), null);
  inMemoryMemberships.get('ws_A_invitee').role = 'owner';
  assert.equal(await getUserWorkspaceRole('invitee', 'ws_A'), 'member');
  inMemoryMemberships.get('ws_A_invitee').role = 'viewer';
  assert.equal((await authorizeWorkspaceAccess(new Request('http://localhost', { method: 'POST' }), 'ws_A')).errorResponse.status, 403);
});

test('role edits stay on the selected membership and cannot transfer ownership', async () => {
  const { updateTeamMember } = require('../lib/db/team.ts');
  await updateTeamMember('invitee', { role: 'admin' }, 'ws_A');
  assert.equal(await getUserWorkspaceRole('invitee', 'ws_A'), 'admin');
  assert.equal(await getUserWorkspaceRole('invitee', 'ws_B'), 'owner');
  assert.equal(inMemoryStore.users.get('invitee').role, 'owner');
  await assert.rejects(() => updateTeamMember('invitee', { role: 'member' }, 'ws_B'));
  await assert.rejects(() => updateTeamMember('invitee', { role: 'owner' }, 'ws_A'));
  const { ensureWorkspaceExists } = require('../lib/db/workspaces.ts');
  await assert.rejects(() => ensureWorkspaceExists('missing_shared', 'invitee'));
});

test('MongoDB membership is authoritative over global role and stale memory', async () => {
  database = { collection: name => ({ findOne: async query => name === 'workspaces'
    ? { id: query.id, ownerId: 'creator' }
    : query.userId === 'invitee' ? { role: 'viewer' } : null }) };
  assert.equal(await getUserWorkspaceRole('invitee', 'ws_A'), 'viewer');
  assert.equal(await getUserWorkspaceRole('outsider', 'ws_A'), null);
  database = null;
});

test('repair defaults to dry run, restores invitation roles, preserves creator, and is idempotent', async () => {
  const { repair } = require('../migrations/repair-workspace-roles.cjs');
  const data = {
    workspaces: [{ _id: 'a', id: 'ws_A', ownerId: 'creator' }],
    workspace_memberships: [
      { workspaceId: 'ws_A', userId: 'creator', role: 'owner' },
      { workspaceId: 'ws_A', userId: 'invited', role: 'owner' },
      { workspaceId: 'ws_A', userId: 'legacy', role: 'owner' },
    ],
    workspace_teams: [{ workspaceId: 'ws_A', userId: 'invited', role: 'owner' }],
    invitations: [{ workspaceId: 'ws_A', inviteeUserId: 'invited', status: 'accepted', workspaceRole: 'admin' }],
  };
  const matches = (row, query) => Object.entries(query).every(([k, v]) => row[k] === v);
  const db = { collection: name => ({
    find: query => ({ toArray: async () => data[name].filter(row => matches(row, query)), async *[Symbol.asyncIterator]() { yield* data[name].filter(row => matches(row, query)); } }),
    findOne: async query => data[name].find(row => matches(row, query)) || null,
    updateOne: async (query, update) => {
      let row = data[name].find(row => matches(row, query));
      if (!row) { row = { ...update.$setOnInsert }; data[name].push(row); }
      Object.assign(row, update.$set);
    },
    updateMany: async (query, update) => data[name].filter(row => matches(row, query)).forEach(row => Object.assign(row, update.$set)),
  }) };
  const reports = [];
  await repair(db, false, row => reports.push(row));
  assert.equal(data.workspace_memberships[1].role, 'owner');
  assert.equal(reports.filter(row => row.action === 'repair').length, 2);
  await repair(db, true, () => {});
  assert.deepEqual(data.workspace_memberships.map(row => row.role), ['owner', 'admin', 'member']);
  assert.equal(data.workspace_teams[0].role, 'admin');
  assert.equal(data.workspaces[0].ownerId, 'creator');
  const snapshot = JSON.stringify(data);
  await repair(db, true, () => {});
  assert.equal(JSON.stringify(data), snapshot);
});
