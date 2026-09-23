const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;
const originalLoad = Module._load;
Module._resolveFilename = function (name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const helpers = require(path.join(root, 'lib/ordis/conversation-cache.ts'));

const cache = new Map();
global.localStorage = { getItem: key => cache.get(key) || null, setItem: (key, value) => cache.set(key, value) };
global.window = { addEventListener() {}, removeEventListener() {} };
const server = new Map();
let online = true;
let holdWrite = null;
global.fetch = async (url, options = {}) => {
  if (!online) return new Response('', { status: 503 });
  const parsed = new URL(url, 'http://localhost');
  const owner = options.headers['X-Ordis-User'];
  if (options.method === 'PUT') {
    if (holdWrite) await holdWrite;
    const body = JSON.parse(options.body);
    server.set(`${owner}:${body.workspaceId}:${body.conversation.id}`, body.conversation);
    return Response.json({ success: true, data: { conversation: body.conversation } });
  }
  const scope = `${owner}:${parsed.searchParams.get('workspaceId')}:`;
  if (options.method === 'DELETE') { server.delete(scope + parsed.searchParams.get('id')); return Response.json({ success: true }); }
  return Response.json({ success: true, data: { conversations: [...server.entries()].filter(([key]) => key.startsWith(scope)).map(([, value]) => value), nextCursor: null } });
};

// Exercise the hook's persistence/race behavior with deterministic React hook boundaries.
let harness;
const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
const react = {
  useRef(initial) { const i = harness.cursor++; return harness.slots[i] ||= { current: initial }; },
  useState(initial) { const h = harness; const i = h.cursor++; if (!(i in h.slots)) h.slots[i] = typeof initial === 'function' ? initial() : initial; return [h.slots[i], value => { h.slots[i] = typeof value === 'function' ? value(h.slots[i]) : value; }]; },
  useCallback(fn, deps) { const i = harness.cursor++; if (!same(harness.deps[i], deps)) { harness.slots[i] = fn; harness.deps[i] = deps; } return harness.slots[i]; },
  useEffect(fn, deps) { const h = harness; const i = h.cursor++; if (!same(h.deps[i], deps)) { h.deps[i] = deps; h.effects.push(() => { h.cleanups[i]?.(); h.cleanups[i] = fn(); }); } },
};
Module._load = function (name, parent, ...args) { return name === 'react' ? react : originalLoad.call(this, name, parent, ...args); };
const { useOrdisConversations } = require(path.join(root, 'lib/ordis/use-ordis-conversations.ts'));
const start = () => { harness = { cursor: 0, slots: [], deps: [], effects: [], cleanups: [] }; };
function render(user = 'userA', workspace = 'wsA') { harness.cursor = 0; const result = useOrdisConversations(user, workspace); for (const effect of harness.effects.splice(0)) effect(); return result; }
const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };

(async () => {
  assert.notEqual(helpers.conversationStorageKey('userA', 'wsA'), helpers.conversationStorageKey('userB', 'wsA'));
  assert.notEqual(helpers.conversationStorageKey('userA', 'wsA'), helpers.conversationStorageKey('userA', 'wsB'));
  assert.deepEqual(helpers.readConversationCache('broken JSON'), helpers.emptyConversationCache());
  const fresh = { id: 'fresh', title: 'Newly synced', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [{ role: 'user', text: 'Keep this' }] };
  assert.equal(helpers.mergeConversationHistory({ ...helpers.emptyConversationCache(), conversations: [fresh] }, [], ['fresh']).conversations.length, 1, 'stale history snapshots must preserve chats changed after the request began');
  start(); render(); await settle(); let ui = render();
  assert.equal(ui.chatHistoryReady, true);
  const first = ui.beginOrdisChat();
  first.setMessages([{ role: 'user', text: 'Plan the launch' }, { role: 'ai', text: null, typing: true }]);
  ui = render();
  assert.equal(ui.beginOrdisChat(), null, 'prevent duplicate send while current chat is pending');
  assert.equal(ui.chatConversations[0].title, 'Plan the launch');
  ui.newOrdisChat(); ui = render();
  const second = ui.beginOrdisChat();
  second.setMessages([{ role: 'user', text: 'A separate question' }]);
  first.setMessages(previous => [...previous.filter(message => !message.typing), { role: 'ai', text: 'Let’s plan it together.' }]);
  await settle(); ui = render();
  assert.equal(ui.activeChatId, second.id);
  assert.equal(ui.chatHistory[0].text, 'A separate question');
  assert.equal(ui.chatConversations.find(chat => chat.id === first.id).messages[1].text, 'Let’s plan it together.');
  assert.equal([...server.values()].some(chat => chat.messages.some(message => message.typing)), false);
  console.log('PASS scoped conversations, titles, concurrent send guard, and replies routed to original chat');

  // Refresh from durable browser/server history and continue the selected chat.
  start(); render(); await settle(); ui = render();
  assert.equal(ui.chatConversations.length, 2);
  ui.selectOrdisChat(first.id); ui = render();
  assert.equal(ui.beginOrdisChat().history.length, 2);
  ui.renameOrdisChat(first.id, 'Launch checklist'); await settle(); ui = render();
  assert.equal(ui.chatConversations.find(chat => chat.id === first.id).title, 'Launch checklist');
  console.log('PASS reload, reopen, rename, and restored conversation context');

  const deletedSession = ui.beginOrdisChat();
  online = false;
  ui.deleteOrdisChat(first.id); await settle(); ui = render();
  assert.equal(ui.chatHistoryStatus, 'local');
  assert.equal(ui.chatConversations.some(chat => chat.id === first.id), false);
  deletedSession.setMessages([{ role: 'ai', text: 'late reply must not restore deleted chat' }]);
  start(); render(); await settle(); ui = render();
  assert.equal(ui.chatConversations.some(chat => chat.id === first.id), false);
  online = true;
  start(); render(); await settle(); ui = render();
  assert.equal([...server.values()].some(chat => chat.id === first.id), false);
  console.log('PASS offline deletion tombstones, no resurrection, and reconnect sync');

  render('userB'); await settle(); ui = render('userB');
  assert.equal(ui.chatConversations.length, 0);
  render('userA', 'wsB'); await settle(); ui = render('userA', 'wsB');
  assert.equal(ui.chatConversations.length, 0);
  console.log('PASS user and workspace history isolation');
  console.log('Ordis conversation cache tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
