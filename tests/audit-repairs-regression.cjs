/**
 * Regression Test Suite for Cursis Security Audit & Repairs
 * Covers:
 * 1. Account Takeover Prevention (Google-only user vs password signup)
 * 2. RBAC & Cross-Workspace Tenant Boundary Isolation
 * 3. Team PATCH Field Allowlists & Credential Immunity
 * 4. Task Tenant Isolation & Field Immutability
 * 5. Document Revision History, Field Reconciliation & Immutability
 * 6. Session Cookie Profile Picture Stripping & Security
 * 7. SSRF Protection in Link-Preview Fetcher
 * 8. Voucher Atomic Redemption Guards
 */

const assert = require('assert');
const path = require('path');

process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'test-audit-secret-key-at-least-32-chars-long!';

const root = path.resolve(__dirname, '..');

const fs = require('fs');
const Module = require('module');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    }
  }).outputText, filename);
};

// Mock mongodb
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async () => null,
    getDb: async () => null,
  },
};

async function runTests() {
  console.log('================================================================');
  console.log('Starting Audit Repairs Regression Test Suite');
  console.log('================================================================\n');

  let passed = 0;

  // -------------------------------------------------------------
  // Test 1: Account takeover prevention
  // -------------------------------------------------------------
  try {
    console.log('[TEST 1] Account Takeover: Password signup cannot take over Google-only account...');
    const { inMemoryStore } = require(path.join(root, 'lib/db/store.ts'));
    const { registerUser } = require(path.join(root, 'lib/db/users.ts'));

    const victimUid = 'google_victim_user_123';
    const victimEmail = 'victim.google@gmail.com';

    inMemoryStore.users.set(victimUid, {
      id: victimUid,
      uid: victimUid,
      email: victimEmail,
      displayName: 'Google Victim',
      authProvider: 'google',
      // No passwordHash!
      workspaceIds: ['ws_victim'],
      activeWorkspaceId: 'ws_victim',
      createdAt: new Date().toISOString(),
    });

    const route = require(path.join(root, 'app/api/auth/signup/route.ts'));
    const fakeRequest = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Impersonator',
        email: victimEmail,
        password: 'Password123!Secure',
        ageConfirmed: true,
        privacyConsent: true,
        noticeVersion: '2026-10-18',
      }),
    });

    const response = await route.POST(fakeRequest);
    const data = await response.json();

    assert.equal(response.status, 409, 'Expected 409 Conflict status');
    assert.ok(data.error && data.error.includes('Google'), 'Expected error message indicating Google account exists');
    assert.ok(!inMemoryStore.users.get(victimUid).passwordHash, 'Victim record must NOT have passwordHash set');

    console.log('✓ TEST 1 PASSED: Password signup safely rejected existing Google-only account with 409');
    passed++;
  } catch (err) {
    console.error('✗ TEST 1 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 2: Cross-Workspace Tenant Boundary & RBAC
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 2] Tenant Boundary: Regular member cannot access or update foreign workspace...');
    const { getUserWorkspaceRole } = require(path.join(root, 'lib/auth/rbac.ts'));
    const { inMemoryStore } = require(path.join(root, 'lib/db/store.ts'));

    const normalUserUid = 'usr_normal_member';
    inMemoryStore.users.set(normalUserUid, {
      id: normalUserUid,
      uid: normalUserUid,
      email: 'member@company.com',
      displayName: 'Normal Member',
      workspaceIds: ['ws_company_a'],
      activeWorkspaceId: 'ws_company_a',
      role: 'owner', // Role in their personal profile / workspace A
    });

    // Foreign workspace
    inMemoryStore.workspaces.set('ws_company_b', {
      id: 'ws_company_b',
      name: 'Company B',
      ownerId: 'usr_company_b_owner',
      memberCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const foreignRole = await getUserWorkspaceRole(normalUserUid, 'ws_company_b', 'member@company.com');
    assert.equal(foreignRole, null, 'User must have NO role in foreign workspace B');

    console.log('✓ TEST 2 PASSED: Sovereign role bypass removed; user correctly denied access to foreign workspace');
    passed++;
  } catch (err) {
    console.error('✗ TEST 2 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 3: Team PATCH Field Allowlists & Credential Immunity
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 3] Team PATCH: Prohibit tampering with passwordHash, salt, email, or role...');
    const { inMemoryStore } = require(path.join(root, 'lib/db/store.ts'));
    const { updateTeamMember } = require(path.join(root, 'lib/db/team.ts'));

    const testMemberId = 'usr_member_tamper';
    inMemoryStore.users.set(testMemberId, {
      id: testMemberId,
      uid: testMemberId,
      email: 'member@test.com',
      displayName: 'Original Name',
      passwordHash: 'original_secure_hash',
      salt: 'original_salt',
      role: 'member',
      workspaceIds: ['ws_test'],
    });

    // Attempt malicious updates
    await assert.rejects(() => updateTeamMember(testMemberId, {
      displayName: 'Legit Updated Name',
      passwordHash: 'hacked_hash',
      salt: 'hacked_salt',
      email: 'attacker@evil.com',
      role: 'owner',
    }), /Workspace is required/);
    await updateTeamMember(testMemberId, { displayName: 'Legit Updated Name', passwordHash: 'hacked_hash', salt: 'hacked_salt', email: 'attacker@evil.com' });

    const updatedUser = inMemoryStore.users.get(testMemberId);
    assert.equal(updatedUser.passwordHash, 'original_secure_hash', 'passwordHash must remain uncorrupted');
    assert.equal(updatedUser.salt, 'original_salt', 'salt must remain uncorrupted');
    assert.equal(updatedUser.email, 'member@test.com', 'email must remain uncorrupted');
    assert.equal(updatedUser.role, 'member', 'non-admin cannot elevate role to owner');
    assert.equal(updatedUser.displayName, 'Legit Updated Name', 'legitimate allowlisted field should update');

    console.log('✓ TEST 3 PASSED: Sensitive fields and unauthorized role elevation safely protected');
    passed++;
  } catch (err) {
    console.error('✗ TEST 3 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 4: Task Tenant Isolation & Field Immutability
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 4] Task Isolation: Prevent cross-tenant ID hijacking and immutable field edits...');
    const { createTask, updateTask, getTaskById } = require(path.join(root, 'lib/db/tasks.ts'));

    // Create task in workspace A
    const taskA = await createTask('ws_alpha', {
      title: 'Confidential Alpha Strategy',
      creatorId: 'usr_alpha_lead',
    });

    assert.equal(taskA.workspaceId, 'ws_alpha');

    // Attempt to hijack or overwrite taskA by inserting with same ID into workspace B
    const taskB = await createTask('ws_beta', {
      id: taskA.id, // client-supplied existing ID
      title: 'Malicious Hijack Task',
      creatorId: 'usr_beta_attacker',
    });

    assert.notEqual(taskB.id, taskA.id, 'Task in workspace B must get a newly generated ID, never hijack task A');

    // Attempt to patch taskA immutable fields
    await updateTask(taskA.id, {
      workspaceId: 'ws_beta',
      creatorId: 'usr_attacker',
      title: 'Legit Title Change',
    });

    const refreshedA = await getTaskById(taskA.id);
    assert.equal(refreshedA.workspaceId, 'ws_alpha', 'workspaceId must be immutable');
    assert.equal(refreshedA.creatorId, 'usr_alpha_lead', 'creatorId must be immutable');
    assert.equal(refreshedA.title, 'Legit Title Change', 'title update must succeed');

    const completed = await updateTask(taskA.id, { status: 'done', completedAt: '1999-01-01' }, 'ws_alpha');
    assert(Number.isFinite(Date.parse(completed.completedAt)));
    assert.notEqual(completed.completedAt, '1999-01-01', 'Completion date is recorded by the server');
    const edited = await updateTask(taskA.id, { title: 'Completed and renamed' }, 'ws_alpha');
    assert.equal(edited.completedAt, completed.completedAt, 'Editing completed work preserves its completion date');
    const reopened = await updateTask(taskA.id, { status: 'todo' }, 'ws_alpha');
    assert.equal(reopened.completedAt, null, 'Reopening clears completion timing');

    console.log('✓ TEST 4 PASSED: Task identity and tenant ownership remain strictly immutable');
    passed++;
  } catch (err) {
    console.error('✗ TEST 4 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 5: Document Field Reconciliation & Immutability
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 5] Document Updates: Field reconciliation and immutable identity...');
    const { createDocument, updateDocument, getDocumentById } = require(path.join(root, 'lib/db/documents.ts'));

    const doc = await createDocument('ws_doc_workspace', {
      title: 'Architecture Blueprint',
      content: '# Architecture Spec',
      authorId: 'usr_architect',
      summary: 'Initial executive summary',
    });

    assert.equal(doc.version, 1);

    const updatedDoc = await updateDocument(doc.id, {
      id: 'doc_fake_new_id',
      workspaceId: 'ws_other',
      authorId: 'usr_imposter',
      summary: 'Revised executive summary v2',
      content: '# Updated Spec',
      versions: [
        { v: 1, date: '2026-10-10', author: 'Architect' },
        { v: 2, date: '2026-10-12', author: 'Lead' },
      ],
    });

    assert.equal(updatedDoc.id, doc.id, 'Document ID must be immutable');
    assert.equal(updatedDoc.workspaceId, 'ws_doc_workspace', 'Workspace ID must be immutable');
    assert.equal(updatedDoc.authorId, 'usr_architect', 'Author ID must be immutable');
    assert.equal(updatedDoc.version, 2, 'Version must be incremented');
    assert.equal(updatedDoc.summary, 'Revised executive summary v2');
    assert.equal(updatedDoc.versions.length, 2, 'Versions revision array preserved');

    console.log('✓ TEST 5 PASSED: Document versions and immutable fields verified');
    passed++;
  } catch (err) {
    console.error('✗ TEST 5 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 6: Session Cookie Profile Picture Stripping
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 6] Session Cookies: Large avatar URLs stripped to prevent cookie bloat...');
    const { createSessionToken, verifySessionToken } = require(path.join(root, 'lib/auth/token.ts'));

    const hugeBase64Avatar = 'data:image/png;base64,' + 'A'.repeat(4000);
    const token = createSessionToken({
      uid: 'usr_heavy_avatar',
      email: 'heavy@example.com',
      name: 'Heavy Avatar User',
      avatar: hugeBase64Avatar,
      role: 'member',
    });

    assert.ok(token.length < 500, `Token length (${token.length}) must be compact (< 500 bytes)`);
    const decoded = verifySessionToken(token);
    assert.equal(decoded.avatar, undefined, 'Huge data URI avatar must be stripped from session token');

    console.log('✓ TEST 6 PASSED: Session cookie bounded; oversize avatar safely stripped');
    passed++;
  } catch (err) {
    console.error('✗ TEST 6 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 7: SSRF Protection in Link-Preview Fetcher
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 7] SSRF Protection: Blocks private IPs, metadata endpoints, and loopbacks...');
    const { getLinkPreview, isValidUrl, isIpBlocked } = require(path.join(root, 'lib/link-preview/fetcher.ts'));

    assert.equal(isValidUrl('http://127.0.0.1:8080/admin'), false, 'Must reject 127.0.0.1');
    assert.equal(isValidUrl('http://169.254.169.254/latest/meta-data/'), false, 'Must reject cloud metadata');
    assert.equal(isValidUrl('http://192.168.1.1/router'), false, 'Must reject 192.168.1.1');
    assert.equal(isValidUrl('file:///etc/passwd'), false, 'Must reject file:// schemes');
    assert.equal(isIpBlocked('10.0.0.5'), true, 'Must block 10.0.0.0/8 private range');

    await assert.rejects(
      async () => await getLinkPreview('http://127.0.0.1:8080'),
      /SSRF/,
      'getLinkPreview must reject loopback'
    );

    console.log('✓ TEST 7 PASSED: SSRF guard successfully blocks internal IPs and non-HTTP protocols');
    passed++;
  } catch (err) {
    console.error('✗ TEST 7 FAILED:', err);
    throw err;
  }

  // -------------------------------------------------------------
  // Test 8: Voucher Redemption Atomic Verification
  // -------------------------------------------------------------
  try {
    console.log('\n[TEST 8] Voucher Redemption: Rejects wildcard pattern bypasses and verifies authenticity...');
    const redeemRoute = require(path.join(root, 'app/api/redeem/route.ts'));
    const { createSessionToken } = require(path.join(root, 'lib/auth/token.ts'));

    const testToken = createSessionToken({
      uid: 'usr_voucher_tester',
      email: 'tester@example.com',
      role: 'owner',
    });

    // Test unearned wildcard code
    const fakeWildcardReq = new Request('http://localhost:3000/api/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ code: 'CURSIS-FAKE-ATTEMPT-123' }),
    });

    const fakeRes = await redeemRoute.POST(fakeWildcardReq);
    assert.equal(fakeRes.status, 400, 'Unearned wildcard code must be rejected with 400');

    // Test authorized promo code
    const validCodeReq = new Request('http://localhost:3000/api/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ code: 'CURSIS-PRO-2026' }),
    });

    const validRes = await redeemRoute.POST(validCodeReq);
    const validData = await validRes.json();
    assert.equal(validRes.status, 200, 'Authorized code must succeed');
    assert.ok(validData.success, 'Redemption must report success');
    assert.ok(Array.isArray(validData.perks), 'Perks array must be returned');

    // Test replay protection (cannot redeem twice)
    const replayReq = new Request('http://localhost:3000/api/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ code: 'CURSIS-PRO-2026' }),
    });

    const replayRes = await redeemRoute.POST(replayReq);
    assert.equal(replayRes.status, 400, 'Replayed single-use voucher must be rejected with 400');

    console.log('✓ TEST 8 PASSED: Voucher wildcard bypass removed and replay attack prevented');
    passed++;
  } catch (err) {
    console.error('✗ TEST 8 FAILED:', err);
    throw err;
  }

  console.log('\n================================================================');
  console.log(`All ${passed} Audit Repairs Regression Tests Passed Successfully! 🚀`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\nSuite failed with error:', err);
  process.exit(1);
});
