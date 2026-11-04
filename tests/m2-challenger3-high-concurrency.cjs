// tests/m2-challenger3-high-concurrency.cjs
// Empirical High-Concurrency & Stress Verification Harness for Milestone 2
// Author: Milestone 2 Challenger 3 (teamwork_challenger)
// Tests: 20-50 Concurrent Bursts, Cross-Workspace Non-Blocking Parallelism,
// Lock Error Recovery, Deep Re-entrancy, Queue Pruning & Interleaved Chaos

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_m2_challenger3_stress_secret_key_32_chars!';
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

// Mock MongoDB (in-memory mode for standalone tests)
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
  removeTeamMember,
  MAX_TEAM_MEMBERS,
} = require('@/lib/db/team');
const { withWorkspaceLock, workspaceLockManager } = require('@/lib/db/workspace-lock');
const { createSessionToken } = require('@/lib/auth/token');

// Load API Route Handlers
const invitationsRoute = require('@/app/api/invitations/route');
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
    tier: 'pro',
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
    skills: ['Architecture'],
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Milestone 2 Challenger 3: Empirical Concurrency & Stress Verification', () => {

  beforeEach(() => {
    resetMemory();
  });

  // ==========================================================================
  // SECTION 1: High-Concurrency Burst Invites (20-50 simultaneous requests)
  // ==========================================================================
  describe('1. High-Concurrency Burst Invites (20-50 Requests)', () => {

    test('1.1: Burst of 50 simultaneous POST /api/invitations on 1-member workspace (3 open seats)', async () => {
      const wsId = 'ws_burst_inv_50';
      const owner = createTestWorkspace(wsId, 'usr_owner_b50', 'owner.b50@cursis.io');

      const BURST_SIZE = 50;
      const requests = Array.from({ length: BURST_SIZE }, (_, i) => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: `burst50_candidate_${i}@testdomain.com`,
            role: 'member',
          }),
        });
        return invitationsRoute.POST(req).then(async (res) => ({
          status: res.status,
          body: await res.json(),
        }));
      });

      const results = await Promise.all(requests);
      const successes = results.filter((r) => r.status === 201);
      const failures = results.filter((r) => r.status === 400);

      const team = await getWorkspaceTeam(wsId);
      const pendingInvites = await getWorkspaceInvitations(wsId);
      const totalCapacityUsed = team.length + pendingInvites.length;

      // Invariant: Total capacity used must equal exactly 4 (1 owner + 3 invitations)
      assert.equal(totalCapacityUsed, 4, `Total capacity used must be exactly 4, got ${totalCapacityUsed}`);
      assert.equal(successes.length, 3, `Exactly 3 of 50 invitations should succeed, got ${successes.length}`);
      assert.equal(failures.length, 47, `Exactly 47 of 50 invitations should be rejected, got ${failures.length}`);
    });

    test('1.2: Burst of 50 simultaneous POST /api/invitations on 3-member workspace (1 open seat)', async () => {
      const wsId = 'ws_burst_inv_3m_50';
      const owner = createTestWorkspace(wsId, 'usr_owner_b3m', 'owner.b3m@cursis.io');

      await addTeamMember(wsId, { email: 'm1.b3m@cursis.io', displayName: 'M1', role: 'member' });
      await addTeamMember(wsId, { email: 'm2.b3m@cursis.io', displayName: 'M2', role: 'member' });

      const teamBefore = await getWorkspaceTeam(wsId);
      assert.equal(teamBefore.length, 3);

      const BURST_SIZE = 50;
      const requests = Array.from({ length: BURST_SIZE }, (_, i) => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: `burst_one_seat_${i}@testdomain.com`,
            role: 'member',
          }),
        });
        return invitationsRoute.POST(req).then(async (res) => ({
          status: res.status,
          body: await res.json(),
        }));
      });

      const results = await Promise.all(requests);
      const successes = results.filter((r) => r.status === 201);
      const failures = results.filter((r) => r.status === 400);

      const team = await getWorkspaceTeam(wsId);
      const pendingInvites = await getWorkspaceInvitations(wsId);
      const totalCapacityUsed = team.length + pendingInvites.length;

      assert.equal(totalCapacityUsed, 4, `Total capacity must not exceed 4, got ${totalCapacityUsed}`);
      assert.equal(successes.length, 1, `Exactly 1 invitation must succeed when 3 seats are full`);
      assert.equal(failures.length, 49, `Exactly 49 invitations must be rejected`);
    });

    test('1.3: Burst of 30 simultaneous POST /api/invitations on full workspace (4 members, 0 open seats)', async () => {
      const wsId = 'ws_burst_inv_full_30';
      const owner = createTestWorkspace(wsId, 'usr_owner_bfull', 'owner.bfull@cursis.io');

      await addTeamMember(wsId, { email: 'm1.full@cursis.io', displayName: 'M1', role: 'member' });
      await addTeamMember(wsId, { email: 'm2.full@cursis.io', displayName: 'M2', role: 'member' });
      await addTeamMember(wsId, { email: 'm3.full@cursis.io', displayName: 'M3', role: 'member' });

      const teamBefore = await getWorkspaceTeam(wsId);
      assert.equal(teamBefore.length, 4);

      const BURST_SIZE = 30;
      const requests = Array.from({ length: BURST_SIZE }, (_, i) => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: `burst_full_${i}@testdomain.com`,
            role: 'member',
          }),
        });
        return invitationsRoute.POST(req).then(async (res) => ({
          status: res.status,
          body: await res.json(),
        }));
      });

      const results = await Promise.all(requests);
      const successes = results.filter((r) => r.status === 201);
      const failures = results.filter((r) => r.status === 400);

      const team = await getWorkspaceTeam(wsId);
      const pendingInvites = await getWorkspaceInvitations(wsId);
      const totalCapacityUsed = team.length + pendingInvites.length;

      assert.equal(totalCapacityUsed, 4);
      assert.equal(successes.length, 0, 'Zero invitations may succeed on a full workspace');
      assert.equal(failures.length, 30, 'All 30 invitations must fail with 400');
    });
  });

  // ==========================================================================
  // SECTION 2: High-Concurrency Burst Direct Member Additions (20-50 Calls)
  // ==========================================================================
  describe('2. High-Concurrency Burst addTeamMember (20-50 Calls)', () => {

    test('2.1: Burst of 50 simultaneous addTeamMember calls on 1-member workspace (3 open seats)', async () => {
      const wsId = 'ws_burst_add_50';
      createTestWorkspace(wsId, 'usr_owner_add50', 'owner.add50@cursis.io');

      const BURST_SIZE = 50;
      const promises = Array.from({ length: BURST_SIZE }, (_, i) =>
        addTeamMember(wsId, {
          email: `burst_add_member_${i}@cursis.in`,
          displayName: `Burst Member ${i}`,
          role: 'member',
        }).then(
          (res) => ({ success: true, res }),
          (err) => ({ success: false, err: err.message, status: err.statusCode })
        )
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      const finalTeam = await getWorkspaceTeam(wsId);
      assert.equal(finalTeam.length, 4, `Final team length must be 4, got ${finalTeam.length}`);
      assert.equal(successes.length, 3, `Exactly 3 additions should succeed (1+3=4), got ${successes.length}`);
      assert.equal(failures.length, 47, `Exactly 47 additions should be rejected, got ${failures.length}`);
    });

    test('2.2: Burst of 30 simultaneous addTeamMember calls on 3-member workspace (1 open seat)', async () => {
      const wsId = 'ws_burst_add_3m_30';
      createTestWorkspace(wsId, 'usr_owner_add3m', 'owner.add3m@cursis.io');

      await addTeamMember(wsId, { email: 'pre1@cursis.in', displayName: 'P1', role: 'member' });
      await addTeamMember(wsId, { email: 'pre2@cursis.in', displayName: 'P2', role: 'member' });

      const BURST_SIZE = 30;
      const promises = Array.from({ length: BURST_SIZE }, (_, i) =>
        addTeamMember(wsId, {
          email: `burst_add_one_seat_${i}@cursis.in`,
          displayName: `Burst One Seat ${i}`,
          role: 'member',
        }).then(
          (res) => ({ success: true, res }),
          (err) => ({ success: false, err: err.message })
        )
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      const finalTeam = await getWorkspaceTeam(wsId);
      assert.equal(finalTeam.length, 4);
      assert.equal(successes.length, 1);
      assert.equal(failures.length, 29);
    });

    test('2.3: Burst of 20 simultaneous addTeamMember calls on full workspace (4 members)', async () => {
      const wsId = 'ws_burst_add_full_20';
      createTestWorkspace(wsId, 'usr_owner_addfull', 'owner.addfull@cursis.io');

      await addTeamMember(wsId, { email: 'f1@cursis.in', displayName: 'F1', role: 'member' });
      await addTeamMember(wsId, { email: 'f2@cursis.in', displayName: 'F2', role: 'member' });
      await addTeamMember(wsId, { email: 'f3@cursis.in', displayName: 'F3', role: 'member' });

      const BURST_SIZE = 20;
      const promises = Array.from({ length: BURST_SIZE }, (_, i) =>
        addTeamMember(wsId, {
          email: `burst_add_overflow_${i}@cursis.in`,
          displayName: `Burst Overflow ${i}`,
          role: 'member',
        }).then(
          (res) => ({ success: true, res }),
          (err) => ({ success: false, err: err.message })
        )
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      const finalTeam = await getWorkspaceTeam(wsId);
      assert.equal(finalTeam.length, 4);
      assert.equal(successes.length, 0);
      assert.equal(failures.length, 20);
    });
  });

  // ==========================================================================
  // SECTION 3: High-Concurrency Burst Acceptances (10-20 Concurrent Users)
  // ==========================================================================
  describe('3. High-Concurrency Burst Acceptances', () => {

    test('3.1: 15 concurrent acceptWorkspaceInvitation calls when exactly 2 seats are free', async () => {
      const wsId = 'ws_burst_acc_15';
      const owner = createTestWorkspace(wsId, 'usr_owner_bacc', 'owner.bacc@cursis.io');

      // Start with 2 active members (owner + 1 member => 2 seats open)
      await addTeamMember(wsId, { email: 'initial_member@cursis.io', displayName: 'Init M', role: 'member' });
      const currentTeam = await getWorkspaceTeam(wsId);
      assert.equal(currentTeam.length, 2);

      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000).toISOString();

      // Seed 15 pending invitations and 15 candidate users
      const NUM_CANDIDATES = 15;
      for (let i = 0; i < NUM_CANDIDATES; i++) {
        const uid = `cand_user_burst_${i}`;
        const email = `candidate_burst_${i}@testdomain.com`;
        const invId = `inv_burst_${i}`;

        inMemoryStore.users.set(uid, {
          id: uid,
          uid,
          email,
          displayName: `Candidate Burst ${i}`,
          role: 'member',
          workspaceIds: [],
          activeWorkspaceId: '',
          presence: 'online',
          lastActiveAt: now.toISOString(),
          createdAt: now.toISOString(),
        });

        inMemoryInvitations.set(invId, {
          id: invId,
          workspaceId: wsId,
          inviterUserId: owner.uid,
          inviteeUserId: uid,
          email,
          name: `Candidate Burst ${i}`,
          roleTitle: 'Team Member',
          workspaceRole: 'member',
          department: 'Engineering',
          status: 'pending',
          token: `tok_burst_${i}`,
          createdAt: now.toISOString(),
          sentAt: now.toISOString(),
          expiresAt,
          invitedBy: owner.uid,
        });
      }

      // Fire 15 concurrent acceptance calls
      const acceptPromises = Array.from({ length: NUM_CANDIDATES }, (_, i) => {
        const uid = `cand_user_burst_${i}`;
        const email = `candidate_burst_${i}@testdomain.com`;
        const invId = `inv_burst_${i}`;
        return acceptWorkspaceInvitation(invId, { uid, email, displayName: `Candidate ${i}` }).then(
          (res) => ({ i, ok: true, res }),
          (err) => ({ i, ok: false, err: err.message, status: err.statusCode })
        );
      });

      const acceptResults = await Promise.all(acceptPromises);
      const accepted = acceptResults.filter((r) => r.ok);
      const rejected = acceptResults.filter((r) => !r.ok);

      const finalTeam = await getWorkspaceTeam(wsId);
      assert.equal(finalTeam.length, 4, `Final team must equal 4, got ${finalTeam.length}`);
      assert.equal(accepted.length, 2, `Exactly 2 candidates can be accepted (2 + 2 = 4), got ${accepted.length}`);
      assert.equal(rejected.length, 13, `13 candidates must be rejected, got ${rejected.length}`);

      for (const rej of rejected) {
        assert.ok(
          rej.err.includes('maximum capacity') || rej.err.includes('limit'),
          `Rejection error should cite capacity limit: ${rej.err}`
        );
      }
    });
  });

  // ==========================================================================
  // SECTION 4: Multi-Workspace Non-Blocking Parallelism (ws_alpha vs ws_beta)
  // ==========================================================================
  describe('4. Multi-Workspace Non-Blocking Parallelism', () => {

    test('4.1: Slow operation on ws_alpha does NOT block fast operation on ws_beta', async () => {
      const wsAlpha = 'ws_alpha_parallel';
      const wsBeta = 'ws_beta_parallel';

      const startTime = Date.now();
      let alphaStartTime = 0;
      let alphaEndTime = 0;
      let betaStartTime = 0;
      let betaEndTime = 0;

      // Start slow task on ws_alpha (sleeps 500ms)
      const alphaTask = withWorkspaceLock(wsAlpha, async () => {
        alphaStartTime = Date.now();
        await sleep(500);
        alphaEndTime = Date.now();
        return 'alpha_done';
      });

      // Concurrently start fast task on ws_beta (sleeps 50ms)
      const betaTask = withWorkspaceLock(wsBeta, async () => {
        betaStartTime = Date.now();
        await sleep(50);
        betaEndTime = Date.now();
        return 'beta_done';
      });

      // Concurrently start second task on ws_alpha (should be queued behind first alpha task!)
      let alpha2StartTime = 0;
      let alpha2EndTime = 0;
      const alphaTask2 = withWorkspaceLock(wsAlpha, async () => {
        alpha2StartTime = Date.now();
        await sleep(20);
        alpha2EndTime = Date.now();
        return 'alpha2_done';
      });

      const [resAlpha, resBeta, resAlpha2] = await Promise.all([alphaTask, betaTask, alphaTask2]);

      console.log('Test 4.1 Timings:', {
        start: startTime,
        alphaStart: alphaStartTime - startTime,
        alphaEnd: alphaEndTime - startTime,
        betaStart: betaStartTime - startTime,
        betaEnd: betaEndTime - startTime,
        alpha2Start: alpha2StartTime - startTime,
        alpha2End: alpha2EndTime - startTime,
      });

      assert.equal(resAlpha, 'alpha_done');
      assert.equal(resBeta, 'beta_done');
      assert.equal(resAlpha2, 'alpha2_done');

      // 1. ws_beta started concurrently at the beginning (proving non-blocking multi-tenant parallel execution)
      assert.ok(
        betaStartTime < alphaEndTime - 100,
        `ws_beta must start concurrently while ws_alpha is still running (betaStart: +${betaStartTime - startTime}ms, alphaEnd: +${alphaEndTime - startTime}ms)`
      );
      assert.ok(
        betaEndTime < alphaEndTime,
        `ws_beta (ended at +${betaEndTime - startTime}ms) MUST finish before ws_alpha (ended at +${alphaEndTime - startTime}ms)`
      );

      // 2. ws_alpha2 MUST NOT start until ws_alpha has finished (proving strict FIFO serialization per-workspace)
      assert.ok(
        alpha2StartTime >= alphaEndTime - 10,
        `ws_alpha2 (started at +${alpha2StartTime - startTime}ms) must wait for ws_alpha (ended at +${alphaEndTime - startTime}ms)`
      );
    });

    test('4.2: Dual-tenant storm: 25 concurrent requests on ws_alpha and 25 on ws_beta simultaneously', async () => {
      const wsAlpha = 'ws_storm_alpha';
      const wsBeta = 'ws_storm_beta';

      const ownerAlpha = createTestWorkspace(wsAlpha, 'usr_owner_alpha', 'owner@alpha.io');
      const ownerBeta = createTestWorkspace(wsBeta, 'usr_owner_beta', 'owner@beta.io');

      // Both workspaces start with 1 owner (3 seats open each)
      const CONCURRENCY_PER_WS = 25;

      const alphaRequests = Array.from({ length: CONCURRENCY_PER_WS }, (_, i) => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(ownerAlpha, wsAlpha),
          body: JSON.stringify({
            workspaceId: wsAlpha,
            email: `alpha_cand_${i}@alpha-test.com`,
            role: 'member',
          }),
        });
        return invitationsRoute.POST(req).then(async (res) => ({
          ws: 'alpha',
          status: res.status,
          body: await res.json(),
        }));
      });

      const betaRequests = Array.from({ length: CONCURRENCY_PER_WS }, (_, i) => {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(ownerBeta, wsBeta),
          body: JSON.stringify({
            workspaceId: wsBeta,
            email: `beta_cand_${i}@beta-test.com`,
            role: 'member',
          }),
        });
        return invitationsRoute.POST(req).then(async (res) => ({
          ws: 'beta',
          status: res.status,
          body: await res.json(),
        }));
      });

      // Fire all 50 requests simultaneously across both workspaces
      const allResults = await Promise.all([...alphaRequests, ...betaRequests]);

      const alphaResults = allResults.filter((r) => r.ws === 'alpha');
      const betaResults = allResults.filter((r) => r.ws === 'beta');

      const alphaSuccess = alphaResults.filter((r) => r.status === 201);
      const betaSuccess = betaResults.filter((r) => r.status === 201);

      const alphaInvites = await getWorkspaceInvitations(wsAlpha);
      const betaInvites = await getWorkspaceInvitations(wsBeta);

      const alphaTeam = await getWorkspaceTeam(wsAlpha);
      const betaTeam = await getWorkspaceTeam(wsBeta);

      // Verify each workspace strictly holds its own 4-seat boundary independently
      assert.equal(alphaTeam.length + alphaInvites.length, 4, 'Alpha capacity must be exactly 4');
      assert.equal(betaTeam.length + betaInvites.length, 4, 'Beta capacity must be exactly 4');
      assert.equal(alphaSuccess.length, 3, 'Alpha must have exactly 3 successful invitations');
      assert.equal(betaSuccess.length, 3, 'Beta must have exactly 3 successful invitations');
    });
  });

  // ==========================================================================
  // SECTION 5: Lock Fault Tolerance, Error Recovery & Re-entrancy
  // ==========================================================================
  describe('5. Lock Fault Tolerance, Recovery & Re-entrancy', () => {

    test('5.1: Unhandled rejection inside withWorkspaceLock releases lock and does not deadlock queue', async () => {
      const wsId = 'ws_throw_recovery';

      let task1Failed = false;
      try {
        await withWorkspaceLock(wsId, async () => {
          await sleep(10);
          throw new Error('SIMULATED_FAILURE_IN_LOCK');
        });
      } catch (err) {
        task1Failed = true;
        assert.equal(err.message, 'SIMULATED_FAILURE_IN_LOCK');
      }
      assert.ok(task1Failed, 'First task must throw');

      // Second task targeting the exact same workspace must run cleanly without hanging
      let task2Ran = false;
      const result2 = await withWorkspaceLock(wsId, async () => {
        task2Ran = true;
        return 'recovered_successfully';
      });

      assert.ok(task2Ran, 'Second task must execute after prior failure');
      assert.equal(result2, 'recovered_successfully');
    });

    test('5.2: Multi-level nested re-entrancy executes without deadlocking', async () => {
      const wsId = 'ws_reentrant_test';

      const executionOrder = [];

      const result = await withWorkspaceLock(wsId, async () => {
        executionOrder.push('level_1_enter');
        
        const inner1 = await withWorkspaceLock(wsId, async () => {
          executionOrder.push('level_2_enter');

          const inner2 = await withWorkspaceLock(wsId, async () => {
            executionOrder.push('level_3_enter');
            return 'level_3_val';
          });

          executionOrder.push('level_2_exit');
          return `inner1_${inner2}`;
        });

        executionOrder.push('level_1_exit');
        return `root_${inner1}`;
      });

      assert.equal(result, 'root_inner1_level_3_val');
      assert.deepEqual(executionOrder, [
        'level_1_enter',
        'level_2_enter',
        'level_3_enter',
        'level_2_exit',
        'level_1_exit',
      ]);
    });

    test('5.3: Lock queue pruning removes settled workspaces to prevent memory leakage', async () => {
      const wsId = 'ws_pruning_test';

      const tasks = Array.from({ length: 20 }, (_, i) =>
        withWorkspaceLock(wsId, async () => {
          await sleep(5);
          return i;
        })
      );

      await Promise.all(tasks);

      // Give event loop tick for final queue cleanup
      await sleep(10);

      // Access internal queues via reflection
      const queues = workspaceLockManager['queues'];
      assert.ok(queues instanceof Map, 'queues should be a Map');
      assert.equal(
        queues.has(wsId),
        false,
        `Queue for ${wsId} must be deleted after settling to prevent memory accumulation`
      );
    });
  });

  // ==========================================================================
  // SECTION 6: Interleaved Chaos Storm (42 Concurrent Mixed Operations)
  // ==========================================================================
  describe('6. Interleaved Chaos Storm (42 Concurrent Mixed Operations)', () => {

    test('6.1: Concurrent storm of invites, direct adds, acceptances, and revokes maintains MAX_TEAM_MEMBERS = 4', async () => {
      const wsId = 'ws_chaos_storm';
      const owner = createTestWorkspace(wsId, 'usr_owner_chaos', 'owner.chaos@cursis.io');

      // Workspace starts with 2 members: owner + 1 active member
      await addTeamMember(wsId, { email: 'active_member@chaos.io', displayName: 'Active Member', role: 'member' });

      // And 1 pre-existing pending invitation
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      const preInvId = 'inv_chaos_pre';
      const preCandUid = 'cand_chaos_pre';

      inMemoryStore.users.set(preCandUid, {
        id: preCandUid,
        uid: preCandUid,
        email: 'pre_cand@chaos.io',
        displayName: 'Pre Candidate',
        role: 'member',
        workspaceIds: [],
        activeWorkspaceId: '',
        presence: 'online',
        lastActiveAt: now.toISOString(),
        createdAt: now.toISOString(),
      });

      inMemoryInvitations.set(preInvId, {
        id: preInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        inviteeUserId: preCandUid,
        email: 'pre_cand@chaos.io',
        name: 'Pre Candidate',
        roleTitle: 'Team Member',
        workspaceRole: 'member',
        department: 'Engineering',
        status: 'pending',
        token: 'tok_chaos_pre',
        createdAt: now.toISOString(),
        sentAt: now.toISOString(),
        expiresAt,
        invitedBy: owner.uid,
      });

      // Initial state: 2 active members + 1 pending invitation = 3 seats used. Exactly 1 seat free!
      const initialTeam = await getWorkspaceTeam(wsId);
      const initialInvites = await getWorkspaceInvitations(wsId);
      assert.equal(initialTeam.length, 2);
      assert.equal(initialInvites.length, 1);
      assert.equal(initialTeam.length + initialInvites.length, 3);

      // Now launch 42 mixed operations concurrently:
      // - 10 POST /api/invitations
      // - 10 direct addTeamMember calls
      // - 1 acceptWorkspaceInvitation for preInvId
      // - 1 revokeWorkspaceInvitation for a dummy inv
      // - 10 POST /api/team with action: 'add'
      // - 10 POST /api/team with action: 'invite'

      const dummyRevokeInvId = 'inv_chaos_dummy_revoke';
      inMemoryInvitations.set(dummyRevokeInvId, {
        id: dummyRevokeInvId,
        workspaceId: wsId,
        inviterUserId: owner.uid,
        email: 'dummy_revoke@chaos.io',
        status: 'pending',
        expiresAt,
      });

      const opPromises = [];

      // A: 10 POST /api/invitations
      for (let i = 0; i < 10; i++) {
        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: `chaos_inv_route_${i}@test.com`,
            role: 'member',
          }),
        });
        opPromises.push(invitationsRoute.POST(req).then(async (res) => ({ type: 'inv_route', status: res.status })));
      }

      // B: 10 direct addTeamMember calls
      for (let i = 0; i < 10; i++) {
        opPromises.push(
          addTeamMember(wsId, {
            email: `chaos_direct_add_${i}@test.com`,
            displayName: `Direct Add ${i}`,
            role: 'member',
          }).then(
            () => ({ type: 'direct_add', status: 201 }),
            (err) => ({ type: 'direct_add', status: err.statusCode || 400 })
          )
        );
      }

      // C: 1 accept of pre-existing invitation
      opPromises.push(
        acceptWorkspaceInvitation(preInvId, {
          uid: preCandUid,
          email: 'pre_cand@chaos.io',
          displayName: 'Pre Candidate',
        }).then(
          () => ({ type: 'accept', status: 200 }),
          (err) => ({ type: 'accept', status: err.statusCode || 400 })
        )
      );

      // D: 1 revoke of dummy invitation
      opPromises.push(
        revokeWorkspaceInvitation(wsId, dummyRevokeInvId, {
          uid: owner.uid,
          email: owner.email,
          displayName: owner.displayName,
          role: 'owner',
        }).then(
          () => ({ type: 'revoke', status: 200 }),
          (err) => ({ type: 'revoke', status: err.statusCode || 400 })
        )
      );

      // E: 10 POST /api/team with action: 'add'
      for (let i = 0; i < 10; i++) {
        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email: `chaos_team_add_${i}@test.com`,
            name: `Team Add ${i}`,
            role: 'member',
          }),
        });
        opPromises.push(teamRoute.POST(req).then(async (res) => ({ type: 'team_add', status: res.status })));
      }

      // F: 10 POST /api/team with action: 'invite'
      for (let i = 0; i < 10; i++) {
        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'invite',
            email: `chaos_team_inv_${i}@test.com`,
            role: 'member',
          }),
        });
        opPromises.push(teamRoute.POST(req).then(async (res) => ({ type: 'team_invite', status: res.status })));
      }

      // Settle all 42 operations
      const settledResults = await Promise.all(opPromises);
      assert.equal(settledResults.length, 42);

      // Audit final workspace state
      const finalTeam = await getWorkspaceTeam(wsId);
      const finalInvites = await getWorkspaceInvitations(wsId);
      const totalCapacityUsed = finalTeam.length + finalInvites.length;

      console.log(`[Interleaved Chaos Storm] Final Team: ${finalTeam.length}, Pending Invites: ${finalInvites.length}, Total Used: ${totalCapacityUsed}`);

      // Core invariants:
      // 1. Total capacity used (active members + pending invitations) MUST NEVER EXCEED 4!
      assert.ok(
        totalCapacityUsed <= MAX_TEAM_MEMBERS,
        `CRITICAL INVARIANT VIOLATED: Total capacity used (${totalCapacityUsed}) exceeded MAX_TEAM_MEMBERS (${MAX_TEAM_MEMBERS})`
      );

      // 2. Active members alone MUST NEVER EXCEED 4!
      assert.ok(
        finalTeam.length <= MAX_TEAM_MEMBERS,
        `CRITICAL INVARIANT VIOLATED: Team length (${finalTeam.length}) exceeded MAX_TEAM_MEMBERS (${MAX_TEAM_MEMBERS})`
      );

      // 3. Since we started with 3 seats used and fired 40 additions/invitations with 1 free seat,
      // the capacity MUST have saturated to exactly 4!
      assert.equal(
        totalCapacityUsed,
        4,
        `Expected workspace capacity to reach exactly 4 under massive demand, got ${totalCapacityUsed}`
      );
    });
  });
});
