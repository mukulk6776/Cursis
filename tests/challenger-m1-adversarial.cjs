// tests/challenger-m1-adversarial.cjs
// Adversarial Stress Testing Suite — Milestone 1
// Challenger 2: RBAC Enforcement, Error Redaction & Founder Parameterization

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

// Module alias resolution
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};

// TypeScript loader
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
        json: (data, init) => {
          const status = init?.status || 200;
          const headers = new Headers(init?.headers);
          headers.set('content-type', 'application/json');
          return new Response(JSON.stringify(data), { status, headers });
        },
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
  if (name === 'cheerio') {
    return {
      load: () => () => ({ attr: () => '', text: () => '' }),
    };
  }
  return origLoad.apply(this, arguments);
};

// DB mock harness
let mockDbFindOneResult = null;
let mockDbUpdateResult = { modifiedCount: 1 };
let mockDbInsertResult = { insertedId: 'mock_id' };
let mockDbShouldThrow = null;

require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async (name) => {
      if (mockDbShouldThrow) throw mockDbShouldThrow;
      return null;
    },
    getDb: async () => {
      if (mockDbShouldThrow) throw mockDbShouldThrow;
      return {
        collection: (colName) => ({
          findOne: async (query) => {
            if (mockDbShouldThrow) throw mockDbShouldThrow;
            if (typeof mockDbFindOneResult === 'function') return mockDbFindOneResult(query, colName);
            return mockDbFindOneResult;
          },
          updateOne: async (query, update) => {
            if (mockDbShouldThrow) throw mockDbShouldThrow;
            return mockDbUpdateResult;
          },
          deleteOne: async (query) => {
            if (mockDbShouldThrow) throw mockDbShouldThrow;
            return { deletedCount: 1 };
          },
          insertOne: async (doc) => {
            if (mockDbShouldThrow) throw mockDbShouldThrow;
            return mockDbInsertResult;
          },
        }),
      };
    },
    isMongoConnected: () => false,
  },
};

const { createSessionToken, SESSION_SECRET } = require('@/lib/auth/token.ts');
const { inMemoryStore } = require('@/lib/db/store');
const { inMemoryMemberships } = require('@/lib/db/memberships');
const { apiError } = require('@/lib/api/response.ts');
const { OrdisEngine } = require('@/lib/ordis/server.ts');

// Route Handlers
const approvalQueueRoute = require('@/app/api/ordis/approval-queue/route.ts');
const approvalQueueItemRoute = require('@/app/api/ordis/approval-queue/[id]/route.ts');
const externalActionRoute = require('@/app/api/ordis/external-action/route.ts');
const agencyCatalogRoute = require('@/app/api/agency/catalog/route.ts');
const smartSlotsRoute = require('@/app/api/calendar/smart-slots/route.ts');
const simulationRoute = require('@/app/api/ordis/simulation/route.ts');
const runProcessRoute = require('@/app/api/ordis/run-process/route.ts');
const riskRadarRoute = require('@/app/api/ordis/risk-radar/route.ts');
const webhookRoute = require('@/app/api/integrations/webhook/route.ts');

// Seed test workspaces
const wsVictim = 'ws_victim_corp';
const wsAttacker = 'ws_attacker_syndicate';

inMemoryStore.workspaces.set(wsVictim, { id: wsVictim, ownerId: 'usr_victim_owner', name: 'Victim Corp' });
inMemoryStore.workspaces.set(wsAttacker, { id: wsAttacker, ownerId: 'usr_attacker', name: 'Attacker Syndicate' });

// Seed memberships for victim workspace
inMemoryMemberships.set(`${wsVictim}_usr_victim_admin`, { id: 'm_v_admin', workspaceId: wsVictim, userId: 'usr_victim_admin', role: 'admin' });
inMemoryMemberships.set(`${wsVictim}_usr_victim_manager`, { id: 'm_v_manager', workspaceId: wsVictim, userId: 'usr_victim_manager', role: 'manager' });
inMemoryMemberships.set(`${wsVictim}_usr_victim_member`, { id: 'm_v_member', workspaceId: wsVictim, userId: 'usr_victim_member', role: 'member' });
inMemoryMemberships.set(`${wsVictim}_usr_victim_viewer`, { id: 'm_v_viewer', workspaceId: wsVictim, userId: 'usr_victim_viewer', role: 'viewer' });

// Seed attacker membership in attacker workspace ONLY
inMemoryMemberships.set(`${wsAttacker}_usr_attacker`, { id: 'm_a_owner', workspaceId: wsAttacker, userId: 'usr_attacker', role: 'owner' });

// Helper to construct authenticated Request
function makeAuthRequest(url, method, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  const init = { method, headers };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(url, init);
}

// ---------------------------------------------------------------------------
// SUITE 1: Adversarial RBAC & Role Elevation Resistance
// ---------------------------------------------------------------------------
test('RBAC Challenger: Token Spoofing and Cryptographic Forgery Rejection', async () => {
  const pendingItem = 'appr_pending_item_1';
  inMemoryStore.approvalQueue.set(pendingItem, {
    id: pendingItem,
    workspaceId: wsVictim,
    action: 'deploy_production_cluster',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  // 1. Unauthenticated (no token) -> 401
  {
    const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${pendingItem}`, 'POST', { action: 'approve' });
    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: pendingItem }) });
    assert.equal(res.status, 401, 'Unauthenticated approval must be 401');
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(inMemoryStore.approvalQueue.get(pendingItem).status, 'pending');
  }

  // 2. Completely invalid garbage token -> 401
  {
    const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${pendingItem}`, 'POST', { action: 'approve' }, 'Bearer junk_invalid_token_xyz');
    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: pendingItem }) });
    assert.equal(res.status, 401, 'Garbage token must be rejected with 401');
  }

  // 3. Forged HMAC signature (attacker signs with their own secret)
  {
    const fakePayload = {
      uid: 'usr_victim_owner',
      email: 'victim_owner@cursis.in',
      displayName: 'Victim Owner Spoofed',
      role: 'owner',
      workspaceId: wsVictim,
      createdAt: Date.now(),
    };
    const fakeData = Buffer.from(JSON.stringify(fakePayload)).toString('base64url');
    const fakeSignature = crypto.createHmac('sha256', 'attacker_guessed_secret_123').update(fakeData).digest('base64url');
    const forgedToken = `cursis_usr_${fakeData}.${fakeSignature}`;

    const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${pendingItem}`, 'POST', { action: 'approve' }, forgedToken);
    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: pendingItem }) });
    assert.equal(res.status, 401, 'Forged HMAC token must be rejected with 401');
    assert.equal(inMemoryStore.approvalQueue.get(pendingItem).status, 'pending');
  }

  // 4. Expired token (exp in past)
  {
    const now = Date.now();
    const expiredPayload = {
      uid: 'usr_victim_owner',
      email: 'victim_owner@cursis.in',
      displayName: 'Victim Owner',
      role: 'owner',
      workspaceId: wsVictim,
      createdAt: now - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      exp: Math.floor((now - 3600000) / 1000), // expired 1 hour ago
    };
    const expiredData = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const validSig = crypto.createHmac('sha256', SESSION_SECRET).update(expiredData).digest('base64url');
    const expiredToken = `cursis_usr_${expiredData}.${validSig}`;

    const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${pendingItem}`, 'POST', { action: 'approve' }, expiredToken);
    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: pendingItem }) });
    assert.equal(res.status, 401, 'Expired session token must be rejected with 401');
  }

  // 5. Tampered payload with original signature
  {
    const legitToken = createSessionToken({
      uid: 'usr_victim_member',
      email: 'member@cursis.in',
      displayName: 'Member',
      role: 'member',
      workspaceId: wsVictim,
      createdAt: Date.now(),
    });
    const parts = legitToken.replace('cursis_usr_', '').split('.');
    const tamperedPayload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    tamperedPayload.role = 'owner';
    tamperedPayload.uid = 'usr_victim_owner';
    const tamperedData = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url');
    const tamperedToken = `cursis_usr_${tamperedData}.${parts[1]}`;

    const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${pendingItem}`, 'POST', { action: 'approve' }, tamperedToken);
    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: pendingItem }) });
    assert.equal(res.status, 401, 'Tampered token payload must fail HMAC check with 401');
  }
});

test('RBAC Challenger: Non-Privileged Roles (viewer, member, manager) Rejected with 403', async () => {
  const itemId = 'appr_perm_check_item';
  inMemoryStore.approvalQueue.set(itemId, {
    id: itemId,
    workspaceId: wsVictim,
    action: 'revoke_api_keys',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  const rolesToTest = [
    { role: 'viewer', uid: 'usr_victim_viewer', email: 'viewer@victim.com' },
    { role: 'member', uid: 'usr_victim_member', email: 'member@victim.com' },
    { role: 'manager', uid: 'usr_victim_manager', email: 'manager@victim.com' },
  ];

  for (const { role, uid, email } of rolesToTest) {
    const token = createSessionToken({
      uid,
      email,
      displayName: `Victim ${role}`,
      role: role,
      workspaceId: wsVictim,
      createdAt: Date.now(),
    });

    // Test POST approval queue item
    const apprReq = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${itemId}`, 'POST', { action: 'approve' }, token);
    const apprRes = await approvalQueueItemRoute.POST(apprReq, { params: Promise.resolve({ id: itemId }) });
    assert.equal(apprRes.status, 403, `Role '${role}' must be rejected with 403 on approval-queue/[id]`);
    const apprJson = await apprRes.json();
    assert.equal(apprJson.success, false);
    assert.ok(apprJson.error.includes('Forbidden'));
    assert.equal(inMemoryStore.approvalQueue.get(itemId).status, 'pending', 'Status must remain pending');

    // Test POST external-action
    const extReq = makeAuthRequest('http://localhost/api/ordis/external-action', 'POST', {
      workspaceId: wsVictim,
      actionType: 'send_invoice',
      payload: { amount: 1000 },
    }, token);
    const extRes = await externalActionRoute.POST(extReq);
    assert.equal(extRes.status, 403, `Role '${role}' must be rejected with 403 on external-action`);
    const extJson = await extRes.json();
    assert.equal(extJson.success, false);
    assert.ok(extJson.error.includes('Forbidden'));
  }
});

test('RBAC Challenger: Cross-Tenant Attack & Body Role Tampering Strictly Blocked', async () => {
  const victimItemId = 'appr_victim_secret_item';
  inMemoryStore.approvalQueue.set(victimItemId, {
    id: victimItemId,
    workspaceId: wsVictim,
    action: 'delete_entire_database',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  // Attacker is owner of wsAttacker
  const attackerToken = createSessionToken({
    uid: 'usr_attacker',
    email: 'attacker@evil.com',
    displayName: 'Attacker Syndicate Owner',
    role: 'owner',
    workspaceId: wsAttacker,
    createdAt: Date.now(),
  });

  // Attack 1: Attacker tries to approve victim's item while providing their own workspaceId in body
  {
    const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${victimItemId}`, 'POST', {
      workspaceId: wsAttacker,
      action: 'approve',
      role: 'owner', // Attempted role elevation in payload
    }, attackerToken);

    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: victimItemId }) });
    assert.equal(res.status, 403, 'Cross-tenant approval attempt must be blocked with 403 Forbidden');
    assert.equal(inMemoryStore.approvalQueue.get(victimItemId).status, 'pending', 'Victim item status must remain pending');
  }

  // Attack 2: Attacker tries to dispatch external action targeting victim workspace
  {
    const req = makeAuthRequest('http://localhost/api/ordis/external-action', 'POST', {
      workspaceId: wsVictim,
      actionType: 'drain_crypto_wallet',
      payload: { destination: '0xAttacker' },
    }, attackerToken);

    const res = await externalActionRoute.POST(req);
    assert.equal(res.status, 403, 'Cross-tenant external action dispatch must be blocked with 403');
    const json = await res.json();
    assert.equal(json.success, false);
  }

  // Verify Legitimate Admin & Owner access
  {
    // Admin approves
    const adminToken = createSessionToken({
      uid: 'usr_victim_admin',
      email: 'admin@victim.com',
      displayName: 'Victim Admin',
      role: 'admin',
      workspaceId: wsVictim,
      createdAt: Date.now(),
    });

    const adminApprReq = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${victimItemId}`, 'POST', { action: 'approve' }, adminToken);
    const adminApprRes = await approvalQueueItemRoute.POST(adminApprReq, { params: Promise.resolve({ id: victimItemId }) });
    assert.equal(adminApprRes.status, 200, 'Legitimate admin must succeed with 200');
    assert.equal(inMemoryStore.approvalQueue.get(victimItemId).status, 'approved');

    // Owner dispatches external action
    const ownerToken = createSessionToken({
      uid: 'usr_victim_owner',
      email: 'owner@victim.com',
      displayName: 'Victim Owner',
      role: 'owner',
      workspaceId: wsVictim,
      createdAt: Date.now(),
    });

    const ownerExtReq = makeAuthRequest('http://localhost/api/ordis/external-action', 'POST', {
      workspaceId: wsVictim,
      actionType: 'send_invoice',
      payload: { invoiceId: 'inv_123' },
    }, ownerToken);
    const ownerExtRes = await externalActionRoute.POST(ownerExtReq);
    assert.equal(ownerExtRes.status, 200, 'Legitimate owner must succeed with 200');
    const ownerExtJson = await ownerExtRes.json();
    assert.equal(ownerExtJson.success, true);
    assert.equal(ownerExtJson.actionType, 'send_invoice');
  }
});

test('RBAC Challenger: Boundary Values, Malformed Payloads & Parameter Injection', async () => {
  const adminToken = createSessionToken({
    uid: 'usr_victim_admin',
    email: 'admin@victim.com',
    displayName: 'Victim Admin',
    role: 'admin',
    workspaceId: wsVictim,
    createdAt: Date.now(),
  });

  // Boundary 1: external-action missing / invalid actionType
  const invalidActionTypes = [
    '',
    '   ',
    null,
    undefined,
    12345,
    true,
    ['send_invoice'],
    { action: 'send_invoice' },
  ];

  for (const badActionType of invalidActionTypes) {
    const req = makeAuthRequest('http://localhost/api/ordis/external-action', 'POST', {
      workspaceId: wsVictim,
      actionType: badActionType,
      payload: { test: true },
    }, adminToken);

    const res = await externalActionRoute.POST(req);
    assert.equal(res.status, 400, `Invalid actionType (${JSON.stringify(badActionType)}) must return 400 Bad Request`);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.error.includes('actionType is required'));
  }

  // Boundary 2: external-action malformed payload (array, string, number, null)
  const nonObjectPayloads = ['string_payload', 9999, [1, 2, 3], null];
  for (const nonObj of nonObjectPayloads) {
    const req = makeAuthRequest('http://localhost/api/ordis/external-action', 'POST', {
      workspaceId: wsVictim,
      actionType: 'sync_crm',
      payload: nonObj,
    }, adminToken);

    const res = await externalActionRoute.POST(req);
    assert.equal(res.status, 200, 'Non-object payload should be gracefully sanitized to {} without crashing');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.deepEqual(json.payload, {});
  }

  // Boundary 3: approval-queue/[id] non-existent item with DB connected -> 404
  {
    mockDbUpdateResult = { matchedCount: 0, modifiedCount: 0 };
    const req = makeAuthRequest('http://localhost/api/ordis/approval-queue/item_non_existent_999', 'POST', {
      workspaceId: wsVictim,
      action: 'approve',
    }, adminToken);
    const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: 'item_non_existent_999' }) });
    assert.equal(res.status, 404, 'Non-existent approval item must return 404 when MongoDB reports matchedCount 0');
    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.error.includes('not found'));
    mockDbUpdateResult = { matchedCount: 1, modifiedCount: 1 };
  }

  // Boundary 4: approval-queue/[id] action value normalization
  {
    const itemNorm = 'appr_item_norm_test';
    inMemoryStore.approvalQueue.set(itemNorm, {
      id: itemNorm,
      workspaceId: wsVictim,
      action: 'test_norm',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // 'reject' explicitly rejects
    const reqReject = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${itemNorm}`, 'POST', {
      workspaceId: wsVictim,
      action: 'reject',
    }, adminToken);
    const resReject = await approvalQueueItemRoute.POST(reqReject, { params: Promise.resolve({ id: itemNorm }) });
    assert.equal(resReject.status, 200);
    assert.equal(inMemoryStore.approvalQueue.get(itemNorm).status, 'rejected');

    // non-reject string defaults to approve
    inMemoryStore.approvalQueue.get(itemNorm).status = 'pending';
    const reqApprove = makeAuthRequest(`http://localhost/api/ordis/approval-queue/${itemNorm}`, 'POST', {
      workspaceId: wsVictim,
      action: 'arbitrary_string',
    }, adminToken);
    const resApprove = await approvalQueueItemRoute.POST(reqApprove, { params: Promise.resolve({ id: itemNorm }) });
    assert.equal(resApprove.status, 200);
    assert.equal(inMemoryStore.approvalQueue.get(itemNorm).status, 'approved');
  }
});

// ---------------------------------------------------------------------------
// SUITE 2: Adversarial Error Sanitization Across All 8 Route Handlers
// ---------------------------------------------------------------------------
test('Error Sanitization Challenger: Forced DB Crashes, Secrets & Stack Trace Redaction Across 8 Route Handlers', async () => {
  const adminToken = createSessionToken({
    uid: 'usr_victim_admin',
    email: 'admin@victim.com',
    displayName: 'Victim Admin',
    role: 'admin',
    workspaceId: wsVictim,
    createdAt: Date.now(),
  });

  const dangerousErrors = [
    {
      type: 'MongoDB Connection String & Credentials Leak',
      message: 'MongoServerError: authentication failed at mongodb+srv://clusterAdmin:P@ssw0rd999!@prod0.cursis.internal:27017/prod?ssl=true',
      forbiddenSubstrings: ['mongodb+srv://', 'P@ssw0rd999!', 'prod0.cursis.internal'],
    },
    {
      type: 'Network Connection Refusal & Internal Hostname',
      message: 'Error: connect ECONNREFUSED 10.240.0.15:27017 at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1300:16)',
      forbiddenSubstrings: ['ECONNREFUSED', '10.240.0.15', 'TCPConnectWrap'],
    },
    {
      type: 'Sensitive API Key / Secret Token Leak',
      message: 'ThirdPartyAuthError: Bearer sk_live_secure_production_key_abcdef1234567890 was rejected by upstream provider',
      forbiddenSubstrings: ['sk_live_secure_production_key_abcdef1234567890', 'Bearer'],
    },
    {
      type: 'Deep Internal Stack Trace (>150 characters)',
      message: 'DatabaseCrashError: Query execution failed at MongoDriver.executeCommand (/app/node_modules/mongodb/lib/cmap/connection.js:142:25)\n    at ConnectionPool.processWaitQueue (/app/node_modules/mongodb/lib/cmap/connection_pool.js:485:31)\n    at Socket.<anonymous> (/app/lib/db.ts:104:18)',
      forbiddenSubstrings: ['MongoDriver.executeCommand', 'connection_pool.js', 'node_modules/mongodb'],
    },
  ];

  // Verification Helper for any route response
  async function verifySanitizedError(response, context) {
    assert.equal(response.status, 500, `${context}: Expected HTTP 500 status code`);
    const rawText = await response.text();
    const json = JSON.parse(rawText);

    assert.equal(json.success, false, `${context}: json.success must be false`);
    assert.ok(json.correlationId, `${context}: Must include UUID correlationId`);
    assert.match(json.correlationId, /^[0-9a-f-]{36}$/i, `${context}: correlationId must be valid UUID`);

    for (const errCase of dangerousErrors) {
      for (const forbidden of errCase.forbiddenSubstrings) {
        assert.ok(
          !rawText.includes(forbidden),
          `${context}: CRITICAL SECURITY VIOLATION: Response leaked '${forbidden}' in body: ${rawText}`
        );
      }
    }

    // Must be sanitized to safe user-facing message
    assert.equal(
      json.error,
      'An unexpected internal error occurred. Please try again later.',
      `${context}: Error message was not properly sanitized`
    );
  }

  // 1. Route: app/api/agency/catalog/route.ts
  {
    const agencyDb = require('@/lib/db/agency.ts');
    const origGetCatalog = agencyDb.getAgencyServiceCatalog;
    for (const danger of dangerousErrors) {
      agencyDb.getAgencyServiceCatalog = async () => { throw new Error(danger.message); };
      const res = await agencyCatalogRoute.GET();
      await verifySanitizedError(res, `agency/catalog (${danger.type})`);
    }
    agencyDb.getAgencyServiceCatalog = origGetCatalog;
  }

  // 2. Route: app/api/calendar/smart-slots/route.ts (GET and POST)
  {
    const calendarDb = require('@/lib/db/calendar.ts');
    const origFindSlots = calendarDb.findSmartOpenSlots;
    for (const danger of dangerousErrors) {
      calendarDb.findSmartOpenSlots = async () => { throw new Error(danger.message); };

      // GET
      const getReq = makeAuthRequest(`http://localhost/api/calendar/smart-slots?workspaceId=${wsVictim}`, 'GET', undefined, adminToken);
      const getRes = await smartSlotsRoute.GET(getReq);
      await verifySanitizedError(getRes, `calendar/smart-slots GET (${danger.type})`);

      // POST
      const postReq = makeAuthRequest('http://localhost/api/calendar/smart-slots', 'POST', { workspaceId: wsVictim }, adminToken);
      const postRes = await smartSlotsRoute.POST(postReq);
      await verifySanitizedError(postRes, `calendar/smart-slots POST (${danger.type})`);
    }
    calendarDb.findSmartOpenSlots = origFindSlots;
  }

  // 3. Route: app/api/ordis/approval-queue/route.ts (GET)
  {
    const origValues = inMemoryStore.approvalQueue.values;
    for (const danger of dangerousErrors) {
      inMemoryStore.approvalQueue.values = () => { throw new Error(danger.message); };
      const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue?workspaceId=${wsVictim}`, 'GET', undefined, adminToken);
      const res = await approvalQueueRoute.GET(req);
      await verifySanitizedError(res, `ordis/approval-queue GET (${danger.type})`);
    }
    inMemoryStore.approvalQueue.values = origValues;
  }

  // 4. Route: app/api/ordis/approval-queue/[id]/route.ts (POST)
  {
    const origResolve = OrdisEngine.resolveApprovalItem;
    for (const danger of dangerousErrors) {
      OrdisEngine.resolveApprovalItem = async () => { throw new Error(danger.message); };
      const req = makeAuthRequest(`http://localhost/api/ordis/approval-queue/any_item`, 'POST', { workspaceId: wsVictim, action: 'approve' }, adminToken);
      const res = await approvalQueueItemRoute.POST(req, { params: Promise.resolve({ id: 'any_item' }) });
      await verifySanitizedError(res, `ordis/approval-queue/[id] POST (${danger.type})`);
    }
    OrdisEngine.resolveApprovalItem = origResolve;
  }

  // 5. Route: app/api/ordis/simulation/route.ts (GET)
  {
    const origSimValues = inMemoryStore.simulations.values;
    for (const danger of dangerousErrors) {
      inMemoryStore.simulations.values = () => { throw new Error(danger.message); };
      const req = makeAuthRequest(`http://localhost/api/ordis/simulation?workspaceId=${wsVictim}`, 'GET', undefined, adminToken);
      const res = await simulationRoute.GET(req);
      await verifySanitizedError(res, `ordis/simulation GET (${danger.type})`);
    }
    inMemoryStore.simulations.values = origSimValues;
  }

  // 6. Route: app/api/ordis/run-process/route.ts (POST)
  {
    const origRunProcess = OrdisEngine.runProcessFromSentence;
    for (const danger of dangerousErrors) {
      OrdisEngine.runProcessFromSentence = async () => { throw new Error(danger.message); };
      const req = makeAuthRequest('http://localhost/api/ordis/run-process', 'POST', { workspaceId: wsVictim, prompt: 'Automate sprint' }, adminToken);
      const res = await runProcessRoute.POST(req);
      await verifySanitizedError(res, `ordis/run-process POST (${danger.type})`);
    }
    OrdisEngine.runProcessFromSentence = origRunProcess;
  }

  // 7. Route: app/api/ordis/risk-radar/route.ts (GET)
  {
    const origRadarValues = inMemoryStore.riskRadar.values;
    for (const danger of dangerousErrors) {
      inMemoryStore.riskRadar.values = () => { throw new Error(danger.message); };
      const req = makeAuthRequest(`http://localhost/api/ordis/risk-radar?workspaceId=${wsVictim}`, 'GET', undefined, adminToken);
      const res = await riskRadarRoute.GET(req);
      await verifySanitizedError(res, `ordis/risk-radar GET (${danger.type})`);
    }
    inMemoryStore.riskRadar.values = origRadarValues;
  }

  // 8. Route: app/api/integrations/webhook/route.ts (POST)
  {
    process.env.CURSIS_WEBHOOK_SECRET = 'test_webhook_secret_key_123';
    const crmDb = require('@/lib/db/crm.ts');
    const origCreateLead = crmDb.createLead;
    for (const danger of dangerousErrors) {
      crmDb.createLead = async () => { throw new Error(danger.message); };
      const req = new Request('http://localhost/api/integrations/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-secret': 'test_webhook_secret_key_123',
          'x-webhook-nonce': crypto.randomUUID(),
        },
        body: JSON.stringify({
          event: 'contact_form_submission',
          workspaceId: wsVictim,
          email: 'lead@customer.com',
          name: 'Lead Customer',
        }),
      });
      const res = await webhookRoute.POST(req);
      await verifySanitizedError(res, `integrations/webhook POST (${danger.type})`);
    }
    crmDb.createLead = origCreateLead;
    delete process.env.CURSIS_WEBHOOK_SECRET;
  }
});

// ---------------------------------------------------------------------------
// SUITE 3: Dynamic Sovereign Founder Parameterization Stress Testing
// ---------------------------------------------------------------------------
test('Founder Challenger: Dynamic Resolution, Fallbacks & Usurpation Resistance', () => {
  const {
    DEFAULT_SOVEREIGN_FOUNDER_EMAIL,
    getSovereignFounderEmail,
    isFounderEmail,
    getAuthorizedRole,
    getAuthorizedTitle,
    getAuthorizedDepartment,
  } = require('@/lib/auth/founder.ts');

  // Baseline Default
  delete process.env.SOVEREIGN_FOUNDER_EMAIL;
  delete process.env.NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL;

  assert.equal(DEFAULT_SOVEREIGN_FOUNDER_EMAIL, 'mukulk3962364@gmail.com');
  assert.equal(getSovereignFounderEmail(), 'mukulk3962364@gmail.com');
  assert.equal(isFounderEmail('mukulk3962364@gmail.com'), true);
  assert.equal(isFounderEmail('  MUKULK3962364@GMAIL.COM  '), true, 'Case and whitespace insensitive');
  assert.equal(isFounderEmail(null), false);
  assert.equal(isFounderEmail(undefined), false);
  assert.equal(isFounderEmail(''), false);
  assert.equal(isFounderEmail('random@user.com'), false);

  assert.equal(getAuthorizedRole('mukulk3962364@gmail.com'), 'owner');
  assert.equal(getAuthorizedTitle('mukulk3962364@gmail.com'), 'Founder & CEO');
  assert.equal(getAuthorizedDepartment('mukulk3962364@gmail.com'), 'Leadership');

  // Usurpation Attempt on default
  assert.equal(getAuthorizedRole('attacker@evil.com'), 'member');
  assert.equal(getAuthorizedRole('attacker@evil.com', 'admin'), 'admin');
  assert.equal(getAuthorizedTitle('attacker@evil.com', 'Founder & CEO'), 'User');
  assert.equal(getAuthorizedTitle('attacker@evil.com', 'executive founder'), 'User');
  assert.equal(getAuthorizedTitle('attacker@evil.com', 'Company Owner'), 'User');
  assert.equal(getAuthorizedTitle('attacker@evil.com', 'Senior Developer'), 'Senior Developer');
  assert.equal(getAuthorizedDepartment('attacker@evil.com', 'Leadership'), 'Operations');
  assert.equal(getAuthorizedDepartment('attacker@evil.com', 'Marketing'), 'Marketing');

  // Dynamic Setting 1: Standard enterprise founder override
  process.env.SOVEREIGN_FOUNDER_EMAIL = '  CTO-Executive@EnterpriseCorp.com  ';
  assert.equal(getSovereignFounderEmail(), 'cto-executive@enterprisecorp.com');
  assert.equal(isFounderEmail('cto-executive@enterprisecorp.com'), true);
  assert.equal(isFounderEmail('CTO-EXECUTIVE@ENTERPRISECORP.COM'), true);
  assert.equal(isFounderEmail('mukulk3962364@gmail.com'), false, 'Old default is no longer founder');
  assert.equal(getAuthorizedRole('cto-executive@enterprisecorp.com'), 'owner');
  assert.equal(getAuthorizedTitle('cto-executive@enterprisecorp.com'), 'Founder & CEO');
  assert.equal(getAuthorizedDepartment('cto-executive@enterprisecorp.com'), 'Leadership');
  assert.equal(getAuthorizedRole('mukulk3962364@gmail.com'), 'member');
  assert.equal(getAuthorizedTitle('mukulk3962364@gmail.com'), 'User');

  // Dynamic Setting 2: Fallback to NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL
  delete process.env.SOVEREIGN_FOUNDER_EMAIL;
  process.env.NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL = 'public-founder@cursis.in';
  assert.equal(getSovereignFounderEmail(), 'public-founder@cursis.in');
  assert.equal(isFounderEmail('public-founder@cursis.in'), true);

  // Dynamic Setting 3: Priority - SOVEREIGN_FOUNDER_EMAIL takes precedence over NEXT_PUBLIC
  process.env.SOVEREIGN_FOUNDER_EMAIL = 'private-founder@cursis.in';
  assert.equal(getSovereignFounderEmail(), 'private-founder@cursis.in');
  assert.equal(isFounderEmail('private-founder@cursis.in'), true);
  assert.equal(isFounderEmail('public-founder@cursis.in'), false);

  // Dynamic Setting 4: Empty string and whitespace fallback to default
  process.env.SOVEREIGN_FOUNDER_EMAIL = '   ';
  delete process.env.NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL;
  assert.equal(getSovereignFounderEmail(), 'mukulk3962364@gmail.com', 'Whitespace only must fallback to default');

  process.env.SOVEREIGN_FOUNDER_EMAIL = '';
  assert.equal(getSovereignFounderEmail(), 'mukulk3962364@gmail.com', 'Empty string must fallback to default');

  delete process.env.SOVEREIGN_FOUNDER_EMAIL;
  delete process.env.NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL;
});
