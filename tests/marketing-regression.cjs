const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
let db;
const calls = [];
const mongo = path.join(root, 'lib/mongodb.ts');
require.cache[mongo] = { id: mongo, filename: mongo, loaded: true, exports: { getDb: async () => db } };
const form = require('../app/api/marketing/[kind]/route.ts');
const analytics = require('../app/api/marketing-events/route.ts');
const request = (body, extra = {}) => new Request('https://cursis.in/api/marketing/contact', { method: 'POST', headers: { origin: 'https://cursis.in', 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) });
const ctx = kind => ({ params: Promise.resolve({ kind }) });
const valid = { name: 'Test Person', email: 'test@example.com', message: 'A meaningful support inquiry.', consent: 'yes', website: '' };
function fakeDb(count = 1) {
  return { collection(name) { return {
    async createIndex() {},
    async findOneAndUpdate(filter, update, options) { calls.push({ name, filter, update, options }); return { count }; },
    async updateOne(filter, update, options) { calls.push({ name, filter, update, options }); },
    async insertOne(value) { calls.push({ name, value }); },
  }; } };
}
test('public marketing form and measurement boundaries', async t => {
  await t.test('rejects malformed email, missing consent and spam trap before writes', async () => {
    calls.length = 0; db = fakeDb();
    for (const body of [{ ...valid, email: 'bad' }, { ...valid, consent: undefined }, { ...valid, website: 'bot' }, { ...valid, message: 'short' }]) assert.equal((await form.POST(request(body), ctx('contact'))).status, 400);
    assert.equal(calls.length, 0);
  });
  await t.test('rejects untrusted origin and unknown form kind', async () => {
    assert.equal((await form.POST(request(valid, { origin: 'https://evil.test' }), ctx('contact'))).status, 403);
    assert.equal((await form.POST(request(valid), ctx('other'))).status, 404);
  });
  await t.test('rejects oversized payload', async () => {
    assert.equal((await form.POST(request({ ...valid, message: 'x'.repeat(13000) }), ctx('contact'))).status, 413);
  });
  await t.test('does not claim success during database outage', async () => {
    db = null;
    assert.equal((await form.POST(request(valid), ctx('contact'))).status, 503);
  });
  await t.test('atomically counts attempts and limits before inquiry write', async () => {
    calls.length = 0; db = fakeDb(6);
    const response = await form.POST(request(valid), ctx('contact'));
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '1800');
    assert.equal(calls.some(c => c.name === 'marketing_contacts'), false);
    assert.deepEqual(calls[0].update.$inc, { count: 1 });
  });
  await t.test('contact success means a durable inquiry write with consent', async () => {
    calls.length = 0; db = fakeDb();
    assert.equal((await form.POST(request(valid), ctx('contact'))).status, 200);
    const record = calls.find(c => c.name === 'marketing_contacts').value;
    assert.equal(record.message, valid.message);
    assert.ok(record.consentAt instanceof Date);
    assert.equal(record.website, undefined);
  });
  await t.test('newsletter normalizes and upserts email independently of contact', async () => {
    calls.length = 0; db = fakeDb();
    assert.equal((await form.POST(request({ ...valid, email: 'TEST@example.com' }), ctx('newsletter'))).status, 200);
    const write = calls.find(c => c.name === 'marketing_subscribers');
    assert.deepEqual(write.filter, { email: 'test@example.com' });
    assert.equal(write.options.upsert, true);
  });
  await t.test('analytics rejects missing consent, private paths, queries and PII-like values', async () => {
    calls.length = 0;
    for (const body of [{ event: 'page_view', path: '/' }, { consent: true, event: 'page_view', path: '/dashboard' }, { consent: true, event: 'page_view', path: '/?email=a' }, { consent: true, event: 'cta_click', path: '/', value: 'person@example.com' }]) assert.equal((await analytics.POST(request(body))).status, 400);
    assert.equal(calls.length, 0);
  });
  await t.test('DNT and GPC suppress analytics writes', async () => {
    calls.length = 0;
    for (const header of ['dnt', 'sec-gpc']) assert.equal((await analytics.POST(request({ consent: true, event: 'page_view', path: '/' }, { [header]: '1' }))).status, 204);
    assert.equal(calls.length, 0);
  });
  await t.test('analytics persists aggregate counts without visitor identifiers', async () => {
    calls.length = 0; db = fakeDb();
    assert.equal((await analytics.POST(request({ consent: true, event: 'cta_click', path: '/', value: 'signup' }))).status, 204);
    assert.deepEqual(Object.keys(calls[0].filter).sort(), ['day', 'event', 'path', 'value']);
    assert.deepEqual(calls[0].update, { $inc: { count: 1 } });
  });
});
