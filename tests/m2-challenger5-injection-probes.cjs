// tests/m2-challenger5-injection-probes.cjs
// Empirical Challenge Suite — Milestone 2 Challenger 5
// Focus: Exhaustive Injection Probes (XSS, SQLi, Command Injection, Null Bytes, CR/LF, Unicode Normalization),
// Database Zero-Mutation Verification & Legitimate RFC Acceptance.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_m2_challenger5_secret_32_chars!';
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
const { inMemoryInvitations, createTeamInvitation } = require('@/lib/db/invitations');
const { getWorkspaceTeam, addTeamMember } = require('@/lib/db/team');
const { createSessionToken } = require('@/lib/auth/token');
const { emailField, PrivacyError } = require('@/lib/privacy/core');
const { validateAction } = require('@/lib/ordis/capabilities');

// Load API Route Handlers
const invitationsRoute = require('@/app/api/invitations/route');
const teamRoute = require('@/app/api/team/route');
const workspaceInvitationsRoute = require('@/app/api/workspaces/[id]/invitations/route');
const crmLeadsRoute = require('@/app/api/crm/leads/route');
const emailUnsubscribeRoute = require('@/app/api/email/unsubscribe/route');

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
// ADVERSARIAL PAYLOAD CATALOGS
// ============================================================================

const NESTED_HTML_XSS_PAYLOADS = [
  { label: 'nested img onerror', payload: '<img src=x onerror=alert(1)>@domain.com' },
  { label: 'svg onload inline event', payload: '<svg/onload=alert(document.cookie)>@domain.com' },
  { label: 'iframe javascript pseudo-protocol', payload: '<iframe src=javascript:alert(1)>@domain.com' },
  { label: 'base64 eval script', payload: '<script>eval(atob("YWxlcnQoMSk="))</script>@domain.com' },
  { label: 'body onload payload', payload: '<body onload=alert("XSS")>@domain.com' },
  { label: 'closing quote script tag', payload: '"><script>alert(1)</script>@domain.com' },
  { label: 'single quote script tag', payload: '\'><script>alert(1)</script>@domain.com' },
  { label: 'obfuscated uppercase nested script', payload: '<<SCRIPT>alert("XSS");//<</SCRIPT>@domain.com' },
  { label: 'anchor tag javascript', payload: '<a href="javascript:alert(1)">click</a>@domain.com' },
  { label: 'style tag injection', payload: '<style>body{background:red}</style>@domain.com' },
  { label: 'complex math mtext svg exploit', payload: '<math><mtext><style><!--</style><img src=1 onerror=alert(1)>@domain.com' },
  { label: 'trailing script tag after valid domain', payload: 'user@domain.com<script>alert(1)</script>' },
  { label: 'inline img tag in local part', payload: 'user<img src=x>@domain.com' },
  { label: 'script tag inside domain part', payload: 'user@<script>alert(1)</script>.com' },
];

const SQLI_PAYLOADS = [
  { label: 'standard OR boolean tautology', payload: '\' OR \'1\'=\'1@domain.com' },
  { label: 'admin hash comment', payload: 'admin\'#@domain.com' },
  { label: 'UNION SELECT credential dump', payload: '\' UNION SELECT null, username, password FROM users--@domain.com' },
  { label: 'AND tautology inline', payload: '1\' AND 1=1--@domain.com' },
  { label: 'admin OR true hash', payload: 'admin\' OR 1=1#@domain.com' },
  { label: 'stacked query xp_cmdshell', payload: '\'; EXEC xp_cmdshell(\'dir\');--@domain.com' },
  { label: 'time-based blind sleep', payload: 'test\' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--@domain.com' },
  { label: 'SQL Server waitfor delay', payload: '1\'; WAITFOR DELAY \'0:0:5\'--@domain.com' },
  { label: 'inline block comment start', payload: 'admin\'/*@domain.com' },
  { label: 'whitespace bypassed OR tautology', payload: 'admin\'/**/OR/**/1=1--@domain.com' },
  { label: 'injection in domain section', payload: 'user@domain.com\' OR \'1\'=\'1' },
  { label: 'stacked drop table query', payload: 'admin\'; DROP TABLE users;--@domain.com' },
  { label: 'string equality tautology', payload: 'admin\' OR \'x\'=\'x@domain.com' },
  { label: 'double quoted SQL tautology', payload: 'admin" OR "1"="1@domain.com' },
];

const COMMAND_INJECTION_PAYLOADS = [
  { label: 'backtick subshell whoami', payload: '`whoami`@domain.com' },
  { label: 'dollar subshell id', payload: '$(id)@domain.com' },
  { label: 'semicolon chained whoami', payload: 'user;whoami@domain.com' },
  { label: 'piped id command', payload: 'user|id@domain.com' },
  { label: 'logical OR chained reboot', payload: 'user||reboot@domain.com' },
  { label: 'logical AND calc launch', payload: 'user&&calc.exe@domain.com' },
  { label: 'background task ampersand dir', payload: 'user&dir@domain.com' },
  { label: 'redirection to file', payload: 'user>out.txt@domain.com' },
  { label: 'input redirection from file', payload: 'user<input.txt@domain.com' },
  { label: 'IFS environment variable cat passwd', payload: '${IFS}cat${IFS}/etc/passwd@domain.com' },
  { label: 'Windows environment variable calc path', payload: '%windir%\\system32\\calc.exe@domain.com' },
  { label: 'dollar parenthesis subshell sleep', payload: 'user$(sleep 5)@domain.com' },
  { label: 'semicolon rm -rf', payload: 'user;rm -rf /@domain.com' },
  { label: 'semicolon net user creation', payload: 'user;net user hacker /add@domain.com' },
];

const NULL_CRLF_UNICODE_PAYLOADS = [
  { label: 'escaped null byte', payload: 'user\\x00@domain.com' },
  { label: 'url encoded null byte', payload: 'user%00@domain.com' },
  { label: 'raw null byte character', payload: 'user\x00@domain.com' },
  { label: 'leading raw null byte', payload: '\x00user@domain.com' },
  { label: 'raw carriage return byte', payload: 'user\r@domain.com' },
  { label: 'raw newline byte', payload: 'user\n@domain.com' },
  { label: 'raw CRLF header injection', payload: 'user\r\n@domain.com' },
  { label: 'CRLF Bcc header injection', payload: 'user\r\nBcc:victim@cursis.in@domain.com' },
  { label: 'raw tab byte', payload: 'user\t@domain.com' },
  { label: 'raw backspace byte', payload: 'user\b@domain.com' },
  { label: 'raw formfeed byte', payload: 'user\f@domain.com' },
  { label: 'raw vertical tab byte', payload: 'user\v@domain.com' },
  { label: 'fullwidth latin unicode letters', payload: '\uFF55\uFF53\uFF45\uFF52@domain.com' }, // ｕｓｅｒ
  { label: 'fullwidth commercial at sign', payload: 'user\uFF20domain.com' }, // ＠
  { label: 'fullwidth full stop dot', payload: 'user@domain\uFF0Ecom' }, // ．
  { label: 'right-to-left override character', payload: 'admin@domain.com\u202E' },
  { label: 'unicode zero-width space in local', payload: 'user\u200B@domain.com' },
  { label: 'null byte in domain part', payload: 'user@domain\x00.com' },
  { label: 'CRLF in domain part', payload: 'user@domain\r\n.com' },
];

const MALFORMED_AND_PATH_PAYLOADS = [
  { label: 'relative path traversal dot dot slash', payload: '../../../etc/passwd@domain.com' },
  { label: 'windows backslash path traversal', payload: '..\\..\\windows\\system32@domain.com' },
  { label: 'domain path traversal', payload: 'user@../../domain.com' },
  { label: 'missing domain dot', payload: 'user@localhost' },
  { label: 'leading dot in domain', payload: 'user@.domain.com' },
  { label: 'consecutive dots in domain', payload: 'user@domain..com' },
  { label: 'trailing dot in domain', payload: 'user@domain.' },
  { label: 'underscore in domain hostname', payload: 'user@domain_name.com' },
  { label: 'trailing hyphen in domain', payload: 'user@domain-.com' },
  { label: 'leading hyphen in domain', payload: 'user@-domain.com' },
];

const LEGITIMATE_RFC_EMAILS = [
  { label: 'standard dot-separated name', email: 'alice.smith@domain.com' },
  { label: 'plus subaddressing marketing tag', email: 'alice+marketing@subdomain.cursis.in' },
  { label: 'hyphen, underscore, plus and multi-level subdomain', email: 'dev-ops.lead_42+k8s-infra@staging.us-east-1.corp.co' },
  { label: 'hyphen in user and hyphen in domain', email: 'user-name@domain-name.com' },
  { label: 'ticket tag with numbers and hyphen', email: 'customer_support+ticket-999@helpdesk.support.net' },
  { label: 'minimal 1-char local and 1-char domain', email: 'a@b.co' },
  { label: 'numeric local and numeric domain', email: '123456@numbers.com' },
  { label: 'multiple dots and plus tag with UK country code', email: 'test.email.with+many.dots+and-tags@company.co.uk' },
  { label: 'standard enterprise cursis email', email: 'operations.lead+tag@engineering.cursis.cloud' },
  { label: 'standard japan co-jp compound domain', email: 'a.b.c-d_e@sub-dept.company.co.jp' },
];

// ============================================================================
// SUITE EXECUTION
// ============================================================================

test('CHALLENGER 5: Exhaustive Injection Probes, DB Zero-Mutation & RFC Acceptance Suite', async (suite) => {

  // --------------------------------------------------------------------------
  // Suite 1: Nested HTML / JS / XSS Probes across POST /api/invitations
  // --------------------------------------------------------------------------
  await suite.test('Suite 1: Nested HTML/JS & XSS Fuzzing (Expect HTTP 400 & Zero DB Mutations)', async (t) => {
    let idx = 0;
    for (const item of NESTED_HTML_XSS_PAYLOADS) {
      idx++;
      await t.test(`XSS probe ${idx}: [${item.label}] -> rejects HTTP 400 without DB write`, async () => {
        resetMemory();
        const wsId = `ws_xss_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_xss_${idx}`, `owner.xss.${idx}@cursis.io`);

        const initInvCount = inMemoryInvitations.size;
        const initUserCount = inMemoryStore.users.size;
        const initMemCount = inMemoryMemberships.size;

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: item.payload,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 400, `XSS VULNERABILITY: Payload [${item.label}] was accepted with HTTP ${res.status}! Expected HTTP 400.`);
        assert.ok(data.error, `Expected structured error response for [${item.label}]`);

        // Assert ZERO database mutations
        assert.equal(inMemoryInvitations.size, initInvCount, `DB MUTATION: Invitation created for XSS payload [${item.label}]`);
        assert.equal(inMemoryStore.users.size, initUserCount, `DB MUTATION: User created for XSS payload [${item.label}]`);
        assert.equal(inMemoryMemberships.size, initMemCount, `DB MUTATION: Membership created for XSS payload [${item.label}]`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 2: SQL Injection Probes across POST /api/invitations and POST /api/team
  // --------------------------------------------------------------------------
  await suite.test('Suite 2: SQLi Fuzzing across Invitations and Team (Expect HTTP 400 & Zero DB Mutations)', async (t) => {
    let idx = 0;
    for (const item of SQLI_PAYLOADS) {
      idx++;
      // Test on POST /api/invitations
      await t.test(`SQLi probe invitations ${idx}: [${item.label}] -> rejects HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_sqli_inv_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_sqli_${idx}`, `owner.sqli.${idx}@cursis.io`);

        const initInvCount = inMemoryInvitations.size;

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: item.payload,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        assert.equal(res.status, 400, `SQLi DEFECT: Payload [${item.label}] accepted on /api/invitations with HTTP ${res.status}`);
        assert.equal(inMemoryInvitations.size, initInvCount, `DB MUTATION: Invitation created for SQLi [${item.label}]`);
      });

      // Test on POST /api/team [add]
      await t.test(`SQLi probe team add ${idx}: [${item.label}] -> rejects HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_sqli_team_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_tsqli_${idx}`, `owner.tsqli.${idx}@cursis.io`);

        const initUserCount = inMemoryStore.users.size;

        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email: item.payload,
            name: 'SQLi Tester',
            role: 'member',
          }),
        });

        const res = await teamRoute.POST(req);
        assert.equal(res.status, 400, `SQLi DEFECT: Payload [${item.label}] accepted on /api/team with HTTP ${res.status}`);
        assert.equal(inMemoryStore.users.size, initUserCount, `DB MUTATION: User record added for SQLi [${item.label}]`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 3: Command Injection & Shell Tokens across Endpoints
  // --------------------------------------------------------------------------
  await suite.test('Suite 3: Command Injection & Shell Token Probes (Expect HTTP 400 & Zero DB Mutations)', async (t) => {
    let idx = 0;
    for (const item of COMMAND_INJECTION_PAYLOADS) {
      idx++;
      await t.test(`Command injection probe ${idx}: [${item.label}] -> rejects HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_cmd_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_cmd_${idx}`, `owner.cmd.${idx}@cursis.io`);

        const initInvCount = inMemoryInvitations.size;

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: item.payload,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        assert.equal(res.status, 400, `COMMAND INJECTION DEFECT: Payload [${item.label}] accepted with HTTP ${res.status}`);
        assert.equal(inMemoryInvitations.size, initInvCount, `DB MUTATION: Invitation created for Command Injection [${item.label}]`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 4: Null Bytes, CR/LF, Control Characters & Unicode Normalization Probes
  // --------------------------------------------------------------------------
  await suite.test('Suite 4: Null Bytes, CR/LF & Unicode Normalization Probes (Expect HTTP 400 & Zero DB Mutations)', async (t) => {
    let idx = 0;
    for (const item of NULL_CRLF_UNICODE_PAYLOADS) {
      idx++;
      await t.test(`Null/CRLF/Unicode probe ${idx}: [${item.label}] -> rejects HTTP 400`, async () => {
        resetMemory();
        const wsId = `ws_null_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_null_${idx}`, `owner.null.${idx}@cursis.io`);

        const initInvCount = inMemoryInvitations.size;

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: item.payload,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        assert.equal(res.status, 400, `INJECTION DEFECT: Null/CRLF/Unicode payload [${item.label}] accepted with HTTP ${res.status}`);
        assert.equal(inMemoryInvitations.size, initInvCount, `DB MUTATION: Record created for Null/CRLF/Unicode [${item.label}]`);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 5: Path Traversal, Malformed Domain & Boundary Probes
  // --------------------------------------------------------------------------
  await suite.test('Suite 5: Path Traversal & Malformed Domain Probes (Security Validation)', async (t) => {
    let idx = 0;
    for (const item of MALFORMED_AND_PATH_PAYLOADS) {
      idx++;
      await t.test(`Path/Malformed probe ${idx}: [${item.label}] -> security verification`, async () => {
        resetMemory();
        const wsId = `ws_path_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_path_${idx}`, `owner.path.${idx}@cursis.io`);

        const initInvCount = inMemoryInvitations.size;

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: item.payload,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        
        // Critical path traversal and domain structure violations must strictly return HTTP 400
        const strictRejectionLabels = [
          'relative path traversal dot dot slash',
          'windows backslash path traversal',
          'domain path traversal',
          'missing domain dot',
          'leading dot in domain',
          'trailing dot in domain',
          'underscore in domain hostname',
        ];

        if (strictRejectionLabels.includes(item.label)) {
          assert.equal(res.status, 400, `SECURITY DEFECT: Malformed/Traversal payload [${item.label}] accepted with HTTP ${res.status}`);
          assert.equal(inMemoryInvitations.size, initInvCount, `DB MUTATION: Record created for [${item.label}]`);
        } else {
          // Benign domain formatting variations (consecutive dots, leading/trailing hyphens)
          // Verify safe handling: no server crash (500), sanitized string storage, no injection side-effects
          assert.ok(res.status === 400 || res.status === 201, `Unexpected HTTP status ${res.status} for benign domain variation [${item.label}]`);
          if (res.status === 201) {
            const stored = Array.from(inMemoryInvitations.values())[0];
            assert.equal(stored.email, item.payload.toLowerCase().trim(), 'Stored email must strictly match sanitized input');
            assert.ok(!stored.email.includes('<') && !stored.email.includes('\'') && !stored.email.includes('"'), 'Must contain zero injection chars');
          }
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 6: Cross-Endpoint Injection Hardening Coverage
  // Testing: /api/workspaces/[id]/invitations, /api/crm/leads, /api/email/unsubscribe,
  // Direct DB createTeamInvitation, addTeamMember, and Privacy emailField.
  // --------------------------------------------------------------------------
  await suite.test('Suite 6: Multi-Endpoint & Layer-by-Layer Injection Hardening', async (t) => {
    // 6.1 /api/workspaces/[id]/invitations
    await t.test('6.1: POST /api/workspaces/[id]/invitations rejects injection strings with HTTP 400', async () => {
      resetMemory();
      const wsId = 'ws_sub_inv_1';
      const owner = createTestWorkspace(wsId, 'usr_owner_subinv', 'owner.subinv@cursis.io');

      const req = new Request(`http://localhost/api/workspaces/${wsId}/invitations`, {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          email: '<script>alert("nested")</script>@domain.com',
          role: 'member',
        }),
      });

      const res = await workspaceInvitationsRoute.POST(req, { params: Promise.resolve({ id: wsId }) });
      assert.equal(res.status, 400, `Expected HTTP 400, got ${res.status}`);
      assert.equal(inMemoryInvitations.size, 0, 'Zero invitations in DB');
    });

    // 6.2 POST /api/crm/leads
    await t.test('6.2: POST /api/crm/leads rejects injection email with HTTP 400', async () => {
      resetMemory();
      const wsId = 'ws_crm_test';
      const owner = createTestWorkspace(wsId, 'usr_owner_crm', 'owner.crm@cursis.io');

      const req = new Request('http://localhost/api/crm/leads', {
        method: 'POST',
        headers: makeAuthHeaders(owner, wsId),
        body: JSON.stringify({
          workspaceId: wsId,
          name: 'Lead Candidate',
          company: 'Acme Corp',
          email: '\' OR \'1\'=\'1@domain.com',
        }),
      });

      const res = await crmLeadsRoute.POST(req);
      assert.equal(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    });

    // 6.3 POST /api/email/unsubscribe
    await t.test('6.3: POST /api/email/unsubscribe rejects injection email with HTTP 400', async () => {
      const req = new Request('http://localhost/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: '`whoami`@domain.com',
        }),
      });

      const res = await emailUnsubscribeRoute.POST(req);
      assert.equal(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    });

    // 6.4 Direct DB: createTeamInvitation throws Error(400) on injection payload
    await t.test('6.4: Direct DB createTeamInvitation throws Error(400) on injection payload', async () => {
      resetMemory();
      const wsId = 'ws_direct_inv';
      const owner = createTestWorkspace(wsId, 'usr_owner_direct', 'owner.direct@cursis.io');

      let threw = false;
      try {
        await createTeamInvitation({
          workspaceId: wsId,
          inviterUser: owner,
          inviteeEmail: '<svg onload=alert(1)>@domain.com',
          role: 'member',
        });
      } catch (err) {
        threw = true;
        assert.equal(err.statusCode, 400, `Expected err.statusCode 400, got ${err.statusCode}`);
      }
      assert.ok(threw, 'Direct DB createTeamInvitation must throw on injection string');
      assert.equal(inMemoryInvitations.size, 0, 'Zero invitations persisted');
    });

    // 6.5 Direct DB: addTeamMember throws Error(400) on injection payload
    await t.test('6.5: Direct DB addTeamMember throws Error(400) on injection payload', async () => {
      resetMemory();
      const wsId = 'ws_direct_add';
      createTestWorkspace(wsId, 'usr_owner_direct_add', 'owner.direct.add@cursis.io');

      let threw = false;
      try {
        await addTeamMember(wsId, {
          email: 'user;DROP TABLE users;--@domain.com',
          displayName: 'Injected User',
          role: 'member',
        });
      } catch (err) {
        threw = true;
        assert.equal(err.statusCode, 400, `Expected err.statusCode 400, got ${err.statusCode}`);
      }
      assert.ok(threw, 'Direct DB addTeamMember must throw on injection string');
    });

    // 6.6 Direct Privacy: emailField throws PrivacyError on injection payload
    await t.test('6.6: Direct Privacy emailField throws PrivacyError on injection payload', () => {
      assert.throws(() => {
        emailField('user"name@domain.com');
      }, PrivacyError, 'emailField must throw PrivacyError on quotes/injection');
    });

    // 6.7 Direct Ordis Capabilities: validateAction returns validation error for invite_member with injection payload
    await t.test('6.7: Ordis validateAction rejects injection email in invite_member', () => {
      const result = validateAction('invite_member', { email: '<script>alert(1)</script>@domain.com' });
      assert.ok(result && result.includes('Please provide the complete email address'), `Expected validation error, got ${result}`);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 7: Legitimate RFC Emails Acceptance (HTTP 201 Created & Correct Persistence)
  // --------------------------------------------------------------------------
  await suite.test('Suite 7: Legitimate RFC Emails Acceptance (HTTP 201 Created & DB Persistence)', async (t) => {
    let idx = 0;
    for (const item of LEGITIMATE_RFC_EMAILS) {
      idx++;
      // 7.1 POST /api/invitations
      await t.test(`Legitimate email on /api/invitations ${idx}: [${item.label}] -> HTTP 201`, async () => {
        resetMemory();
        const wsId = `ws_rfc_inv_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_rfc_${idx}`, `owner.rfc.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            email: item.email,
            role: 'member',
          }),
        });

        const res = await invitationsRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 201, `Expected HTTP 201 for valid email [${item.email}], got ${res.status}`);
        assert.ok(data.invitation || data.token, `Expected invitation object for [${item.email}]`);
        assert.equal(inMemoryInvitations.size, 1, `Expected 1 stored invitation for [${item.email}]`);
        const stored = Array.from(inMemoryInvitations.values())[0];
        assert.equal(stored.email, item.email.toLowerCase().trim());
        assert.equal(stored.status, 'pending');
        assert.ok(stored.token && stored.token.length > 20, 'Expected cryptographically secure token');
        assert.ok(new Date(stored.expiresAt).getTime() > Date.now(), 'Expected valid future expiration');
      });

      // 7.2 POST /api/team [action: 'add']
      await t.test(`Legitimate email on /api/team [add] ${idx}: [${item.label}] -> HTTP 201`, async () => {
        resetMemory();
        const wsId = `ws_rfc_team_${idx}`;
        const owner = createTestWorkspace(wsId, `usr_owner_rfct_${idx}`, `owner.rfct.${idx}@cursis.io`);

        const req = new Request('http://localhost/api/team', {
          method: 'POST',
          headers: makeAuthHeaders(owner, wsId),
          body: JSON.stringify({
            workspaceId: wsId,
            action: 'add',
            email: item.email,
            name: 'RFC Member',
            role: 'member',
          }),
        });

        const res = await teamRoute.POST(req);
        const data = await res.json();

        assert.equal(res.status, 201, `Expected HTTP 201 for valid email [${item.email}], got ${res.status}`);
        assert.ok(data.member, `Expected member payload for [${item.email}]`);
        const team = await getWorkspaceTeam(wsId);
        assert.equal(team.length, 2, `Expected team size 2 after addition, got ${team.length}`);
      });
    }
  });

});
