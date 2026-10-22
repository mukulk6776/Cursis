const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => imports[name] || require(name), Date, Set, Map, URL, TextEncoder });
  return exports;
}
const csv = load('lib/engagement/csv.ts');
const header = 'name,assignee email,due date,status\n';
test('CSV handles BOM, CRLF, commas, escaped quotes, reordered headers and multiline quoted fields', () => {
  const rows = csv.parseTaskCsv('\uFEFFstatus,due date,assignee email,name\r\ndone,2026-10-22,Alice@Example.com,"A, ""quoted""\nname"\r\n', ['alice@example.com']);
  assert.equal(rows.length, 1); assert.equal(rows[0].name, 'A, "quoted"\nname');
  assert.equal(rows[0].status, 'done'); assert.equal(rows[0].email, 'alice@example.com'); assert.equal(rows[0].errors.length, 0);
});
test('CSV rejects malformed input, impossible dates, unknown members/statuses and oversized batches', () => {
  for (const value of ['', header, header + '"Unclosed', 'name,name,due date,status\nA,,2026-10-22,todo', header + '"A"bad,,2026-10-22,todo']) assert.throws(() => csv.parseTaskCsv(value, []));
  const rows = csv.parseTaskCsv(header + ',bob@example.com,2026-02-30,__proto__\n', ['alice@example.com']);
  assert.equal(rows[0].errors.length, 4); assert.equal(rows[0].status, 'todo');
  assert.throws(() => csv.parseTaskCsv(header + 'a'.repeat(64000), []), /64 KB/);
  assert.throws(() => csv.parseTaskCsv(header + 'A,,2026-10-22,todo\n'.repeat(101), []), /100 tasks/);
});
function harness({ denied = false, available = true, failOnce = false } = {}) {
  const stored = new Map();
  let writes = 0;
  const api = { apiSuccess: data => Response.json(data), apiError: (error, status) => Response.json({ error }, { status }) };
  const route = load('app/api/tasks/import/route.ts', {
    '@/lib/engagement/csv': csv, '@/lib/api/response': api,
    '@/lib/auth/rbac': { authorizeWorkspaceAccess: async (_request, workspaceId) => {
      assert.equal(workspaceId, 'ws_alice');
      return denied ? { errorResponse: api.apiError('Forbidden', 403) } : { workspaceId, user: { uid: 'alice' } };
    } },
    '@/lib/engagement/http': { readAppBody: request => request.json(), engagementFailure: () => api.apiError('Unavailable', 503) },
    '@/lib/mongodb': { getDb: async () => available ? { collection(name) {
      if (name === 'workspaces') return { findOne: async query => { assert.equal(query.id, 'ws_alice'); return { ownerId: 'alice' }; } };
      if (name === 'workspace_memberships') return { find: query => { assert.equal(query.workspaceId, 'ws_alice'); return { toArray: async () => [] }; } };
      if (name === 'users') return { find: query => { assert.deepEqual([...query.$or[0].uid.$in], ['alice']); return { toArray: async () => [{ uid: 'alice', email: 'alice@example.com', displayName: 'Alice' }] }; } };
      assert.equal(name, 'tasks');
      return {
        find: () => ({ toArray: async () => [...stored.values()] }),
        bulkWrite: async operations => { writes++; for (const operation of operations) {
          const { filter, update } = operation.updateOne;
          assert.equal(filter.workspaceId, 'ws_alice');
          if (!stored.has(filter._id)) stored.set(filter._id, update.$setOnInsert);
          if (failOnce) { failOnce = false; throw new Error('Partial write'); }
        } },
      };
    } } : null },
  });
  const body = { workspaceId: 'ws_alice', batchId: '223e4567-e89b-42d3-a456-426614174000', csv: header + 'A,alice@example.com,2026-10-22,todo\nB,,2026-10-23,completed' };
  return { stored, post: changes => route.POST(new Request('https://cursis.in/api/tasks/import', { method: 'POST', body: JSON.stringify({ ...body, ...changes }) })), get writes() { return writes; } };
}
test('CSV server revalidates membership and all rows before any write, and requires durable storage', async () => {
  assert.equal((await harness({ denied: true }).post()).status, 403);
  assert.equal((await harness({ available: false }).post()).status, 503);
  const h = harness();
  assert.equal((await h.post({ csv: header + 'A,bob@example.com,2026-10-22,todo' })).status, 400);
  assert.equal((await h.post({ uid: 'bob' })).status, 400); assert.equal(h.writes, 0);
});
test('CSV retries recover partial writes without duplicates and reject a changed batch', async () => {
  const h = harness({ failOnce: true });
  assert.equal((await h.post()).status, 503); assert.equal(h.stored.size, 1);
  assert.equal((await h.post()).status, 200); assert.equal(h.stored.size, 2);
  assert.equal((await h.post()).status, 200); assert.equal(h.stored.size, 2);
  assert.equal((await h.post({ csv: header + 'Changed,,2026-10-22,todo' })).status, 409);
  for (const task of h.stored.values()) { assert.equal(task.creatorId, 'alice'); assert.equal(task.workspaceId, 'ws_alice'); assert.equal(task.completedAt, null); }
});
