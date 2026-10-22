const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness({ age = 1, complete = false, dismissed = false, denied = false, available = true } = {}) {
  const reads = [], writes = [];
  const exports = {};
  const api = { apiSuccess: data => Response.json(data), apiError: (error, status) => Response.json({ error }, { status }) };
  const imports = {
    '@/lib/api/response': api,
    '@/lib/auth/rbac': { authorizeWorkspaceAccess: async (_request, workspaceId) => {
      assert.equal(workspaceId, 'ws_alice');
      return denied ? { errorResponse: api.apiError('Forbidden', 403) } : { user: { uid: 'alice' }, workspaceId, role: 'owner' };
    } },
    '@/lib/engagement/http': { readAppBody: request => request.json(), engagementFailure: () => api.apiError('Unavailable', 503) },
    '@/lib/mongodb': { getDb: async () => available ? { collection: name => ({
      findOne: async query => {
        reads.push({ name, query });
        if (name === 'workspaces') return { createdAt: new Date(Date.now() - age * 86400000).toISOString() };
        if (name === 'workspace_activation') return dismissed ? {} : null;
        assert.equal(query.workspaceId, 'ws_alice');
        if (name !== 'projects') assert.equal(query.userId || query.inviterUserId, 'alice');
        return complete ? {} : null;
      },
      updateOne: async (query, update) => writes.push({ query, update }),
    }) } : null },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/activation/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => imports[name] || require(name), URL, Date });
  return { reads, writes, get: () => exports.GET(new Request('https://cursis.in/api/activation?workspaceId=ws_alice')), dismiss: body => exports.PATCH(new Request('https://cursis.in/api/activation', { method: 'PATCH', body: JSON.stringify(body) })) };
}
test('checklist derives progress from scoped real activity and hides after seven days, completion or dismissal', async () => {
  assert.deepEqual(await (await harness().get()).json(), { visible: true, steps: [false, false, false] });
  for (const options of [{ age: 7 }, { age: -1 }, { complete: true }, { dismissed: true }]) assert.equal((await (await harness(options).get()).json()).visible, false);
});
test('checklist enforces membership, durable storage and per-user dismissal', async () => {
  assert.equal((await harness({ denied: true }).get()).status, 403);
  assert.equal((await harness({ available: false }).get()).status, 503);
  const h = harness();
  assert.equal((await h.dismiss({ workspaceId: 'ws_alice', dismissed: true, userId: 'bob' })).status, 400);
  assert.equal((await h.dismiss({ workspaceId: 'ws_alice', dismissed: true })).status, 200);
  assert.equal(h.writes[0].query._id, 'ws_alice:alice');
  assert.equal(h.writes[0].update.$set.userId, 'alice');
});
