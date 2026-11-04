// tests/ordis-rbac.cjs
// Automated Regression Suite for Milestone 1: Ordis Approval Queue & External Action RBAC
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};

require.extensions['.ts'] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );
};

// Next.js & external runtime shims
const origLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === 'next/server') {
    return {
      NextResponse: {
        json: (data, init) => Response.json(data, init),
        redirect: (url, init) => Response.redirect(url, init),
        next: () => new Response(null, { status: 200 }),
      },
      NextRequest: Request,
    };
  }
  if (name === 'next/headers') {
    return {
      cookies: async () => ({
        get: () => undefined,
        set: () => {},
        delete: () => {},
      }),
      headers: async () => new Headers(),
    };
  }
  if (name === 'resend') {
    return {
      Resend: class {
        emails = { send: async () => ({ id: 'mock_resend_id' }) };
      },
    };
  }
  if (name === 'groq-sdk') {
    return class MockGroq {
      chat = { completions: { create: async () => ({ choices: [{ message: { content: 'Mock' } }] }) } };
    };
  }
  if (name === 'firebase-admin') {
    return {
      auth: () => ({
        verifyIdToken: async () => ({ uid: 'usr_mock', email: 'mock@cursis.in' }),
      }),
    };
  }
  if (name === 'jose') {
    return {
      createRemoteJWKSet: () => ({}),
      jwtVerify: async () => ({ payload: { sub: 'usr_mock', email: 'mock@cursis.in' } }),
      SignJWT: class {
        setProtectedHeader() { return this; }
        setIssuedAt() { return this; }
        setExpirationTime() { return this; }
        async sign() { return 'mock_jwt'; }
      },
    };
  }
  return origLoad.apply(this, arguments);
};

// Mock authentication session
let currentUser = null;
require.cache[path.join(root, 'lib/auth/session.ts')] = {
  id: path.join(root, 'lib/auth/session.ts'),
  filename: path.join(root, 'lib/auth/session.ts'),
  loaded: true,
  exports: {
    getAuthenticatedUser: async () => currentUser,
  },
};

// Mock MongoDB
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async () => null,
    getDb: async () => ({
      collection: () => ({
        findOne: async () => null,
        updateOne: async () => ({ modifiedCount: 1 }),
        deleteOne: async () => ({ deletedCount: 1 }),
        insertOne: async () => ({ insertedId: 'mock' }),
      }),
    }),
    isMongoConnected: () => false,
  },
};

const { inMemoryStore } = require('@/lib/db/store');
const { inMemoryMemberships } = require('@/lib/db/memberships');
const approvalRoute = require('@/app/api/ordis/approval-queue/[id]/route.ts');
const externalActionRoute = require('@/app/api/ordis/external-action/route.ts');

const wsId = 'ws_rbac_test_m1';
inMemoryStore.workspaces.set(wsId, { id: wsId, ownerId: 'uid_owner_m1', name: 'RBAC Test Workspace' });
inMemoryMemberships.set(`${wsId}_uid_admin_m1`, { id: 'm_admin', workspaceId: wsId, userId: 'uid_admin_m1', role: 'admin' });
inMemoryMemberships.set(`${wsId}_uid_manager_m1`, { id: 'm_manager', workspaceId: wsId, userId: 'uid_manager_m1', role: 'manager' });
inMemoryMemberships.set(`${wsId}_uid_member_m1`, { id: 'm_member', workspaceId: wsId, userId: 'uid_member_m1', role: 'member' });
inMemoryMemberships.set(`${wsId}_uid_viewer_m1`, { id: 'm_viewer', workspaceId: wsId, userId: 'uid_viewer_m1', role: 'viewer' });

test('RBAC: POST /api/ordis/approval-queue/[id] unauthenticated is rejected with 401', async () => {
  currentUser = null;
  const req = new Request('http://localhost/api/ordis/approval-queue/item_1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  const res = await approvalRoute.POST(req, { params: Promise.resolve({ id: 'item_1' }) });
  assert.equal(res.status, 401);
});

test('RBAC: POST /api/ordis/approval-queue/[id] member and manager are rejected with 403 Forbidden', async () => {
  const itemId = 'appr_item_test_forbidden';
  inMemoryStore.approvalQueue.set(itemId, {
    id: itemId,
    workspaceId: wsId,
    action: 'delete_department',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  // Test Member
  currentUser = { uid: 'uid_member_m1', email: 'member@test.com', workspaceId: wsId };
  const memberReq = new Request(`http://localhost/api/ordis/approval-queue/${itemId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  const memberRes = await approvalRoute.POST(memberReq, { params: Promise.resolve({ id: itemId }) });
  assert.equal(memberRes.status, 403, 'Member role must be rejected with 403');
  assert.equal(inMemoryStore.approvalQueue.get(itemId).status, 'pending', 'Status must remain pending');

  // Test Manager
  currentUser = { uid: 'uid_manager_m1', email: 'manager@test.com', workspaceId: wsId };
  const managerReq = new Request(`http://localhost/api/ordis/approval-queue/${itemId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  const managerRes = await approvalRoute.POST(managerReq, { params: Promise.resolve({ id: itemId }) });
  assert.equal(managerRes.status, 403, 'Manager role must be rejected with 403');
  assert.equal(inMemoryStore.approvalQueue.get(itemId).status, 'pending', 'Status must remain pending');
});

test('RBAC: POST /api/ordis/approval-queue/[id] admin and owner are permitted', async () => {
  const itemAdmin = 'appr_item_admin_approve';
  inMemoryStore.approvalQueue.set(itemAdmin, {
    id: itemAdmin,
    workspaceId: wsId,
    action: 'rebalance_workload',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  // Admin approves
  currentUser = { uid: 'uid_admin_m1', email: 'admin@test.com', workspaceId: wsId };
  const adminReq = new Request(`http://localhost/api/ordis/approval-queue/${itemAdmin}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  const adminRes = await approvalRoute.POST(adminReq, { params: Promise.resolve({ id: itemAdmin }) });
  assert.equal(adminRes.status, 200, 'Admin must be permitted with 200');
  assert.equal(inMemoryStore.approvalQueue.get(itemAdmin).status, 'approved', 'Item status must be approved');

  // Owner rejects
  const itemOwner = 'appr_item_owner_reject';
  inMemoryStore.approvalQueue.set(itemOwner, {
    id: itemOwner,
    workspaceId: wsId,
    action: 'delete_channel',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  currentUser = { uid: 'uid_owner_m1', email: 'owner@test.com', workspaceId: wsId };
  const ownerReq = new Request(`http://localhost/api/ordis/approval-queue/${itemOwner}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'reject' }),
  });
  const ownerRes = await approvalRoute.POST(ownerReq, { params: Promise.resolve({ id: itemOwner }) });
  assert.equal(ownerRes.status, 200, 'Owner must be permitted with 200');
  assert.equal(inMemoryStore.approvalQueue.get(itemOwner).status, 'rejected', 'Item status must be rejected');
});

test('RBAC: POST /api/ordis/external-action restricts dispatching to owner and admin', async () => {
  // Member is forbidden
  currentUser = { uid: 'uid_member_m1', email: 'member@test.com', workspaceId: wsId };
  const memberReq = new Request('http://localhost/api/ordis/external-action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: wsId, actionType: 'send_invoice', payload: { amount: 50000 } }),
  });
  const memberRes = await externalActionRoute.POST(memberReq);
  assert.equal(memberRes.status, 403, 'Member must be rejected with 403');

  // Manager is forbidden
  currentUser = { uid: 'uid_manager_m1', email: 'manager@test.com', workspaceId: wsId };
  const managerReq = new Request('http://localhost/api/ordis/external-action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: wsId, actionType: 'send_docusign_contract', payload: { contractId: 'c1' } }),
  });
  const managerRes = await externalActionRoute.POST(managerReq);
  assert.equal(managerRes.status, 403, 'Manager must be rejected with 403');

  // Admin is permitted
  currentUser = { uid: 'uid_admin_m1', email: 'admin@test.com', workspaceId: wsId };
  const adminReq = new Request('http://localhost/api/ordis/external-action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: wsId, actionType: 'sync_salesforce_crm', payload: { accountId: 'acc_1' } }),
  });
  const adminRes = await externalActionRoute.POST(adminReq);
  assert.equal(adminRes.status, 200, 'Admin must be permitted with 200');

  // Admin missing actionType -> 400
  const invalidReq = new Request('http://localhost/api/ordis/external-action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: wsId, actionType: '' }),
  });
  const invalidRes = await externalActionRoute.POST(invalidReq);
  assert.equal(invalidRes.status, 400, 'Missing actionType must return 400');
});
