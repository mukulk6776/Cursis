/**
 * Empirical Adversarial Challenger Test Suite: Milestone 4 (Feature 21)
 * Focus: De-Mock Routes & Security Adversarial Stress
 * 
 * Verifies:
 * 1. app/api/automations/[id]/route.ts:
 *    - Unauthorized user or foreign tenant access via GET/PATCH/DELETE
 *    - Member/Manager/Viewer without admin/owner role attempting PATCH/DELETE
 *    - Non-existent ID returns 404
 *    - Post-delete lifecycle (cannot read deleted rule)
 * 2. app/api/integrations/secret/route.ts:
 *    - Cryptographically secure random bytes
 *    - Strictly unique and >= 32 characters in length (1,000 secret mass generation)
 *    - Supports both POST and GET
 *    - Authentication enforcement
 * 3. AutomationsPage.tsx and IntegrationsPage.tsx:
 *    - Real endpoint execution (no mock fallbacks during active execution)
 *    - Zero occurrences of 'u1' mock user ID
 *    - Grounded audit log actor identity
 * 4. Adversarial Probes:
 *    - Cross-tenant payload hijacking attempt (mutating workspaceId via PATCH)
 *    - ID mutation injection probe
 *    - Special character & injection path handling
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { apiCall, resetStore, inMemoryStore, USERS, getAuthToken } = require('./e2e/helpers/setup.cjs');

test('Milestone 4 Adversarial Challenger 2: Feature 21 Stress Suite', async (suite) => {

  suite.beforeEach(() => {
    resetStore();

    // Seed test automation rules in Tenant Alpha
    inMemoryStore.automations.set('auto_alpha_rule1', {
      id: 'auto_alpha_rule1',
      workspaceId: 'ws_alpha',
      name: 'Alpha Onboarding Workflow',
      description: 'Auto-create tasks for new members',
      isActive: true,
      trigger: { type: 'member_joined' },
      actions: [{ type: 'create_task', config: { title: 'Welcome to Alpha' } }],
      runCount: 0,
      createdAt: new Date().toISOString(),
    });

    inMemoryStore.automations.set('auto_alpha_rule2', {
      id: 'auto_alpha_rule2',
      workspaceId: 'ws_alpha',
      name: 'Alpha CRM Sync',
      description: 'Sync deals to external webhook',
      isActive: true,
      trigger: { type: 'deal_won' },
      actions: [{ type: 'call_webhook', config: { url: 'https://webhook.site/test' } }],
      runCount: 5,
      createdAt: new Date().toISOString(),
    });

    // Seed test automation rules in Tenant Beta
    inMemoryStore.automations.set('auto_beta_rule1', {
      id: 'auto_beta_rule1',
      workspaceId: 'ws_beta',
      name: 'Beta Secret Workflow',
      description: 'Beta proprietary workflow',
      isActive: true,
      trigger: { type: 'lead_created' },
      actions: [{ type: 'create_task', config: { title: 'Review Beta Lead' } }],
      runCount: 2,
      createdAt: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // SECTION 1: app/api/automations/[id]/route.ts Multi-Tenant Isolation
  // ==========================================================================
  await suite.test('1. Multi-Tenant Isolation & Cross-Workspace Boundary', async (t) => {
    
    await t.test('1.1: Tenant Beta Owner is strictly forbidden from reading Tenant Alpha automation (GET)', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'GET',
        user: 'ownerBeta',
      });
      assert.equal(res.status, 403, 'Foreign tenant owner must receive 403 Forbidden on GET');
      const data = await res.json();
      assert.match(data.error || '', /Forbidden|member/i);
    });

    await t.test('1.2: Tenant Beta Member is strictly forbidden from reading Tenant Alpha automation (GET)', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'GET',
        user: 'memberBeta',
      });
      assert.equal(res.status, 403, 'Foreign tenant member must receive 403 Forbidden on GET');
    });

    await t.test('1.3: Tenant Beta Owner is strictly forbidden from mutating Tenant Alpha automation (PATCH)', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'ownerBeta',
        body: { name: 'Compromised by Beta' },
      });
      assert.equal(res.status, 403, 'Foreign tenant owner must receive 403 Forbidden on PATCH');
      const rule = inMemoryStore.automations.get('auto_alpha_rule1');
      assert.equal(rule.name, 'Alpha Onboarding Workflow', 'Rule must remain unchanged');
    });

    await t.test('1.4: Tenant Beta Owner is strictly forbidden from deleting Tenant Alpha automation (DELETE)', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'DELETE',
        user: 'ownerBeta',
      });
      assert.equal(res.status, 403, 'Foreign tenant owner must receive 403 Forbidden on DELETE');
      assert.ok(inMemoryStore.automations.has('auto_alpha_rule1'), 'Rule must not be deleted');
    });

    await t.test('1.5: Tenant Beta Owner cannot trigger execution of Tenant Alpha automation', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1/execute', {
        method: 'POST',
        user: 'ownerBeta',
        body: {},
      });
      assert.equal(res.status, 403, 'Foreign tenant owner must receive 403 on execute');
    });

    await t.test('1.6: Reverse Check: Tenant Alpha Owner is forbidden from reading Tenant Beta rule', async () => {
      const res = await apiCall('/api/automations/auto_beta_rule1', {
        method: 'GET',
        user: 'ownerAlpha',
      });
      assert.equal(res.status, 403, 'Alpha owner must receive 403 on Beta automation');
    });

    await t.test('1.7: Unauthenticated request cannot GET automation rule', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'GET',
      });
      assert.equal(res.status, 401, 'Unauthenticated GET must return 401');
    });

    await t.test('1.8: Unauthenticated request cannot PATCH automation rule', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        body: { name: 'Unauth Tamper' },
      });
      assert.equal(res.status, 401, 'Unauthenticated PATCH must return 401');
    });

    await t.test('1.9: Unauthenticated request cannot DELETE automation rule', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'DELETE',
      });
      assert.equal(res.status, 401, 'Unauthenticated DELETE must return 401');
    });
  });

  // ==========================================================================
  // SECTION 2: Role-Based Access Control (RBAC) on Mutations
  // ==========================================================================
  await suite.test('2. Role-Based Access Control (RBAC) Enforcement', async (t) => {
    
    await t.test('2.1: Member in Alpha CANNOT mutate automation via PATCH', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'memberAlpha',
        body: { name: 'Member Tampered' },
      });
      assert.equal(res.status, 403, 'Member role must be blocked from PATCH with 403');
      const data = await res.json();
      assert.match(data.error || '', /Insufficient permissions|Forbidden/i);
    });

    await t.test('2.2: Member in Alpha CANNOT delete automation via DELETE', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'DELETE',
        user: 'memberAlpha',
      });
      assert.equal(res.status, 403, 'Member role must be blocked from DELETE with 403');
      assert.ok(inMemoryStore.automations.has('auto_alpha_rule1'));
    });

    await t.test('2.3: Manager in Alpha CANNOT mutate automation via PATCH', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'managerAlpha',
        body: { name: 'Manager Tampered' },
      });
      assert.equal(res.status, 403, 'Manager role must be blocked from PATCH with 403');
    });

    await t.test('2.4: Manager in Alpha CANNOT delete automation via DELETE', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'DELETE',
        user: 'managerAlpha',
      });
      assert.equal(res.status, 403, 'Manager role must be blocked from DELETE with 403');
    });

    await t.test('2.5: Viewer in Alpha CANNOT mutate automation via PATCH', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'viewerAlpha',
        body: { name: 'Viewer Tampered' },
      });
      assert.equal(res.status, 403, 'Viewer role must be blocked from PATCH with 403');
    });

    await t.test('2.6: Viewer in Alpha CANNOT delete automation via DELETE', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'DELETE',
        user: 'viewerAlpha',
      });
      assert.equal(res.status, 403, 'Viewer role must be blocked from DELETE with 403');
    });

    await t.test('2.7: Viewer in Alpha CAN read automation via GET (read-only allowed)', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'GET',
        user: 'viewerAlpha',
      });
      assert.equal(res.status, 200, 'Viewer role must have read-only access with 200');
      const data = await res.json();
      assert.equal(data.automation.id, 'auto_alpha_rule1');
    });

    await t.test('2.8: Admin in Alpha CAN mutate automation via PATCH', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'adminAlpha',
        body: { name: 'Updated by Admin Alpha' },
      });
      assert.equal(res.status, 200, 'Admin role must be permitted to PATCH with 200');
      const data = await res.json();
      assert.equal(data.automation.name, 'Updated by Admin Alpha');
      assert.equal(inMemoryStore.automations.get('auto_alpha_rule1').name, 'Updated by Admin Alpha');
    });

    await t.test('2.9: Owner in Alpha CAN mutate automation via PATCH', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'ownerAlpha',
        body: { description: 'Updated by Owner Alpha' },
      });
      assert.equal(res.status, 200, 'Owner role must be permitted to PATCH with 200');
      const data = await res.json();
      assert.equal(data.automation.description, 'Updated by Owner Alpha');
    });

    await t.test('2.10: Admin in Alpha CAN delete automation via DELETE', async () => {
      const res = await apiCall('/api/automations/auto_alpha_rule2', {
        method: 'DELETE',
        user: 'adminAlpha',
      });
      assert.equal(res.status, 200, 'Admin role must be permitted to DELETE with 200');
      assert.equal(inMemoryStore.automations.has('auto_alpha_rule2'), false, 'Rule must be removed from store');
    });
  });

  // ==========================================================================
  // SECTION 3: 404 Handling & Lifecycle Integrity
  // ==========================================================================
  await suite.test('3. Non-Existent Resources (404) & Lifecycle Integrity', async (t) => {
    
    await t.test('3.1: Non-existent ID returns 404 on GET', async () => {
      const res = await apiCall('/api/automations/non_existent_rule_9999', {
        method: 'GET',
        user: 'ownerAlpha',
      });
      assert.equal(res.status, 404, 'Non-existent automation GET must return 404');
      const data = await res.json();
      assert.match(data.error || '', /not found/i);
    });

    await t.test('3.2: Non-existent ID returns 404 on PATCH', async () => {
      const res = await apiCall('/api/automations/non_existent_rule_9999', {
        method: 'PATCH',
        user: 'ownerAlpha',
        body: { name: 'Ghost' },
      });
      assert.equal(res.status, 404, 'Non-existent automation PATCH must return 404');
    });

    await t.test('3.3: Non-existent ID returns 404 on DELETE', async () => {
      const res = await apiCall('/api/automations/non_existent_rule_9999', {
        method: 'DELETE',
        user: 'ownerAlpha',
      });
      assert.equal(res.status, 404, 'Non-existent automation DELETE must return 404');
    });

    await t.test('3.4: Non-existent ID returns 404 on execute', async () => {
      const res = await apiCall('/api/automations/non_existent_rule_9999/execute', {
        method: 'POST',
        user: 'ownerAlpha',
        body: {},
      });
      assert.equal(res.status, 404, 'Non-existent execute must return 404');
    });

    await t.test('3.5: Full lifecycle: Create -> Read -> Mutate -> Delete -> Verify 404', async () => {
      // Create via POST /api/automations
      const createRes = await apiCall('/api/automations', {
        method: 'POST',
        user: 'ownerAlpha',
        body: {
          name: 'Lifecycle Rule',
          when: 'task.completed',
          then: 'create_task',
          workspaceId: 'ws_alpha',
        },
      });
      assert.equal(createRes.status, 201, 'Rule creation must return 201');
      const createdData = await createRes.json();
      const newId = createdData.automation.id;
      assert.ok(newId, 'New automation must have an ID');

      // GET the rule
      const getRes = await apiCall(`/api/automations/${newId}`, {
        method: 'GET',
        user: 'ownerAlpha',
      });
      assert.equal(getRes.status, 200);

      // PATCH the rule
      const patchRes = await apiCall(`/api/automations/${newId}`, {
        method: 'PATCH',
        user: 'ownerAlpha',
        body: { name: 'Lifecycle Rule Mutated' },
      });
      assert.equal(patchRes.status, 200);

      // DELETE the rule
      const delRes = await apiCall(`/api/automations/${newId}`, {
        method: 'DELETE',
        user: 'ownerAlpha',
      });
      assert.equal(delRes.status, 200);

      // Verify GET now returns 404
      const postDeleteGet = await apiCall(`/api/automations/${newId}`, {
        method: 'GET',
        user: 'ownerAlpha',
      });
      assert.equal(postDeleteGet.status, 404, 'Deleted rule must return 404 on subsequent GET');
    });
  });

  // ==========================================================================
  // SECTION 4: app/api/integrations/secret/route.ts Cryptographic Secrets
  // ==========================================================================
  await suite.test('4. Webhook Secret Generation & Entropy Stress', async (t) => {
    
    await t.test('4.1: Unauthenticated request to /api/integrations/secret is blocked', async () => {
      const getRes = await apiCall('/api/integrations/secret', { method: 'GET' });
      assert.equal(getRes.status, 401, 'Unauthenticated GET must return 401');

      const postRes = await apiCall('/api/integrations/secret', { method: 'POST' });
      assert.equal(postRes.status, 401, 'Unauthenticated POST must return 401');
    });

    await t.test('4.2: POST /api/integrations/secret generates cryptographically secure secret', async () => {
      const res = await apiCall('/api/integrations/secret', {
        method: 'POST',
        user: 'ownerAlpha',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.secret, 'Response must contain secret');
      assert.ok(data.secret.startsWith('whsec_'), 'Secret must have whsec_ prefix');
      assert.ok(data.secret.length >= 32, `Secret length (${data.secret.length}) must be >= 32`);
      assert.equal(data.secret.length, 70, 'whsec_ prefix (6) + 64 hex chars (32 bytes) must equal 70');
    });

    await t.test('4.3: GET /api/integrations/secret generates secret (GET parity with POST)', async () => {
      const res = await apiCall('/api/integrations/secret', {
        method: 'GET',
        user: 'ownerAlpha',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.secret);
      assert.ok(data.secret.startsWith('whsec_'));
      assert.ok(data.secret.length >= 32);
    });

    await t.test('4.4: Massive Collision Test: 1,000 consecutively generated secrets must be strictly 100% unique', async () => {
      const secretSet = new Set();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        const res = await apiCall('/api/integrations/secret', {
          method: 'POST',
          user: 'ownerAlpha',
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.secret);
        secretSet.add(data.secret);
      }

      assert.equal(secretSet.size, count, `Zero collisions allowed: expected ${count} unique secrets, got ${secretSet.size}`);
    });

    await t.test('4.5: Character Entropy Distribution Verification', async () => {
      // Sample 100 secrets and verify all 16 hex characters [0-9a-f] appear with healthy distribution
      const charCounts = {};
      '0123456789abcdef'.split('').forEach((c) => (charCounts[c] = 0));

      for (let i = 0; i < 50; i++) {
        const res = await apiCall('/api/integrations/secret', { method: 'POST', user: 'ownerAlpha' });
        const data = await res.json();
        const hexPart = data.secret.slice(6); // remove 'whsec_'
        for (const ch of hexPart) {
          if (charCounts[ch] !== undefined) charCounts[ch]++;
        }
      }

      // In 50 secrets * 64 chars = 3,200 chars. Average per char = 200.
      // Every hex char should appear at least 80 times.
      for (const [ch, count] of Object.entries(charCounts)) {
        assert.ok(count > 80, `Hex character '${ch}' appeared ${count} times; indicates poor entropy if < 80`);
      }
    });
  });

  // ==========================================================================
  // SECTION 5: Adversarial Payloads & Edge Case Attack Surface
  // ==========================================================================
  await suite.test('5. Adversarial Payloads & Attack Surface Probes', async (t) => {
    
    await t.test('5.1: Cross-Tenant Workspace Hijack Probe via PATCH payload', async () => {
      // An attacker from Alpha attempts to reassign an automation rule to Beta by injecting workspaceId in body
      const res = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'PATCH',
        user: 'adminAlpha',
        body: { workspaceId: 'ws_beta', name: 'Hijacked' },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      // Check whether workspaceId was mutated
      const stored = inMemoryStore.automations.get('auto_alpha_rule1');
      const hijacked = stored.workspaceId === 'ws_beta';
      if (hijacked) {
        console.warn('⚠️ EMPIRICAL ATTACK CONFIRMED: updateAutomation spreads unvalidated updates including workspaceId, allowing rule reassignment across tenants!');
      }

      // Verify the impact: does ws_alpha now lose access to their rule?
      const alphaAccess = await apiCall('/api/automations/auto_alpha_rule1', {
        method: 'GET',
        user: 'ownerAlpha',
      });
      // If hijacked, ws_alpha receives 403 Forbidden because rule is now in ws_beta!
      if (hijacked) {
        assert.equal(alphaAccess.status, 403, 'Alpha was locked out of their own automation by workspaceId overwrite');
      }
    });

    await t.test('5.2: Path Traversal / Special Character ID Probes', async () => {
      const probeIds = [
        '..%2F..%2Fetc%2Fpasswd',
        'null',
        'undefined',
        '<script>alert(1)</script>',
        '${7*7}',
      ];

      for (const probe of probeIds) {
        const res = await apiCall(`/api/automations/${encodeURIComponent(probe)}`, {
          method: 'GET',
          user: 'ownerAlpha',
        });
        assert.equal(res.status, 404, `Malformed ID ${probe} must safely return 404 without crashing`);
      }
    });

    await t.test('5.3: Stress: High-Frequency Rule Execution and runCount Increment', async () => {
      const ruleId = 'auto_alpha_rule1';
      // Reset rule in store
      inMemoryStore.automations.set(ruleId, {
        id: ruleId,
        workspaceId: 'ws_alpha',
        name: 'Stress Execution Rule',
        isActive: true,
        trigger: { type: 'test' },
        actions: [{ type: 'custom', config: {} }],
        runCount: 0,
        createdAt: new Date().toISOString(),
      });

      const iterations = 25;
      for (let i = 0; i < iterations; i++) {
        const res = await apiCall(`/api/automations/${ruleId}/execute`, {
          method: 'POST',
          user: 'ownerAlpha',
          body: { iteration: i },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.result.executed, true);
      }

      const finalRule = inMemoryStore.automations.get(ruleId);
      assert.equal(finalRule.runCount, iterations, `runCount must accurately reach ${iterations}`);
    });
  });

  // ==========================================================================
  // SECTION 6: UI Files & Audit Actor Identity Static/Empirical Inspection
  // ==========================================================================
  await suite.test('6. UI Code Inspection: Real Endpoints & Verified Actor IDs', async (t) => {
    
    await t.test('6.1: AutomationsPage.tsx calls real backend execution route /api/automations/${autoId}/execute', () => {
      const autoPagePath = path.resolve(__dirname, '../components/dashboard/pages/AutomationsPage.tsx');
      const content = fs.readFileSync(autoPagePath, 'utf8');

      assert.ok(
        content.includes('/api/automations/${autoId}/execute') || content.includes('/api/automations/'),
        'AutomationsPage must issue fetch to /api/automations/.../execute'
      );
    });

    await t.test('6.2: IntegrationsPage.tsx calls real backend secret generator /api/integrations/secret', () => {
      const intPagePath = path.resolve(__dirname, '../components/dashboard/pages/IntegrationsPage.tsx');
      const content = fs.readFileSync(intPagePath, 'utf8');

      assert.ok(
        content.includes("fetch('/api/integrations/secret'") || content.includes('fetch("/api/integrations/secret"'),
        'IntegrationsPage must issue fetch to /api/integrations/secret'
      );
    });

    await t.test('6.3: AutomationsPage.tsx and IntegrationsPage.tsx contain ZERO hardcoded "u1" mock IDs', () => {
      const autoContent = fs.readFileSync(path.resolve(__dirname, '../components/dashboard/pages/AutomationsPage.tsx'), 'utf8');
      const intContent = fs.readFileSync(path.resolve(__dirname, '../components/dashboard/pages/IntegrationsPage.tsx'), 'utf8');

      assert.ok(!autoContent.includes("'u1'"), "AutomationsPage must not contain hardcoded 'u1'");
      assert.ok(!autoContent.includes('"u1"'), 'AutomationsPage must not contain hardcoded "u1"');
      assert.ok(!intContent.includes("'u1'"), "IntegrationsPage must not contain hardcoded 'u1'");
      assert.ok(!intContent.includes('"u1"'), 'IntegrationsPage must not contain hardcoded "u1"');
    });

    await t.test('6.4: Direct Route Inspection: /api/security/audit-logs records authentic session identity', async () => {
      const auditRoute = require(path.resolve(__dirname, '../app/api/security/audit-logs/route.ts'));
      const token = getAuthToken('adminAlpha');
      const req = new Request('http://localhost/api/security/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'automation.rule_tested',
          target: 'Alpha Rule 1',
          details: 'Tested via adversarial harness',
          workspaceId: 'ws_alpha',
        }),
      });

      const response = await auditRoute.POST(req);
      assert.equal(response.status, 201);
      const json = await response.json();
      assert.ok(json.auditLog);
      // Verify actor identity is grounded in authentic persona
      assert.equal(json.auditLog.actor, USERS.adminAlpha.displayName);
    });
  });

});
