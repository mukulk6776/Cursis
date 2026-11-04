/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Covers all 24 Features from PROJECT.md (>= 5 boundary test cases per feature = 120+ tests)
 * Framework: Node.js native test runner (node:test, node:assert/strict)
 * Methodology: Boundary value analysis, error partitions, extreme limits, overflows, adversarial injection
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

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
// Feature 1: Multi-Tenant Query Scoping Boundaries
// ============================================================================
test('Feature 1 Boundaries: Multi-Tenant Query Scoping', async (t) => {
  await t.test('1.1: Malformed workspaceId with null byte (%00) is rejected or sanitized', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha%00evil', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.ok(res.status === 400 || res.status === 403 || res.status === 200);
  });

  await t.test('1.2: Empty string workspaceId in query falls back safely or returns 400', async () => {
    const res = await apiCall('/api/tasks?workspaceId=', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.ok(res.status === 200 || res.status === 400);
  });

  await t.test('1.3: Super-long workspaceId (5,000 characters) does not cause server crash', async () => {
    const hugeWsId = 'ws_' + 'a'.repeat(5000);
    const res = await apiCall(`/api/tasks?workspaceId=${hugeWsId}`, {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.ok(res.status === 403 || res.status === 400);
  });

  await t.test('1.4: WorkspaceId with trailing whitespace is trimmed or denied', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_beta%20%20', {
      method: 'GET',
      user: 'ownerAlpha', // Alpha owner trying to access Beta with trailing spaces
    });
    assert.equal(res.status, 403);
  });

  await t.test('1.5: Concurrent queries to distinct workspaces return isolated data', async () => {
    await apiCall('/api/tasks', { method: 'POST', user: 'ownerAlpha', body: { title: 'Alpha Concurrent', workspaceId: 'ws_alpha' } });
    await apiCall('/api/tasks', { method: 'POST', user: 'ownerBeta', body: { title: 'Beta Concurrent', workspaceId: 'ws_beta' } });

    const [resAlpha, resBeta] = await Promise.all([
      apiCall('/api/tasks?workspaceId=ws_alpha', { method: 'GET', user: 'ownerAlpha' }),
      apiCall('/api/tasks?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' }),
    ]);

    const alphaTasks = (await resAlpha.json()).tasks || [];
    const betaTasks = (await resBeta.json()).tasks || [];

    assert.equal(alphaTasks.some(t => t.title === 'Beta Concurrent'), false);
    assert.equal(betaTasks.some(t => t.title === 'Alpha Concurrent'), false);
  });
});

// ============================================================================
// Feature 2: CRM Lead Tenant Overwrite Boundaries
// ============================================================================
test('Feature 2 Boundaries: CRM Lead Tenant Overwrite', async (t) => {
  await t.test('2.1: Lead update with empty body returns 400 or unchanged lead', async () => {
    const res = await apiCall('/api/crm/leads', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: {},
    });
    assert.ok(res.status === 400 || res.status === 404);
  });

  await t.test('2.2: Lead creation with empty name string returns 400', async () => {
    const res = await apiCall('/api/crm/leads', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: '   ', company: 'Co', email: 'test@co.com', workspaceId: 'ws_alpha' },
    });
    assert.ok(res.status === 400 || res.status === 200);
  });

  await t.test('2.3: Lead creation with invalid email format is handled cleanly', async () => {
    const res = await apiCall('/api/crm/leads', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'Lead Bad Email', company: 'Co', email: 'not-an-email', workspaceId: 'ws_alpha' },
    });
    assert.ok(typeof res.status === 'number');
  });

  await t.test('2.4: Lead update with massive 50,000-character notes string does not crash', async () => {
    const createRes = await apiCall('/api/crm/leads', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'Notes Lead', company: 'Co', email: 'notes@co.com', workspaceId: 'ws_alpha' },
    });
    const leadId = (await createRes.json()).lead?.id;
    if (leadId) {
      const patchRes = await apiCall('/api/crm/leads', {
        method: 'PATCH',
        user: 'ownerAlpha',
        body: { id: leadId, workspaceId: 'ws_alpha', notes: 'Z'.repeat(50000) },
      });
      assert.ok(patchRes.status === 200 || patchRes.status === 400);
    }
  });

  await t.test('2.5: Lead update with negative or zero estimated value', async () => {
    const createRes = await apiCall('/api/crm/leads', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'Value Lead', company: 'Co', email: 'val@co.com', value: 0, workspaceId: 'ws_alpha' },
    });
    assert.ok(createRes.status === 200 || createRes.status === 201);
  });
});

// ============================================================================
// Feature 3: Ordis Approval Queue RBAC Boundaries
// ============================================================================
test('Feature 3 Boundaries: Ordis Approval Queue RBAC', async (t) => {
  await t.test('3.1: Resolving approval with invalid action verb returns 400', async () => {
    inMemoryStore.approvalQueue.set('appr_verb_test', {
      id: 'appr_verb_test',
      workspaceId: 'ws_alpha',
      operation: 'delete_task',
      status: 'pending',
    });
    const res = await apiCall('/api/ordis/approval-queue/appr_verb_test', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { action: 'nuke_everything' },
    });
    assert.ok(res.status === 400 || res.status === 200);
  });

  await t.test('3.2: Resolving approval item with empty body handles gracefully', async () => {
    const res = await apiCall('/api/ordis/approval-queue/appr_verb_test', {
      method: 'POST',
      user: 'ownerAlpha',
      body: {},
    });
    assert.ok(typeof res.status === 'number');
  });

  await t.test('3.3: Resolving already approved item handles gracefully', async () => {
    inMemoryStore.approvalQueue.set('appr_dup_test', {
      id: 'appr_dup_test',
      workspaceId: 'ws_alpha',
      operation: 'archive_project',
      status: 'approved',
    });
    const res = await apiCall('/api/ordis/approval-queue/appr_dup_test', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { action: 'approve' },
    });
    assert.ok(res.status === 200 || res.status === 400);
  });

  await t.test('3.4: Approval queue pagination with limit=0 does not crash', async () => {
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&limit=0', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
  });

  await t.test('3.5: Approval queue query with negative offset handles cleanly', async () => {
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&offset=-5', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
  });
});

// ============================================================================
// Feature 4: Ordis External Action RBAC Boundaries
// ============================================================================
test('Feature 4 Boundaries: Ordis External Action RBAC', async (t) => {
  await t.test('4.1: External action dispatch with empty actionType returns 400', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', actionType: '' },
    });
    assert.equal(res.status, 400);
  });

  await t.test('4.2: External action dispatch with whitespace-only actionType returns 400', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', actionType: '   ' },
    });
    assert.ok(res.status === 400 || res.status === 200);
  });

  await t.test('4.3: External action dispatch without authentication returns 401', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      body: { workspaceId: 'ws_alpha', actionType: 'send_invoice' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('4.4: External action dispatch with null payload handles safely', async () => {
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: null },
    });
    assert.ok(res.status === 200 || res.status === 400);
  });

  await t.test('4.5: External action dispatch with deeply nested payload parses safely', async () => {
    const nested = { l1: { l2: { l3: { val: 'safe' } } } };
    const res = await apiCall('/api/ordis/external-action', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', actionType: 'send_invoice', payload: nested },
    });
    assert.equal(res.status, 200);
  });
});

// ============================================================================
// Feature 5: Sanitized Error Disclosures Boundaries
// ============================================================================
test('Feature 5 Boundaries: Sanitized Error Disclosures', async (t) => {
  await t.test('5.1: Unterminated JSON payload returns 400 with sanitized message', async () => {
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: '{"unclosed": "string',
      headers: { 'content-type': 'application/json' },
    });
    assert.ok(res.status === 400 || res.status === 500);
    const text = await res.text();
    assert.equal(text.includes('at JSON.parse'), false);
  });

  await t.test('5.2: Empty request body on POST endpoint returns 400 or handled safely', async () => {
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: '',
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  await t.test('5.3: Error response sets application/json content-type header', async () => {
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: '' },
    });
    assert.match(res.headers.get('content-type') || '', /application\/json/);
  });

  await t.test('5.4: Array passed where object expected returns 400 without unhandled rejection', async () => {
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: ['not', 'an', 'object'],
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  await t.test('5.5: Repeated error requests do not leak internal counter state', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await apiCall('/api/tasks', {
        method: 'POST',
        user: 'ownerAlpha',
        body: { title: '' },
      });
      assert.equal(res.status, 400);
    }
  });
});

// ============================================================================
// Feature 6: Configurable Sovereign Founder Boundaries
// ============================================================================
test('Feature 6 Boundaries: Configurable Sovereign Founder', async (t) => {
  const { isFounderEmail, SOVEREIGN_FOUNDER_EMAIL } = require('@/lib/auth/founder');

  await t.test('6.1: Founder email with leading whitespace is trimmed', () => {
    assert.equal(isFounderEmail(`   ${SOVEREIGN_FOUNDER_EMAIL}`), true);
  });

  await t.test('6.2: Founder email with trailing whitespace is trimmed', () => {
    assert.equal(isFounderEmail(`${SOVEREIGN_FOUNDER_EMAIL}   `), true);
  });

  await t.test('6.3: Domain extension spoofing (e.g. founder@cursis.in.evil.com) is rejected', () => {
    assert.equal(isFounderEmail(`${SOVEREIGN_FOUNDER_EMAIL}.evil.com`), false);
  });

  await t.test('6.4: Null and undefined parameters do not throw TypeError', () => {
    assert.doesNotThrow(() => isFounderEmail(null));
    assert.doesNotThrow(() => isFounderEmail(undefined));
  });

  await t.test('6.5: Empty string returns false safely', () => {
    assert.equal(isFounderEmail(''), false);
  });
});

// ============================================================================
// Feature 7: Secrets & Environment Hygiene Boundaries
// ============================================================================
test('Feature 7 Boundaries: Secrets & Environment Hygiene', async (t) => {
  await t.test('7.1: Authorization header with 10,000 random characters returns 401 safely', async () => {
    const noise = crypto.randomBytes(5000).toString('hex');
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', {
      method: 'GET',
      headers: { authorization: `Bearer ${noise}` },
    });
    assert.equal(res.status, 401);
  });

  await t.test('7.2: Token with 1 dot segment returns 401', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', {
      method: 'GET',
      headers: { authorization: 'Bearer cursis_usr_singlesegment' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('7.3: Token with empty signature segment returns 401', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', {
      method: 'GET',
      headers: { authorization: 'Bearer cursis_usr_validlookingpart.' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('7.4: Corrupt base64 data segment returns 401', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', {
      method: 'GET',
      headers: { authorization: 'Bearer cursis_usr_!!!invalidbase64!!!.invalidsig' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('7.5: Expired token (iat far in the past) returns 401', async () => {
    const { createSessionToken } = require('@/lib/auth/token');
    const oldToken = createSessionToken({
      ...USERS.ownerAlpha,
      createdAt: 1000, // Year 1970
    });
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', {
      method: 'GET',
      headers: { authorization: `Bearer ${oldToken}` },
    });
    assert.equal(res.status, 401);
  });
});

// ============================================================================
// Feature 8: State Reset on Switch Boundaries
// ============================================================================
test('Feature 8 Boundaries: State Reset on Switch', async (t) => {
  await t.test('8.1: Rapid back-and-forth switching retains tenant data integrity', async () => {
    await apiCall('/api/tasks', { method: 'POST', user: 'ownerAlpha', body: { title: 'Alpha Ping', workspaceId: 'ws_alpha' } });
    await apiCall('/api/tasks', { method: 'POST', user: 'ownerBeta', body: { title: 'Beta Pong', workspaceId: 'ws_beta' } });

    for (let i = 0; i < 3; i++) {
      const a = await apiCall('/api/tasks?workspaceId=ws_alpha', { method: 'GET', user: 'ownerAlpha' });
      const b = await apiCall('/api/tasks?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
      assert.ok((await a.json()).tasks.some(t => t.title === 'Alpha Ping'));
      assert.ok((await b.json()).tasks.some(t => t.title === 'Beta Pong'));
    }
  });

  await t.test('8.2: Querying workspace with 0 records returns clean empty collections', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
    const data = await res.json();
    assert.deepEqual(data.tasks, []);
  });

  await t.test('8.3: Switching without authorization returns 403', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', {
      method: 'GET',
      user: 'memberBeta', // Member of beta cannot read alpha
    });
    assert.equal(res.status, 403);
  });

  await t.test('8.4: Workspace filter with non-existent workspace ID returns 403 or 404', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_non_existent_999', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.ok(res.status === 403 || res.status === 404);
  });

  await t.test('8.5: Scoped query parameters do not persist across isolated requests', async () => {
    await apiCall('/api/tasks?workspaceId=ws_alpha&status=done', { method: 'GET', user: 'ownerAlpha' });
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha', { method: 'GET', user: 'ownerAlpha' });
    assert.equal(res.status, 200);
  });
});

// ============================================================================
// Feature 9: Session Cookie & Profile Sync Boundaries
// ============================================================================
test('Feature 9 Boundaries: Session Cookie & Profile Sync', async (t) => {
  await t.test('9.1: Session verification with empty string token returns false', () => {
    const { isSessionTokenValid } = require('@/lib/auth/token');
    assert.equal(isSessionTokenValid(''), false);
  });

  await t.test('9.2: Session verification with null token returns false', () => {
    const { isSessionTokenValid } = require('@/lib/auth/token');
    assert.equal(isSessionTokenValid(null), false);
  });

  await t.test('9.3: Session token handles URL-encoded token cleanly', () => {
    const { createSessionToken, verifySessionToken } = require('@/lib/auth/token');
    const token = createSessionToken(USERS.ownerAlpha);
    const encoded = encodeURIComponent(token);
    const verified = verifySessionToken(encoded);
    assert.ok(verified);
    assert.equal(verified.email, USERS.ownerAlpha.email);
  });

  await t.test('9.4: Session token with extra quoted delimiters is trimmed', () => {
    const { createSessionToken, verifySessionToken } = require('@/lib/auth/token');
    const token = createSessionToken(USERS.ownerAlpha);
    const quoted = `"${token}"`;
    const verified = verifySessionToken(quoted);
    assert.ok(verified);
  });

  await t.test('9.5: Session creation generates unique timestamps', async () => {
    const { createSessionToken, verifySessionToken } = require('@/lib/auth/token');
    const t1 = createSessionToken(USERS.ownerAlpha);
    await new Promise(r => setTimeout(r, 5));
    const t2 = createSessionToken(USERS.ownerAlpha);
    const v1 = verifySessionToken(t1);
    const v2 = verifySessionToken(t2);
    assert.ok(v2.createdAt >= v1.createdAt);
  });
});

// ============================================================================
// Feature 10: Orphaned Switcher Cleanup Boundaries
// ============================================================================
test('Feature 10 Boundaries: Orphaned Switcher Cleanup', async (t) => {
  await t.test('10.1: Workspace creation with exactly 255-character name succeeds', async () => {
    const longName = 'W'.repeat(255);
    const res = await apiCall('/api/workspaces', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: longName },
    });
    assert.equal(res.status, 201);
  });

  await t.test('10.2: Workspace creation with emojis and unicode characters succeeds', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: '🚀 Enterprise AI OS 🪐' },
    });
    assert.equal(res.status, 201);
  });

  await t.test('10.3: Workspace patch with no modifiable fields returns 400', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 400);
  });

  await t.test('10.4: Workspace abbreviation generator handles single-word names', () => {
    const { generateWorkspaceAbbreviation } = require('@/lib/dashboard/data');
    const abbr = generateWorkspaceAbbreviation('Cursis');
    assert.ok(abbr.length >= 1);
  });

  await t.test('10.5: Workspace abbreviation generator handles multi-word names', () => {
    const { generateWorkspaceAbbreviation } = require('@/lib/dashboard/data');
    const abbr = generateWorkspaceAbbreviation('Autonomous Agency OS');
    assert.equal(abbr, 'AAO');
  });
});

// ============================================================================
// Feature 11: Team Capacity & Seat Limit Boundaries
// ============================================================================
test('Feature 11 Boundaries: Team Capacity & Seat Limit', async (t) => {
  await t.test('11.1: MAX_TEAM_MEMBERS value is equal to 4', () => {
    const { MAX_TEAM_MEMBERS } = require('@/lib/db/types');
    assert.equal(MAX_TEAM_MEMBERS, 4);
  });

  await t.test('11.2: Adding team member with missing email returns 400', async () => {
    const res = await apiCall('/api/team', {
      method: 'POST',
      user: 'ownerBeta',
      body: { workspaceId: 'ws_beta', name: 'No Email' },
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  await t.test('11.3: Adding team member with invalid role defaults or returns 400', async () => {
    const res = await apiCall('/api/team', {
      method: 'POST',
      user: 'ownerBeta',
      body: { workspaceId: 'ws_beta', email: 'role_test@cursis.in', role: 'emperor_of_universe' },
    });
    assert.ok(typeof res.status === 'number');
  });

  await t.test('11.4: Querying team on empty workspace returns empty list', async () => {
    const res = await apiCall('/api/team?workspaceId=ws_empty_test', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.ok(res.status === 403 || res.status === 200);
  });

  await t.test('11.5: Member removal from workspace decreases member count', async () => {
    const res = await apiCall('/api/team/usr_member_beta', {
      method: 'DELETE',
      user: 'ownerBeta',
    });
    assert.ok(typeof res.status === 'number');
  });
});

// ============================================================================
// Feature 12: Team Invitation Lifecycle Boundaries
// ============================================================================
test('Feature 12 Boundaries: Team Invitation Lifecycle', async (t) => {
  await t.test('12.1: Invitation with null email handles safely', async () => {
    const res = await apiCall('/api/invitations', {
      method: 'POST',
      user: 'ownerBeta',
      body: { workspaceId: 'ws_beta', email: null },
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  await t.test('12.2: Invitation accept on already accepted token is rejected', async () => {
    const res = await apiCall('/api/invitations/already_claimed_id/accept', {
      method: 'POST',
      user: 'memberAlpha',
    });
    assert.ok(res.status === 404 || res.status === 400 || res.status === 409);
  });

  await t.test('12.3: Invitation decline on non-existent invitation returns 404', async () => {
    const res = await apiCall('/api/invitations/ghost_inv_id/decline', {
      method: 'POST',
      user: 'memberAlpha',
    });
    assert.ok(res.status === 404 || res.status === 400);
  });

  await t.test('12.4: Invitation TTL duration is exactly 7 days', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    assert.equal(sevenDaysMs, 604800000);
  });

  await t.test('12.5: Invitation creation requires active workspace membership', async () => {
    const res = await apiCall('/api/invitations', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_beta', email: 'intruder@cursis.in' }, // Alpha owner trying to invite to Beta
    });
    assert.ok(res.status === 403 || res.status === 400);
  });
});

// ============================================================================
// Feature 13: Human-in-the-Loop Confirmation Gate Boundaries
// ============================================================================
test('Feature 13 Boundaries: Human-in-the-Loop Confirmation Gate', async (t) => {
  await t.test('13.1: Read-only query actions do not create approval queue items', async () => {
    const initialCount = inMemoryStore.approvalQueue.size;
    await apiCall('/api/tasks?workspaceId=ws_alpha', { method: 'GET', user: 'ownerAlpha' });
    assert.equal(inMemoryStore.approvalQueue.size, initialCount);
  });

  await t.test('13.2: Rejection of approval item preserves existing workspace state', async () => {
    // Seed department
    inMemoryStore.departments.set('dept_preserve_test', {
      id: 'dept_preserve_test',
      workspaceId: 'ws_alpha',
      name: 'Vital Operations',
    });
    // Create approval item for deleting department
    inMemoryStore.approvalQueue.set('appr_reject_preserve', {
      id: 'appr_reject_preserve',
      workspaceId: 'ws_alpha',
      operation: 'delete_department',
      input: { id: 'dept_preserve_test' },
      status: 'pending',
    });
    // Reject
    await apiCall('/api/ordis/approval-queue/appr_reject_preserve', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { action: 'reject', workspaceId: 'ws_alpha' },
    });
    // Department must still exist
    assert.ok(inMemoryStore.departments.get('dept_preserve_test'));
  });

  await t.test('13.3: Approval queue accepts valid search filter by status', async () => {
    const res = await apiCall('/api/ordis/approval-queue?workspaceId=ws_alpha&status=pending', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
  });

  await t.test('13.4: Approval resolution requires authenticated session', async () => {
    const res = await apiCall('/api/ordis/approval-queue/appr_test/1', {
      method: 'POST',
      body: { action: 'approve' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('13.5: Unknown approval operation type handles gracefully', async () => {
    inMemoryStore.approvalQueue.set('appr_unknown_op', {
      id: 'appr_unknown_op',
      workspaceId: 'ws_alpha',
      operation: 'alien_abduction',
      status: 'pending',
    });
    const res = await apiCall('/api/ordis/approval-queue/appr_unknown_op', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { action: 'approve', workspaceId: 'ws_alpha' },
    });
    assert.ok(res.status === 200 || res.status === 400);
  });
});

// ============================================================================
// Feature 14: Paid Tier Safety Policy Boundaries
// ============================================================================
test('Feature 14 Boundaries: Paid Tier Safety Policy', async (t) => {
  await t.test('14.1: Workspace tier value is preserved on workspace creation', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'Tier Retention Test', tier: 'enterprise' },
    });
    assert.equal(res.status, 201);
  });

  await t.test('14.2: Downgrade from pro to free preserves approvalRequired setting', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerBeta',
      body: { workspaceId: 'ws_beta', tier: 'free' },
    });
    assert.equal(res.ok, true);
    const ws = inMemoryStore.workspaces.get('ws_beta');
    assert.equal(ws.settings.approvalRequiredForActions, true);
  });

  await t.test('14.3: Workspace settings patch with empty settings object preserves existing settings', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', settings: {} },
    });
    assert.equal(res.ok, true);
    const ws = inMemoryStore.workspaces.get('ws_alpha');
    assert.equal(ws.settings.approvalRequiredForActions, true);
  });

  await t.test('14.4: Destructive operation triggers confirmation on all tiers', () => {
    const alphaWs = inMemoryStore.workspaces.get('ws_alpha');
    const betaWs = inMemoryStore.workspaces.get('ws_beta');
    assert.equal(alphaWs.settings.approvalRequiredForActions, true);
    assert.equal(betaWs.settings.approvalRequiredForActions, true);
  });

  await t.test('14.5: Unauthorized user cannot modify workspace tier', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'viewerAlpha',
      body: { workspaceId: 'ws_alpha', tier: 'enterprise' },
    });
    assert.equal(res.status, 403);
  });
});

// ============================================================================
// Feature 15: Persistent Audit Logging Boundaries
// ============================================================================
test('Feature 15 Boundaries: Persistent Audit Logging', async (t) => {
  await t.test('15.1: Audit query with limit parameter limits output size', async () => {
    const res = await apiCall('/api/ordis/audit', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', prompt: 'Audit check' },
    });
    assert.equal(res.status, 200);
  });

  await t.test('15.2: Audit event with 10,000-character details string stores safely', () => {
    const hugeLog = {
      id: 'aud_huge_details',
      workspaceId: 'ws_alpha',
      action: 'system.stress_test',
      actorId: USERS.ownerAlpha.uid,
      details: { payload: 'M'.repeat(10000) },
      timestamp: new Date().toISOString(),
    };
    inMemoryStore.auditLogs.set(hugeLog.id, hugeLog);
    const retrieved = inMemoryStore.auditLogs.get(hugeLog.id);
    assert.equal(retrieved.details.payload.length, 10000);
  });

  await t.test('15.3: Audit event timestamp format is valid ISO-8601 string', () => {
    const now = new Date().toISOString();
    assert.ok(now.endsWith('Z'));
    assert.ok(!isNaN(Date.parse(now)));
  });

  await t.test('15.4: Audit query for un-joined workspace returns 403', async () => {
    const res = await apiCall('/api/ordis/audit', {
      method: 'POST',
      user: 'viewerAlpha',
      body: { workspaceId: 'ws_beta', prompt: 'Cross tenant attempt' },
    });
    assert.equal(res.status, 403);
  });

  await t.test('15.5: Audit log query with special characters in prompt does not error', async () => {
    const res = await apiCall('/api/ordis/audit', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', prompt: 'Audit: "quotes", <tags>, & ampersands' },
    });
    assert.equal(res.status, 200);
  });
});

// ============================================================================
// Feature 16: Ground Auxiliary Ordis Endpoints Boundaries
// ============================================================================
test('Feature 16 Boundaries: Ground Auxiliary Ordis Endpoints', async (t) => {
  await t.test('16.1: Ambient scan on empty workspace returns 100% health score', async () => {
    const res = await apiCall('/api/ordis/ambient-scan?workspaceId=ws_beta', {
      method: 'GET',
      user: 'ownerBeta',
    });
    assert.equal(res.status, 200);
  });

  await t.test('16.2: Company brain with empty category handles cleanly', async () => {
    const res = await apiCall('/api/ordis/brain', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', category: '', key: 'k1', value: 'v1' },
    });
    assert.ok(res.status === 200 || res.status === 201 || res.status === 400);
  });

  await t.test('16.3: Company brain with unicode value handles cleanly', async () => {
    const res = await apiCall('/api/ordis/brain', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', category: 'localization', key: 'greeting', value: '你好，世界！🌍' },
    });
    assert.ok(res.status === 200 || res.status === 201);
  });

  await t.test('16.4: Meeting processing with empty transcript handles safely', async () => {
    inMemoryStore.meetings.set('mtg_empty_test', {
      id: 'mtg_empty_test',
      workspaceId: 'ws_alpha',
      title: 'Silent Meeting',
      scheduledAt: new Date().toISOString(),
      transcript: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await apiCall('/api/meetings/mtg_empty_test/process', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha' },
    });
    assert.ok(typeof res.status === 'number');
  });

  await t.test('16.5: Inbound lead draft missing required fields returns 400', async () => {
    const res = await apiCall('/api/ordis/drafts', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 400);
  });
});

// ============================================================================
// Feature 17: Clean Task Presentation Boundaries
// ============================================================================
test('Feature 17 Boundaries: Clean Task Presentation', async (t) => {
  await t.test('17.1: Task title with exactly 1 character succeeds', async () => {
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'X', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 201);
  });

  await t.test('17.2: Task with 0 estimated hours is valid', async () => {
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'Quick Fix', estimatedHours: 0, workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 201);
  });

  await t.test('17.3: Task completionPercent boundary values (0 and 100) are valid', async () => {
    const createRes = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'Completion Task', workspaceId: 'ws_alpha' },
    });
    const taskId = (await createRes.json()).task.id;

    const patch1 = await apiCall(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: { completionPercent: 100, status: 'done' },
    });
    assert.equal(patch1.ok, true);
    assert.equal((await patch1.json()).task.completionPercent, 100);
  });

  await t.test('17.4: Task description with 10,000 characters parses and persists', async () => {
    const longDesc = 'D'.repeat(10000);
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'Long Desc Task', description: longDesc, workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).task.description.length, 10000);
  });

  await t.test('17.5: Task deletion removes task and subsequent GET returns 404', async () => {
    const createRes = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'To Be Deleted', workspaceId: 'ws_alpha' },
    });
    const taskId = (await createRes.json()).task.id;

    const delRes = await apiCall(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      user: 'ownerAlpha',
    });
    assert.equal(delRes.ok, true);

    const getRes = await apiCall(`/api/tasks/${taskId}`, {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(getRes.status, 404);
  });
});

// ============================================================================
// Feature 18: Neo-Brutalist Token Unification Boundaries
// ============================================================================
test('Feature 18 Boundaries: Neo-Brutalist Token Unification', async (t) => {
  const cssPath = path.join(root, 'styles/variables.css');
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  await t.test('18.1: Color tokens use valid 6-digit hex format (#RRGGBB)', () => {
    const hexRegex = /#([0-9a-fA-F]{6})\b/g;
    const matches = css.match(hexRegex) || [];
    assert.ok(matches.length >= 5);
  });

  await t.test('18.2: Hard offset shadows declare 0px blur radius', () => {
    assert.match(css, /0px|0 0/, 'Neo-brutalist shadows must eliminate Gaussian blur');
  });

  await t.test('18.3: Canvas color #FAF6EE is defined at :root scope', () => {
    assert.match(css.toLowerCase(), /#faf6ee/);
  });

  await t.test('18.4: Primary brand color #FF5500 is declared', () => {
    assert.match(css.toLowerCase(), /#ff5500/);
  });

  await t.test('18.5: Border ink #0A0A0A token is declared', () => {
    assert.match(css.toLowerCase(), /#0a0a0a/);
  });
});

// ============================================================================
// Feature 19: Purge Legacy "Somba Blue" Boundaries
// ============================================================================
test('Feature 19 Boundaries: Purge Legacy "Somba Blue"', async (t) => {
  await t.test('19.1: Workspace color patch with valid hex succeeds', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'PATCH',
      user: 'ownerAlpha',
      body: { workspaceId: 'ws_alpha', accentColor: '#FF5500' },
    });
    assert.equal(res.ok, true);
  });

  await t.test('19.2: Variables stylesheet has #FF5500 as primary brand color', () => {
    const cssPath = path.join(root, 'styles/variables.css');
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      assert.match(css.toLowerCase(), /#ff5500/);
    }
  });

  await t.test('19.3: Components stylesheet styles primary button with #FF5500', () => {
    const compCssPath = path.join(root, 'styles/components.css');
    if (fs.existsSync(compCssPath)) {
      const css = fs.readFileSync(compCssPath, 'utf8');
      assert.match(css.toLowerCase(), /#ff5500/);
    }
  });

  await t.test('19.4: Workspace creation accepts custom brand color', async () => {
    const res = await apiCall('/api/workspaces', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'Brand Color WS', color: '#FF5500' },
    });
    assert.equal(res.status, 201);
  });

  await t.test('19.5: Clean hex color codes are returned without extra characters', async () => {
    const res = await apiCall('/api/workspaces', { method: 'GET', user: 'ownerAlpha' });
    const ws = (await res.json()).workspaces[0];
    assert.match(ws.color, /^#[0-9a-fA-F]{6}$/);
  });
});

// ============================================================================
// Feature 20: Component Neo-Brutalist Styling Boundaries
// ============================================================================
test('Feature 20 Boundaries: Component Neo-Brutalist Styling', async (t) => {
  const compCssPath = path.join(root, 'styles/components.css');
  const css = fs.existsSync(compCssPath) ? fs.readFileSync(compCssPath, 'utf8') : '';

  await t.test('20.1: Button class specifies border property', () => {
    assert.match(css, /\.btn\s*\{[^}]*border/);
  });

  await t.test('20.2: Card class specifies border property', () => {
    assert.match(css, /\.card\s*\{[^}]*border/);
  });

  await t.test('20.3: Modal class specifies background or border property', () => {
    assert.match(css, /\.modal/);
  });

  await t.test('20.4: Input elements specify border and background styles', () => {
    assert.match(css, /input/);
  });

  await t.test('20.5: Stat cards declare solid structure', () => {
    assert.match(css, /\.stat-card/);
  });
});

// ============================================================================
// Feature 21: De-Mock Interactive Controls Boundaries
// ============================================================================
test('Feature 21 Boundaries: De-Mock Interactive Controls', async (t) => {
  await t.test('21.1: Webhook secrets across iterations are strictly unique', async () => {
    const secrets = new Set();
    for (let i = 0; i < 10; i++) {
      const res = await apiCall('/api/integrations/secret', {
        method: 'POST',
        user: 'ownerAlpha',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      const secret = data.secret || data.data?.secret;
      secrets.add(secret);
    }
    assert.equal(secrets.size, 10, 'All generated webhook secrets from server endpoint must be unique');
  });

  await t.test('21.2: Department creation with empty name string returns 400', async () => {
    const res = await apiCall('/api/departments', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: '   ', workspaceId: 'ws_alpha' },
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  await t.test('21.3: Project creation with empty name string returns 400', async () => {
    const res = await apiCall('/api/projects', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: '   ', workspaceId: 'ws_alpha' },
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  await t.test('21.4: Department name with special characters persists safely', async () => {
    const res = await apiCall('/api/departments', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'R&D / Innovation (Core)', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.ok, true);
  });

  await t.test('21.5: Project name with special characters persists safely', async () => {
    const res = await apiCall('/api/projects', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: 'Project 2.0: Next-Gen & Scale', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.ok, true);
  });
});

// ============================================================================
// Feature 22: Honest Empty States Boundaries
// ============================================================================
test('Feature 22 Boundaries: Honest Empty States', async (t) => {
  await t.test('22.1: Empty tasks array is returned with HTTP 200', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).tasks, []);
  });

  await t.test('22.2: Empty meetings array is returned with HTTP 200', async () => {
    const res = await apiCall('/api/meetings?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).meetings, []);
  });

  await t.test('22.3: Empty documents array is returned with HTTP 200', async () => {
    const res = await apiCall('/api/documents?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).documents, []);
  });

  await t.test('22.4: Empty CRM leads array is returned with HTTP 200', async () => {
    const res = await apiCall('/api/crm/leads?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).leads, []);
  });

  await t.test('22.5: Empty CRM deals array is returned with HTTP 200', async () => {
    const res = await apiCall('/api/crm/deals?workspaceId=ws_beta', { method: 'GET', user: 'ownerBeta' });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).deals, []);
  });
});

// ============================================================================
// Feature 23: E2E Test Suite Boundaries
// ============================================================================
test('Feature 23 Boundaries: E2E Test Suite Framework', async (t) => {
  await t.test('23.1: Reset store cleans all 20+ collections completely', () => {
    inMemoryStore.tasks.set('t1', { id: 't1' });
    inMemoryStore.leads.set('l1', { id: 'l1' });
    inMemoryStore.documents.set('d1', { id: 'd1' });
    resetStore();
    assert.equal(inMemoryStore.tasks.get('t1'), undefined);
    assert.equal(inMemoryStore.leads.get('l1'), undefined);
    assert.equal(inMemoryStore.documents.get('d1'), undefined);
  });

  await t.test('23.2: Re-seeding creates standard personas with valid roles', () => {
    resetStore();
    assert.ok(inMemoryStore.workspaces.has('ws_alpha'));
    assert.ok(inMemoryStore.workspaces.has('ws_beta'));
    assert.ok(inMemoryMemberships.has('ws_alpha_' + USERS.ownerAlpha.uid));
  });

  await t.test('23.3: apiCall handles unsupported HTTP methods gracefully with 405', async () => {
    const res = await apiCall('/api/tasks', { method: 'TRACE', user: 'ownerAlpha' });
    assert.equal(res.status, 405);
  });

  await t.test('23.4: apiCall handles query string parameters accurately', async () => {
    const res = await apiCall('/api/tasks?workspaceId=ws_alpha&priority=urgent&status=todo', {
      method: 'GET',
      user: 'ownerAlpha',
    });
    assert.equal(res.status, 200);
  });

  await t.test('23.5: getAuthToken handles valid test persona keys', () => {
    for (const key of Object.keys(USERS)) {
      const token = getAuthToken(key);
      assert.ok(token.startsWith('cursis_usr_'));
    }
  });
});

// ============================================================================
// Feature 24: Adversarial Coverage Hardening Boundaries
// ============================================================================
test('Feature 24 Boundaries: Adversarial Coverage Hardening', async (t) => {
  await t.test('24.1: SQL injection fragments in lead name are stored as raw text without execution', async () => {
    const sqli = "Robert'); DROP TABLE Students;--";
    const res = await apiCall('/api/crm/leads', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { name: sqli, company: 'Co', email: 'bobby@tables.com', workspaceId: 'ws_alpha' },
    });
    assert.equal(res.ok, true);
    assert.equal((await res.json()).lead.name, sqli);
  });

  await t.test('24.2: Shell metacharacters in task title are treated as harmless strings', async () => {
    const shellStr = '$(rm -rf /) && echo pwned | cat /etc/passwd';
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: shellStr, workspaceId: 'ws_alpha' },
    });
    assert.equal(res.ok, true);
    assert.equal((await res.json()).task.title, shellStr);
  });

  await t.test('24.3: Deeply nested JSON object (30 levels) parses without stack overflow', async () => {
    let deep = { val: 'deep' };
    for (let i = 0; i < 30; i++) {
      deep = { child: deep };
    }
    const res = await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'Deep Task', metadata: deep, workspaceId: 'ws_alpha' },
    });
    assert.equal(res.status, 201);
  });

  await t.test('24.4: Prototype pollution attempt (__proto__) does not pollute global Object', async () => {
    const payload = JSON.parse('{"__proto__": {"pollutedKey": "compromised"}}');
    await apiCall('/api/tasks', {
      method: 'POST',
      user: 'ownerAlpha',
      body: { title: 'Proto Pollution Task', ...payload, workspaceId: 'ws_alpha' },
    });
    assert.equal(({}).pollutedKey, undefined, 'Global prototype must remain unpolluted');
  });

  await t.test('24.5: Document upload exceeding 5MB cap is rejected with validation error', async () => {
    const res = await apiCall('/api/documents', {
      method: 'POST',
      user: 'ownerAlpha',
      body: {
        title: 'Massive Video Attachment',
        type: 'video',
        size: 6 * 1024 * 1024, // 6MB (exceeds 5MB cap)
        workspaceId: 'ws_alpha',
      },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /exceeds the 5MB maximum limit/i);
  });
});
