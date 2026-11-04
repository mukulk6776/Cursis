// tests/m2-challenger4-adversarial.cjs
// Empirical Challenge Suite — Milestone 2 Challenger 4
// Focus: Email Validation & Fuzzing, Defect Verification on removeTeamMember (lib/db/team.ts:449)

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
const { inMemoryInvitations } = require('@/lib/db/invitations');
const { getWorkspaceTeam, addTeamMember, removeTeamMember } = require('@/lib/db/team');
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
// EMPIRICAL CHALLENGE SUITE: EMAIL FUZZING & DEFECT AUDIT
// ============================================================================

test('CHALLENGER 4: Empirical Email Validation Fuzzing & Defect Verification Suite', async (suite) => {

  const BOUNDARY_AND_MALFORMED_EMAILS = [
    { label: 'missing local part', email: '@missinguser.com' },
    { label: 'missing domain part', email: 'user@' },
    { label: 'not an email', email: 'notanemail' },
    { label: 'empty string', email: '' },
    { label: 'whitespace only', email: '   ' },
    { label: 'missing domain name before dot', email: 'user@.com' },
    { label: 'only @ symbol', email: '@' },
    { label: 'missing TLD', email: 'user@domain' },
    { label: 'space in local part', email: 'user space@domain.com' },
    { label: 'space in domain part', email: 'user@domain .com' },
    { label: 'double @ symbol', email: 'user@@domain.com' },
    { label: 'newline injection', email: 'user\n@domain.com' },
    { label: 'CRLF header injection', email: 'user\r\nBcc:victim@cursis.in' },
    { label: 'null value', email: null },
    { label: 'undefined value', email: undefined },
    { label: 'numeric value', email: 12345 },
    { label: 'object payload', email: { $gt: '' } },
  ];

  const INJECTION_PAYLOAD_EMAILS = [
    { label: 'XSS script tag in local part', email: '<script>alert(1)</script>@domain.com' },
    { label: 'XSS script tag trailing', email: 'user@domain.com<script>alert(1)</script>' },
    { label: 'SQL injection single-quote comment', email: "admin'--@domain.com" },
    { label: 'SQL injection DROP TABLE with space', email: 'user;DROP TABLE users;--@domain.com' },
    { label: 'SQL injection DROP TABLE without space', email: 'user;DROP/**/TABLE/**/users;--@domain.com' },
    { label: 'double-quotes in local part', email: 'user"name@domain.com' },
    { label: 'eval syntax in local part', email: "eval('test')@domain.com" },
  ];

  const VALID_RFC_EMAILS = [
    'user+tag@domain.com',
    'name@sub.domain.co.uk',
    'valid.email-test_123@subdept.cursis.cloud',
    'admin+marketing@company.org',
    'cursis_lead.42@org.io',
    'operations.lead+tag@engineering.cursis.cloud',
    'a.b.c-d_e@sub-dept.company.co.jp',
  ];

  // --------------------------------------------------------------------------
  // Suite 1: Malformed and Boundary Emails on POST /api/invitations
  // --------------------------------------------------------------------------
  await suite.test('Suite 1: Boundary & Malformed Emails on POST /api/invitations (Expect HTTP 400)', async (t) => {
    let idx = 0;
    for (const testCase of BOUNDARY_AND_MALFORMED_EMAILS) {
      idx++;
      await t.test(`POST /api/invitations: [${testCase.label}] -> rejects with HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_fuzz_inv_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_fuzz_${idx}`, `owner.fuzz.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: testCase.email,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 400, `Expected HTTP 400 for [${testCase.label}], got ${res.status}`);
        assert.ok(data.error, `Expected error message in body for [${testCase.label}]`);
        assert.equal(inMemoryInvitations.size, 0, `Expected 0 invitations stored for [${testCase.label}]`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 2: Malformed and Boundary Emails on POST /api/team
  // --------------------------------------------------------------------------
  await suite.test('Suite 2: Boundary & Malformed Emails on POST /api/team (Expect HTTP 400)', async (t) => {
    let idx = 0;
    // 2.1 action: 'invite'
    for (const testCase of BOUNDARY_AND_MALFORMED_EMAILS) {
      idx++;
      await t.test(`POST /api/team [invite]: [${testCase.label}] -> rejects with HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_fuzz_team_inv_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_tinv_${idx}`, `owner.team.inv.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'invite',
            email: testCase.email,
            role: 'member',
          }),
        });

        const res = await teamRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 400, `Expected HTTP 400 for team invite [${testCase.label}], got ${res.status}`);
        assert.ok(data.error, `Expected error message in body for [${testCase.label}]`);
        assert.equal(inMemoryInvitations.size, 0, `Expected 0 invitations stored for [${testCase.label}]`);
      });
    }

    // 2.2 action: 'add'
    for (const testCase of BOUNDARY_AND_MALFORMED_EMAILS) {
      idx++;
      await t.test(`POST /api/team [add]: [${testCase.label}] -> rejects with HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_fuzz_team_add_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_tadd_${idx}`, `owner.team.add.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email: testCase.email,
            name: 'Fuzz Candidate',
            role: 'member',
          }),
        });

        const res = await teamRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 400, `Expected HTTP 400 for team add [${testCase.label}], got ${res.status}`);
        assert.ok(data.error, `Expected error message in body for [${testCase.label}]`);
        const team = await getWorkspaceTeam(wsId);
        assert.equal(team.length, 1, `Team size must remain 1 (owner only), got ${team.length}`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 3: Injection String Payloads on POST /api/invitations and POST /api/team
  // --------------------------------------------------------------------------
  await suite.test('Suite 3: Injection Payloads Fuzzing (XSS / SQL / Command / Quotes)', async (t) => {
    let idx = 0;
    for (const testCase of INJECTION_PAYLOAD_EMAILS) {
      idx++;
      await t.test(`Injection Fuzz /api/invitations: [${testCase.label}] -> evaluates HTTP status`, async () => {
        resetMemory();
        const wsId = `ws_inj_inv_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_inj_${idx}`, `owner.inj.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: testCase.email,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        const data = await res.json();

        if (res.status === 201) {
          console.warn(`[CHALLENGE OBSERVATION] Injection email "${testCase.email}" accepted with HTTP 201 (token generated: ${Boolean(data.invitation || data.token)})`);
        }
        // Assert whether it rejected with 400 per prompt instruction
        assert.equal(res.status, 400, `INJECTION DEFECT: Expected HTTP 400 for injection payload [${testCase.label}], but server returned HTTP ${res.status}`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 4: Valid RFC Emails Acceptance (Expect HTTP 201 Created)
  // --------------------------------------------------------------------------
  await suite.test('Suite 4: Valid RFC Emails Acceptance (HTTP 201 Created)', async (t) => {
    let idx = 0;
    // 4.1 POST /api/invitations
    for (const email of VALID_RFC_EMAILS) {
      idx++;
      await t.test(`Valid email on /api/invitations: [${email}] -> succeeds with HTTP 201`, async () => {
        resetMemory();
        const wsId = `ws_valid_inv_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_vinv_${idx}`, `owner.valid.inv.${idx}@cursis.io`);

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
        const data = await res.json();

        assert.equal(res.status, 201, `Expected HTTP 201 for valid email [${email}], got ${res.status}`);
        assert.ok(data.invitation || data.token, `Expected invitation payload in response for [${email}]`);
        assert.equal(inMemoryInvitations.size, 1, `Expected exactly 1 invitation stored for [${email}]`);
        const stored = Array.from(inMemoryInvitations.values())[0];
        assert.equal(stored.email, email.toLowerCase().trim());
        assert.equal(stored.status, 'pending');
        assert.ok(stored.token && stored.token.length > 20, 'Expected secure random token');
        assert.ok(new Date(stored.expiresAt).getTime() > Date.now(), 'Expected valid expiration in future');
      });
    }

    // 4.2 POST /api/team with action: 'add'
    for (const email of VALID_RFC_EMAILS) {
      idx++;
      await t.test(`Valid email on /api/team [add]: [${email}] -> succeeds with HTTP 201`, async () => {
        resetMemory();
        const wsId = `ws_valid_team_add_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_tvadd_${idx}`, `owner.team.vadd.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email,
            name: 'Valid Member',
            role: 'member',
          }),
        });

        const res = await teamRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 201, `Expected HTTP 201 for valid team add [${email}], got ${res.status}`);
        assert.ok(data.member, `Expected member payload in response for [${email}]`);
        const team = await getWorkspaceTeam(wsId);
        assert.equal(team.length, 2, `Expected team size 2 after addition, got ${team.length}`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 5: Defect Verification on removeTeamMember (Confirm ZERO ReferenceError)
  // --------------------------------------------------------------------------
  await suite.test('Suite 5: Defect Verification on removeTeamMember (lib/db/team.ts:449)', async (t) => {
    // 5.1 Target: Owner target -> returns false, ZERO ReferenceError
    await t.test('5.1: removeTeamMember against Workspace Owner executes with ZERO ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_owner';
      const owner = createTestWorkspace(wsId, 'usr_owner_defect', 'owner.defect@cursis.io');

      let result;
      let error = null;
      try {
        result = await removeTeamMember(wsId, owner.uid);
      } catch (err) {
        error = err;
      }

      assert.equal(error, null, `ReferenceError detected: ${error?.stack || error}`);
      assert.equal(result, false, 'Expected removeTeamMember on owner to return false (owner protected)');
      const team = await getWorkspaceTeam(wsId);
      assert.equal(team.length, 1, 'Owner must remain in workspace');
    });

    // 5.2 Target: Member target -> successfully removes member, returns true, ZERO ReferenceError
    await t.test('5.2: removeTeamMember against regular Member executes with ZERO ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_member';
      const owner = createTestWorkspace(wsId, 'usr_owner_def_m', 'owner.def.m@cursis.io');
      const addedMember = await addTeamMember(wsId, {
        email: 'regular.member@cursis.io',
        displayName: 'Regular Member',
        role: 'member',
      });

      const teamBefore = await getWorkspaceTeam(wsId);
      assert.equal(teamBefore.length, 2, 'Workspace must have 2 members before removal');

      let result;
      let error = null;
      try {
        result = await removeTeamMember(wsId, addedMember.id);
      } catch (err) {
        error = err;
      }

      assert.equal(error, null, `ReferenceError detected: ${error?.stack || error}`);
      assert.equal(result, true, 'Expected removeTeamMember on member to return true');
      const teamAfter = await getWorkspaceTeam(wsId);
      assert.equal(teamAfter.length, 1, 'Workspace must have 1 member after removal');
      assert.equal(teamAfter[0].id, owner.uid, 'Remaining member must be owner');
    });

    // 5.3 Target: Non-member target -> executes with ZERO ReferenceError
    await t.test('5.3: removeTeamMember against non-member target executes with ZERO ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_nonmember';
      createTestWorkspace(wsId, 'usr_owner_def_nm', 'owner.def.nm@cursis.io');

      let result;
      let error = null;
      try {
        result = await removeTeamMember(wsId, 'usr_non_existent_999');
      } catch (err) {
        error = err;
      }

      assert.equal(error, null, `ReferenceError detected: ${error?.stack || error}`);
      assert.ok(typeof result === 'boolean', 'Expected boolean return value');
    });

    // 5.4 Target: Founder email hint -> returns false, ZERO ReferenceError
    await t.test('5.4: removeTeamMember with founder email hint executes with ZERO ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_founder';
      const founderUid = 'usr_founder_id';
      const founderUser = {
        id: founderUid,
        uid: founderUid,
        email: 'founder@cursis.in',
        displayName: 'Founder User',
        role: 'owner',
        workspaceIds: [wsId],
        activeWorkspaceId: wsId,
        createdAt: new Date().toISOString(),
      };
      inMemoryStore.users.set(founderUid, founderUser);
      createTestWorkspace(wsId, founderUid, 'founder@cursis.in');

      let result;
      let error = null;
      try {
        result = await removeTeamMember(wsId, founderUid, 'founder@cursis.in');
      } catch (err) {
        error = err;
      }

      assert.equal(error, null, `ReferenceError detected: ${error?.stack || error}`);
      assert.equal(result, false, 'Expected removeTeamMember on founder to return false');
    });

    // 5.5 Target: Empty strings -> executes with ZERO ReferenceError
    await t.test('5.5: removeTeamMember with empty/blank identifiers executes with ZERO ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_empty';
      createTestWorkspace(wsId, 'usr_owner_def_empty', 'owner.def.empty@cursis.io');

      for (const [w, u] of [['', ''], [wsId, ''], ['', 'usr_some_user']]) {
        let result;
        let error = null;
        try {
          result = await removeTeamMember(w, u);
        } catch (err) {
          error = err;
        }
        assert.equal(error, null, `ReferenceError detected for [${w}, ${u}]: ${error?.stack || error}`);
        assert.ok(typeof result === 'boolean', `Expected boolean for [${w}, ${u}]`);
      }
    });

    // 5.6 HTTP Route Handler: DELETE /api/team executes with ZERO ReferenceError (no 500 error)
    await t.test('5.6: HTTP DELETE /api/team removes member with HTTP 200 and ZERO 500 ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_http';
      const owner = createTestWorkspace(wsId, 'usr_owner_def_http', 'owner.def.http@cursis.io');
      const addedMember = await addTeamMember(wsId, {
        email: 'http.target@cursis.io',
        displayName: 'HTTP Target',
        role: 'member',
      });

      const deleteReq = new Request(
        `http://localhost/api/team?workspaceId=${wsId}&userId=${addedMember.id}`,
        {
          method: 'DELETE',
          headers: makeAuthHeaders(owner, wsId),
        }
      );

      const res = await teamRoute.DELETE(deleteReq);
      const data = await res.json();

      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}: ${JSON.stringify(data)}`);
      assert.equal(data.removed, true, 'Expected removed to be true');
      const teamAfter = await getWorkspaceTeam(wsId);
      assert.equal(teamAfter.length, 1, 'Member must be removed');
    });

    // 5.7 HTTP Route Handler: DELETE /api/team on non-member executes without 500 ReferenceError
    await t.test('5.7: HTTP DELETE /api/team on non-member executes without 500 ReferenceError', async () => {
      resetMemory();
      const wsId = 'ws_defect_http_nm';
      const owner = createTestWorkspace(wsId, 'usr_owner_def_http_nm', 'owner.def.http.nm@cursis.io');

      const deleteReq = new Request(
        `http://localhost/api/team?workspaceId=${wsId}&userId=usr_not_in_ws_123`,
        {
          method: 'DELETE',
          headers: makeAuthHeaders(owner, wsId),
        }
      );

      const res = await teamRoute.DELETE(deleteReq);
      const data = await res.json();

      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}: ${JSON.stringify(data)}`);
    });
  });

});
