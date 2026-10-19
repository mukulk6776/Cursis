const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require('typescript');
process.env.AUTH_SESSION_SECRET = 'privacy-test-session-secret-32-characters';
process.env.NEXT_PUBLIC_APP_URL = 'https://app.example';
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText, filename);
function mock(file, exports) {
  const filename = path.join(root, file);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}
let activeDb = null;
let currentUser = { uid: 'alice', email: 'alice@example.com' };
let passwordValid = false;
const calls = [];
mock('lib/mongodb.ts', { getDb: async () => activeDb });
mock('lib/db/store.ts', { inMemoryStore: { users: new Map(), workspaces: new Map(), tasks: new Map() } });
mock('lib/db/memberships.ts', { inMemoryMemberships: new Map() });
mock('lib/db/invitations.ts', { inMemoryInvitations: new Map() });
mock('lib/auth/session.ts', { getAuthenticatedUser: async () => currentUser });
mock('lib/db/users.ts', { verifyPasswordResultAsync: async () => ({ valid: passwordValid }) });
mock('lib/auth/firebase-admin.ts', { verifyFirebaseIdToken: async () => ({ email_verified: true, email: 'mallory@example.com', auth_time: Date.now() / 1000 }) });
mock('lib/auth/rateLimit.ts', { checkRateLimit: async () => ({ allowed: true }), recordAttempt: async () => {} });
const core = require('../lib/privacy/core.ts');
const data = require('../lib/privacy/data.ts');
const routes = require('../app/api/privacy/route.ts');
const cookies = require('../lib/analytics/privacy.ts');

function fakeDb(rows = {}) {
  return { collection(name) {
    return {
      find(scope, options) { calls.push(['find', name, scope, options]); return {
        limit() { return this; }, sort() { return this; }, async toArray() { return rows[name] || []; }
      }; },
      async findOne(scope) { calls.push(['findOne', name, scope]); return (rows[name] || [])[0] || null; },
      async deleteMany(scope) { calls.push(['deleteMany', name, scope]); },
      async deleteOne(scope) { calls.push(['deleteOne', name, scope]); },
      async createIndex(scope, options) { calls.push(['index', name, scope, options]); },
      async updateOne(scope, changes, options) { calls.push(['update', name, scope, changes, options]); },
      async insertOne(row) { calls.push(['insert', name, row]); },
      async countDocuments() { return 0; },
    };
  } };
}
function request(body, origin = 'https://app.example') {
  return new Request('https://app.example/api/privacy', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('privacy boundary and lifecycle behavior', async t => {
  await t.test('missing or cross-origin mutation rejected before database writes', async () => {
    calls.length = 0;
    assert.equal((await routes.POST(request({ action: 'profile' }, 'https://evil.example'))).status, 403);
    assert.equal(calls.length, 0);
  });
  await t.test('anonymous export rejected', async () => {
    currentUser = null;
    assert.equal((await routes.GET(new Request('https://app.example/api/privacy?export=json'))).status, 401);
    currentUser = { uid: 'alice', email: 'alice@example.com' };
  });
  await t.test('privacy writes fail closed without durable database', async () => {
    activeDb = null;
    assert.equal((await routes.POST(request({ action: 'request', kind: 'access', message: 'Please provide my data' }))).status, 503);
  });
  await t.test('profile correction does not permit role or credential mutation', async () => {
    activeDb = fakeDb(); calls.length = 0;
    assert.equal((await routes.POST(request({ action: 'profile', displayName: 'Alice', role: 'owner', passwordHash: 'bad' }))).status, 200);
    const write = calls.find(c => c[0] === 'update');
    assert.deepEqual(Object.keys(write[3].$set).sort(), ['department', 'displayName', 'title']);
    assert.deepEqual(write[2], { uid: 'alice' });
  });
  await t.test('nominee requires affirmative attestation and never assigns access', async () => {
    activeDb = fakeDb(); calls.length = 0;
    assert.equal((await routes.POST(request({ action: 'nominee', name: 'Bob', email: 'bob@example.com', confirmed: 'true' }))).status, 400);
    assert.equal((await routes.POST(request({ action: 'nominee', name: 'Bob', email: 'bob@example.com', confirmed: true }))).status, 200);
    const write = calls.find(c => c[0] === 'update');
    assert.equal(write[1], 'privacy_nominees');
    assert.equal(write[3].$set.uid, 'alice');
    assert.equal(write[3].$set.role, undefined);
  });
  await t.test('erasure rejects invalid password and a different Google identity', async () => {
    activeDb = fakeDb({ users: [{ passwordHash: 'hash', salt: 'salt' }] }); calls.length = 0;
    assert.equal((await routes.POST(request({ action: 'erase', confirmation: 'DELETE MY ACCOUNT', password: 'wrong' }))).status, 403);
    assert.equal((await routes.POST(request({ action: 'erase', confirmation: 'DELETE MY ACCOUNT', idToken: 'other-user' }))).status, 403);
    assert.equal(calls.some(c => c[0] === 'update'), false);
  });
  await t.test('verified closure records job and blocks both identities before returning accepted', async () => {
    passwordValid = true; calls.length = 0;
    const response = await routes.POST(request({ action: 'erase', confirmation: 'DELETE MY ACCOUNT', password: 'valid' }));
    assert.equal(response.status, 202);
    const writes = calls.filter(c => c[0] === 'update');
    assert.deepEqual(writes.map(c => c[1]), ['privacy_erasures', 'privacy_blocks', 'privacy_blocks']);
    assert.equal(writes[0][3].$setOnInsert.status, 'pending');
    assert.ok(writes[0][3].$setOnInsert.externalTasks.length > 0);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  });
  await t.test('closure blocks survive process cache recreation', async () => {
    activeDb = fakeDb({ privacy_blocks: [{ blockedAt: new Date() }] });
    assert.equal(await core.accountBlocked('alice', 'alice@example.com'), true);
  });
  await t.test('access receipts persist deadlines and acknowledgment', async () => {
    activeDb = fakeDb(); calls.length = 0;
    const response = await routes.POST(request({ action: 'request', kind: 'access', message: 'My processing summary and recipients' }));
    assert.equal(response.status, 201);
    const row = calls.find(c => c[0] === 'insert')[2];
    assert.equal(+row.acknowledgeBy - +row.receivedAt, 72 * 3600000);
    assert.equal(+row.resolveBy - +row.receivedAt, 30 * 86400000);
    assert.ok(row.acknowledgedAt);
  });
  await t.test('export scopes do not dump shared workspaces and redact nested credentials', async () => {
    activeDb = fakeDb({ ordis_conversations: [{ messages: [{ text: 'my note', metadata: { accessToken: 'secret', safe: 'ok' } }] }] }); calls.length = 0;
    const result = await data.exportAccount('alice', 'alice@example.com');
    assert.equal(calls.some(c => c[1] === 'tasks' || c[1] === 'integrations'), false);
    assert.deepEqual(calls.find(c => c[1] === 'ordis_conversations')[2], { userId: 'alice' });
    assert.equal(JSON.stringify(result).includes('secret'), false);
    assert.ok(result.scope.includes('not a complete'));
  });
  await t.test('active erasure preserves shared tenant records and never completes external jobs', async () => {
    activeDb = fakeDb({ workspaces: [{ id: 'shared', ownerId: 'alice', memberCount: 2 }], workspace_memberships: [{ userId: 'bob' }] }); calls.length = 0;
    const result = await data.eraseActiveData(activeDb, 'alice', 'alice@example.com');
    assert.deepEqual(result.sharedWorkspaces, ['shared']);
    assert.equal(calls.some(c => c[0] === 'deleteMany' && c[2].workspaceId === 'shared'), false);
    assert.equal(calls.some(c => c[0] === 'deleteMany' && ['privacy_blocks', 'privacy_erasures', 'audit_logs'].includes(c[1])), false);
  });
  await t.test('cookie authorization rejects missing, malformed, future and expired choices', () => {
    const current = { essential: true, functional: false, analytics: true, timestamp: new Date().toISOString() };
    assert.equal(cookies.hasCurrentCookieChoice(current), true);
    for (const bad of [null, {}, { ...current, analytics: 'true' }, { ...current, timestamp: 'bad' },
      { ...current, timestamp: new Date(Date.now() + 3600000).toISOString() },
      { ...current, timestamp: new Date(Date.now() - 181 * 86400000).toISOString() }]) assert.equal(cookies.hasCurrentCookieChoice(bad), false);
  });
});
