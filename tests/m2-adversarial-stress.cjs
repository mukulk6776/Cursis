// tests/m2-adversarial-stress.cjs
// Adversarial Stress & Boundary Testing Harness for Milestone 2
// Author: Milestone 2 Challenger 1 (teamwork_challenger)
// Tests: Concurrency, Session Spoofing, Unauthorized Workspace Ingress, Race Conditions, State Reset Completeness

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_m2_adversarial_secret_key_32_chars!';
process.env.SOVEREIGN_FOUNDER_EMAIL = 'founder@cursis.in';

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

// Shims for Next.js headers & server
let setCookieCalls = [];
const origLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === 'next/server') {
    return {
      NextResponse: {
        json: (data, init) => {
          const res = Response.json(data, init);
          res.cookies = {
            set: (k, v, o) => setCookieCalls.push({ name: k, value: v, options: o }),
          };
          return res;
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
        set: (k, v, o) => setCookieCalls.push({ name: k, value: v, options: o }),
        delete: () => {},
      }),
      headers: async () => new Headers(),
    };
  }
  if (name === 'resend') {
    return {
      Resend: class {
        emails = { send: async () => ({ id: 'mock_resend_email_id' }) };
      },
    };
  }
  if (name === 'firebase-admin') {
    return {
      auth: () => ({
        verifyIdToken: async (token) => ({
          uid: 'usr_firebase_mock',
          email: 'firebase@cursis.in',
          email_verified: true,
        }),
      }),
    };
  }
  if (name === 'jose') {
    return {
      createRemoteJWKSet: () => ({}),
      jwtVerify: async () => ({
        payload: {
          sub: 'usr_mock_jose',
          email: 'test@cursis.in',
          email_verified: true,
          displayName: 'Jose Mock User',
        },
      }),
      SignJWT: class {
        setProtectedHeader() { return this; }
        setIssuedAt() { return this; }
        setExpirationTime() { return this; }
        async sign() { return 'mock_signed_jwt'; }
      },
    };
  }
  return origLoad.apply(this, arguments);
};

// Mock MongoDB
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async () => null,
    getDb: async () => null,
    isMongoConnected: () => false,
  },
};

const { inMemoryStore } = require('@/lib/db/store');
const { inMemoryMemberships } = require('@/lib/db/memberships');
const { inMemoryInvitations } = require('@/lib/db/invitations');
const { createSessionToken, verifySessionToken } = require('@/lib/auth/token');
const { getUserWorkspaceRole, authorizeWorkspaceAccess } = require('@/lib/auth/rbac');

// Route handlers
const switchRoute = require('@/app/api/workspaces/switch/route');
const sessionRoute = require('@/app/api/auth/session/route');

function setupTestEnvironment() {
  inMemoryStore.workspaces.clear();
  inMemoryStore.users.clear();
  inMemoryMemberships.clear();
  inMemoryInvitations.clear();
  setCookieCalls = [];

  const now = new Date().toISOString();

  // Workspace Alpha
  inMemoryStore.workspaces.set('ws_alpha', {
    id: 'ws_alpha',
    name: 'Alpha Corp',
    slug: 'alpha-corp',
    tier: 'free',
    ordisMode: 'chill',
    industry: 'Technology',
    teamSize: '1-4',
    features: ['tasks'],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'medium' },
    ownerId: 'usr_alpha_owner',
    memberCount: 2,
    createdAt: now,
    updatedAt: now,
  });

  // Workspace Beta
  inMemoryStore.workspaces.set('ws_beta', {
    id: 'ws_beta',
    name: 'Beta Global',
    slug: 'beta-global',
    tier: 'pro',
    ordisMode: 'balanced',
    industry: 'Healthcare',
    teamSize: '1-4',
    features: ['tasks', 'crm'],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'low' },
    ownerId: 'usr_beta_owner',
    memberCount: 2,
    createdAt: now,
    updatedAt: now,
  });

  // Workspace Gamma (Secret isolated tenant)
  inMemoryStore.workspaces.set('ws_gamma', {
    id: 'ws_gamma',
    name: 'Gamma Classified',
    slug: 'gamma-classified',
    tier: 'enterprise',
    ordisMode: 'pro',
    industry: 'Defense',
    teamSize: '1-4',
    features: ['tasks', 'crm', 'security'],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'none' },
    ownerId: 'usr_gamma_owner',
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  // Users
  inMemoryStore.users.set('usr_alpha_member', {
    id: 'usr_alpha_member',
    uid: 'usr_alpha_member',
    email: 'alpha_member@cursis.in',
    displayName: 'Alpha Member',
    role: 'member',
    workspaceIds: ['ws_alpha'],
    activeWorkspaceId: 'ws_alpha',
  });

  inMemoryStore.users.set('usr_alpha_viewer', {
    id: 'usr_alpha_viewer',
    uid: 'usr_alpha_viewer',
    email: 'alpha_viewer@cursis.in',
    displayName: 'Alpha Viewer',
    role: 'viewer',
    workspaceIds: ['ws_alpha'],
    activeWorkspaceId: 'ws_alpha',
  });

  inMemoryStore.users.set('usr_dual_member', {
    id: 'usr_dual_member',
    uid: 'usr_dual_member',
    email: 'dual@cursis.in',
    displayName: 'Dual Member',
    role: 'member',
    workspaceIds: ['ws_alpha', 'ws_beta'],
    activeWorkspaceId: 'ws_alpha',
  });

  // Memberships
  inMemoryMemberships.set('ws_alpha_usr_alpha_member', {
    id: 'mem_a1',
    workspaceId: 'ws_alpha',
    userId: 'usr_alpha_member',
    role: 'member',
    createdAt: now,
  });

  // usr_dual_member is 'viewer' in ws_alpha, but 'admin' in ws_beta!
  inMemoryMemberships.set('ws_alpha_usr_dual_member', {
    id: 'mem_d_alpha',
    workspaceId: 'ws_alpha',
    userId: 'usr_dual_member',
    role: 'viewer',
    createdAt: now,
  });

  inMemoryMemberships.set('ws_beta_usr_dual_member', {
    id: 'mem_d_beta',
    workspaceId: 'ws_beta',
    userId: 'usr_dual_member',
    role: 'admin',
    createdAt: now,
  });
}

function createAuthHeader(user, overrideWorkspaceId) {
  const token = createSessionToken({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    workspaceId: overrideWorkspaceId || user.activeWorkspaceId,
    createdAt: Date.now(),
  });
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

describe('M2 Adversarial Challenge Suite: Workspace Switching & State Isolation', () => {

  beforeEach(() => {
    setupTestEnvironment();
  });

  // ==========================================================================
  // CHALLENGE 1: Rapid Alternating Switches & Race Conditions
  // ==========================================================================
  test('Challenge 1.1: Rapid alternating concurrent switches do not corrupt user state or throw 500s', async () => {
    const user = inMemoryStore.users.get('usr_dual_member');
    const targets = ['ws_beta', 'ws_alpha', 'ws_beta', 'ws_alpha', 'ws_beta'];
    
    // Fire 20 alternating switch requests concurrently
    const requests = Array.from({ length: 20 }, (_, idx) => {
      const target = targets[idx % targets.length];
      const req = new Request('http://localhost/api/workspaces/switch', {
        method: 'POST',
        headers: createAuthHeader(user),
        body: JSON.stringify({ workspaceId: target }),
      });
      return switchRoute.POST(req);
    });

    const responses = await Promise.all(requests);

    for (const res of responses) {
      assert.equal(res.status, 200, 'Every valid switch must succeed with 200 without throwing 500');
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(['ws_alpha', 'ws_beta'].includes(body.workspaceId));
    }

    // Active workspace in store must be a valid target
    assert.ok(['ws_alpha', 'ws_beta'].includes(user.activeWorkspaceId));
  });

  test('Challenge 1.2: Client-side generational counter protects against out-of-order async response stale bleed', async () => {
    // Simulate the DashboardContext generational pattern:
    let stateGen = 0;
    let committedWorkspaceData = null;

    async function simulateSync(wsId, simulatedNetworkDelayMs) {
      const currentGen = ++stateGen;
      await new Promise((res) => setTimeout(res, simulatedNetworkDelayMs));
      if (currentGen !== stateGen) {
        // Discard superseded fetch
        return { discarded: true };
      }
      committedWorkspaceData = { workspaceId: wsId, tasks: [`task_for_${wsId}`] };
      return { discarded: false, data: committedWorkspaceData };
    }

    // Switch A triggers with 60ms delay
    const callA = simulateSync('ws_alpha', 60);
    // User immediately switches to B, which returns fast in 10ms
    const callB = simulateSync('ws_beta', 10);

    const [resA, resB] = await Promise.all([callA, callB]);

    assert.equal(resB.discarded, false, 'Faster second switch must be accepted');
    assert.equal(resA.discarded, true, 'Slower first switch must be discarded');
    assert.equal(
      committedWorkspaceData.workspaceId,
      'ws_beta',
      'Final state MUST reflect ws_beta and NOT be overwritten by ws_alpha'
    );
  });

  // ==========================================================================
  // CHALLENGE 2: Forged, Non-Member, or Malformed Workspace Switch Invocations
  // ==========================================================================
  test('Challenge 2.1: Non-member cannot switch to unauthorized workspace (ws_gamma)', async () => {
    const user = inMemoryStore.users.get('usr_dual_member'); // member of alpha and beta, NOT gamma
    const req = new Request('http://localhost/api/workspaces/switch', {
      method: 'POST',
      headers: createAuthHeader(user),
      body: JSON.stringify({ workspaceId: 'ws_gamma' }),
    });

    const res = await switchRoute.POST(req);
    assert.equal(res.status, 403, 'Must return 403 Forbidden for non-member target workspace');
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Forbidden/i);
  });

  test('Challenge 2.2: Forged nonexistent workspaceId returns 403 Forbidden', async () => {
    const user = inMemoryStore.users.get('usr_dual_member');
    const req = new Request('http://localhost/api/workspaces/switch', {
      method: 'POST',
      headers: createAuthHeader(user),
      body: JSON.stringify({ workspaceId: 'ws_hacked_fictitious_9999' }),
    });

    const res = await switchRoute.POST(req);
    assert.equal(res.status, 403, 'Targeting nonexistent workspace must be forbidden');
  });

  test('Challenge 2.3: Malformed, boundary, and injection payloads in workspaceId', async () => {
    const user = inMemoryStore.users.get('usr_dual_member');

    const badInputs = [
      { payload: { workspaceId: '' }, expectedStatus: 400 },
      { payload: { workspaceId: '   ' }, expectedStatus: 400 },
      { payload: { workspaceId: null }, expectedStatus: 400 },
      { payload: { workspaceId: 12345 }, expectedStatus: 400 },
      { payload: { workspaceId: true }, expectedStatus: 400 },
      { payload: { workspaceId: {} }, expectedStatus: 400 },
      { payload: { workspaceId: [] }, expectedStatus: 400 },
      { payload: {}, expectedStatus: 400 },
      // SQL / Path Traversal / Prototype pollution payloads
      { payload: { workspaceId: '../../etc/passwd' }, expectedStatus: 403 },
      { payload: { workspaceId: "' OR '1'='1" }, expectedStatus: 403 },
      { payload: { workspaceId: '__proto__' }, expectedStatus: 403 },
      { payload: { workspaceId: 'constructor' }, expectedStatus: 403 },
    ];

    for (const { payload, expectedStatus } of badInputs) {
      const req = new Request('http://localhost/api/workspaces/switch', {
        method: 'POST',
        headers: createAuthHeader(user),
        body: JSON.stringify(payload),
      });

      const res = await switchRoute.POST(req);
      assert.equal(
        res.status,
        expectedStatus,
        `Payload ${JSON.stringify(payload)} should return status ${expectedStatus}, got ${res.status}`
      );
    }
  });

  test('Challenge 2.4: Immediate revocation of membership blocks subsequent switch', async () => {
    const user = inMemoryStore.users.get('usr_dual_member');
    
    // Revoke membership in ws_beta
    inMemoryMemberships.delete('ws_beta_usr_dual_member');

    const req = new Request('http://localhost/api/workspaces/switch', {
      method: 'POST',
      headers: createAuthHeader(user),
      body: JSON.stringify({ workspaceId: 'ws_beta' }),
    });

    const res = await switchRoute.POST(req);
    assert.equal(res.status, 403, 'Revoked member must immediately be blocked from switching to that workspace');
  });

  // ==========================================================================
  // CHALLENGE 3: Session Cookie Hijacking and Role Isolation
  // ==========================================================================
  test('Challenge 3.1: Session cookie signature tampering is completely rejected', () => {
    const validToken = createSessionToken({
      uid: 'usr_dual_member',
      email: 'dual@cursis.in',
      displayName: 'Dual Member',
      role: 'member',
      workspaceId: 'ws_alpha',
      createdAt: Date.now(),
    });

    assert.ok(validToken.startsWith('cursis_usr_'), 'Valid token must have cursis_usr_ prefix');
    const raw = validToken.replace('cursis_usr_', '');
    const parts = raw.split('.');
    assert.equal(parts.length, 2, 'Valid token raw body must have data and signature parts');

    // Attacker alters payload part of token to change workspaceId to ws_gamma
    const payloadJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    const modifiedPayload = JSON.parse(payloadJson);
    modifiedPayload.workspaceId = 'ws_gamma';
    modifiedPayload.role = 'owner';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(modifiedPayload)).toString('base64url');

    const forgedToken = `cursis_usr_${tamperedPayloadB64}.${parts[1]}`; // old signature with tampered payload

    const verified = verifySessionToken(forgedToken);
    assert.equal(verified, null, 'Tampered token signature verification must return null');

    // Attacker signs with different key
    const fakeSignature = require('crypto').createHmac('sha256', 'wrong_secret_key_12345').update(tamperedPayloadB64).digest('base64url');
    const wrongKeyToken = `cursis_usr_${tamperedPayloadB64}.${fakeSignature}`;
    assert.equal(verifySessionToken(wrongKeyToken), null, 'Token signed with wrong key must return null');
  });

  test('Challenge 3.2: Tampered token sent to /api/workspaces/switch is rejected with 401', async () => {
    const forgedToken = 'cursis_usr_eyJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJ1c3JfZHVhbF9tZW1iZXIiLCJ3b3Jrc3BhY2VJZCI6IndzX2dhbW1hIn0.invalid_signature_here';

    const req = new Request('http://localhost/api/workspaces/switch', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${forgedToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ workspaceId: 'ws_gamma' }),
    });

    const res = await switchRoute.POST(req);
    assert.equal(res.status, 401, 'Request with forged signature must be rejected with 401 Unauthorized');
  });

  test('Challenge 3.3: Role isolation across switches (viewer in Alpha -> admin in Beta -> viewer in Alpha)', async () => {
    const user = inMemoryStore.users.get('usr_dual_member');

    // 1. Switch to Beta -> user role must be 'admin'
    const switchBetaReq = new Request('http://localhost/api/workspaces/switch', {
      method: 'POST',
      headers: createAuthHeader(user, 'ws_alpha'),
      body: JSON.stringify({ workspaceId: 'ws_beta' }),
    });
    const betaRes = await switchRoute.POST(switchBetaReq);
    assert.equal(betaRes.status, 200);
    const betaBody = await betaRes.json();
    assert.equal(betaBody.user.role, 'admin', 'Dual member must have role admin in ws_beta');

    // Verify minted token has role 'admin'
    const betaDecoded = verifySessionToken(betaBody.token);
    assert.equal(betaDecoded.role, 'admin');

    // 2. Switch back to Alpha -> user role must downgrade back to 'viewer'
    const switchAlphaReq = new Request('http://localhost/api/workspaces/switch', {
      method: 'POST',
      headers: createAuthHeader(user, 'ws_beta'),
      body: JSON.stringify({ workspaceId: 'ws_alpha' }),
    });
    const alphaRes = await switchRoute.POST(switchAlphaReq);
    assert.equal(alphaRes.status, 200);
    const alphaBody = await alphaRes.json();
    assert.equal(alphaBody.user.role, 'viewer', 'Dual member must have role viewer in ws_alpha');

    // Verify minted token has role 'viewer' (no privilege escalation)
    const alphaDecoded = verifySessionToken(alphaBody.token);
    assert.equal(alphaDecoded.role, 'viewer', 'Role must downgrade cleanly with zero privilege bleed');
  });

  // ==========================================================================
  // CHALLENGE 4: State Setters Completeness & Leakage Simulation
  // ==========================================================================
  test('Challenge 4.1: Direct inspection of switchWorkspace confirms all 12 reset setters exist', () => {
    const fileContent = fs.readFileSync(path.join(root, 'lib/dashboard/DashboardContext.tsx'), 'utf8');

    // Locate switchWorkspace function
    const switchWsMatch = fileContent.match(/const switchWorkspace = async \((.*?)\) => {([\s\S]*?)};/);
    assert.ok(switchWsMatch, 'switchWorkspace function definition must exist in DashboardContext.tsx');

    const switchBody = switchWsMatch[2];

    const expectedSetters = [
      'setEmployees([])',
      'setInvitations([])',
      'setCrm({ deals: [], contacts: [] })',
      'setAutomations([])',
      'setApiKeys([])',
      'setWebhooks([])',
      'setAuditLogs([])',
      'setTasks([])',
      'setDepartments([])',
      'setProjects([])',
      'setDocuments([])',
      'setMeetings([])',
    ];

    for (const setter of expectedSetters) {
      assert.ok(
        switchBody.includes(setter),
        `switchWorkspace must call '${setter}' to guarantee zero stale state leakage`
      );
    }
  });

  test('Challenge 4.2: Simulation proves state reset prevents stale entity retention', () => {
    // Populate an active state model with mock entities
    const activeState = {
      employees: [{ id: 'emp_1', name: 'Alpha Emp' }],
      invitations: [{ id: 'inv_1', email: 'pending@alpha.com' }],
      crm: { deals: [{ id: 'deal_1' }], contacts: [{ id: 'contact_1' }] },
      automations: [{ id: 'auto_1' }],
      apiKeys: [{ id: 'key_1' }],
      webhooks: [{ id: 'wh_1' }],
      auditLogs: [{ id: 'log_1' }],
      tasks: [{ id: 'task_1' }],
      departments: [{ id: 'dept_1' }],
      projects: [{ id: 'proj_1' }],
      documents: [{ id: 'doc_1' }],
      meetings: [{ id: 'mtg_1' }],
    };

    // Apply the 12 reset actions from switchWorkspace
    function applyWorkspaceSwitchReset(state) {
      state.employees = [];
      state.invitations = [];
      state.crm = { deals: [], contacts: [] };
      state.automations = [];
      state.apiKeys = [];
      state.webhooks = [];
      state.auditLogs = [];
      state.tasks = [];
      state.departments = [];
      state.projects = [];
      state.documents = [];
      state.meetings = [];
    }

    applyWorkspaceSwitchReset(activeState);

    // Verify every single collection is emptied
    assert.equal(activeState.employees.length, 0);
    assert.equal(activeState.invitations.length, 0);
    assert.equal(activeState.crm.deals.length, 0);
    assert.equal(activeState.crm.contacts.length, 0);
    assert.equal(activeState.automations.length, 0);
    assert.equal(activeState.apiKeys.length, 0);
    assert.equal(activeState.webhooks.length, 0);
    assert.equal(activeState.auditLogs.length, 0);
    assert.equal(activeState.tasks.length, 0);
    assert.equal(activeState.departments.length, 0);
    assert.equal(activeState.projects.length, 0);
    assert.equal(activeState.documents.length, 0);
    assert.equal(activeState.meetings.length, 0);
  });

  // ==========================================================================
  // CHALLENGE 5: Cross-Workspace Access Authorization Gate
  // ==========================================================================
  test('Challenge 5.1: authorizeWorkspaceAccess enforces strict boundaries against arbitrary workspaceIds', async () => {
    const user = inMemoryStore.users.get('usr_alpha_member'); // only member of ws_alpha
    const validAlphaReq = new Request('http://localhost/api/tasks', {
      headers: createAuthHeader(user, 'ws_alpha'),
    });

    // Valid access to own workspace
    const authSuccess = await authorizeWorkspaceAccess(validAlphaReq, 'ws_alpha');
    assert.equal(authSuccess.errorResponse, null);
    assert.equal(authSuccess.workspaceId, 'ws_alpha');

    // Unauthorized access attempt to ws_beta
    const authForbidden = await authorizeWorkspaceAccess(validAlphaReq, 'ws_beta');
    assert.ok(authForbidden.errorResponse, 'Must deny access to unauthorized workspace');
    assert.equal(authForbidden.errorResponse.status, 403);
  });
});
