const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => imports[name] || require(name), process: { env }, Date, Map, Set, Buffer, URL });
  return exports;
}
const reports = load('lib/engagement/reports.ts');
const now = new Date('2026-10-22T03:30:00Z');
const task = { id: 't', title: 'Actual work', status: 'todo', dueDate: '2026-10-22', assigneeId: 'alice', assigneeName: 'Alice', estimatedHours: 8 };
test('weekly periods, completion dates, current risk and configured shared workload use real records', () => {
  const period = reports.reportPeriod(now);
  assert.equal(period.start, '2026-10-12T00:00:00.000Z');
  assert.equal(period.end, '2026-10-19T00:00:00.000Z');
  const summary = reports.summarizeTasks([task, { ...task, dueDate: '2026-10-21', assignees: ['alice', 'bob'] },
    { ...task, status: 'done', completedAt: '2026-10-18T12:00:00Z' }, { ...task, status: 'done' },
    { ...task, status: 'done', completedAt: period.end }], period.start, period.end, now, 10);
  assert.equal(summary.completed, 1); assert.equal(summary.unknownCompletionDates, 1);
  assert.equal(summary.atRisk.length, 1); assert.equal(summary.dueToday.length, 1);
  assert.equal(summary.overloaded.length, 1); assert.equal(summary.overloaded[0].name, 'Alice'); assert.equal(summary.overloaded[0].hours, 12);
  assert.equal(reports.summarizeTasks([task], period.start, period.end, now, null).overloaded, null);
  assert(reports.reportsPaused('2026-10-21', undefined));
  assert(!reports.reportsPaused('2026-10-21', '2026-10-22'));
});
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(option => matches(row, option));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('$exists' in value) return (row[key] !== undefined) === value.$exists;
      if ('$ne' in value) return row[key] !== value.$ne;
      if ('$lt' in value) return row[key] < value.$lt;
    }
    return row[key] === value;
  });
}
function harness({ paused = false, weekly = true, blocked = false, fail = false, daily = false } = {}) {
  const deliveries = [], sends = [];
  const db = { collection(name) {
    if (name === 'workspaces') return { find: () => [{ id: 'ws_alice', name: 'Real workspace', ownerId: 'alice', createdAt: '2026-10-01' }], findOne: async () => ({ id: 'ws_alice', name: 'Real workspace', ownerId: 'alice' }) };
    if (name === 'tasks') return { find: query => { assert.equal(query.workspaceId, 'ws_alice'); return { toArray: async () => [task] }; } };
    if (name === 'users') return { findOne: async () => ({ uid: 'alice', email: 'alice@example.com' }) };
    if (name === 'workspace_email_preferences') return { findOne: async () => ({ weekly, daily }), find: () => daily ? [{ workspaceId: 'ws_alice', userId: 'alice', daily: true }] : [] };
    if (name === 'unsubscribes') return { findOne: async () => paused ? { unsubscribedAt: now.toISOString() } : null };
    if (name === 'workspace_memberships') return { findOne: async () => null };
    assert.equal(name, 'workspace_email_deliveries');
    function update(row, changes) { Object.assign(row, changes.$set); for (const key of Object.keys(changes.$unset || {})) delete row[key]; }
    return {
      createIndex: async () => {},
      findOne: async query => deliveries.find(row => matches(row, query)),
      updateOne: async (query, changes) => { const row = deliveries.find(row => matches(row, query)); if (row) update(row, changes); else if (changes.$setOnInsert) deliveries.push({ ...changes.$setOnInsert }); },
      findOneAndUpdate: async (query, changes) => { const row = deliveries.find(row => matches(row, query)); if (!row) return null; update(row, changes); return { ...row }; },
    };
  } };
  const sender = load('lib/engagement/send-reports.ts', {
    './reports': reports, '@/lib/site': { SITE_URL: 'https://cursis.in' },
    '@/lib/privacy/core': { accountBlocked: async () => blocked },
    '@/lib/email/notifications': { sendProgressEmail: async (payload, key) => { sends.push({ payload, key }); if (fail) throw new Error('Provider failure'); } },
  });
  return { db, sends, deliveries, run: date => sender.sendWorkspaceReports(db, date || now) };
}
test('report deliveries are durable, deduplicated, honor owner preference and unsubscribe and include real data', async () => {
  const h = harness();
  assert.equal((await h.run()).sent, 1); assert.equal((await h.run()).sent, 0);
  assert.equal(h.sends.length, 1);
  assert(h.sends[0].payload.text.includes('Open tasks currently at risk or overdue: 0'));
  assert(h.sends[0].payload.text.includes('/unsubscribe?email=alice%40example.com'));
  assert(h.sends[0].payload.text.includes('Overload not assessed'));
  for (const options of [{ paused: true }, { weekly: false }, { blocked: true }]) assert.equal((await harness(options).run()).sent, 0);
});
test('delivery failures are visible, retries keep the original payload and old ambiguous sends require review', async () => {
  const h = harness({ fail: true });
  assert.equal((await h.run()).failed, 1);
  assert.equal((await h.run(new Date(+now + 3600000))).failed, 1);
  assert.equal(h.sends[0].key, h.sends[1].key);
  assert.equal(h.sends[0].payload.text, h.sends[1].payload.text);
  assert.equal((await h.run(new Date(+now + 24 * 3600000))).review, 1);
  assert.equal(h.sends.length, 2);
  assert.equal(h.deliveries[0].needsReview, true);
});
test('daily digest is opt-in, assigned-user scoped, unsubscribable and deduplicated', async () => {
  const h = harness({ weekly: false, daily: true });
  assert.equal((await h.run()).sent, 1);
  assert.equal(h.sends[0].payload.subject, 'Your Ordis daily task digest');
  assert(h.sends[0].payload.text.includes('Due today: 1'));
  assert(h.sends[0].payload.text.includes('Actual work'));
  assert.equal((await h.run()).sent, 0);
  assert.equal((await harness({ weekly: false }).run()).sent, 0);
  assert.equal((await harness({ daily: true, paused: true }).run()).sent, 0);
});
test('report endpoint fails closed without the scheduler secret and provider configuration', async () => {
  const api = { apiError: (error, status) => Response.json({ error }, { status }), apiSuccess: (data, status) => Response.json(data, { status }) };
  let jobs = 0;
  function route(env) { return load('app/api/reports/send/route.ts', { '@/lib/api/response': api, '@/lib/mongodb': { getDb: async () => ({}) }, '@/lib/engagement/send-reports': { sendWorkspaceReports: async () => { jobs++; return { sent: 1, failed: 0, review: 0 }; } } }, env); }
  const request = secret => new Request('https://cursis.in/api/reports/send', { headers: { authorization: `Bearer ${secret}` } });
  const secret = 'x'.repeat(32);
  assert.equal((await route({}).GET(request(secret))).status, 401);
  assert.equal((await route({ CRON_SECRET: secret }).GET(request('wrong'))).status, 401);
  assert.equal((await route({ CRON_SECRET: secret }).GET(request(secret))).status, 503);
  assert.equal((await route({ CRON_SECRET: secret, RESEND_API_KEY: 'test', RESEND_FROM_EMAIL: 'test@example.com' }).GET(request(secret))).status, 200);
  assert.equal(jobs, 1);
});
test('email preferences keep member opt-in separate from owner controls and reject arbitrary identities', async () => {
  const api = { apiError: (error, status) => Response.json({ error }, { status }), apiSuccess: data => Response.json(data) };
  const writes = [];
  let role = 'member';
  const route = load('app/api/report-preferences/route.ts', {
    '@/lib/api/response': api, '@/lib/engagement/reports': reports,
    '@/lib/auth/rbac': { authorizeWorkspaceAccess: async () => ({ user: { uid: 'alice', email: 'alice@example.com' }, workspaceId: 'ws_alice', role }) },
    '@/lib/mongodb': { getDb: async () => ({ collection: () => ({ findOne: async () => null, updateOne: async (query, update) => writes.push({ query, update }) }) }) },
    '@/lib/engagement/http': { readAppBody: request => request.json(), engagementFailure: () => api.apiError('Unavailable', 503) },
  });
  const patch = body => route.PATCH(new Request('https://cursis.in/api/report-preferences', { method: 'PATCH', body: JSON.stringify(body) }));
  const data = { workspaceId: 'ws_alice', daily: true, resume: false };
  assert.equal((await patch({ ...data, weekly: false })).status, 403);
  assert.equal((await patch({ ...data, userId: 'bob' })).status, 400);
  assert.equal((await patch({ ...data, daily: 'yes' })).status, 400);
  assert.equal((await patch(data)).status, 200);
  assert.equal(writes[0].query._id, 'ws_alice:alice');
  assert.equal(writes[0].update.$set.daily, true);
  assert.equal(writes[0].update.$set.weekly, undefined);
  role = 'owner';
  assert.equal((await patch({ ...data, weekly: true, capacityHours: 0 })).status, 400);
  assert.equal((await patch({ ...data, weekly: false, capacityHours: 20, resume: true })).status, 200);
  assert(Number.isFinite(Date.parse(writes[1].update.$set.consentAt)));
  assert.equal((await (await route.GET(new Request('https://cursis.in/api/report-preferences?workspaceId=ws_alice'))).json()).daily, false);
});
