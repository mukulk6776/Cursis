// tests/workspace-state-consistency.cjs
// Automated Verification Suite for Milestone 2: Features 8-12
// Workspace State Consistency, Switch Route, Team Seat Limit, and Invitation Lifecycle

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_m2_test_secret_32_characters_long!';
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

// Shims for Next.js and external modules
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
      jwtVerify: async (token) => ({
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
const { inMemoryInvitations, createTeamInvitation, getWorkspaceInvitations } = require('@/lib/db/invitations');
const { getWorkspaceTeam, addTeamMember, MAX_TEAM_MEMBERS } = require('@/lib/db/team');
const { createSessionToken, verifySessionToken } = require('@/lib/auth/token');

// Load API routes
const switchRoute = require('@/app/api/workspaces/switch/route');
const invitationsRoute = require('@/app/api/invitations/route');
const teamRoute = require('@/app/api/team/route');
const sessionRoute = require('@/app/api/auth/session/route');

function resetTestData() {
  inMemoryStore.workspaces.clear();
  inMemoryStore.users.clear();
  inMemoryStore.tasks.clear();
  inMemoryMemberships.clear();
  inMemoryInvitations.clear();
  setCookieCalls = [];

  const now = new Date().toISOString();

  // Seed Workspace Alpha (Full capacity = 4)
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
    memberCount: 4,
    createdAt: now,
    updatedAt: now,
  });

  // Seed Workspace Beta (Capacity = 2 of 4)
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

  // Seed Users
  inMemoryStore.users.set('usr_alpha_owner', {
    id: 'usr_alpha_owner',
    uid: 'usr_alpha_owner',
    email: 'owner@alpha.cursis.in',
    displayName: 'Alpha Owner',
    role: 'owner',
    workspaceIds: ['ws_alpha'],
    activeWorkspaceId: 'ws_alpha',
  });

  inMemoryStore.users.set('usr_alpha_member', {
    id: 'usr_alpha_member',
    uid: 'usr_alpha_member',
    email: 'member@alpha.cursis.in',
    displayName: 'Alpha Member',
    role: 'member',
    workspaceIds: ['ws_alpha'],
    activeWorkspaceId: 'ws_alpha',
  });

  inMemoryStore.users.set('usr_alpha_viewer', {
    id: 'usr_alpha_viewer',
    uid: 'usr_alpha_viewer',
    email: 'viewer@alpha.cursis.in',
    displayName: 'Alpha Viewer',
    role: 'viewer',
    workspaceIds: ['ws_alpha'],
    activeWorkspaceId: 'ws_alpha',
  });

  inMemoryStore.users.set('usr_beta_owner', {
    id: 'usr_beta_owner',
    uid: 'usr_beta_owner',
    email: 'owner@beta.cursis.in',
    displayName: 'Beta Owner',
    role: 'owner',
    workspaceIds: ['ws_beta'],
    activeWorkspaceId: 'ws_beta',
  });

  // Dual-workspace user (member of both alpha and beta)
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
  inMemoryMemberships.set('ws_alpha_usr_alpha_owner', {
    id: 'mem_1',
    workspaceId: 'ws_alpha',
    userId: 'usr_alpha_owner',
    role: 'owner',
    createdAt: now,
  });
  inMemoryMemberships.set('ws_alpha_usr_alpha_member', {
    id: 'mem_2',
    workspaceId: 'ws_alpha',
    userId: 'usr_alpha_member',
    role: 'member',
    createdAt: now,
  });
  inMemoryMemberships.set('ws_alpha_usr_alpha_viewer', {
    id: 'mem_3',
    workspaceId: 'ws_alpha',
    userId: 'usr_alpha_viewer',
    role: 'viewer',
    createdAt: now,
  });
  inMemoryMemberships.set('ws_alpha_usr_dual_member', {
    id: 'mem_4',
    workspaceId: 'ws_alpha',
    userId: 'usr_dual_member',
    role: 'member',
    createdAt: now,
  });

  inMemoryMemberships.set('ws_beta_usr_beta_owner', {
    id: 'mem_5',
    workspaceId: 'ws_beta',
    userId: 'usr_beta_owner',
    role: 'owner',
    createdAt: now,
  });
  inMemoryMemberships.set('ws_beta_usr_dual_member', {
    id: 'mem_6',
    workspaceId: 'ws_beta',
    userId: 'usr_dual_member',
    role: 'admin',
    createdAt: now,
  });
}

function makeAuthHeaders(user) {
  const token = createSessionToken({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    workspaceId: user.activeWorkspaceId,
    createdAt: Date.now(),
  });
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

// ============================================================================
// TEST SUITE: Milestone 2 Consistency & Limits
// ============================================================================

test('Milestone 2: Workspace State Consistency & Team Limits Suite', async (t) => {

  // --------------------------------------------------------------------------
  // Feature 8: Comprehensive Workspace State Clearing
  // --------------------------------------------------------------------------
  await t.test('Feature 8: DashboardContext resets all tenant state on switch', () => {
    const contextContent = fs.readFileSync(path.join(root, 'lib/dashboard/DashboardContext.tsx'), 'utf8');

    // Verify all tenant-scoped state resetters are invoked in switchWorkspace
    const requiredResetters = [
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

    for (const resetter of requiredResetters) {
      assert.ok(
        contextContent.includes(resetter),
        `switchWorkspace must execute '${resetter}' to prevent stale tenant leaks`
      );
    }

    // Verify server synchronization call is present
    assert.ok(
      contextContent.includes('/api/workspaces/switch'),
      'switchWorkspace must call /api/workspaces/switch'
    );
  });

  // --------------------------------------------------------------------------
  // Feature 9: Server Session & Active Workspace Synchronization
  // --------------------------------------------------------------------------
  await t.test('Feature 9: /api/workspaces/switch and /api/auth/session contracts', async (st) => {
    resetTestData();

    await st.test('9.1: Unauthenticated request to /api/workspaces/switch is rejected with 401', async () => {
      const req = new Request('http://localhost/api/workspaces/switch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: 'ws_beta' }),
      });
      const res = await switchRoute.POST(req);
      assert.equal(res.status, 401);
    });

    await st.test('9.2: Empty or missing workspaceId is rejected with 400', async () => {
      const user = inMemoryStore.users.get('usr_dual_member');
      const req = new Request('http://localhost/api/workspaces/switch', {
        method: 'POST',
        headers: makeAuthHeaders(user),
        body: JSON.stringify({ workspaceId: '' }),
      });
      const res = await switchRoute.POST(req);
      assert.equal(res.status, 400);
    });

    await st.test('9.3: Switching to workspace where user is NOT a member is rejected with 403', async () => {
      const user = inMemoryStore.users.get('usr_alpha_member'); // only member of alpha
      const req = new Request('http://localhost/api/workspaces/switch', {
        method: 'POST',
        headers: makeAuthHeaders(user),
        body: JSON.stringify({ workspaceId: 'ws_beta' }),
      });
      const res = await switchRoute.POST(req);
      assert.equal(res.status, 403);
    });

    await st.test('9.4: Legitimate switch updates user profile, session token, and re-mints cookie', async () => {
      const user = inMemoryStore.users.get('usr_dual_member');
      assert.equal(user.activeWorkspaceId, 'ws_alpha');

      const req = new Request('http://localhost/api/workspaces/switch', {
        method: 'POST',
        headers: makeAuthHeaders(user),
        body: JSON.stringify({ workspaceId: 'ws_beta' }),
      });
      const res = await switchRoute.POST(req);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.workspaceId, 'ws_beta');

      // Profile updated
      assert.equal(user.activeWorkspaceId, 'ws_beta');

      // Cookie re-minted
      const cookieCall = setCookieCalls.find((c) => c.name === 'cursis_session');
      assert.ok(cookieCall, 'cursis_session cookie must be set');
      const decoded = verifySessionToken(cookieCall.value);
      assert.equal(decoded.workspaceId, 'ws_beta');
      assert.equal(decoded.role, 'admin'); // dual member is admin in ws_beta
    });

    await st.test('9.5: /api/auth/session accepts workspaceId update for session refresh', async () => {
      const user = inMemoryStore.users.get('usr_dual_member');
      const req = new Request('http://localhost/api/auth/session', {
        method: 'POST',
        headers: makeAuthHeaders(user),
        body: JSON.stringify({ workspaceId: 'ws_beta' }),
      });
      const res = await sessionRoute.POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.workspaceId, 'ws_beta');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 10: Orphaned Switcher Cleanup
  // --------------------------------------------------------------------------
  await t.test('Feature 10: WorkspaceSwitcher component has no dead routing paths', () => {
    const switcherContent = fs.readFileSync(path.join(root, 'components/dashboard/WorkspaceSwitcher.tsx'), 'utf8');
    assert.equal(
      switcherContent.includes('/dashboard/w/'),
      false,
      'Orphaned /dashboard/w/ route path must be removed'
    );
  });

  // --------------------------------------------------------------------------
  // Feature 11: Team Capacity & Seat Limit Enforcement
  // --------------------------------------------------------------------------
  await t.test('Feature 11: Team Capacity & Seat Limit Enforcement', async (st) => {
    resetTestData();

    await st.test('11.1: MAX_TEAM_MEMBERS is strictly 4', () => {
      assert.equal(MAX_TEAM_MEMBERS, 4);
    });

    await st.test('11.2: Adding member beyond seat limit (4) is rejected with 400', async () => {
      const owner = inMemoryStore.users.get('usr_alpha_owner');
      const req = new Request('http://localhost/api/team', {
        method: 'POST',
        headers: makeAuthHeaders(owner),
        body: JSON.stringify({
          workspaceId: 'ws_alpha',
          email: 'overflow@cursis.in',
          name: 'Overflow User',
          role: 'member',
        }),
      });
      const res = await teamRoute.POST(req);
      assert.equal(res.status, 400);
    });

    await st.test('11.3: Active members + pending invites >= 4 blocks adding more', async () => {
      const owner = inMemoryStore.users.get('usr_beta_owner');
      // ws_beta has 2 active members; add 2 pending invitations
      inMemoryInvitations.set('inv_1', {
        id: 'inv_1',
        workspaceId: 'ws_beta',
        email: 'p1@cursis.in',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      inMemoryInvitations.set('inv_2', {
        id: 'inv_2',
        workspaceId: 'ws_beta',
        email: 'p2@cursis.in',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      // Now 2 active + 2 pending = 4 capacity; adding 5th must fail
      const req = new Request('http://localhost/api/team', {
        method: 'POST',
        headers: makeAuthHeaders(owner),
        body: JSON.stringify({
          workspaceId: 'ws_beta',
          email: 'another@cursis.in',
          name: 'Another User',
          role: 'member',
        }),
      });
      const res = await teamRoute.POST(req);
      assert.equal(res.status, 400);
    });

    await st.test('11.4: Non-owner/admin is blocked from adding team members (403)', async () => {
      const viewer = inMemoryStore.users.get('usr_alpha_viewer');
      const req = new Request('http://localhost/api/team', {
        method: 'POST',
        headers: makeAuthHeaders(viewer),
        body: JSON.stringify({
          workspaceId: 'ws_alpha',
          email: 'hacker@cursis.in',
          name: 'Hacker',
          role: 'member',
        }),
      });
      const res = await teamRoute.POST(req);
      assert.equal(res.status, 403);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 12: Team Invitation Lifecycle
  // --------------------------------------------------------------------------
  await t.test('Feature 12: Team Invitation Lifecycle', async (st) => {
    resetTestData();

    await st.test('12.1: Owner can issue invitation for unregistered email without 404', async () => {
      const owner = inMemoryStore.users.get('usr_beta_owner');
      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner),
        body: JSON.stringify({
          workspaceId: 'ws_beta',
          email: 'unregistered_new_user@external.com',
          role: 'member',
        }),
      });
      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.invitation);
      assert.equal(data.invitation.status, 'pending');
      assert.ok(data.invitation.token.startsWith('tok_'));
      assert.ok(new Date(data.invitation.expiresAt) > new Date());
    });

    await st.test('12.2: GET /api/invitations returns pending invitations', async () => {
      const owner = inMemoryStore.users.get('usr_beta_owner');
      const req = new Request('http://localhost/api/invitations?workspaceId=ws_beta', {
        method: 'GET',
        headers: makeAuthHeaders(owner),
      });
      const res = await invitationsRoute.GET(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.invitations));
      assert.ok(data.invitations.length >= 1);
    });

    await st.test('12.3: Non-owner/admin is blocked from creating invitations (403)', async () => {
      const member = inMemoryStore.users.get('usr_alpha_member');
      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(member),
        body: JSON.stringify({
          workspaceId: 'ws_alpha',
          email: 'target@cursis.in',
          role: 'member',
        }),
      });
      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 403);
    });

    await st.test('12.4: Invitation creation is blocked when workspace is at capacity', async () => {
      const owner = inMemoryStore.users.get('usr_alpha_owner'); // alpha at 4 members
      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner),
        body: JSON.stringify({
          workspaceId: 'ws_alpha',
          email: 'overflow_invite@cursis.in',
          role: 'member',
        }),
      });
      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 400);
    });
  });
});
