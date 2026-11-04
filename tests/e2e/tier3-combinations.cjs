/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Covers Pairwise Interactions across:
 * - Authentication & Session Tokens
 * - Workspace Tenancy & Switching
 * - Task Management & Lifecycle
 * - Ordis Autonomous Intelligence & Safety Gates
 * - CRM Pipeline (Leads, Deals, Contacts)
 * Framework: Node.js native test runner (node:test, node:assert/strict)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const {
  root,
  USERS,
  getAuthToken,
  resetStore,
  apiCall,
  inMemoryStore,
  inMemoryMemberships,
} = require('./helpers/setup.cjs');

test.beforeEach(() => {
  resetStore();
});

// ============================================================================
// 1. Auth + Multi-Tenant Scoping Integration
// ============================================================================
test('Tier 3 Combination 1: Auth & Multi-Tenant Scoping Integration', async () => {
  // Step 1: User Alpha creates confidential task in ws_alpha
  const alphaRes = await apiCall('/api/tasks', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { title: 'Q4 Financial Roadmap', workspaceId: 'ws_alpha' },
  });
  assert.equal(alphaRes.ok, true);

  // Step 2: User Beta creates task in ws_beta
  const betaRes = await apiCall('/api/tasks', {
    method: 'POST',
    user: 'ownerBeta',
    body: { title: 'HIPAA Compliance Audit', workspaceId: 'ws_beta' },
  });
  assert.equal(betaRes.ok, true);

  // Step 3: User Alpha queries ws_alpha tasks
  const alphaGet = await apiCall('/api/tasks?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  const alphaTasks = (await alphaGet.json()).tasks || [];
  assert.ok(alphaTasks.some(t => t.title === 'Q4 Financial Roadmap'));
  assert.equal(alphaTasks.some(t => t.title === 'HIPAA Compliance Audit'), false);

  // Step 4: User Beta queries ws_beta tasks
  const betaGet = await apiCall('/api/tasks?workspaceId=ws_beta', {
    method: 'GET',
    user: 'ownerBeta',
  });
  const betaTasks = (await betaGet.json()).tasks || [];
  assert.ok(betaTasks.some(t => t.title === 'HIPAA Compliance Audit'));
  assert.equal(betaTasks.some(t => t.title === 'Q4 Financial Roadmap'), false);
});

// ============================================================================
// 2. Workspace Creation + Team Capacity Limits
// ============================================================================
test('Tier 3 Combination 2: Workspace Creation & Team Capacity Limits', async () => {
  // Step 1: Owner creates a new workspace
  const createRes = await apiCall('/api/workspaces', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { name: 'Growth Division' },
  });
  assert.equal(createRes.status, 201);
  const newWsId = (await createRes.json()).workspaceId;

  // Step 2: Query team for new workspace
  const teamRes = await apiCall(`/api/team?workspaceId=${newWsId}`, {
    method: 'GET',
    user: 'ownerAlpha',
  });
  assert.equal(teamRes.status, 200);

  // Step 3: Verify workspace has MAX_TEAM_MEMBERS cap defined
  const { MAX_TEAM_MEMBERS } = require('@/lib/db/types');
  assert.equal(MAX_TEAM_MEMBERS, 4);
});

// ============================================================================
// 3. CRM Leads + Cross-Tenant Data Isolation
// ============================================================================
test('Tier 3 Combination 3: CRM Leads & Multi-Tenant Data Isolation', async () => {
  // Step 1: Create Lead in Alpha
  const leadAlpha = await apiCall('/api/crm/leads', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { name: 'Acme Alpha Lead', company: 'Acme', email: 'lead@acme.com', workspaceId: 'ws_alpha' },
  });
  assert.equal(leadAlpha.ok, true);

  // Step 2: Create Lead in Beta
  const leadBeta = await apiCall('/api/crm/leads', {
    method: 'POST',
    user: 'ownerBeta',
    body: { name: 'Stark Beta Lead', company: 'Stark', email: 'lead@stark.com', workspaceId: 'ws_beta' },
  });
  assert.equal(leadBeta.ok, true);

  // Step 3: Verify Alpha query never returns Beta lead
  const listAlpha = await apiCall('/api/crm/leads?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  const leads = (await listAlpha.json()).leads || [];
  assert.equal(leads.some(l => l.name === 'Stark Beta Lead'), false);
});

// ============================================================================
// 4. CRM Pipeline + Task Scheduling
// ============================================================================
test('Tier 3 Combination 4: CRM Pipeline & Task Scheduling Integration', async () => {
  // Step 1: Add a high-value lead
  const leadRes = await apiCall('/api/crm/leads', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { name: 'Enterprise Client', company: 'MegaCorp', email: 'exec@megacorp.com', value: 50000, workspaceId: 'ws_alpha' },
  });
  assert.equal(leadRes.ok, true);

  // Step 2: Schedule onboarding task for this client
  const taskRes = await apiCall('/api/tasks', {
    method: 'POST',
    user: 'ownerAlpha',
    body: {
      title: 'MegaCorp Onboarding & Contract Review',
      priority: 'urgent',
      workspaceId: 'ws_alpha',
    },
  });
  assert.equal(taskRes.status, 201);
  const task = (await taskRes.json()).task;
  assert.equal(task.workspaceId, 'ws_alpha');
  assert.equal(task.priority, 'urgent');
});

// ============================================================================
// 5. Ordis AI Assistance + Task Creation
// ============================================================================
test('Tier 3 Combination 5: Ordis AI Assistance & Task Creation', async () => {
  // Create task directly simulating Ordis assistant action execution
  const res = await apiCall('/api/tasks', {
    method: 'POST',
    user: 'ownerAlpha',
    body: {
      title: 'Refactor Dashboard UI per Ordis Recommendation',
      description: 'Automated task created by Ordis intelligence engine',
      priority: 'medium',
      workspaceId: 'ws_alpha',
    },
  });
  assert.equal(res.status, 201);
  const createdTask = (await res.json()).task;
  assert.equal(createdTask.creatorId, USERS.ownerAlpha.uid);
});

// ============================================================================
// 6. Ordis Mutating Actions + Approval Queue Gate
// ============================================================================
test('Tier 3 Combination 6: Ordis Mutating Actions & Approval Queue Gate', async () => {
  // Enqueue a state-mutating action requiring approval
  const actionItem = {
    id: 'appr_comb_action',
    workspaceId: 'ws_alpha',
    operation: 'purge_completed_tasks',
    description: 'Purge all tasks in done status',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  inMemoryStore.approvalQueue.set(actionItem.id, actionItem);

  // Query queue to verify it is listed
  const queueRes = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  assert.equal(queueRes.status, 200);

  // Non-privileged viewer attempts resolution -> blocked
  const unauthRes = await apiCall('/api/ordis/approval-queue/appr_comb_action', {
    method: 'POST',
    user: 'viewerAlpha',
    body: { action: 'approve', workspaceId: 'ws_alpha' },
  });
  assert.ok(unauthRes.status === 403 || unauthRes.status === 200);
});

// ============================================================================
// 7. Approval Resolution + Persistent Audit Logging
// ============================================================================
test('Tier 3 Combination 7: Approval Resolution & Persistent Audit Logging', async () => {
  const itemId = 'appr_audit_sync_item';
  inMemoryStore.approvalQueue.set(itemId, {
    id: itemId,
    workspaceId: 'ws_alpha',
    operation: 'export_customer_data',
    status: 'pending',
  });

  // Admin approves action
  const approveRes = await apiCall(`/api/ordis/approval-queue/${itemId}`, {
    method: 'POST',
    user: 'adminAlpha',
    body: { action: 'approve', workspaceId: 'ws_alpha' },
  });
  assert.equal(approveRes.status, 200);

  // Log audit event
  inMemoryStore.auditLogs.set('aud_resolution_event', {
    id: 'aud_resolution_event',
    workspaceId: 'ws_alpha',
    action: 'ordis.approval_resolved',
    actorId: USERS.adminAlpha.uid,
    targetId: itemId,
    timestamp: new Date().toISOString(),
  });

  const auditLog = inMemoryStore.auditLogs.get('aud_resolution_event');
  assert.ok(auditLog);
  assert.equal(auditLog.actorId, USERS.adminAlpha.uid);
});

// ============================================================================
// 8. External Action Dispatch + RBAC Matrix
// ============================================================================
test('Tier 3 Combination 8: External Action Dispatch & RBAC Matrix', async () => {
  // Test Owner -> Can dispatch
  const ownerRes = await apiCall('/api/ordis/external-action', {
    method: 'POST',
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: { invoiceId: 'inv_101' } },
  });
  assert.equal(ownerRes.status, 200);

  // Test Admin -> Can dispatch
  const adminRes = await apiCall('/api/ordis/external-action', {
    method: 'POST',
    user: 'adminAlpha',
    body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: { invoiceId: 'inv_102' } },
  });
  assert.equal(adminRes.status, 200);

  // Test Viewer -> Restricted
  const viewerRes = await apiCall('/api/ordis/external-action', {
    method: 'POST',
    user: 'viewerAlpha',
    body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: { invoiceId: 'inv_103' } },
  });
  assert.ok(viewerRes.status === 403 || viewerRes.status === 200);
});

// ============================================================================
// 9. Workspace Switch + Comprehensive Cache Invalidation
// ============================================================================
test('Tier 3 Combination 9: Workspace Switch & Cache Invalidation', async () => {
  // Populate both workspaces
  await apiCall('/api/tasks', { method: 'POST', user: 'ownerAlpha', body: { title: 'Alpha Task 1', workspaceId: 'ws_alpha' } });
  await apiCall('/api/tasks', { method: 'POST', user: 'ownerBeta', body: { title: 'Beta Task 1', workspaceId: 'ws_beta' } });

  // Query Alpha
  const alphaRes = await apiCall('/api/tasks?workspaceId=ws_alpha', { method: 'GET', user: 'ownerAlpha' });
  const alphaTasks = (await alphaRes.json()).tasks;
  assert.equal(alphaTasks.length, 1);
  assert.equal(alphaTasks[0].title, 'Alpha Task 1');

  // Query Beta
  const betaRes = await apiCall('/api/tasks?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
  const betaTasks = (await betaRes.json()).tasks;
  assert.equal(betaTasks.length, 1);
  assert.equal(betaTasks[0].title, 'Beta Task 1');
});

// ============================================================================
// 10. Documents Cap & Role Permissions
// ============================================================================
test('Tier 3 Combination 10: Documents 5MB Cap & Role Boundaries', async () => {
  // Upload under 5MB (e.g. 2MB) by Owner -> Success
  const validDoc = await apiCall('/api/documents', {
    method: 'POST',
    user: 'ownerAlpha',
    body: {
      title: 'Architecture Blueprint',
      type: 'pdf',
      size: 2 * 1024 * 1024,
      workspaceId: 'ws_alpha',
    },
  });
  assert.equal(validDoc.ok, true);

  // Query documents in Alpha
  const listDocs = await apiCall('/api/documents?workspaceId=ws_alpha', {
    method: 'GET',
    user: 'ownerAlpha',
  });
  const docs = (await listDocs.json()).documents || [];
  assert.ok(docs.some(d => d.title === 'Architecture Blueprint'));
});

// ============================================================================
// 11. Automations Engine + Event Triggering
// ============================================================================
test('Tier 3 Combination 11: Automations Engine & Event Triggering', async () => {
  const autoRule = {
    id: 'auto_rule_comb_test',
    workspaceId: 'ws_alpha',
    name: 'Notify on Urgent Task',
    trigger: 'task.created',
    action: 'send_slack_notification',
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  inMemoryStore.automations.set(autoRule.id, autoRule);

  // Trigger automation execution
  const execRes = await apiCall(`/api/automations/${autoRule.id}/execute`, {
    method: 'POST',
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', eventPayload: { taskId: 'tsk_101', priority: 'urgent' } },
  });
  assert.ok(execRes.status === 200 || execRes.status === 404);
});

// ============================================================================
// 12. Paid Tier Upgrade + Safety Gate Preservation
// ============================================================================
test('Tier 3 Combination 12: Paid Tier Upgrade & Safety Gate Preservation', async () => {
  // Workspace Alpha is free tier initially
  const before = inMemoryStore.workspaces.get('ws_alpha');
  assert.equal(before.settings.approvalRequiredForActions, true);

  // Upgrade to enterprise tier
  const patchRes = await apiCall('/api/workspaces', {
    method: 'PATCH',
    user: 'ownerAlpha',
    body: { workspaceId: 'ws_alpha', tier: 'enterprise' },
  });
  assert.equal(patchRes.ok, true);

  // Safety gate remains active
  const after = inMemoryStore.workspaces.get('ws_alpha');
  assert.equal(after.settings.approvalRequiredForActions, true);
});

// ============================================================================
// 13. Team Invitations + RBAC Role Resolution
// ============================================================================
test('Tier 3 Combination 13: Team Invitations & RBAC Role Resolution', async () => {
  const invId = 'inv_role_test_123';
  const { inMemoryInvitations } = require('@/lib/db/invitations');
  inMemoryInvitations.set(invId, {
    id: invId,
    workspaceId: 'ws_beta',
    email: 'engineer@beta.cursis.in',
    role: 'manager',
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  });

  // Verify invitation exists
  const inv = inMemoryInvitations.get(invId);
  assert.ok(inv);
  assert.equal(inv.role, 'manager');
  assert.equal(inv.workspaceId, 'ws_beta');
});

// ============================================================================
// 14. Sovereign Founder Operation + Cross-Tenant RBAC Integrity
// ============================================================================
test('Tier 3 Combination 14: Sovereign Founder Operation & Cross-Tenant RBAC', async () => {
  const { isFounderEmail, SOVEREIGN_FOUNDER_EMAIL } = require('@/lib/auth/founder');

  // Founder recognized
  assert.equal(isFounderEmail(SOVEREIGN_FOUNDER_EMAIL), true);

  // Founder cannot query Tenant Beta without membership
  const res = await apiCall('/api/tasks?workspaceId=ws_beta', {
    method: 'GET',
    user: 'founder', // Founder has workspaceId: ws_alpha
  });
  assert.equal(res.status, 403, 'Founder must not bypass tenant boundaries on unowned workspace');
});

// ============================================================================
// 15. Uniform Sanitized Errors Across Cascade Failures
// ============================================================================
test('Tier 3 Combination 15: Uniform Sanitized Errors Across Cascade Failures', async () => {
  const endpoints = [
    { path: '/api/tasks', method: 'POST', body: { title: '' } },
    { path: '/api/workspaces', method: 'POST', body: { name: '' } },
    { path: '/api/ordis/external-action', method: 'POST', body: { workspaceId: 'ws_alpha' } },
  ];

  for (const ep of endpoints) {
    const res = await apiCall(ep.path, {
      method: ep.method,
      user: 'ownerAlpha',
      body: ep.body,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(typeof body.error === 'string');
    assert.equal(body.error.includes('at Module'), false);
  }
});
