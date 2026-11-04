// tests/challenger-m2-team-limits.cjs
// Adversarial Stress Testing Suite — Milestone 2: Team Limits & Invitation Lifecycle
// Challenger 2: Concurrency, Seat Limits, RBAC, Token Lifecycle & Email Fuzzing

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_m2_challenger_test_secret_32_chars!';
process.env.SOVEREIGN_FOUNDER_EMAIL = 'founder@cursis.in';

// Module alias resolution for '@/...'
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};

// TypeScript loader hook
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

// Shims for Next.js and third-party modules
let setCookieCalls = [];
const origLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === 'next/server') {
    return {
      NextResponse: {
        json: (data, init) => {
          const status = init?.status || 200;
          const headers = new Headers(init?.headers);
          headers.set('content-type', 'application/json');
          const res = new Response(JSON.stringify(data), { status, headers });
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
const {
  inMemoryInvitations,
  createTeamInvitation,
  getWorkspaceInvitations,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
} = require('@/lib/db/invitations');
const {
  getWorkspaceTeam,
  addTeamMember,
  MAX_TEAM_MEMBERS,
} = require('@/lib/db/team');
const { createSessionToken } = require('@/lib/auth/token');

// Load API Route Handlers
const invitationsRoute = require('@/app/api/invitations/route');
const acceptRoute = require('@/app/api/invitations/[id]/accept/route');
const declineRoute = require('@/app/api/invitations/[id]/decline/route');
const workspaceInvitationsRoute = require('@/app/api/workspaces/[id]/invitations/route');
const teamRoute = require('@/app/api/team/route');

function resetMemory() {
  inMemoryStore.workspaces.clear();
  inMemoryStore.users.clear();
  inMemoryStore.tasks.clear();
  inMemoryMemberships.clear();
  inMemoryInvitations.clear();
  setCookieCalls = [];
}

function createTestWorkspace(wsId, ownerUid, ownerEmail) {
  const now = new Date().toISOString();
  inMemoryStore.workspaces.set(wsId, {
    id: wsId,
    name: `Workspace ${wsId}`,
    slug: wsId,
    tier: 'free',
    ordisMode: 'chill',
    industry: 'Engineering',
    teamSize: '1-4',
    features: ['team', 'tasks'],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'medium' },
    ownerId: ownerUid,
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  const ownerUser = {
    id: ownerUid,
    uid: ownerUid,
    email: ownerEmail,
    displayName: 'Workspace Owner',
    role: 'owner',
    workspaceIds: [wsId],
    activeWorkspaceId: wsId,
    skills: ['Leadership'],
    presence: 'online',
    lastActiveAt: now,
    createdAt: now,
  };
  inMemoryStore.users.set(ownerUid, ownerUser);

  inMemoryMemberships.set(`${wsId}_${ownerUid}`, {
    id: `mem_${wsId}_${ownerUid}`,
    workspaceId: wsId,
    userId: ownerUid,
    role: 'owner',
    createdAt: now,
  });

  return ownerUser;
}

function makeAuthHeaders(user, workspaceId) {
  const activeWs = workspaceId || user.activeWorkspaceId || user.workspaceIds?.[0] || 'ws_default';
  const token = createSessionToken({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    workspaceId: activeWs,
    createdAt: Date.now(),
  });
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

// ============================================================================
// ADVERSARIAL TEST SUITE
// ============================================================================

test('CHALLENGER: Team Limits & Invitation Lifecycle Adversarial Verification', async (suite) => {

  // --------------------------------------------------------------------------
  // Category 1: Concurrency & Seat Limit Race Conditions
  // --------------------------------------------------------------------------
  await suite.test('Category 1: Concurrency & Seat Limit Race Conditions', async (t) => {

    await t.test('1.1: Concurrent POST /api/invitations evaluation under burst requests', async () => {
      resetMemory();
      const wsId = 'ws_race_inv';
      const owner = createTestWorkspace(wsId, 'usr_owner_race', 'owner.race@cursis.io');

      // Add 2 active members (Total active = 3: owner + m1 + m2)
      await addTeamMember(wsId, { email: 'm1.race@cursis.io', displayName: 'M1', role: 'member' });
      await addTeamMember(wsId, { email: 'm2.race@cursis.io', displayName: 'M2', role: 'member' });

      const teamBefore = await getWorkspaceTeam(wsId);
      assert.equal(teamBefore.length, 3, 'Workspace must have exactly 3 members before burst');

      // Now fire 10 concurrent invitation requests simultaneously
      const concurrencyCount = 10;
      const promises = Array.from({ length: concurrencyCount }).map((_, i) => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: `race_candidate_${i}@testdomain.com`,
            role: 'member',
          }),
        });
        return invitationsRoute.POST(req).then(async (res) => ({
          index: i,
          status: res.status,
          body: await res.json(),
        }));
      });

      const results = await Promise.all(promises);
      const successResults = results.filter((r) => r.status === 201);
      const rejectedResults = results.filter((r) => r.status === 400);

      console.log(`[Adversarial Concurrency 1.1] 10 Burst Invites -> ${successResults.length} succeeded, ${rejectedResults.length} rejected`);

      const pendingInvites = await getWorkspaceInvitations(wsId);
      const totalCapacityUsed = teamBefore.length + pendingInvites.length;

      // Check whether capacity constraint held under concurrency:
      // In a perfectly serialized system, totalCapacityUsed <= MAX_TEAM_MEMBERS (4).
      // If async TOCTOU allows leaks, successResults > 1 and totalCapacityUsed > 4.
      console.log(`[Adversarial Concurrency 1.1] Total Capacity Used: ${totalCapacityUsed} / ${MAX_TEAM_MEMBERS}`);

      // We assert that the system enforced capacity <= 4
      assert.ok(
        totalCapacityUsed <= MAX_TEAM_MEMBERS,
        `VULNERABILITY DETECTED: Concurrent invitations exceeded MAX_TEAM_MEMBERS (total=${totalCapacityUsed}, limit=${MAX_TEAM_MEMBERS})`
      );
      assert.equal(successResults.length, 1, 'Only 1 invitation should succeed when 3 of 4 seats are occupied');
      assert.equal(rejectedResults.length, 9, '9 invitations should be rejected with capacity limit 400');
    });

    await t.test('1.2: Concurrent addTeamMember calls evaluation under burst requests', async () => {
      resetMemory();
      const wsId = 'ws_race_add';
      createTestWorkspace(wsId, 'usr_owner_add', 'owner.add@cursis.io');

      const initialTeam = await getWorkspaceTeam(wsId);
      assert.equal(initialTeam.length, 1, 'Workspace should start with 1 owner');

      // Fire 10 concurrent direct member additions
      const addPromises = Array.from({ length: 10 }).map((_, i) =>
        addTeamMember(wsId, {
          email: `concurrent_member_${i}@cursis.in`,
          displayName: `Concurrent Member ${i}`,
          role: 'member',
        }).then(
          (res) => ({ success: true, res }),
          (err) => ({ success: false, err: err.message })
        )
      );

      const addResults = await Promise.all(addPromises);
      const addedSuccess = addResults.filter((r) => r.success);
      const addedFailed = addResults.filter((r) => !r.success);

      console.log(`[Adversarial Concurrency 1.2] 10 Burst addTeamMember -> ${addedSuccess.length} succeeded, ${addedFailed.length} rejected`);

      const finalTeam = await getWorkspaceTeam(wsId);
      assert.ok(
        finalTeam.length <= MAX_TEAM_MEMBERS,
        `VULNERABILITY DETECTED: Concurrent addTeamMember exceeded MAX_TEAM_MEMBERS (total=${finalTeam.length}, limit=${MAX_TEAM_MEMBERS})`
      );
      assert.equal(finalTeam.length, 4, 'Final team length must reach exactly 4');
      assert.equal(addedSuccess.length, 3, 'Exactly 3 member additions can succeed (1 + 3 = 4)');
      assert.equal(addedFailed.length, 7, '7 member additions must be rejected');
    });

    await t.test('1.3: Concurrent acceptWorkspaceInvitation when 2 invitations exist at 3 members', async () => {
      resetMemory();
      const wsId = 'ws_race_accept';
      createTestWorkspace(wsId, 'usr_owner_acc', 'owner.acc@cursis.io');

      await addTeamMember(wsId, { email: 'acc_m1@cursis.io', displayName: 'M1', role: 'member' });
      await addTeamMember(wsId, { email: 'acc_m2@cursis.io', displayName: 'M2', role: 'member' });

      const currentTeam = await getWorkspaceTeam(wsId);
      assert.equal(currentTeam.length, 3, 'Team must have 3 members');

      // Create 2 candidate users and invitations
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000).toISOString();

      inMemoryStore.users.set('cand_user_1', {
        id: 'cand_user_1',
        uid: 'cand_user_1',
        email: 'cand1@test.com',
        displayName: 'Candidate 1',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
        presence: 'online',
        lastActiveAt: now.toISOString(),
        createdAt: now.toISOString(),
      });
      inMemoryInvitations.set('inv_race_cand1', {
        id: 'inv_race_cand1',
        workspaceId: wsId,
        inviterUserId: 'usr_owner_acc',
        inviteeUserId: 'cand_user_1',
        email: 'cand1@test.com',
        name: 'Candidate 1',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_cand1',
        createdAt: now.toISOString(),
        sentAt: now.toISOString(),
        expiresAt,
        invitedBy: 'usr_owner_acc',
      });

      inMemoryStore.users.set('cand_user_2', {
        id: 'cand_user_2',
        uid: 'cand_user_2',
        email: 'cand2@test.com',
        displayName: 'Candidate 2',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
        presence: 'online',
        lastActiveAt: now.toISOString(),
        createdAt: now.toISOString(),
      });
      inMemoryInvitations.set('inv_race_cand2', {
        id: 'inv_race_cand2',
        workspaceId: wsId,
        inviterUserId: 'usr_owner_acc',
        inviteeUserId: 'cand_user_2',
        email: 'cand2@test.com',
        name: 'Candidate 2',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_cand2',
        createdAt: now.toISOString(),
        sentAt: now.toISOString(),
        expiresAt,
        invitedBy: 'usr_owner_acc',
      });

      // Fire concurrent acceptances by both candidates simultaneously
      const acceptPromises = [
        acceptWorkspaceInvitation('inv_race_cand1', {
          uid: 'cand_user_1',
          email: 'cand1@test.com',
          displayName: 'Candidate 1',
        }).then(
          (res) => ({ user: 1, ok: true, res }),
          (err) => ({ user: 1, ok: false, err: err.message })
        ),
        acceptWorkspaceInvitation('inv_race_cand2', {
          uid: 'cand_user_2',
          email: 'cand2@test.com',
          displayName: 'Candidate 2',
        }).then(
          (res) => ({ user: 2, ok: true, res }),
          (err) => ({ user: 2, ok: false, err: err.message })
        ),
      ];

      const acceptResults = await Promise.all(acceptPromises);
      const okCount = acceptResults.filter((r) => r.ok).length;
      const failCount = acceptResults.filter((r) => !r.ok).length;

      console.log(`[Adversarial Concurrency 1.3] Concurrent accepts at limit: ${okCount} ok, ${failCount} failed`);

      const finalMembers = await getWorkspaceTeam(wsId);
      assert.ok(
        finalMembers.length <= MAX_TEAM_MEMBERS,
        `VULNERABILITY DETECTED: Concurrent acceptances resulted in ${finalMembers.length} members (exceeds ${MAX_TEAM_MEMBERS})`
      );
      assert.equal(finalMembers.length, 4, 'Final members must be exactly 4');
      assert.equal(okCount, 1, 'Only 1 candidate could join');
      assert.equal(failCount, 1, '2nd candidate must fail capacity check');
    });
  });

  // --------------------------------------------------------------------------
  // Category 2: RBAC Matrix on All Invitation Endpoints
  // --------------------------------------------------------------------------
  await suite.test('Category 2: RBAC Matrix on All Invitation Endpoints', async (t) => {
    function setupRoleWorkspace(role) {
      inMemoryInvitations.clear();
      const wsId = `ws_rbac_${role}`;
      const owner = createTestWorkspace(wsId, `usr_owner_${role}`, `owner.${role}@cursis.io`);

      if (role === 'owner') {
        return { wsId, user: owner, expectSuccess: true };
      }
      if (role === 'admin') {
        const u = { id: `usr_admin_${role}`, uid: `usr_admin_${role}`, email: `admin.${role}@cursis.io`, displayName: 'Admin User', role: 'admin', workspaceIds: [wsId], activeWorkspaceId: wsId };
        inMemoryStore.users.set(u.uid, u);
        inMemoryMemberships.set(`${wsId}_${u.uid}`, { id: `mem_${wsId}_admin`, workspaceId: wsId, userId: u.uid, role: 'admin', createdAt: new Date().toISOString() });
        return { wsId, user: u, expectSuccess: true };
      }
      if (role === 'manager') {
        const u = { id: `usr_manager_${role}`, uid: `usr_manager_${role}`, email: `manager.${role}@cursis.io`, displayName: 'Manager User', role: 'manager', workspaceIds: [wsId], activeWorkspaceId: wsId };
        inMemoryStore.users.set(u.uid, u);
        inMemoryMemberships.set(`${wsId}_${u.uid}`, { id: `mem_${wsId}_manager`, workspaceId: wsId, userId: u.uid, role: 'manager', createdAt: new Date().toISOString() });
        return { wsId, user: u, expectSuccess: false };
      }
      if (role === 'member') {
        const u = { id: `usr_member_${role}`, uid: `usr_member_${role}`, email: `member.${role}@cursis.io`, displayName: 'Member User', role: 'member', workspaceIds: [wsId], activeWorkspaceId: wsId };
        inMemoryStore.users.set(u.uid, u);
        inMemoryMemberships.set(`${wsId}_${u.uid}`, { id: `mem_${wsId}_member`, workspaceId: wsId, userId: u.uid, role: 'member', createdAt: new Date().toISOString() });
        return { wsId, user: u, expectSuccess: false };
      }
      if (role === 'viewer') {
        const u = { id: `usr_viewer_${role}`, uid: `usr_viewer_${role}`, email: `viewer.${role}@cursis.io`, displayName: 'Viewer User', role: 'viewer', workspaceIds: [wsId], activeWorkspaceId: wsId };
        inMemoryStore.users.set(u.uid, u);
        inMemoryMemberships.set(`${wsId}_${u.uid}`, { id: `mem_${wsId}_viewer`, workspaceId: wsId, userId: u.uid, role: 'viewer', createdAt: new Date().toISOString() });
        return { wsId, user: u, expectSuccess: false };
      }
      if (role === 'outsider') {
        const u = { id: `usr_outsider_${role}`, uid: `usr_outsider_${role}`, email: `outsider.${role}@othercorp.com`, displayName: 'Outsider User', role: 'owner', workspaceIds: ['ws_other'], activeWorkspaceId: 'ws_other' };
        inMemoryStore.users.set(u.uid, u);
        return { wsId, user: u, expectSuccess: false };
      }
    }

    const testRoles = ['owner', 'admin', 'manager', 'member', 'viewer', 'outsider'];

    // 2.1: POST /api/invitations
    for (const roleName of testRoles) {
      await t.test(`2.1: POST /api/invitations as role [${roleName}]`, async () => {
        const { wsId, user, expectSuccess } = setupRoleWorkspace(roleName);
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(user, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: `target_${roleName}@test.com`,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        if (expectSuccess) {
          assert.equal(res.status, 201, `Role ${roleName} should be authorized (201)`);
          const body = await res.json();
          assert.ok(body.invitation, 'Invitation payload should be present');
        } else {
          assert.equal(res.status, 403, `Role ${roleName} must be forbidden (403)`);
        }
      });
    }

    // 2.2: POST /api/workspaces/[id]/invitations
    for (const roleName of testRoles) {
      await t.test(`2.2: POST /api/workspaces/[id]/invitations as role [${roleName}]`, async () => {
        const { wsId, user, expectSuccess } = setupRoleWorkspace(roleName);
        const req = new Request(`http://localhost/api/workspaces/${wsId}/invitations`, {
          method: 'POST',
          headers: makeAuthHeaders(user, wsId),
          body: JSON.stringify({
            email: `target_ws_${roleName}@test.com`,
            role: 'member',
          }),
        });

        const res = await workspaceInvitationsRoute.POST(req, {
          params: Promise.resolve({ id: wsId }),
        });

        if (expectSuccess) {
          assert.equal(res.status, 201, `Role ${roleName} should be authorized (201)`);
        } else {
          assert.equal(res.status, 403, `Role ${roleName} must be forbidden (403)`);
        }
      });
    }

    // 2.3: GET /api/workspaces/[id]/invitations
    for (const roleName of testRoles) {
      await t.test(`2.3: GET /api/workspaces/[id]/invitations as role [${roleName}]`, async () => {
        const { wsId, user, expectSuccess } = setupRoleWorkspace(roleName);
        const req = new Request(`http://localhost/api/workspaces/${wsId}/invitations`, {
          method: 'GET',
          headers: makeAuthHeaders(user, wsId),
        });

        const res = await workspaceInvitationsRoute.GET(req, {
          params: Promise.resolve({ id: wsId }),
        });

        if (expectSuccess) {
          assert.equal(res.status, 200, `Role ${roleName} should view invitations (200)`);
        } else {
          assert.equal(res.status, 403, `Role ${roleName} must be forbidden from viewing (403)`);
        }
      });
    }

    // 2.4: DELETE /api/workspaces/[id]/invitations (Revocation)
    for (const roleName of testRoles) {
      await t.test(`2.4: DELETE /api/workspaces/[id]/invitations as role [${roleName}]`, async () => {
        const { wsId, user, expectSuccess } = setupRoleWorkspace(roleName);
        const dummyInvId = `inv_revoke_${roleName}`;
        inMemoryInvitations.set(dummyInvId, {
          id: dummyInvId,
          workspaceId: wsId,
          inviterUserId: `usr_owner_${roleName}`,
          email: `test_revoke_${roleName}@cursis.io`,
          status: 'pending',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        });

        const req = new Request(`http://localhost/api/workspaces/${wsId}/invitations?invitationId=${dummyInvId}`, {
          method: 'DELETE',
          headers: makeAuthHeaders(user, wsId),
        });

        const res = await workspaceInvitationsRoute.DELETE(req, {
          params: Promise.resolve({ id: wsId }),
        });

        if (expectSuccess) {
          assert.equal(res.status, 200, `Role ${roleName} should be allowed to revoke (200)`);
        } else {
          assert.equal(res.status, 403, `Role ${roleName} must be forbidden from revoking (403)`);
        }
      });
    }

    // 2.5: POST /api/team with action: 'invite' and action: 'add'
    for (const roleName of testRoles) {
      await t.test(`2.5: POST /api/team (action: invite & add) as role [${roleName}]`, async () => {
        const { wsId, user, expectSuccess } = setupRoleWorkspace(roleName);

        // Test action: 'invite'
        const inviteReq = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(user, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'invite',
            email: `team_invite_${roleName}@test.com`,
            role: 'member',
          }),
        });
        const inviteRes = await teamRoute.POST(inviteReq);
        if (expectSuccess) {
          assert.equal(inviteRes.status, 201, `Action 'invite' should succeed for ${roleName}`);
        } else {
          assert.equal(inviteRes.status, 403, `Action 'invite' must be forbidden for ${roleName}`);
        }

        // Test action: 'add'
        inMemoryInvitations.clear();
        const addReq = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(user, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email: `team_add_${roleName}@test.com`,
            name: `Direct ${roleName}`,
            role: 'member',
          }),
        });
        const addRes = await teamRoute.POST(addReq);
        if (expectSuccess) {
          assert.equal(addRes.status, 201, `Action 'add' should succeed for ${roleName}`);
        } else {
          assert.equal(addRes.status, 403, `Action 'add' must be 403 for ${roleName}`);
        }
      });
    }

    // 2.6: Unauthenticated access check across all endpoints
    await t.test('2.6: Unauthenticated requests return 401 across all invitation endpoints', async () => {
      const wsId = 'ws_unauth_test';
      const endpoints = [
        () => invitationsRoute.GET(new Request('http://localhost/api/invitations')),
        () => invitationsRoute.POST(new Request('http://localhost/api/invitations', { method: 'POST', body: '{}' })),
        () => workspaceInvitationsRoute.GET(new Request(`http://localhost/api/workspaces/${wsId}/invitations`), { params: Promise.resolve({ id: wsId }) }),
        () => workspaceInvitationsRoute.POST(new Request(`http://localhost/api/workspaces/${wsId}/invitations`, { method: 'POST', body: '{}' }), { params: Promise.resolve({ id: wsId }) }),
        () => workspaceInvitationsRoute.DELETE(new Request(`http://localhost/api/workspaces/${wsId}/invitations?id=123`, { method: 'DELETE' }), { params: Promise.resolve({ id: wsId }) }),
        () => acceptRoute.POST(new Request('http://localhost/api/invitations/123/accept', { method: 'POST' }), { params: Promise.resolve({ id: '123' }) }),
        () => declineRoute.POST(new Request('http://localhost/api/invitations/123/decline', { method: 'POST' }), { params: Promise.resolve({ id: '123' }) }),
      ];

      for (const call of endpoints) {
        const res = await call();
        assert.equal(res.status, 401, 'Unauthenticated access must strictly return 401 Unauthorized');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Category 3: Token Lifecycle & Security
  // --------------------------------------------------------------------------
  await suite.test('Category 3: Token Lifecycle & Security', async (t) => {
    resetMemory();
    const wsId = 'ws_token_lifecycle';
    const owner = createTestWorkspace(wsId, 'usr_owner_token', 'owner.token@cursis.io');

    // 3.1: Expired Token Rejection
    await t.test('3.1: Expired invitation token is rejected on accept and excluded from GET lists', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const expiredInvId = 'inv_expired_test';

      inMemoryInvitations.set(expiredInvId, {
        id: expiredInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        inviteeUserId: 'usr_invitee_exp',
        email: 'invitee.exp@cursis.io',
        name: 'Invitee Exp',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_expired_123',
        createdAt: pastDate,
        sentAt: pastDate,
        expiresAt: pastDate,
        invitedBy: owner.uid,
      });

      inMemoryStore.users.set('usr_invitee_exp', {
        id: 'usr_invitee_exp',
        uid: 'usr_invitee_exp',
        email: 'invitee.exp@cursis.io',
        displayName: 'Invitee Exp',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
      });

      // Verification A: GET /api/invitations must NOT include expired invitation
      const getReq = new Request(`http://localhost/api/invitations?workspaceId=${wsId}`, {
        headers: makeAuthHeaders(owner, wsId),
      });
      const getRes = await invitationsRoute.GET(getReq);
      const getData = await getRes.json();
      assert.equal(
        getData.invitations.some((inv) => inv.id === expiredInvId),
        false,
        'Expired invitation must not appear in active pending invitations list'
      );

      // Verification B: acceptWorkspaceInvitation throws 400 for expired token
      let threw = false;
      try {
        await acceptWorkspaceInvitation(expiredInvId, {
          uid: 'usr_invitee_exp',
          email: 'invitee.exp@cursis.io',
        });
      } catch (err) {
        threw = true;
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('expired'), 'Error message should mention expired');
      }
      assert.ok(threw, 'acceptWorkspaceInvitation must reject expired token');

      // Verification C: POST /api/invitations/[id]/accept returns 400
      const expUser = inMemoryStore.users.get('usr_invitee_exp');
      const acceptReq = new Request(`http://localhost/api/invitations/${expiredInvId}/accept`, {
        method: 'POST',
        headers: makeAuthHeaders(expUser, wsId),
      });
      const acceptRes = await acceptRoute.POST(acceptReq, {
        params: Promise.resolve({ id: expiredInvId }),
      });
      assert.equal(acceptRes.status, 400, 'Accept route must return 400 for expired token');
    });

    // 3.2: Replay Attack: Double Acceptance Rejection
    await t.test('3.2: Already accepted invitation token cannot be accepted again (Replay rejection)', async () => {
      const validInvId = 'inv_replay_test';
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      inMemoryInvitations.set(validInvId, {
        id: validInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        inviteeUserId: 'usr_replay',
        email: 'replay@cursis.io',
        name: 'Replay User',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_replay_123',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        expiresAt: futureDate,
        invitedBy: owner.uid,
      });

      inMemoryStore.users.set('usr_replay', {
        id: 'usr_replay',
        uid: 'usr_replay',
        email: 'replay@cursis.io',
        displayName: 'Replay User',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
      });

      const replayUser = inMemoryStore.users.get('usr_replay');

      // First accept -> Succeeds
      const firstRes = await acceptWorkspaceInvitation(validInvId, {
        uid: 'usr_replay',
        email: 'replay@cursis.io',
      });
      assert.equal(firstRes.success, true, 'First acceptance should succeed');

      // Second accept -> MUST fail with 400
      let secondThrew = false;
      try {
        await acceptWorkspaceInvitation(validInvId, {
          uid: 'usr_replay',
          email: 'replay@cursis.io',
        });
      } catch (err) {
        secondThrew = true;
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('already accepted') || err.message.includes('not found'));
      }
      assert.ok(secondThrew, 'Second acceptance attempt must throw 400');

      // Third accept via HTTP route -> 400
      const secondReq = new Request(`http://localhost/api/invitations/${validInvId}/accept`, {
        method: 'POST',
        headers: makeAuthHeaders(replayUser, wsId),
      });
      const routeRes = await acceptRoute.POST(secondReq, {
        params: Promise.resolve({ id: validInvId }),
      });
      assert.equal(routeRes.status, 400, 'HTTP route must return 400 on replay acceptance');
    });

    // 3.3: Declined Invitation Acceptance Rejection
    await t.test('3.3: Declined invitation cannot be subsequently accepted', async () => {
      const declineInvId = 'inv_decline_test';
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      inMemoryInvitations.set(declineInvId, {
        id: declineInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        inviteeUserId: 'usr_decliner',
        email: 'decliner@cursis.io',
        name: 'Decliner',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_decline_123',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        expiresAt: futureDate,
        invitedBy: owner.uid,
      });

      inMemoryStore.users.set('usr_decliner', {
        id: 'usr_decliner',
        uid: 'usr_decliner',
        email: 'decliner@cursis.io',
        displayName: 'Decliner',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
      });

      // Decline it
      const declineRes = await declineWorkspaceInvitation(declineInvId, {
        uid: 'usr_decliner',
        email: 'decliner@cursis.io',
      });
      assert.equal(declineRes.success, true);

      // Now attempt acceptance -> Must throw 400
      let acceptThrew = false;
      try {
        await acceptWorkspaceInvitation(declineInvId, {
          uid: 'usr_decliner',
          email: 'decliner@cursis.io',
        });
      } catch (err) {
        acceptThrew = true;
        assert.equal(err.statusCode, 400);
      }
      assert.ok(acceptThrew, 'Declined invitation must not be acceptable');
    });

    // 3.4: Revoked Invitation Acceptance Rejection
    await t.test('3.4: Revoked invitation cannot be subsequently accepted', async () => {
      const revokeInvId = 'inv_revoked_acceptance_test';
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      inMemoryInvitations.set(revokeInvId, {
        id: revokeInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        inviteeUserId: 'usr_revoked_target',
        email: 'revoked_target@cursis.io',
        name: 'Revoked Target',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_revoked_123',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        expiresAt: futureDate,
        invitedBy: owner.uid,
      });

      // Revoke by owner
      await revokeWorkspaceInvitation(wsId, revokeInvId, {
        uid: owner.uid,
        email: owner.email,
      });

      // Target attempts to accept -> Must throw 400
      let acceptThrew = false;
      try {
        await acceptWorkspaceInvitation(revokeInvId, {
          uid: 'usr_revoked_target',
          email: 'revoked_target@cursis.io',
        });
      } catch (err) {
        acceptThrew = true;
        assert.equal(err.statusCode, 400);
      }
      assert.ok(acceptThrew, 'Revoked invitation must not be acceptable');
    });

    // 3.5: Cross-User Token Theft (Actor B trying to accept Actor A's invitation)
    await t.test('3.5: Token theft rejection: Third-party cannot accept another user invitation (403)', async () => {
      const targetInvId = 'inv_theft_target';
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      inMemoryInvitations.set(targetInvId, {
        id: targetInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        inviteeUserId: 'usr_alice',
        email: 'alice@cursis.io',
        name: 'Alice Legit',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_alice_private',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        expiresAt: futureDate,
        invitedBy: owner.uid,
      });

      inMemoryStore.users.set('usr_alice', {
        id: 'usr_alice',
        uid: 'usr_alice',
        email: 'alice@cursis.io',
        displayName: 'Alice Legit',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
      });

      inMemoryStore.users.set('usr_eve_attacker', {
        id: 'usr_eve_attacker',
        uid: 'usr_eve_attacker',
        email: 'eve@adversary.com',
        displayName: 'Eve Attacker',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
      });

      const eve = inMemoryStore.users.get('usr_eve_attacker');

      // Eve attempts to accept Alice's invitation via DB function
      let eveThrew = false;
      try {
        await acceptWorkspaceInvitation(targetInvId, {
          uid: 'usr_eve_attacker',
          email: 'eve@adversary.com',
        });
      } catch (err) {
        eveThrew = true;
        assert.equal(err.statusCode, 403, 'Cross-user acceptance must throw 403 Forbidden');
      }
      assert.ok(eveThrew, 'Cross-user acceptance must be rejected');

      // Eve attempts to accept Alice's invitation via HTTP route
      const httpEveReq = new Request(`http://localhost/api/invitations/${targetInvId}/accept`, {
        method: 'POST',
        headers: makeAuthHeaders(eve, wsId),
      });
      const httpEveRes = await acceptRoute.POST(httpEveReq, {
        params: Promise.resolve({ id: targetInvId }),
      });
      assert.equal(httpEveRes.status, 403, 'HTTP accept route must reject Eve with 403 Forbidden');

      // Eve attempts to decline Alice's invitation -> Must also be rejected with 403
      let eveDeclineThrew = false;
      try {
        await declineWorkspaceInvitation(targetInvId, {
          uid: 'usr_eve_attacker',
          email: 'eve@adversary.com',
        });
      } catch (err) {
        eveDeclineThrew = true;
        assert.equal(err.statusCode, 403, 'Cross-user decline must throw 403 Forbidden');
      }
      assert.ok(eveDeclineThrew, 'Cross-user decline must be rejected');

      // Ensure Alice's invitation remains safely pending
      const invAfter = inMemoryInvitations.get(targetInvId);
      assert.equal(invAfter.status, 'pending', 'Alice invitation must remain pending unharmed');
    });

    // 3.6: Tampered / Non-Existent Token ID
    await t.test('3.6: Tampered, non-existent, or empty invitation IDs return 400/404 cleanly', async () => {
      const tamperedIds = [
        'inv_non_existent_id_99999',
        '',
        '   ',
        "' OR '1'='1",
        '{"$ne": null}',
        '../../../etc/passwd',
      ];

      for (const badId of tamperedIds) {
        const req = new Request(`http://localhost/api/invitations/${encodeURIComponent(badId)}/accept`, {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
        });
        const res = await acceptRoute.POST(req, {
          params: Promise.resolve({ id: badId }),
        });
        assert.ok(
          res.status === 400 || res.status === 404,
          `Tampered ID "${badId}" must return 400 or 404 (got ${res.status})`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // Category 4: Capacity Limit Enforcement (Active + Pending Combinations)
  // --------------------------------------------------------------------------
  await suite.test('Category 4: Capacity Limit Enforcement (Active + Pending Combinations)', async (t) => {

    const combinations = [
      { active: 1, pending: 3 },
      { active: 2, pending: 2 },
      { active: 3, pending: 1 },
      { active: 4, pending: 0 },
    ];

    for (const combo of combinations) {
      await t.test(`4.1: Capacity limit enforced for ${combo.active} active + ${combo.pending} pending = 4`, async () => {
        resetMemory();
        const wsId = `ws_combo_${combo.active}_${combo.pending}`;
        const owner = createTestWorkspace(wsId, `usr_owner_${combo.active}`, `owner_${combo.active}@combo.com`);

        // Add additional active members up to combo.active
        for (let a = 2; a <= combo.active; a++) {
          await addTeamMember(wsId, {
            email: `combo_m${a}@combo.com`,
            displayName: `Combo Member ${a}`,
            role: 'member',
          });
        }

        // Add pending invitations up to combo.pending
        for (let p = 1; p <= combo.pending; p++) {
          const invId = `inv_combo_${wsId}_${p}`;
          inMemoryInvitations.set(invId, {
            id: invId,
            workspaceId: wsId,
            inviterUserId: owner.uid,
            email: `pending_${p}@combo.com`,
            status: 'pending',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          });
        }

        // Verify total team + pending = 4
        const team = await getWorkspaceTeam(wsId);
        const pending = await getWorkspaceInvitations(wsId);
        assert.equal(team.length, combo.active, 'Active team count matches setup');
        assert.equal(pending.length, combo.pending, 'Pending invite count matches setup');
        assert.equal(team.length + pending.length, 4, 'Total capacity used must equal exactly 4');

        // Test 1: Sending another invitation must be rejected (400)
        const invReq = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: 'overflow_invitee@combo.com',
            role: 'member',
          }),
        });
        const invRes = await invitationsRoute.POST(invReq);
        assert.equal(invRes.status, 400, 'Sending invitation at capacity 4 must return 400');
        const invBody = await invRes.json();
        assert.ok(
          invBody.error.includes('capacity') || invBody.error.includes('4 members') || invBody.error.includes('maximum team limit'),
          'Error message must state capacity limit reached'
        );

        // Test 2: Adding a member directly must be rejected (400)
        const addReq = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email: 'overflow_direct@combo.com',
            name: 'Direct Overflow',
            role: 'member',
          }),
        });
        const addRes = await teamRoute.POST(addReq);
        assert.equal(addRes.status, 400, 'Direct add member at capacity 4 must return 400');
      });
    }

    // 4.2: Dynamic Capacity Release and Re-Invitation
    await t.test('4.2: Dynamic capacity release via revocation allows new invitation immediately', async () => {
      resetMemory();
      const wsId = 'ws_dynamic_cap';
      const owner = createTestWorkspace(wsId, 'dyn_owner', 'dyn_owner@test.com');

      // Add 2 members (total active = 3: owner + m1 + m2)
      await addTeamMember(wsId, { email: 'dyn_m1@test.com', displayName: 'M1', role: 'member' });
      await addTeamMember(wsId, { email: 'dyn_m2@test.com', displayName: 'M2', role: 'member' });

      // Add 1 pending invitation (total capacity = 3 + 1 = 4)
      const invToRevoke = await createTeamInvitation({
        workspaceId: wsId,
        inviterUser: { uid: owner.uid, email: owner.email, role: 'owner' },
        inviteeEmail: 'revoke_me@test.com',
      });
      assert.ok(invToRevoke.id);

      // Verify at capacity 4: another invite fails
      let capBlocked = false;
      try {
        await createTeamInvitation({
          workspaceId: wsId,
          inviterUser: { uid: owner.uid, email: owner.email, role: 'owner' },
          inviteeEmail: 'blocked@test.com',
        });
      } catch (err) {
        capBlocked = true;
      }
      assert.ok(capBlocked, 'At capacity 4, another invite must fail');

      // Now Revoke the pending invitation
      await revokeWorkspaceInvitation(wsId, invToRevoke.id, {
        uid: owner.uid,
        email: owner.email,
      });

      // Capacity should now be 3. Now new invitation should SUCCEED!
      const newInv = await createTeamInvitation({
        workspaceId: wsId,
        inviterUser: { uid: owner.uid, email: owner.email, role: 'owner' },
        inviteeEmail: 'fresh_invitee@test.com',
      });
      assert.ok(newInv.id, 'New invitation must succeed after revoking older one');
    });

    // 4.3: Self-Invitation Prevention
    await t.test('4.3: Workspace owner/admin cannot invite themselves', async () => {
      resetMemory();
      const wsId = 'ws_self_inv';
      const owner = createTestWorkspace(wsId, 'usr_owner_self', 'owner.self@cursis.io');

      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email: 'owner.self@cursis.io',
          role: 'member',
        }),
      });

      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 400, 'Self-invitation must return 400');
      const body = await res.json();
      assert.ok(body.error.includes('cannot invite yourself'), 'Error message must note self-invitation prohibited');
    });

    // 4.4: Existing Member Re-Invitation Prevention
    await t.test('4.4: Inviting an already active member returns 400', async () => {
      resetMemory();
      const wsId = 'ws_existing_member';
      const owner = createTestWorkspace(wsId, 'usr_owner_exist', 'owner.exist@cursis.io');

      await addTeamMember(wsId, {
        email: 'active.member@cursis.io',
        displayName: 'Active Member',
        role: 'member',
      });

      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email: 'active.member@cursis.io',
          role: 'member',
        }),
      });

      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 400, 'Inviting active member must return 400');
      const body = await res.json();
      assert.ok(body.error.includes('already an active member') || body.error.includes('already a member'));
    });

    // 4.5: Duplicate Pending Invitation Prevention
    await t.test('4.5: Sending a duplicate invitation to the same email while pending returns 400', async () => {
      resetMemory();
      const wsId = 'ws_duplicate_pending';
      const owner = createTestWorkspace(wsId, 'usr_owner_dup', 'owner.dup@cursis.io');

      // First invite -> 201
      const req1 = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email: 'duplicate_test@external.com',
          role: 'member',
        }),
      });
      const res1 = await invitationsRoute.POST(req1);
      assert.equal(res1.status, 201, 'First invitation must succeed');

      // Second invite to exact same email while pending -> 400
      const req2 = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email: 'duplicate_test@external.com',
          role: 'member',
        }),
      });
      const res2 = await invitationsRoute.POST(req2);
      assert.equal(res2.status, 400, 'Duplicate pending invitation must return 400');
      const body2 = await res2.json();
      assert.ok(body2.error.includes('already been sent'), 'Error message must note pending invitation exists');
    });
  });

  // --------------------------------------------------------------------------
  // Category 5: Email Validation, Sanitization & Input Fuzzing
  // --------------------------------------------------------------------------
  await suite.test('Category 5: Email Validation, Sanitization & Input Fuzzing', async (t) => {
    resetMemory();
    const wsId = 'ws_fuzz_test';
    const owner = createTestWorkspace(wsId, 'usr_owner_fuzz', 'owner.fuzz@cursis.io');

    // 5.1: Unregistered Valid Email Support
    await t.test('5.1: Unregistered valid email creates pending invitation with 7-day TTL token without 404', async () => {
      inMemoryInvitations.clear();
      const email = 'brand_new_unregistered_person@external-domain.co';
      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email,
          role: 'member',
        }),
      });

      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.invitation);
      assert.equal(data.invitation.email, email);
      assert.equal(data.invitation.status, 'pending');
      assert.ok(data.invitation.token.startsWith('tok_'));

      // Validate 7-day expiration
      const expiresAtMs = new Date(data.invitation.expiresAt).getTime();
      const createdAtMs = new Date(data.invitation.createdAt).getTime();
      const diffDays = Math.round((expiresAtMs - createdAtMs) / (1000 * 60 * 60 * 24));
      assert.equal(diffDays, 7, 'Invitation TTL must be exactly 7 days');
    });

    // 5.2: Whitespace Padding Normalization
    await t.test('5.2: Leading and trailing whitespace is stripped cleanly', async () => {
      inMemoryInvitations.clear();
      const paddedEmail = '   padded.user@clean-domain.org   ';
      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email: paddedEmail,
          role: 'member',
        }),
      });

      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.invitation.email, 'padded.user@clean-domain.org');
    });

    // 5.3: Case Normalization
    await t.test('5.3: Mixed and upper-case email addresses are normalized to lowercase', async () => {
      inMemoryInvitations.clear();
      const mixedEmail = 'John.Doe_TEST@CoMpAnY.Co.Uk';
      const req = new Request('http://localhost/api/invitations', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          email: mixedEmail,
          role: 'member',
        }),
      });

      const res = await invitationsRoute.POST(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.invitation.email, 'john.doe_test@company.co.uk');
    });

    // 5.4: Malformed Emails Rejected with 400
    const malformedEmails = [
      { input: '', desc: 'empty string' },
      { input: '   ', desc: 'whitespace only' },
      { input: 'plainaddress', desc: 'missing @ sign' },
      { input: null, desc: 'null value' },
      { input: undefined, desc: 'undefined value' },
      { input: 12345, desc: 'numeric value' },
      { input: { email: 'nested@test.com' }, desc: 'object instead of string' },
      { input: '<script>alert("xss")</script>', desc: 'script tags' },
    ];

    for (const testInput of malformedEmails) {
      await t.test(`5.4: Malformed email [${testInput.desc}] rejected with 400`, async () => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: testInput.input,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        assert.equal(
          res.status,
          400,
          `Malformed email "${testInput.desc}" must return 400 Bad Request (got ${res.status})`
        );
      });
    }

    // 5.4b: Edge-Case Incomplete Emails (Missing local-part or domain-part)
    const incompleteEmails = [
      { input: '@missinguser.com', desc: 'missing local part' },
      { input: 'user@', desc: 'missing domain part' },
    ];

    for (const testInput of incompleteEmails) {
      await t.test(`5.4b: Edge-case email [${testInput.desc}] inspection`, async () => {
        inMemoryInvitations.clear();
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: testInput.input,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        // Note: Currently email validation uses email.includes('@') without local/domain validation.
        // We log whether it was permitted or rejected to document the edge case behavior.
        console.log(`[Edge-Case Email 5.4b] Input "${testInput.input}" resulted in HTTP status ${res.status}`);
      });
    }

    // 5.5: RFC 5322 Plus Addressing and Complex Subdomains
    const validComplexEmails = [
      'user+testing123@cursis.in',
      'operations.lead+tag@engineering.cursis.cloud',
      'a.b.c-d_e@sub-dept.company.co.jp',
    ];

    for (const complexEmail of validComplexEmails) {
      await t.test(`5.5: Complex RFC email [${complexEmail}] is accepted`, async () => {
        inMemoryInvitations.clear();

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: complexEmail,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        assert.equal(res.status, 201, `Complex email ${complexEmail} should be accepted with 201`);
        const data = await res.json();
        assert.equal(data.invitation.email, complexEmail);
      });
    }

    // 5.6: SQL / NoSQL Injection & Long String Fuzzing in Email and Fields
    await t.test('5.6: Injection vectors in email and payload fields handled safely without 500 crash', async () => {
      const injectionPayloads = [
        "admin'--@cursis.io",
        'admin" OR 1=1;--@cursis.io',
        '{"$gt":""}@cursis.io',
        'a'.repeat(300) + '@cursis.io',
      ];

      for (const payload of injectionPayloads) {
        inMemoryInvitations.clear();

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: payload,
            role: 'member',
            note: 'A'.repeat(5000), // large note
            department: '<svg onload=alert(1)>',
          }),
        });

        const res = await invitationsRoute.POST(req);
        assert.notEqual(
          res.status,
          500,
          `Injection payload should never cause a 500 server crash (got ${res.status})`
        );
      }
    });
  });
});
