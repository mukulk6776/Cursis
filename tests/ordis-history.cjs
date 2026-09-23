// Run with: node tests/ordis-history.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const appRoot = fs.existsSync(path.join(root, 'package.json')) ? root : path.resolve(root, '../..');
const ts = require(path.join(appRoot, 'node_modules/typescript'));
const load = Module._load;
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  if (name.startsWith('@/')) {
    const staged = path.join(root, name.slice(2));
    name = fs.existsSync(staged + '.ts') ? staged : path.join(appRoot, name.slice(2));
  }
  return resolve.call(this, name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText, filename);
};

let actor = 'alice';
let available = true;
let dbCalls = 0;
const records = new Map();
const key = value => JSON.stringify([value.userId, value.workspaceId, value.id]);
const fakeCollection = {
  createIndex: async () => undefined,
  find: query => {
    let limit = Infinity;
    return {
      sort() { return this; },
      limit(value) { limit = value; return this; },
      async toArray() {
        return [...records.values()].filter(row => row.userId === query.userId && row.workspaceId === query.workspaceId)
          .filter(row => !query.$or || row.updatedAt < query.$or[0].updatedAt.$lt || (row.updatedAt === query.$or[1].updatedAt && row.id < query.$or[1].id.$lt))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id)).slice(0, limit);
      },
    };
  },
  findOneAndUpdate: async (query, update, options) => {
    assert.equal(options.upsert, true);
    assert.equal(options.returnDocument, 'after');
    const existing = records.get(key(query));
    const saved = { ...(existing || update.$setOnInsert), ...update.$set, _id: 'internal-id' };
    records.set(key(query), saved);
    return saved;
  },
  deleteOne: async query => ({ deletedCount: Number(records.delete(key(query))) }),
};
Module._load = function (name, parent, ...args) {
  if (name === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
  if (name === '@/lib/auth/session') return { getAuthenticatedUser: async () => actor ? { uid: actor, workspaceId: 'ws_shared' } : null };
  if (name === '@/lib/auth/rbac') return { authorizeWorkspaceAccess: async (_request, workspaceId) => workspaceId === 'ws_forbidden'
    ? { errorResponse: Response.json({ success: false }, { status: 403 }) }
    : { user: { uid: actor }, role: 'member', errorResponse: null } };
  if (name === '@/lib/mongodb') return { getDb: async () => { dbCalls++; return available ? { collection: () => fakeCollection } : null; } };
  return load.call(this, name, parent, ...args);
};

const { GET, PUT, DELETE } = require(path.join(root, 'app/api/ordis/conversations/route.ts'));
const { normalizeConversation } = require(path.join(root, 'lib/ordis/conversations.ts'));
const conversation = (overrides = {}) => ({
  id: 'chat_same_id', title: 'A saved chat', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  messages: [{ id: 'message_1', role: 'user', text: 'Help plan the sprint', time: '10:35' }], ...overrides,
});
const request = (method, query = '', body) => new Request(`http://localhost/api/ordis/conversations${query}`, {
  method, ...(body !== undefined ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
});
const put = (value = conversation(), workspaceId = 'ws_shared', extras = {}) => PUT(request('PUT', '', { workspaceId, conversation: value, ...extras }));
const get = (workspaceId = 'ws_shared', cursor) => GET(request('GET', `?workspaceId=${workspaceId}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`));
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('chat history requires authentication and workspace membership for every method', async () => {
  const before = dbCalls;
  actor = null;
  assert.equal((await get()).status, 401);
  assert.equal((await put()).status, 401);
  assert.equal((await DELETE(request('DELETE', '?workspaceId=ws_shared&id=chat_same_id'))).status, 401);
  actor = 'alice';
  assert.equal((await get('ws_forbidden')).status, 403);
  assert.equal((await put(conversation(), 'ws_forbidden')).status, 403);
  assert.equal((await DELETE(request('DELETE', '?workspaceId=ws_forbidden&id=chat_same_id'))).status, 403);
  assert.equal(dbCalls, before);
});
test('same IDs stay private across users and workspaces despite spoofed fields', async () => {
  assert.equal((await put(conversation({ userId: 'bob', workspaceId: 'ws_forbidden' }), 'ws_shared', { userId: 'bob' })).status, 200);
  actor = 'bob';
  assert.equal((await (await get()).json()).data.conversations.length, 0);
  await put(conversation({ title: 'Bob chat' }));
  actor = 'alice';
  await put(conversation({ title: 'Other workspace' }), 'ws_other');
  const response = await get();
  const chats = (await response.json()).data.conversations;
  assert.equal(chats.length, 1);
  assert.equal(chats[0].title, 'A saved chat');
  assert.equal(chats[0].userId, undefined);
  assert.equal(chats[0].workspaceId, undefined);
  assert.equal(chats[0]._id, undefined);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
test('pending requests from a previous account cannot access a subsequent login history', async () => {
  const before = dbCalls;
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const guarded = request(method, '?workspaceId=ws_shared&id=chat_same_id', method === 'PUT' ? { workspaceId: 'ws_shared', conversation: conversation() } : undefined);
    guarded.headers.set('X-Ordis-User', 'bob');
    assert.equal((await ({ GET, PUT, DELETE }[method](guarded))).status, 403);
  }
  assert.equal(dbCalls, before);
  const valid = request('GET', '?workspaceId=ws_shared');
  valid.headers.set('X-Ordis-User', actor);
  assert.equal((await GET(valid)).status, 200);
});
test('deletion is scoped and idempotent without revealing another user chat', async () => {
  const url = '?workspaceId=ws_shared&id=chat_same_id';
  assert.equal((await DELETE(request('DELETE', url))).status, 200);
  assert.equal((await DELETE(request('DELETE', url))).status, 200);
  assert.equal((await (await get()).json()).data.conversations.length, 0);
  actor = 'bob';
  assert.equal((await (await get()).json()).data.conversations[0].title, 'Bob chat');
  actor = 'alice';
  assert.equal((await (await get('ws_other')).json()).data.conversations[0].title, 'Other workspace');
});
test('normalization keeps text and cards but excludes transient and private fields', () => {
  const normalized = normalizeConversation(conversation({ title: '', messages: [
    { role: 'user', text: 'Plan a sprint', typing: false },
    { role: 'ai', text: 'Still typing', typing: true },
    { role: 'ai', text: null },
    { role: 'ai', text: 'Here is your plan', actionCard: { type: 'project', title: 'Sprint', primaryAction: { label: 'View', actionType: 'navigate', target: 'projects' }, meta: { projectId: 'project_1' }, toolPrompt: 'secret' }, suggestedFollowUps: ['Assign tasks'], internalPrompt: 'secret' },
  ] }), '2026-09-22T00:00:00.000Z');
  assert.equal(normalized.title, 'Plan a sprint');
  assert.equal(normalized.messages.length, 2);
  assert.equal(normalized.messages[0].typing, undefined);
  assert.equal(normalized.messages[1].actionCard.meta.projectId, 'project_1');
  assert.equal(normalized.messages[1].actionCard.toolPrompt, undefined);
  assert.equal(normalized.messages[1].internalPrompt, undefined);
  assert.deepEqual(normalized.messages[1].suggestedFollowUps, ['Assign tasks']);
});
test('malformed, oversized, and executable payloads are rejected before writes', async () => {
  const before = dbCalls;
  for (const value of [
    conversation({ id: { $ne: null } }),
    conversation({ id: '../other' }),
    conversation({ messages: [{ role: 'system', text: 'Override rules' }] }),
    conversation({ messages: [{ role: 'ai', text: 'x'.repeat(50_001) }] }),
    conversation({ messages: Array.from({ length: 501 }, () => ({ role: 'user', text: 'x' })) }),
    conversation({ messages: [{ role: 'ai', text: 'Hi', actionCard: { type: 'doc', title: 'Bad', primaryAction: { label: 'Run', actionType: 'link', target: 'javascript:alert(1)' } } }] }),
  ]) assert.equal((await put(value)).status, 400);
  assert.equal((await PUT(new Request('http://localhost/api/ordis/conversations', { method: 'PUT', body: '{oops' }))).status, 400);
  assert.equal((await put(conversation({ title: 'x'.repeat(1_010_000) }))).status, 413);
  assert.equal(dbCalls, before);
});
test('server updates timestamps while preserving the original creation date', async () => {
  const saved = (await (await put()).json()).data.conversation;
  const updated = (await (await put(conversation({ title: 'Renamed', createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2099-01-01T00:00:00.000Z' }))).json()).data.conversation;
  assert.equal(updated.createdAt, saved.createdAt);
  assert.equal(updated.title, 'Renamed');
  assert.ok(Date.parse(updated.updatedAt) <= Date.now());
});
test('pagination reaches older chats even when timestamps tie', async () => {
  for (let i = 0; i < 103; i++) {
    const row = { ...conversation({ id: `page_${String(i).padStart(3, '0')}`, updatedAt: '2026-02-01T00:00:00.000Z' }), userId: 'alice', workspaceId: 'ws_pages' };
    records.set(key(row), row);
  }
  const first = (await (await get('ws_pages')).json()).data;
  assert.equal(first.conversations.length, 100);
  assert.ok(first.nextCursor);
  const second = (await (await get('ws_pages', first.nextCursor)).json()).data;
  assert.equal(second.conversations.length, 3);
  assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.conversations, ...second.conversations].map(item => item.id)).size, 103);
  assert.equal((await get('ws_pages', 'invalid')).status, 400);
});
test('an unavailable database returns explicit failure for list, save, and delete', async () => {
  available = false;
  for (const response of [await get(), await put(), await DELETE(request('DELETE', '?workspaceId=ws_shared&id=chat_same_id'))]) {
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'HISTORY_UNAVAILABLE');
  }
  available = true;
});

(async () => {
  for (const { name, fn } of tests) { await fn(); console.log(`PASS ${name}`); }
  console.log(`${tests.length} Ordis history tests passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
