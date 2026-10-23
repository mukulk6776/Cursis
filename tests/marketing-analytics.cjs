const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('lib/analytics/marketing.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function setup() {
  let consent = false;
  const calls = [], exports = {};
  vm.runInNewContext(source, { exports, require: () => ({ isSessionReplayAllowed: () => consent }), fetch: (url, options) => { calls.push({ url, options, body: JSON.parse(options.body) }); return Promise.resolve({}); } });
  return { exports, calls, allow: () => { consent = true; } };
}
test('requested marketing actions use distinct API-compatible counters and require consent', () => {
  const { exports, calls, allow } = setup();
  for (const name of Object.keys(exports.MARKETING_EVENTS)) exports.trackMarketing(name, name === 'compare_view' ? '/compare' : '/');
  assert.equal(calls.length, 0);
  allow();
  for (const name of Object.keys(exports.MARKETING_EVENTS)) exports.trackMarketing(name, name === 'compare_view' ? '/compare' : '/');
  assert.equal(calls.length, 5);
  assert.equal(new Set(calls.map(c => JSON.stringify(c.body))).size, 5);
  for (const call of calls) {
    assert.equal(call.url, '/api/marketing-events');
    assert.equal(call.options.credentials, 'omit');
    assert.deepEqual(Object.keys(call.body).sort(), ['consent', 'event', 'path', 'value']);
    assert(['cta_click', 'demo_interaction', 'page_view'].includes(call.body.event));
    assert(['', 'signup', '100'].includes(call.body.value));
  }
  assert.equal(calls[4].body.path, '/compare');
});
test('a failed analytics request cannot interrupt navigation', async () => {
  const exports = {};
  vm.runInNewContext(source, { exports, require: () => ({ isSessionReplayAllowed: () => true }), fetch: () => Promise.reject(new Error('offline')) });
  assert.doesNotThrow(() => exports.trackMarketing('signup_click', '/'));
  await new Promise(resolve => setImmediate(resolve));
});
