const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

function load(file, imports, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => name in imports ? imports[name] : require(name),
    process: { env: { NODE_ENV: 'test' } }, console, Buffer, TextEncoder, URL, ...globals });
  return exports;
}
const policy = load('lib/auth/password.ts', {});
const salt = crypto.randomBytes(16).toString('hex');
const store = { users: new Map() };
const get = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);
function matches(document, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === '$or') return expected.some(item => matches(document, item));
    const actual = get(document, key);
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      return Object.entries(expected).every(([operator, value]) => {
        if (operator === '$exists') return (actual !== undefined) === value;
        if (operator === '$type') return typeof actual === value;
        if (operator === '$ne') return actual !== value;
        if (operator === '$gt') return actual > value;
        if (operator === '$gte') return actual >= value;
        if (operator === '$lt') return actual < value;
        if (operator === '$lte') return actual <= value;
        throw new Error(`Unsupported operator: ${operator}`);
      });
    }
    return actual === expected;
  });
}
function harness() {
  let now = Date.now(), available = true, configured = true, failMail = false, blocked = false;
  let user = { id: 'alice', uid: 'alice', email: 'alice@gmail.com', salt, passwordHash: 'old-hash' };
  const mail = [], buckets = new Map();
  const users = {
    async findOne(query) { return user && matches(user, query) ? structuredClone(user) : null; },
    async findOneAndUpdate(query, update) {
      if (!user || !matches(user, query)) return null;
      if (update.$set) Object.assign(user, update.$set);
      if (update.$inc) user.passwordReset.attempts += update.$inc['passwordReset.attempts'];
      return structuredClone(user);
    },
    async updateOne(query, update) {
      if (!user || !matches(user, query)) return { modifiedCount: 0 };
      Object.assign(user, update.$set);
      if (update.$unset?.passwordReset !== undefined) delete user.passwordReset;
      return { modifiedCount: 1 };
    },
  };
  const db = { collection(name) { return name === 'users' ? users : {
    async createIndex() {},
    async findOneAndUpdate(query) {
      const count = (buckets.get(query._id) || 0) + 1;
      buckets.set(query._id, count);
      return { count };
    },
  }; } };
  const mongodb = { getDb: async () => available ? db : null, getCollection: async () => available ? users : null };
  const credentials = load('lib/db/users.ts', {
    './store': { inMemoryStore: store }, '@/lib/mongodb': mongodb,
    '@/lib/auth/founder': { isFounderEmail: () => false, getAuthorizedTitle: (_, value) => value, getAuthorizedRole: (_, value) => value, getAuthorizedDepartment: (_, value) => value },
  });
  class ClockDate extends Date { constructor(value) { super(value === undefined ? now : value); } static now() { return now; } }
  const route = load('app/api/auth/password-reset/route.ts', {
    '@/lib/mongodb': mongodb, '@/lib/db/users': credentials,
    '@/lib/auth/token': { SESSION_SECRET: 'test-secret-for-reset-codes' },
    '@/lib/auth/rateLimit': { getClientIP: request => request.headers.get('x-forwarded-for') || 'test' },
    '@/lib/auth/password': policy, '@/lib/privacy/core': { accountBlocked: async () => blocked },
    '@/lib/email/notifications': { isPasswordResetEmailConfigured: () => configured,
      sendPasswordResetEmail: async (email, code) => { if (failMail) throw new Error('Provider unavailable'); mail.push({ email, code }); },
    },
  }, { Date: ClockDate });
  const session = load('lib/auth/session.ts', {
    'next/headers': { cookies: async () => ({ get: () => undefined }) }, '@/lib/db/store': { inMemoryStore: store },
    './founder': { isFounderEmail: () => false }, '@/lib/privacy/core': { accountBlocked: async () => blocked },
    '@/lib/mongodb': mongodb, './token': {},
  });
  return { mail, users, credentials, session,
    get user() { return user; },
    advance(ms) { now += ms; },
    unavailable() { available = false; }, unconfigured() { configured = false; }, failMail() { failMail = true; },
    unknown() { user = null; }, oauth() { delete user.passwordHash; }, block() { blocked = true; },
    post(body, headers = {}) { return route.POST(new Request('https://cursis.in/api/auth/password-reset', {
      method: 'POST', headers: { origin: 'https://cursis.in', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
    })); },
  };
}
const request = { action: 'request', email: 'alice@gmail.com' };
const reset = (h, code = h.mail.at(-1).code) => ({ action: 'reset', email: request.email, code, password: 'New!Secure42' });

test('delivers a code, stores only its keyed digest, updates credentials once and revokes old sessions', async () => {
  const h = harness();
  assert.equal((await h.post({ ...request, email: ' ALICE@GMAIL.COM ' })).status, 200);
  assert.match(h.mail[0].code, /^\d{6}$/);
  assert.equal(h.mail[0].email, request.email);
  assert.notEqual(h.user.passwordReset.hash, h.mail[0].code);
  const code = h.mail[0].code;
  const response = await h.post(reset(h));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /cursis_session=;.*Max-Age=0/);
  assert.equal(h.user.passwordReset, undefined);
  assert.equal((await h.credentials.verifyPasswordResultAsync('New!Secure42', h.user.salt, h.user.passwordHash)).valid, true);
  assert.equal(await h.session.isSessionRevoked({ email: request.email, createdAt: h.user.passwordChangedAt - 1 }), true);
  assert.equal(await h.session.isSessionRevoked({ email: request.email, createdAt: h.user.passwordChangedAt + 1 }), false);
  assert.equal((await h.post(reset(h, code))).status, 400);
});

test('five concurrent wrong guesses lock the code; expired codes cannot update credentials', async () => {
  const h = harness();
  await h.post(request);
  const wrong = h.mail[0].code === '000000' ? '111111' : '000000';
  const responses = await Promise.all(Array.from({ length: 5 }, () => h.post(reset(h, wrong))));
  assert(responses.every(response => response.status === 400));
  assert.equal((await h.post(reset(h))).status, 400);
  assert.equal(h.user.passwordHash, 'old-hash');
  const expired = harness();
  await expired.post(request); expired.advance(600001);
  assert.equal((await expired.post(reset(expired))).status, 400);
});

test('concurrent valid submissions can change the password only once', async () => {
  const h = harness(); await h.post(request);
  const statuses = await Promise.all([h.post(reset(h)), h.post(reset(h))]);
  assert.deepEqual(statuses.map(response => response.status).sort(), [200, 400]);
});

test('resend has a cooldown, replaces the previous code, and is limited per email across IPs', async () => {
  const h = harness(); await h.post(request);
  const first = h.mail[0].code;
  await h.post(request); assert.equal(h.mail.length, 1);
  h.advance(60001); await h.post(request); assert.equal(h.mail.length, 2);
  if (first !== h.mail[1].code) assert.equal((await h.post(reset(h, first))).status, 400);
  const limited = harness();
  for (let i = 0; i < 5; i++) await limited.post(request, { 'x-forwarded-for': `test-${i}` });
  const response = await limited.post(request, { 'x-forwarded-for': 'another-ip' });
  assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '1800');
});

test('unknown, Google-only, and blocked accounts return the same message and receive no reset code', async () => {
  const valid = harness(); const expected = await (await valid.post(request)).json();
  for (const kind of ['unknown', 'oauth', 'block']) {
    const h = harness(); h[kind]();
    assert.deepEqual(await (await h.post(request)).json(), expected);
    assert.equal(h.mail.length, 0);
  }
});

test('storage and delivery failures fail closed and do not leave a usable unsent code', async () => {
  for (const kind of ['unavailable', 'unconfigured', 'failMail']) {
    const h = harness(); h[kind]();
    assert.equal((await h.post(request)).status, 503);
    assert.equal(h.user.passwordReset, undefined);
  }
});

test('validates origin, JSON size, email, code and the shared signup password policy', async () => {
  const h = harness();
  assert.equal((await h.post(request, { origin: 'https://evil.test' })).status, 403);
  assert.equal((await h.post(request, { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await h.post({ ...request, extra: 'x'.repeat(5000) })).status, 413);
  assert.equal((await h.post({ ...request, email: { $ne: '' } })).status, 400);
  await h.post(request);
  for (const password of ['short', 'password@123', 'NoSpecial42', 'a'.repeat(129)]) {
    assert.equal((await h.post({ ...reset(h), password })).status, 400);
  }
  assert.equal((await h.post(reset(h, '12345'))).status, 400);
  assert.equal(policy.passwordValidationError('Good!Password42'), null);
});

test('password login reads durable credentials before a stale server cache', async () => {
  const h = harness();
  store.users.set('alice', { ...h.user, passwordHash: 'stale-hash' });
  assert.equal((await h.credentials.findUserByEmail(request.email)).passwordHash, 'old-hash');
  store.users.clear();
});
