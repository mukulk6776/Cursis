// Run with: node tests/ordis-actions.cjs
// TypeScript loader keeps the regression suite dependency-free beyond the app's TypeScript.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const load = Module._load;
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText, filename);
};

let allowed = true;
let writes = [];
let apiError = false;
const fakeRoutes = {
  GET: async request => Response.json({ success: true, data: { tasks: [{ id: 'task_here' }], workspace: new URL(request.url).searchParams.get('workspaceId') } }),
  POST: async request => {
    writes.push(await request.json());
    return apiError ? Response.json({ success: false, error: 'Duplicate department' }, { status: 400 }) : Response.json({ success: true, data: { saved: true } });
  },
  PATCH: async request => fakeRoutes.POST(request),
  DELETE: async request => Response.json({ success: true, data: { success: true, query: new URL(request.url).search } }),
};
Module._load = function (name, parent, ...args) {
  if (name === '@/lib/auth/rbac') return { authorizeWorkspaceAccess: async () => allowed ? { user: { uid: 'user' }, role: 'owner', errorResponse: null } : { errorResponse: new Response(null, { status: 403 }) } };
  if (name.startsWith('@/app/api/')) return fakeRoutes;
  return load.call(this, name, parent, ...args);
};

const { distressResponse } = require(path.join(root, 'lib/ordis/safety.ts'));
const { validateAction, parseDirectAction, capabilities, pages } = require(path.join(root, 'lib/ordis/capabilities.ts'));
const { runWorkspaceAssistant } = require(path.join(root, 'lib/ordis/assistant.ts'));
const { executeWorkspaceAction } = require(path.join(root, 'lib/ordis/workspace-actions.ts'));
const request = new Request('http://localhost/api/ordis/chat', { headers: { authorization: 'Bearer test' } });
const base = { request, workspaceId: 'ws_here' };
const call = (id, operation, input) => ({ id, type: 'function', function: { name: 'workspace_action', arguments: JSON.stringify({ operation, input }) } });
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('personal distress never calls a model or a workspace action', async () => {
  for (const message of ['i want to suicide', 'I want to kill myself', "I don't want to live", 'I want to die']) {
    const result = await runWorkspaceAssistant({ ...base, message, complete: () => { throw new Error('Model must not run'); }, runAction: () => { throw new Error('Mutation must not run'); } });
    assert.match(result.responseText, /immediate danger/);
    assert.equal(result.refreshWorkspace, undefined);
  }
  assert.equal(distressResponse('Create a task to fix the UI'), null);
});
test('screenshot department request retains UI/UX and executes the real action', async () => {
  const result = await runWorkspaceAssistant({ ...base, message: 'add a new department named ui/ux' });
  assert.match(result.responseText, /Created the ui\/ux department/);
  assert.equal(writes.at(-1).name, 'ui/ux');
  assert.equal(result.refreshWorkspace, true);
});
test('incomplete screenshot email asks for the domain suffix without a write', async () => {
  const before = writes.length;
  const result = await runWorkspaceAssistant({ ...base, message: 'add saranshvashistha518@gmail into team asap' });
  assert.match(result.responseText, /complete email address/);
  assert.doesNotMatch(result.responseText, /incorrect user|unregistered/);
  assert.equal(writes.length, before);
});
test('valid invitation uses website invite action, never creates an employee', async () => {
  const result = await runWorkspaceAssistant({ ...base, message: 'invite alex@example.com' });
  assert.equal(writes.at(-1).action, 'invite');
  assert.match(result.responseText, /after accepting/);
  assert.equal(result.stateMutations, undefined);
});
test('API failures are not acknowledged as successful mutations', async () => {
  apiError = true;
  const result = await runWorkspaceAssistant({ ...base, message: 'create department Design' });
  apiError = false;
  assert.match(result.responseText, /Duplicate department/);
  assert.equal(result.refreshWorkspace, false);
});
test('workspace authorization denies writes', async () => {
  allowed = false;
  const before = writes.length;
  const result = await executeWorkspaceAction(request, 'ws_other', 'create_department', { name: 'Nope' });
  allowed = true;
  assert.equal(result.ok, false);
  assert.equal(writes.length, before);
});
test('model-supplied workspace is overridden and foreign IDs are rejected', async () => {
  await executeWorkspaceAction(request, 'ws_here', 'create_department', { name: 'Here', workspaceId: 'ws_other' });
  assert.equal(writes.at(-1).workspaceId, 'ws_here');
  const result = await executeWorkspaceAction(request, 'ws_here', 'update_task', { id: 'task_elsewhere', title: 'Nope' });
  assert.equal(result.ok, false);
  assert.match(result.error, /active workspace/);
});
test('malformed and invented operations never dispatch', async () => {
  for (const operation of ['constructor', '__proto__', 'send_email', 'https://attacker.example']) assert.ok(validateAction(operation, {}));
  assert.ok(validateAction('create_event', { title: 'Missing time' }));
  assert.ok(validateAction('remove_member', {}));
});
test('multi-step tool loop sees previous results and retains all actions', async () => {
  let round = 0;
  const result = await runWorkspaceAssistant({ ...base, message: 'Create a task and a project', complete: async messages => {
    if (round++ === 0) return { tool_calls: [call('one', 'create_task', { title: 'A' }), call('two', 'create_project', { name: 'B' })] };
    assert.equal(messages.filter(message => message.role === 'tool').length, 2);
    return { content: 'Created task A and project B.' };
  } });
  assert.equal(result.actions.length, 2);
  assert.equal(result.refreshWorkspace, true);
});
test('repeated successful tool calls are not executed twice', async () => {
  let round = 0;
  const before = writes.length;
  await runWorkspaceAssistant({ ...base, message: 'Please create task A', complete: async () => round++ < 2 ? { tool_calls: [call(String(round), 'create_task', { title: 'A' })] } : { content: 'Done' } });
  assert.equal(writes.length, before + 1);
});
test('provider failure after a write retains its receipt without fallback mutations', async () => {
  let round = 0;
  const before = writes.length;
  const result = await runWorkspaceAssistant({ ...base, message: 'Please create task A', complete: async () => {
    if (round++ === 0) return { tool_calls: [call('one', 'create_task', { title: 'A' })] };
    throw new Error('provider offline');
  } });
  assert.equal(writes.length, before + 1);
  assert.match(result.responseText, /create task: completed/);
  assert.equal(result.refreshWorkspace, true);
});
test('ordinary conversation does not create unrelated workspace entities', async () => {
  const before = writes.length;
  const result = await runWorkspaceAssistant({ ...base, message: 'Hello!', complete: async () => ({ content: 'Hello! How can I help?' }) });
  assert.match(result.responseText, /Hello/);
  assert.equal(writes.length, before);
  assert.equal(parseDirectAction('Explain how to create a department'), null);
  assert.equal(parseDirectAction('create department Design and invite alex@example.com'), null);
});
test('all website pages are navigable and implemented capabilities are discoverable', async () => {
  assert.equal(pages.length, 15);
  assert.ok(Object.keys(capabilities).length >= 38);
  let round = 0;
  const result = await runWorkspaceAssistant({ ...base, message: 'Open settings', complete: async () => round++ === 0 ? { tool_calls: [{ id: 'nav', type: 'function', function: { name: 'open_page', arguments: '{"page":"settings"}' } }] } : { content: 'Opened settings.' } });
  assert.equal(result.navigateToPage, 'settings');
});
test('a failed action overrides misleading model success prose', async () => {
  let round = 0;
  const result = await runWorkspaceAssistant({ ...base, message: 'Please create a document', runAction: async operation => ({ ok: false, operation, error: 'Forbidden' }), complete: async () => round++ === 0 ? { tool_calls: [call('denied', 'create_document', { title: 'A', content: 'B' })] } : { content: 'Done, created the document.' } });
  assert.match(result.responseText, /Forbidden/);
  assert.doesNotMatch(result.responseText, /Done/);
  assert.equal(result.refreshWorkspace, false);
});

(async () => {
  for (const { name, fn } of tests) { await fn(); console.log(`PASS ${name}`); }
  console.log(`${tests.length} regression tests passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
