const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness(connect) {
  let attempts = 0, closes = 0, now = 1000;
  const timers = new Map(), db = {}, exports = {}, globals = {};
  class MongoClient {
    connect() { attempts++; return connect(attempts).then(() => this); }
    db() { return db; }
    async close() { closes++; }
  }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/mongodb.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    exports, require: name => name === 'mongodb' ? { MongoClient } : require(name),
    global: globals, process: { env: { MONGODB_URI: 'mongodb://db.example/cursis' } }, URL,
    Date: { now: () => now }, console: { warn() {} },
    setTimeout(fn) { const id = {}; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
  });
  return { exports, db, timers, get attempts() { return attempts; }, get closes() { return closes; }, advance() { now += 30_001; } };
}
test('concurrent callers share one connection and one retry after cooldown', async () => {
  const h = harness(async attempt => { if (attempt === 1) throw new Error('Unavailable'); });
  assert.deepEqual(await Promise.all([h.exports.getDb(), h.exports.getDb()]), [null, null]);
  assert.equal(await h.exports.getDb(), null);
  assert.equal(h.attempts, 1); assert.equal(h.closes, 1);
  h.advance();
  const results = await Promise.all([h.exports.getDb(), h.exports.getDb()]);
  assert(results.every(db => db === h.db)); assert.equal(h.attempts, 2);
  assert.equal(h.timers.size, 0);
});
test('a stalled DNS/connect attempt times out and does not retry within one request', async () => {
  const h = harness(() => new Promise(() => {}));
  const pending = h.exports.getDb();
  for (const timeout of h.timers.values()) timeout();
  assert.equal(await pending, null);
  assert.equal(await h.exports.getDb(), null);
  assert.equal(h.attempts, 1); assert.equal(h.closes, 1);
});
