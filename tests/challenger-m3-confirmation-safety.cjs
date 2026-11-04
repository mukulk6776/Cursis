/**
 * Empirical Adversarial Test Harness — Milestone 3 Challenger 1
 * Targets:
 *   - Feature 13: Human-in-the-Loop Confirmation Gate
 *   - Feature 14: Paid Tier Safety Policy
 *
 * Requirements:
 * 1. Destructive action without input.confirmed === true is halted and enqueued to approval queue.
 * 2. Destructive action cannot be triggered by non-admin roles without proper RBAC.
 * 3. Non-existent approval items cannot be resolved (strictly 404).
 * 4. Invalid action verbs (e.g. 'explode') return 400 Bad Request.
 * 5. Upgrading workspace tier to paid, pro, or enterprise does NOT silently disable approvalRequiredForActions.
 * 6. Pagination boundaries on approval queue (limit=0, negative offset).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  root,
  USERS,
  getAuthToken,
  resetStore,
  apiCall,
  inMemoryStore,
  inMemoryMemberships,
} = require('./e2e/helpers/setup.cjs');

const { executeWorkspaceAction } = require(path.join(root, 'lib/ordis/workspace-actions.ts'));
const { createWorkspace, updateWorkspace, getWorkspace } = require(path.join(root, 'lib/db/workspaces.ts'));
const { OrdisEngine } = require(path.join(root, 'lib/ordis/server.ts'));

function createAuthRequest(userKey, workspaceId) {
  const token = getAuthToken(userKey);
  return new Request(`http://localhost/api/ordis/action?workspaceId=${workspaceId}`, {
    headers: {
      cookie: `auth_session_token=${token}`,
      authorization: `Bearer ${token}`,
    },
  });
}

test.beforeEach(() => {
  resetStore();
});

// ============================================================================
// Group 1: Feature 13 — Confirmation Gate Halting & Enqueuing
// ============================================================================
test('Adversarial Feature 13: Destructive Actions Halted Without input.confirmed', async (t) => {
  const destructiveOps = [
    { op: 'delete_task', input: { id: 'tsk_dummy_1' } },
    { op: 'delete_project', input: { id: 'proj_dummy_1' } },
    { op: 'delete_department', input: { id: 'dept_dummy_1' } },
    { op: 'remove_member', input: { userId: 'usr_dummy_1' } },
    { op: 'delete_meeting', input: { id: 'meet_dummy_1' } },
    { op: 'delete_document', input: { id: 'doc_dummy_1' } },
  ];

  for (const { op, input } of destructiveOps) {
    await t.test(`Confirmation gate halts '${op}' without confirmation and enqueues to approval queue`, async () => {
      const initialQueueSize = inMemoryStore.approvalQueue.size;
      const req = createAuthRequest('ownerAlpha', 'ws_alpha');

      const result = await executeWorkspaceAction(req, 'ws_alpha', op, { ...input });

      assert.equal(result.ok, false, `Operation ${op} must NOT execute without confirmation`);
      assert.equal(result.changed, false, `Operation ${op} must not mark changed=true when halted`);
      assert.ok(result.error && result.error.includes('Confirmation required'), `Error must state confirmation required: ${result.error}`);
      assert.ok(result.actionPayload, 'Action payload must be present');
      assert.equal(result.actionPayload.type, 'action_confirmation_required');
      assert.equal(result.actionPayload.operation, op);
      assert.ok(result.actionPayload.actionId, 'Generated actionId must be present');

      // Verify approval queue registration
      const enqueued = inMemoryStore.approvalQueue.get(result.actionPayload.actionId);
      assert.ok(enqueued, `Item ${result.actionPayload.actionId} must be present in inMemoryStore.approvalQueue`);
      assert.equal(enqueued.status, 'pending');
      assert.equal(enqueued.workspaceId, 'ws_alpha');
      assert.equal(enqueued.operation, op);
      assert.equal(inMemoryStore.approvalQueue.size, initialQueueSize + 1);
    });
  }

  await t.test('Confirmation gate allows execution when input.confirmed === true', async () => {
    // Seed a task to delete
    inMemoryStore.tasks.set('tsk_to_confirm_del', {
      id: 'tsk_to_confirm_del',
      workspaceId: 'ws_alpha',
      title: 'Target to Delete',
      status: 'todo',
    });

    const req = createAuthRequest('ownerAlpha', 'ws_alpha');
    const result = await executeWorkspaceAction(req, 'ws_alpha', 'delete_task', {
      id: 'tsk_to_confirm_del',
      confirmed: true,
    });

    // It should pass confirmation gate (no action_confirmation_required error)
    if (!result.ok) {
      assert.notEqual(result.actionPayload?.type, 'action_confirmation_required',
        'Should not be halted by confirmation gate when input.confirmed === true');
    }
  });

  await t.test('Non-destructive actions (e.g. create_task) bypass confirmation gate', async () => {
    const initialQueueSize = inMemoryStore.approvalQueue.size;
    const req = createAuthRequest('ownerAlpha', 'ws_alpha');

    const result = await executeWorkspaceAction(req, 'ws_alpha', 'create_task', {
      title: 'Harmless Task',
      priority: 'medium',
    });

    assert.notEqual(result.actionPayload?.type, 'action_confirmation_required',
      'create_task is non-destructive and must not trigger confirmation gate');
    assert.equal(inMemoryStore.approvalQueue.size, initialQueueSize,
      'Approval queue size must not increase for non-destructive actions');
  });

  await t.test('Disabling approvalRequiredForActions in workspace settings allows destructive actions without confirmation', async () => {
    // Explicitly disable approval required in ws_alpha settings
    const ws = inMemoryStore.workspaces.get('ws_alpha');
    ws.settings.approvalRequiredForActions = false;

    // Seed task
    inMemoryStore.tasks.set('tsk_free_del', {
      id: 'tsk_free_del',
      workspaceId: 'ws_alpha',
      title: 'Delete without gate',
      status: 'todo',
    });

    const initialQueueSize = inMemoryStore.approvalQueue.size;
    const req = createAuthRequest('ownerAlpha', 'ws_alpha');
    const result = await executeWorkspaceAction(req, 'ws_alpha', 'delete_task', {
      id: 'tsk_free_del',
      // confirmed: false/omitted
    });

    assert.notEqual(result.actionPayload?.type, 'action_confirmation_required',
      'Should not be gated when approvalRequiredForActions is false');
    assert.equal(inMemoryStore.approvalQueue.size, initialQueueSize,
      'No pending approval item should be enqueued when setting is disabled');
  });
});

// ============================================================================
// Group 2: RBAC Enforcement on Approval Queue and External Actions
// ============================================================================
test('Adversarial RBAC: Role-Based Access Control on Approval Queue and Actions', async (t) => {
  const seedApprovalItem = (id = 'appr_rbac_test_01') => {
    inMemoryStore.approvalQueue.set(id, {
      id,
      workspaceId: 'ws_alpha',
      operation: 'delete_task',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  };

  await t.test('Viewer role in workspace cannot resolve approval queue item (strictly 403)', async () => {
    const testActionId = 'appr_rbac_viewer';
    seedApprovalItem(testActionId);

    const res = await apiCall(`/api/ordis/approval-queue/${testActionId}`, {
      method: 'POST',
      user: 'viewerAlpha',
      body: { action: 'approve', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 403, `Viewer role must receive 403 Forbidden on approval resolution, got ${res.status}`);
    const item = inMemoryStore.approvalQueue.get(testActionId);
    assert.equal(item.status, 'pending', 'Status must remain pending');
  });

  await t.test('Member role in workspace cannot resolve approval queue item (strictly 403)', async () => {
    const testActionId = 'appr_rbac_member';
    seedApprovalItem(testActionId);

    const res = await apiCall(`/api/ordis/approval-queue/${testActionId}`, {
      method: 'POST',
      user: 'memberAlpha',
      body: { action: 'approve', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 403, `Member role must receive 403 Forbidden on approval resolution, got ${res.status}`);
    const item = inMemoryStore.approvalQueue.get(testActionId);
    assert.equal(item.status, 'pending', 'Status must remain pending');
  });

  await t.test('Foreign workspace owner cannot resolve victim approval item (strictly 403)', async () => {
    const testActionId = 'appr_rbac_foreign';
    seedApprovalItem(testActionId);

    const res = await apiCall(`/api/ordis/approval-queue/${testActionId}`, {
      method: 'POST',
      user: 'ownerBeta',
      body: { action: 'approve', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 403, `Cross-workspace tenant must receive 403 Forbidden, got ${res.status}`);
    const item = inMemoryStore.approvalQueue.get(testActionId);
    assert.equal(item.status, 'pending', 'Status must remain pending');
  });

  await t.test('Owner of the workspace CAN resolve approval item (200 OK)', async () => {
    const testActionId = 'appr_rbac_owner';
    seedApprovalItem(testActionId);

    const res = await apiCall(`/api/ordis/approval-queue/${testActionId}`, {
      method: 'POST',
      user: 'ownerAlpha',
      body: { action: 'approve', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 200, `Owner must be authorized to resolve, got ${res.status}`);
    const item = inMemoryStore.approvalQueue.get(testActionId);
    assert.equal(item.status, 'approved');
  });

  await t.test('Viewer cannot dispatch external action (POST /api/ordis/external-action returns 403)', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'viewerAlpha',
      body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: { amount: 500 } },
    });
    assert.equal(res.status, 403, 'Viewer must be blocked from external actions');
  });

  await t.test('Member cannot dispatch external action (POST /api/ordis/external-action returns 403)', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'memberAlpha',
      body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: { amount: 500 } },
    });
    assert.equal(res.status, 403, 'Member must be blocked from external actions');
  });

  await t.test('Owner CAN dispatch external action (POST /api/ordis/external-action returns 200)', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: { amount: 500 } },
    });
    assert.equal(res.status, 200, 'Owner must be authorized to dispatch external actions');
  });
});

// ============================================================================
// Group 3: Strict Error Semantics — 404 for Missing Items, 400 for Invalid Verbs
// ============================================================================
test('Adversarial Semantics: Strict 404 for Missing Items & Strict 400 for Invalid Verbs', async (t) => {
  const ghostIds = ['appr_non_existent_001', 'appr_ghost_99999', 'unknown_id_xyz'];
  for (const ghostId of ghostIds) {
    await t.test(`Resolving missing item '${ghostId}' returns strictly 404`, async () => {
      const res = await apiCall(`/api/ordis/approval-queue/${ghostId}`, {
        method: 'POST',
        user: 'ownerAlpha',
        body: { action: 'approve', workspaceId: 'ws_alpha' },
      });
      assert.equal(res.status, 404, `Missing item resolution must return strictly 404, got ${res.status}`);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error && body.error.toLowerCase().includes('not found'));
    });
  }

  const invalidVerbs = [
    'explode',
    'destroy',
    'drop_tables',
    'APPROVE', // Case sensitivity check
    'REJECT',
    'yes',
    'no',
    'accept',
    '',
    12345,
    true,
    null,
  ];

  for (const badVerb of invalidVerbs) {
    await t.test(`Invalid action verb '${badVerb}' strictly returns 400 Bad Request`, async () => {
      const validItemId = 'appr_verb_' + Math.random().toString(36).slice(2, 7);
      inMemoryStore.approvalQueue.set(validItemId, {
        id: validItemId,
        workspaceId: 'ws_alpha',
        operation: 'delete_task',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      const res = await apiCall(`/api/ordis/approval-queue/${validItemId}`, {
        method: 'POST',
        user: 'ownerAlpha',
        body: { action: badVerb, workspaceId: 'ws_alpha' },
      });
      assert.equal(res.status, 400, `Verb '${badVerb}' must return 400 Bad Request, got ${res.status}`);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error && body.error.toLowerCase().includes('must be approve or reject'));
    });
  }

  await t.test('Missing action field in payload returns 400 Bad Request', async () => {
    const validItemId = 'appr_no_act';
    inMemoryStore.approvalQueue.set(validItemId, {
      id: validItemId,
      workspaceId: 'ws_alpha',
      operation: 'delete_task',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const res = await apiCall(`/api/ordis/approval-queue/${validItemId}`, {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha' }, // no action field
    });
    assert.equal(res.status, 400);
  });
});

// ============================================================================
// Group 4: Feature 14 — Paid Tier Safety Policy Invariants
// ============================================================================
test('Adversarial Feature 14: Tier Upgrades MUST NOT Silently Disable Safety Gate', async (t) => {
  const tiersToTest = ['paid', 'pro', 'enterprise'];

  for (const tier of tiersToTest) {
    await t.test(`Upgrading ws_alpha to tier '${tier}' preserves approvalRequiredForActions: true`, async () => {
      // Ensure initial state
      const initialWs = inMemoryStore.workspaces.get('ws_alpha');
      initialWs.settings.approvalRequiredForActions = true;

      const res = await apiCall('/api/workspaces', {
        method: 'PATCH',
        user: 'ownerAlpha',
        body: { workspaceId: 'ws_alpha', tier },
      });
      assert.equal(res.status, 200, `Workspace update to tier ${tier} must succeed`);

      const updatedWs = inMemoryStore.workspaces.get('ws_alpha');
      assert.equal(updatedWs.tier, tier);
      assert.equal(
        updatedWs.settings.approvalRequiredForActions,
        true,
        `Tier upgrade to '${tier}' must NOT disable approvalRequiredForActions!`
      );
    });
  }

  await t.test('createWorkspace with paid/pro/enterprise tier defaults approvalRequiredForActions to true', async () => {
    const proWsId = await createWorkspace(USERS.ownerAlpha.uid, {
      name: 'Safety Pro Workspace',
      tier: 'pro',
    });
    const createdPro = inMemoryStore.workspaces.get(proWsId);
    assert.ok(createdPro, 'Created Pro workspace must exist');
    assert.equal(createdPro.settings.approvalRequiredForActions, true);

    const entWsId = await createWorkspace(USERS.ownerAlpha.uid, {
      name: 'Safety Enterprise Workspace',
      tier: 'enterprise',
    });
    const createdEnt = inMemoryStore.workspaces.get(entWsId);
    assert.ok(createdEnt, 'Created Enterprise workspace must exist');
    assert.equal(createdEnt.settings.approvalRequiredForActions, true);
  });

  await t.test('Explicitly disabled approvalRequiredForActions remains disabled across non-setting tier updates', async () => {
    // Explicitly disable
    const resDisable = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: {
        workspaceId: 'ws_alpha',
        settings: { approvalRequiredForActions: false },
      },
    });
    assert.equal(resDisable.status, 200);
    assert.equal(inMemoryStore.workspaces.get('ws_alpha').settings.approvalRequiredForActions, false);

    // Update tier to enterprise without setting approvalRequired
    const resTier = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', tier: 'enterprise' },
    });
    assert.equal(resTier.status, 200);

    // It should preserve the existing false setting, not reset it
    const ws = inMemoryStore.workspaces.get('ws_alpha');
    assert.equal(ws.settings.approvalRequiredForActions, false);
  });

  await t.test('Explicitly enabling approvalRequiredForActions updates cleanly', async () => {
    const resEnable = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: {
        workspaceId: 'ws_alpha',
        settings: { approvalRequiredForActions: true },
      },
    });
    assert.equal(resEnable.status, 200);
    assert.equal(inMemoryStore.workspaces.get('ws_alpha').settings.approvalRequiredForActions, true);
  });
});

// ============================================================================
// Group 5: Pagination and Query Boundaries on Approval Queue
// ============================================================================
test('Adversarial Pagination: Boundary Behavior on GET /api/ordis/approval-queue', async (t) => {
  const seedPaginationItems = () => {
    inMemoryStore.approvalQueue.clear();
    const now = Date.now();
    for (let i = 0; i < 7; i++) {
      const id = `appr_page_item_${i}`;
      inMemoryStore.approvalQueue.set(id, {
        id,
        workspaceId: 'ws_alpha',
        operation: `op_${i}`,
        status: 'pending',
        createdAt: new Date(now - i * 1000).toISOString(),
      });
    }
  };

  await t.test('limit=0 strictly returns an empty items array', async () => {
    seedPaginationItems();
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&limit=0', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items), 'items must be an array');
    assert.equal(data.items.length, 0, 'limit=0 must return 0 items');
  });

  await t.test('limit=3 returns exactly first 3 items sorted by latest createdAt', async () => {
    seedPaginationItems();
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&limit=3', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.items.length, 3);
    assert.equal(data.items[0].id, 'appr_page_item_0');
    assert.equal(data.items[1].id, 'appr_page_item_1');
    assert.equal(data.items[2].id, 'appr_page_item_2');
  });

  await t.test('Negative offset (e.g. offset=-5) is clamped to 0 (does not throw)', async () => {
    seedPaginationItems();
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&offset=-5&limit=2', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.items.length, 2);
    assert.equal(data.items[0].id, 'appr_page_item_0');
  });

  await t.test('Offset beyond total items returns empty array', async () => {
    seedPaginationItems();
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&offset=50', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items));
    assert.equal(data.items.length, 0);
  });

  await t.test('Pagination slice with offset=4 and limit=2 returns items 4 and 5', async () => {
    seedPaginationItems();
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&offset=4&limit=2', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.items.length, 2);
    assert.equal(data.items[0].id, 'appr_page_item_4');
    assert.equal(data.items[1].id, 'appr_page_item_5');
  });

  await t.test('Non-numeric offset and limit degrade gracefully to defaults', async () => {
    seedPaginationItems();
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&offset=bad&limit=evil', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items));
  });
});

// ============================================================================
// Group 6: Unauthenticated Request & Security Boundary Analysis
// ============================================================================
test('Adversarial Security: Unauthenticated Resolution Protection', async (t) => {
  await t.test('Resolving existing approval item without session token returns 401', async () => {
    const seedId = 'appr_unauth_probe_exists';
    inMemoryStore.approvalQueue.set(seedId, {
      id: seedId,
      workspaceId: 'ws_alpha',
      operation: 'delete_task',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const res = await apiCall(`/api/ordis/approval-queue/${seedId}`, {
      method: 'POST',
      // user omitted: unauthenticated
      body: { action: 'approve' },
    });
    assert.equal(res.status, 401, `Unauthenticated request on existing item must return 401, got ${res.status}`);
  });

  await t.test('Resolving non-existent item without session token does NOT leak internal data (401 or 404)', async () => {
    const res = await apiCall('/api/ordis/approval-queue/appr_nonexistent_unauth', {
      method: 'POST',
      body: { action: 'approve' },
    });
    assert.ok(
      res.status === 401 || res.status === 404,
      `Unauthenticated probe on non-existent item must return 401 or 404, got ${res.status}`
    );
  });
});
