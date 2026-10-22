const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => imports[name] || require(name), URL, TextEncoder, process: { env: {} } });
  return exports;
}
class PrivacyError extends Error { constructor(message, status) { super(message); this.status = status; } }
const api = { apiSuccess: data => Response.json(data), apiError: (error, status) => Response.json({ error }, { status }) };
const http = load('lib/engagement/http.ts', { '@/lib/api/response': api, '@/lib/privacy/core': { PrivacyError }, '@/lib/site': { SITE_URL: 'https://cursis.in' } });
function harness({ signedIn = true, available = true, old = false } = {}) {
  let source;
  const writes = [];
  const route = load('app/api/acquisition/route.ts', {
    '@/lib/api/response': { ...api, getAuthOrError: async () => signedIn ? { user: { uid: 'alice' } } : { errorResponse: api.apiError('Unauthorized', 401) } },
    '@/lib/mongodb': { getDb: async () => available ? { collection: () => ({ updateOne: async (query, update) => {
      writes.push({ query, update });
      assert.equal(query.$or[0].uid, 'alice');
      assert.equal(query.signupSource.$exists, false);
      assert(Number.isFinite(Date.parse(query.createdAt.$gte)));
      if (source || old) return { modifiedCount: 0 };
      source = update.$set.signupSource;
      return { modifiedCount: 1 };
    } }) } : null },
    '@/lib/engagement/http': http,
  });
  return { writes, post(body, headers = {}) { return route.POST(new Request('https://cursis.in/api/acquisition', {
    method: 'POST', headers: { origin: 'https://cursis.in', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  })); } };
}
const input = { source: 'ordis-demo', consent: true };
test('source attribution is consented, owned by the signed-in new user and write-once', async () => {
  const h = harness();
  assert.equal((await (await h.post(input)).json()).recorded, true);
  assert.equal((await (await h.post(input)).json()).recorded, false);
  assert.equal((await (await harness({ old: true }).post(input)).json()).recorded, false);
  assert.equal(h.writes[0].update.$set.signupSource, 'ordis-demo');
});
test('rejects anonymous, cross-origin, missing-consent and arbitrary-identity requests', async () => {
  assert.equal((await harness({ signedIn: false }).post(input)).status, 401);
  const h = harness();
  for (const body of [{ ...input, consent: false }, { ...input, uid: 'bob' }, { ...input, source: 'unknown' }]) assert.equal((await h.post(body)).status, 400);
  assert.equal((await h.post(input, { origin: 'https://evil.test' })).status, 403);
  assert.equal((await h.post(input, { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await h.post({ ...input, extra: 'x'.repeat(13000) })).status, 413);
  assert.equal(h.writes.length, 0);
  assert.equal((await harness({ available: false }).post(input)).status, 503);
});
