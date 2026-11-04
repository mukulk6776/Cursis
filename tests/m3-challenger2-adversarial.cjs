/**
 * tests/m3-challenger2-adversarial.cjs
 * Milestone 3 Adversarial Challenge Suite:
 * - Feature 15 (Persistent Audit Logging)
 * - Feature 16 (Grounded Auxiliary Endpoints: ambient-scan, audit, process-meeting, drafts, goal, risk-radar)
 * - Feature 17 (Clean Task Presentation, zero ***, zero 24-char hex ObjectIds)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  USERS,
  getAuthToken,
  resetStore,
  apiCall,
  inMemoryStore,
} = require('./e2e/helpers/setup.cjs');

const { executeWorkspaceAction } = require('../lib/ordis/workspace-actions.ts');
const { getAuditLogs } = require('../lib/db/audit.ts');
const { sanitizeTaskTable, presentTaskList } = require('../lib/ordis/task-presentation.ts');

// Direct route module imports for routes not registered in setup.cjs's ROUTE_TABLE
const processMeetingRoute = require('../app/api/ordis/process-meeting/route.ts');
const goalRoute = require('../app/api/ordis/goal/route.ts');
const riskRadarRoute = require('../app/api/ordis/risk-radar/route.ts');

async function directRouteCall(handler, method, urlPath, options = {}) {
  const urlObj = new URL(`http://localhost${urlPath}`);
  const headers = new Headers(options.headers || {});
  if (!headers.has('content-type') && options.body && typeof options.body === 'object') {
    headers.set('content-type', 'application/json');
  }
  if (options.user) {
    const token = getAuthToken(options.user);
    headers.set('authorization', `Bearer ${token}`);
  }
  const bodyString = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined;
  const req = new Request(urlObj.toString(), {
    method,
    headers,
    body: (method !== 'GET' && method !== 'HEAD' && bodyString !== undefined) ? bodyString : undefined,
  });
  const res = await handler(req, { params: Promise.resolve(options.params || {}) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

test.beforeEach(() => {
  resetStore();
});

test('Feature 16 Adversarial: Empty workspace returns 100% health score and 0 fake bottlenecks or risks', async () => {
  // Clear any pre-seeded data in ws_alpha to simulate an empty workspace
  inMemoryStore.tasks.clear();
  inMemoryStore.projects.clear();
  inMemoryStore.ordisCards.clear();
  inMemoryStore.riskRadar.clear();

  // 1. Ambient scan GET
  const ambientGet = await apiCall('/api/ordis/ambient-scan?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  assert.equal(ambientGet.status, 200);
  const ambientData = await ambientGet.json();
  assert.equal(ambientData.success, true);
  assert.equal(ambientData.healthScore, 100);
  assert.equal(ambientData.cards.length, 0);
  assert.equal(ambientData.metrics.overdueTasks, 0);
  assert.equal(ambientData.metrics.blockedTasks, 0);
  assert.equal(ambientData.metrics.activeAlerts, 0);

  // 2. Ambient scan POST
  const ambientPost = await apiCall('/api/ordis/ambient-scan', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha' },
  });
  assert.equal(ambientPost.status, 200);
  const ambientPostData = await ambientPost.json();
  assert.equal(ambientPostData.healthScore, 100);
  assert.equal(ambientPostData.newlyDetectedCount, 0);

  // 3. Risk radar GET (direct route call)
  const riskGet = await directRouteCall(riskRadarRoute.GET, 'GET', '/api/ordis/risk-radar?workspaceId=ws_alpha', {
    user: 'ownerAlpha',
  });
  assert.equal(riskGet.status, 200);
  assert.deepEqual(riskGet.json.radarItems, []);

  // 4. Business audit POST
  const auditPost = await apiCall('/api/ordis/audit', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', prompt: 'Perform complete health check' },
  });
  assert.equal(auditPost.status, 200);
  const auditData = await auditPost.json();
  assert.equal(auditData.report.healthScore, 100);
  assert.deepEqual(auditData.report.bottlenecks, []);
  assert.ok(auditData.report.recommendations.some(r => r.includes('no critical bottlenecks')));
});

test('Feature 16 Adversarial: Real bottleneck detection and cross-tenant isolation', async () => {
  inMemoryStore.tasks.clear();
  inMemoryStore.projects.clear();
  inMemoryStore.ordisCards.clear();
  inMemoryStore.riskRadar.clear();

  // Create overdue task in ws_beta
  const pastDate = new Date(Date.now() - 86400000 * 4).toISOString();
  await apiCall('/api/tasks', {
    method: 'POST',
    user: 'ownerBeta',
    body: {
      workspaceId: 'ws_beta',
      title: 'PostgreSQL Failover Replica Deployment',
      status: 'in_progress',
      dueDate: pastDate,
      priority: 'urgent',
    },
  });

  // Create blocked task in ws_beta
  await apiCall('/api/tasks', {
    method: 'POST',
    user: 'ownerBeta',
    body: {
      workspaceId: 'ws_beta',
      title: 'OAuth2 Gateway Migration',
      status: 'blocked',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      priority: 'high',
    },
  });

  // 1. Check ws_beta ambient scan reflects real bottlenecks
  const ambientBeta = await apiCall('/api/ordis/ambient-scan?workspaceId=ws_beta', {
    method: 'GET',
    user: 'ownerBeta',
  });
  assert.equal(ambientBeta.status, 200);
  const betaData = await ambientBeta.json();
  assert.equal(betaData.metrics.overdueTasks, 1);
  assert.equal(betaData.metrics.blockedTasks, 1);
  assert.equal(betaData.healthScore, 65); // 100 - 15 - 20 = 65

  // 2. Check ws_beta risk radar reflects real overdue/blocked items
  const riskBeta = await directRouteCall(riskRadarRoute.GET, 'GET', '/api/ordis/risk-radar?workspaceId=ws_beta', {
    user: 'ownerBeta',
  });
  assert.equal(riskBeta.status, 200);
  assert.ok(riskBeta.json.radarItems.length >= 2);
  const overdueRisk = riskBeta.json.radarItems.find(r => r.targetName === 'PostgreSQL Failover Replica Deployment');
  assert.ok(overdueRisk, 'Overdue task must appear in risk radar');
  assert.equal(overdueRisk.workspaceId, 'ws_beta');

  // 3. TENANT ISOLATION: ws_alpha must still report 100% health and 0 risks!
  const ambientAlpha = await apiCall('/api/ordis/ambient-scan?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  assert.equal(ambientAlpha.status, 200);
  const alphaData = await ambientAlpha.json();
  assert.equal(alphaData.healthScore, 100);
  assert.equal(alphaData.metrics.overdueTasks, 0);
  assert.equal(alphaData.metrics.blockedTasks, 0);
  assert.equal(alphaData.cards.length, 0);

  const riskAlpha = await directRouteCall(riskRadarRoute.GET, 'GET', '/api/ordis/risk-radar?workspaceId=ws_alpha', {
    user: 'ownerAlpha',
  });
  assert.equal(riskAlpha.status, 200);
  assert.deepEqual(riskAlpha.json.radarItems, []);
});

test('Feature 16 Adversarial: GET /api/ordis/audit and GET /api/ordis/drafts exist and isolate tenants', async () => {
  // Seed audit log in ws_alpha
  inMemoryStore.auditLogs.set('aud_alpha_confidential', {
    id: 'aud_alpha_confidential',
    workspaceId: 'ws_alpha',
    action: 'confidential_contract_signed',
    actorId: USERS.ownerAlpha.uid,
    actorName: 'Owner Alpha',
    actorType: 'user',
    targetType: 'contract',
    targetId: 'doc_999',
    details: { secret: 'Alpha confidential terms' },
    createdAt: new Date().toISOString(),
  });

  // Query GET /api/ordis/audit as ownerAlpha
  const auditGetAlpha = await apiCall('/api/ordis/audit?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  assert.equal(auditGetAlpha.status, 200);
  const auditDataAlpha = await auditGetAlpha.json();
  assert.ok(auditDataAlpha.auditLogs.some(l => l.id === 'aud_alpha_confidential'));

  // Query GET /api/ordis/audit as ownerBeta -> must NOT see Alpha's audit log
  const auditGetBeta = await apiCall('/api/ordis/audit?workspaceId=ws_beta', {
    method: 'GET',
    user: 'ownerBeta',
  });
  assert.equal(auditGetBeta.status, 200);
  const auditDataBeta = await auditGetBeta.json();
  assert.ok(!auditDataBeta.auditLogs.some(l => l.id === 'aud_alpha_confidential'));

  // POST /api/ordis/drafts on ws_alpha
  const draftCreate = await apiCall('/api/ordis/drafts', {
    method: 'POST',
    user: 'ownerAlpha',
    body: {
      workspaceId: 'ws_alpha',
      name: 'Sundar Pichai',
      company: 'Alphabet Inc',
      email: 'sundar@alphabet.com',
      budget: 5000000,
      requirements: 'Enterprise Search Integration',
    },
  });
  assert.equal(draftCreate.status, 200);
  const draftRes = await draftCreate.json();
  assert.equal(draftRes.proposalGenerated, true);
  assert.equal(draftRes.contractGenerated, true);

  // GET /api/ordis/drafts as ownerAlpha -> returns drafts
  const getDraftsAlpha = await apiCall('/api/ordis/drafts?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  assert.equal(getDraftsAlpha.status, 200);
  const draftsDataAlpha = await getDraftsAlpha.json();
  assert.ok(draftsDataAlpha.total >= 2);
  assert.ok(draftsDataAlpha.drafts.some(d => d.company === 'Alphabet Inc'));

  // GET /api/ordis/drafts as ownerBeta -> must NOT see Alphabet Inc drafts
  const getDraftsBeta = await apiCall('/api/ordis/drafts?workspaceId=ws_beta', {
    method: 'GET',
    user: 'ownerBeta',
  });
  assert.equal(getDraftsBeta.status, 200);
  const draftsDataBeta = await getDraftsBeta.json();
  assert.equal(draftsDataBeta.total, 0);
  assert.deepEqual(draftsDataBeta.drafts, []);
});

test('Feature 16 Adversarial: process-meeting requires valid meeting and enforces tenant scoping', async () => {
  // 1. Missing meetingId -> 400
  const noMeeting = await directRouteCall(processMeetingRoute.POST, 'POST', '/api/ordis/process-meeting', {
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha' },
  });
  assert.equal(noMeeting.status, 400);

  // 2. Non-existent meetingId -> 404
  const notFound = await directRouteCall(processMeetingRoute.POST, 'POST', '/api/ordis/process-meeting', {
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', meetingId: 'meet_missing_404' },
  });
  assert.equal(notFound.status, 404);

  // 3. Create real meeting in ws_alpha
  const createMeeting = await apiCall('/api/meetings', {
    method: 'POST',
    user: 'ownerAlpha',
    body: {
      workspaceId: 'ws_alpha',
      title: 'Core Engine Sync',
      notes: 'Decision: Milestone 3 verification is complete.\nAgreed: Proceed to Milestone 4 Neo-Brutalist theming.',
    },
  });
  assert.equal(createMeeting.status, 201);
  const meetingData = await createMeeting.json();
  const meetingId = meetingData.meeting?.id || meetingData.id;
  assert.ok(meetingId, 'Meeting must have valid ID');

  // 4. Cross-tenant attempt: ownerBeta calling process-meeting on ws_alpha meeting -> 404
  const crossCall = await directRouteCall(processMeetingRoute.POST, 'POST', '/api/ordis/process-meeting', {
    user: 'ownerBeta',
    body: { workspaceId: 'ws_beta', meetingId },
  });
  assert.equal(crossCall.status, 404);

  // 5. Authorized process-meeting on ws_alpha -> extracts genuine decisions
  const processRes = await directRouteCall(processMeetingRoute.POST, 'POST', '/api/ordis/process-meeting', {
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', meetingId },
  });
  assert.equal(processRes.status, 200);
  const processed = processRes.json;
  assert.equal(processed.meetingId, meetingId);
  assert.ok(processed.decisions.length >= 2);
  assert.ok(processed.decisions.some(d => d.includes('Milestone 3 verification is complete')));
  assert.ok(processed.decisions.some(d => d.includes('Proceed to Milestone 4')));
});

test('Feature 16 Adversarial: Goal planning produces structured schema and isolates workspaces', async () => {
  // Missing goal -> 400
  const noGoal = await directRouteCall(goalRoute.POST, 'POST', '/api/ordis/goal', {
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha' },
  });
  assert.equal(noGoal.status, 400);

  // Valid goal creation
  const createGoal = await directRouteCall(goalRoute.POST, 'POST', '/api/ordis/goal', {
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', goal: 'Deploy Multi-Region Disaster Recovery' },
  });
  assert.equal(createGoal.status, 201);
  const plan = createGoal.json.plan;
  assert.equal(plan.workspaceId, 'ws_alpha');
  assert.equal(plan.goal, 'Deploy Multi-Region Disaster Recovery');
  assert.ok(plan.steps.length >= 3);
  for (const s of plan.steps) {
    assert.ok(s.id);
    assert.ok(typeof s.stepNumber === 'number');
    assert.ok(s.title);
    assert.ok(s.action);
    assert.ok(s.status);
  }

  // GET goals on ws_alpha
  const getAlpha = await directRouteCall(goalRoute.GET, 'GET', '/api/ordis/goal?workspaceId=ws_alpha', {
    user: 'ownerAlpha',
  });
  assert.equal(getAlpha.status, 200);
  assert.ok(getAlpha.json.goals.some(g => g.id === plan.id));

  // GET goals on ws_beta -> must NOT contain Alpha's goal plan
  const getBeta = await directRouteCall(goalRoute.GET, 'GET', '/api/ordis/goal?workspaceId=ws_beta', {
    user: 'ownerBeta',
  });
  assert.equal(getBeta.status, 200);
  assert.ok(!getBeta.json.goals.some(g => g.id === plan.id));
});

test('Feature 15 Adversarial: Every Ordis state mutation persists an audit log entry in inMemoryStore', async () => {
  const token = getAuthToken('ownerAlpha');
  const mockReq = new Request('http://localhost/api/ordis/chat', {
    headers: { authorization: `Bearer ${token}` },
  });

  // Execute state mutating action: create_task
  const result = await executeWorkspaceAction(mockReq, 'ws_alpha', 'create_task', {
    title: 'Adversarial Audit Verification Task',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: '2026-12-31',
  });
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);

  // Check audit log
  const logs = await getAuditLogs('ws_alpha');
  const mutationLog = logs.find(l => l.action === 'ordis.create_task');
  assert.ok(mutationLog, 'Audit log entry for ordis.create_task must exist');
  assert.equal(mutationLog.workspaceId, 'ws_alpha');
  assert.equal(mutationLog.actorType, 'ordis_assisted');
  assert.equal(mutationLog.actorId, USERS.ownerAlpha.uid);
  assert.ok(mutationLog.details);
  assert.equal(mutationLog.details.operation, 'create_task');
  assert.ok(inMemoryStore.auditLogs.has(mutationLog.id));
});

test('Feature 17 Adversarial: Clean task presentation strips markdown table artifacts and raw ObjectIds', () => {
  // Test 1: Markdown table containing raw 24-character hex MongoDB ObjectIds
  const rawMongoId1 = '507f1f77bcf86cd799439011';
  const rawMongoId2 = '60b8d295f1d24c001f3e89a2';
  const tableWithIds = `| Task ID | Title | Status | Priority | Due Date |\n|---|---|---|---|---|\n| ${rawMongoId1} | Security Audit | In progress | High | 2026-11-20 |\n| ${rawMongoId2} | Performance Profiling | Done | Medium | 2026-11-21 |`;

  const sanitized = sanitizeTaskTable(tableWithIds, []);
  assert.ok(sanitized);
  assert.ok(!sanitized.includes(rawMongoId1), `Raw ObjectId must be stripped from table output. Got:\n${sanitized}`);
  assert.ok(!sanitized.includes(rawMongoId2), `Raw ObjectId must be stripped from table output. Got:\n${sanitized}`);
  assert.ok(!sanitized.includes('| Task ID |'), `Table headers must be stripped and replaced with bullet points. Got:\n${sanitized}`);
  assert.ok(sanitized.includes('Security Audit'), 'Task title must be retained');
  assert.ok(sanitized.includes('Performance Profiling'), 'Task title must be retained');

  // Test 2: Markdown table with bold formatting in cells and tsk_ prefix
  const tableWithBoldRow = `| Title | Status | Assignee |\n|---|---|---|\n| **[Urgent] Zero Day Patch** | Blocked | tsk_raw_9999 |\n| *[Bug] Fix Login* | Todo | mem_usr_123 |`;
  const sanitizedBold = sanitizeTaskTable(tableWithBoldRow, []);
  assert.ok(sanitizedBold);
  // Verify ZERO triple or quadruple asterisks in output
  assert.ok(!sanitizedBold.includes('***'), `Sanitized output must not contain triple asterisks. Got:\n${sanitizedBold}`);
  assert.ok(!sanitizedBold.includes('****'), `Sanitized output must not contain quadruple asterisks. Got:\n${sanitizedBold}`);
  // Verify raw ID prefixes are stripped
  assert.ok(!sanitizedBold.includes('tsk_raw_9999'), `Raw tsk_ ID must be stripped. Got:\n${sanitizedBold}`);
  assert.ok(!sanitizedBold.includes('mem_usr_123'), `Raw mem_ ID must be stripped. Got:\n${sanitizedBold}`);

  // Test 3: Normal task presentation via presentTaskList does not contain *** or raw ObjectIds
  const tasks = [
    {
      id: rawMongoId1,
      title: 'Implement Multi-Region DNS Failover',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-11-30',
      assigneeName: 'Elena Rostova',
    },
    {
      id: rawMongoId2,
      title: 'Update OAuth Provider Certificates',
      status: 'todo',
      priority: 'high',
      assigneeName: 'Alex Mercer',
    },
  ];

  const presented = presentTaskList('show ongoing tasks', [
    { ok: true, operation: 'list_tasks', data: { tasks } },
  ]);
  assert.ok(presented);
  assert.ok(!presented.includes('***'), `Formatted text must not contain triple asterisks. Got:\n${presented}`);
  assert.ok(!presented.includes(rawMongoId1), `Formatted text must not contain raw ObjectIds. Got:\n${presented}`);
  assert.ok(!presented.includes(rawMongoId2), `Formatted text must not contain raw ObjectIds. Got:\n${presented}`);
  assert.ok(presented.includes('Multi\\-Region') || presented.includes('Multi-Region'));
  assert.ok(presented.includes('Elena Rostova'));
  assert.ok(presented.includes('Urgent'));
});
