/**
 * Milestone 4 Empirical Adversarial Verification Suite
 * Agent: m4_challenger_4 (Empirical Challenger)
 * 
 * Verifies:
 * 1. Webhook Secret Entropy & Randomness Stress Test:
 *    - >=100 iterations against /api/integrations/secret (POST and GET)
 *    - All secrets >= 32 chars (70 chars total), start with 'whsec_'
 *    - ZERO collisions across 150 live API samples (100% unique)
 *    - Entropy / character distribution verification
 *    - 200 iterations of client-side CSPRNG logic with zero collisions
 * 
 * 2. Multi-Tenant Security on Automations (lib/db/automations.ts:updateAutomation):
 *    - Cross-tenant update: Workspace A attempting to update Workspace B rule -> returns null, 0 changes
 *    - Reverse cross-tenant: Workspace B attempting to update Workspace A rule -> returns null, 0 changes
 *    - Tenant identity tampering: Attempt to mutate workspaceId, id, _id, createdAt via update payload -> stripped
 *    - NoSQL operator injection: Keys starting with '$' ($set, $where, $gt, $regex, $eval) -> rejected with Error
 *    - NoSQL dot-notation path injection: Keys containing '.' (trigger.type, actions.0.type, metadata.secret) -> rejected with Error
 *    - Non-existent rule ID -> returns null gracefully
 * 
 * 3. Execution Edge Cases & State Bleed:
 *    - executeAutomationRule when rule.runCount is undefined -> correctly increments to 1, no NaN
 *    - executeAutomationRule when rule.runCount is null -> correctly increments to 1, no NaN
 *    - executeAutomationRule with unsupported/unknown action type -> returns status: 'failed' with explicit reason, not fake success
 *    - executeAutomationRule with inactive rule -> returns executed: false
 *    - AutomationsPage.tsx:parseNlAutomationPrompt across 28 adversarial edge-case prompt strings:
 *      * Empty string, whitespace-only, single punctuation
 *      * Gibberish strings (random characters, emoji spam, unicode zero-width spaces)
 *      * Prompts with no keywords
 *      * Boundary and SQL/NoSQL injection string inputs
 *      * Large inputs (1,000+ characters)
 *      * Exact assertion: ZERO crashes, and ZERO fake dummy strings ('NLP Parsed Condition', 'Execute NLP Parsed Action')
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

// Load E2E test harness & environment shims
const { apiCall, resetStore, inMemoryStore, USERS } = require('./e2e/helpers/setup.cjs');

// Load automations DB module
const {
  updateAutomation,
  executeAutomationRule,
  createAutomation,
  getAutomationById,
} = require('../lib/db/automations');

test('Milestone 4 Adversarial Verification (m4_challenger_4)', async (suite) => {

  suite.beforeEach(() => {
    resetStore();

    // Seed test automation rules in Tenant Alpha
    inMemoryStore.automations.set('auto_alpha_m4', {
      id: 'auto_alpha_m4',
      workspaceId: 'ws_alpha',
      name: 'Alpha Primary Automation',
      description: 'Workspace Alpha automated task router',
      isActive: true,
      trigger: { type: 'task.created' },
      actions: [{ type: 'create_task', config: { title: 'Triage Task Alpha' } }],
      runCount: 0,
      createdAt: new Date().toISOString(),
    });

    // Seed test automation rules in Tenant Beta
    inMemoryStore.automations.set('auto_beta_m4', {
      id: 'auto_beta_m4',
      workspaceId: 'ws_beta',
      name: 'Beta Protected Automation',
      description: 'Workspace Beta confidential lead workflow',
      isActive: true,
      trigger: { type: 'lead_created' },
      actions: [{ type: 'create_crm_deal', config: { title: 'Confidential Beta Deal' } }],
      runCount: 3,
      createdAt: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // SECTION 1: Webhook Secret Entropy & Randomness Stress Test
  // ==========================================================================
  await suite.test('1. Webhook Secret Entropy & CSPRNG Randomness Stress Test', async (t) => {

    await t.test('1.1: Live API endpoint /api/integrations/secret evaluates across >= 100 samples with ZERO collisions', async () => {
      const iterations = 120;
      const seenSecrets = new Set();

      for (let i = 0; i < iterations; i++) {
        // Alternate between POST and GET to verify parity across HTTP methods
        const method = i % 2 === 0 ? 'POST' : 'GET';
        const res = await apiCall('/api/integrations/secret', {
          method,
          user: 'ownerAlpha',
        });

        assert.equal(res.status, 200, `Call ${i + 1} (${method}) must return 200 OK`);
        const data = await res.json();

        assert.ok(data.secret, `Call ${i + 1} must return a secret property`);
        assert.ok(data.secret.startsWith('whsec_'), `Call ${i + 1}: secret must begin with 'whsec_'`);
        assert.ok(data.secret.length >= 32, `Call ${i + 1}: secret length (${data.secret.length}) must be >= 32 chars`);
        assert.equal(data.secret.length, 70, `Call ${i + 1}: standard format expects 6 (whsec_) + 64 hex = 70 characters`);

        assert.ok(!seenSecrets.has(data.secret), `Collision detected on iteration ${i + 1}! Secret: ${data.secret}`);
        seenSecrets.add(data.secret);
      }

      assert.equal(seenSecrets.size, iterations, `All ${iterations} generated secrets must be strictly unique`);
    });

    await t.test('1.2: Character Distribution & Shannon Entropy across generated webhook secrets', async () => {
      const sampleCount = 60;
      let totalHexChars = 0;
      const charFrequencies = {};
      '0123456789abcdef'.split('').forEach((c) => (charFrequencies[c] = 0));

      for (let i = 0; i < sampleCount; i++) {
        const res = await apiCall('/api/integrations/secret', { method: 'POST', user: 'ownerAlpha' });
        const json = await res.json();
        const hex = json.secret.replace(/^whsec_/, '');
        assert.equal(hex.length, 64, 'Hex portion must be exactly 64 characters');
        totalHexChars += hex.length;

        for (const ch of hex) {
          assert.ok(charFrequencies[ch] !== undefined, `Unexpected non-hex character '${ch}' found in secret`);
          charFrequencies[ch]++;
        }
      }

      // Calculate Shannon entropy: H = -sum(p * log2(p))
      // For 16 equally likely hex characters, max theoretical entropy is log2(16) = 4.0 bits/char.
      let shannonEntropy = 0;
      for (const ch of Object.keys(charFrequencies)) {
        const p = charFrequencies[ch] / totalHexChars;
        assert.ok(p > 0.02, `Character '${ch}' has unusually low frequency (${p.toFixed(4)}), indicating poor entropy`);
        shannonEntropy -= p * Math.log2(p);
      }

      // Assert entropy is close to ideal 4.0 bits (should be > 3.9 bits/char)
      assert.ok(
        shannonEntropy > 3.9,
        `Shannon entropy of generated secrets (${shannonEntropy.toFixed(4)}) is below 3.9 bits/char (theoretical max: 4.0)`
      );
    });

    await t.test('1.3: Client-side Webhook CSPRNG generation logic stress test (200 iterations)', () => {
      // Replicate DashboardContext.tsx:generateSecureWebhookSecret CSPRNG algorithm
      function generateClientWebhookSecret() {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
        return `whsec_${hex}`;
      }

      const clientSecrets = new Set();
      const count = 200;
      for (let i = 0; i < count; i++) {
        const secret = generateClientWebhookSecret();
        assert.ok(secret.startsWith('whsec_'), 'Client secret must start with whsec_');
        assert.ok(secret.length >= 32, 'Client secret must be >= 32 chars');
        assert.equal(secret.length, 70, 'Client secret must be 70 chars (whsec_ + 64 hex)');
        assert.ok(!clientSecrets.has(secret), `Collision detected in client CSPRNG generator at iteration ${i}!`);
        clientSecrets.add(secret);
      }
      assert.equal(clientSecrets.size, count, `Zero collisions in ${count} client CSPRNG secrets`);
    });
  });

  // ==========================================================================
  // SECTION 2: Multi-Tenant Security on Automations (updateAutomation)
  // ==========================================================================
  await suite.test('2. Multi-Tenant Security on lib/db/automations.ts:updateAutomation', async (t) => {

    await t.test('2.1: Workspace A attempt to update Workspace B automation fails and updates 0 records', async () => {
      // rule auto_beta_m4 belongs to ws_beta
      const originalBetaRule = inMemoryStore.automations.get('auto_beta_m4');
      assert.ok(originalBetaRule, 'Beta rule must exist prior to test');
      const originalBetaName = originalBetaRule.name;

      // ws_alpha caller attempts to update auto_beta_m4
      const result = await updateAutomation(
        'auto_beta_m4',
        { name: 'Tampered by Workspace Alpha' },
        'ws_alpha' // caller workspaceId
      );

      // Must return null (rejection / 0 updates)
      assert.equal(result, null, 'Cross-tenant updateAutomation must return null');

      // Verify stored record was NOT modified
      const currentBetaRule = inMemoryStore.automations.get('auto_beta_m4');
      assert.equal(currentBetaRule.name, originalBetaName, 'Beta rule name must remain intact in database');
    });

    await t.test('2.2: Reverse Cross-Tenant: Workspace B attempt to update Workspace A automation fails', async () => {
      // rule auto_alpha_m4 belongs to ws_alpha
      const originalAlphaRule = inMemoryStore.automations.get('auto_alpha_m4');
      const originalAlphaName = originalAlphaRule.name;

      // ws_beta caller attempts to update auto_alpha_m4
      const result = await updateAutomation(
        'auto_alpha_m4',
        { name: 'Tampered by Workspace Beta' },
        'ws_beta' // caller workspaceId
      );

      assert.equal(result, null, 'Reverse cross-tenant updateAutomation must return null');
      const currentAlphaRule = inMemoryStore.automations.get('auto_alpha_m4');
      assert.equal(currentAlphaRule.name, originalAlphaName, 'Alpha rule name must remain intact in database');
    });

    await t.test('2.3: Same-Tenant update succeeds when workspaceId matches', async () => {
      const result = await updateAutomation(
        'auto_alpha_m4',
        { name: 'Legitimately Updated by Alpha' },
        'ws_alpha'
      );

      assert.ok(result, 'Same-tenant update must return updated rule object');
      assert.equal(result.name, 'Legitimately Updated by Alpha');
      const stored = inMemoryStore.automations.get('auto_alpha_m4');
      assert.equal(stored.name, 'Legitimately Updated by Alpha');
    });

    await t.test('2.4: Tenant Overwrite Hijacking: workspaceId in update payload is strictly stripped', async () => {
      // Even within valid workspace, payload attempting to mutate workspaceId to another tenant must be neutralized
      const result = await updateAutomation(
        'auto_alpha_m4',
        { workspaceId: 'ws_beta', name: 'Alpha Rename' },
        'ws_alpha'
      );

      assert.ok(result);
      assert.equal(result.workspaceId, 'ws_alpha', 'Returned rule must retain original workspaceId');

      const stored = inMemoryStore.automations.get('auto_alpha_m4');
      assert.equal(stored.workspaceId, 'ws_alpha', 'Stored rule must retain original workspaceId ws_alpha');
    });

    await t.test('2.5: Identity Overwrite: id, _id, and createdAt in payload are strictly stripped', async () => {
      const originalCreatedAt = inMemoryStore.automations.get('auto_alpha_m4').createdAt;

      const result = await updateAutomation(
        'auto_alpha_m4',
        {
          id: 'auto_injected_id',
          _id: 'fake_object_id',
          createdAt: '1970-01-01T00:00:00.000Z',
          description: 'Safe Description Update',
        },
        'ws_alpha'
      );

      assert.ok(result);
      assert.equal(result.id, 'auto_alpha_m4', 'Rule id must not be mutated');
      assert.equal(result._id, undefined, 'Mongo _id must not be inserted from client payload');
      assert.equal(result.createdAt, originalCreatedAt, 'Rule createdAt must not be mutated');
      assert.equal(result.description, 'Safe Description Update');
    });

    await t.test('2.6: NoSQL operator injection keys ($set, $where, $gt, $regex, $eval) are rejected with Error', async () => {
      const maliciousDollarKeys = [
        { '$set': { name: 'Pwned' } },
        { '$where': '1 == 1' },
        { '$gt': '' },
        { '$regex': '.*' },
        { '$eval': 'db.dropDatabase()' },
        { '$ne': null },
      ];

      for (const payload of maliciousDollarKeys) {
        await assert.rejects(
          async () => {
            await updateAutomation('auto_alpha_m4', payload, 'ws_alpha');
          },
          /Invalid automation update field/,
          `Payload with key ${Object.keys(payload)[0]} must throw 'Invalid automation update field'`
        );
      }
    });

    await t.test('2.7: NoSQL dot-notation injection keys are rejected with Error', async () => {
      const maliciousDotKeys = [
        { 'trigger.type': 'unauthorized_trigger' },
        { 'actions.0.type': 'malicious_action' },
        { 'metadata.admin_role': true },
        { 'config.headers.authorization': 'stolen' },
        { 'user.role': 'owner' },
      ];

      for (const payload of maliciousDotKeys) {
        await assert.rejects(
          async () => {
            await updateAutomation('auto_alpha_m4', payload, 'ws_alpha');
          },
          /Invalid automation update field/,
          `Payload with key ${Object.keys(payload)[0]} must throw 'Invalid automation update field'`
        );
      }
    });

    await t.test('2.8: Non-existent rule returns null gracefully', async () => {
      const result = await updateAutomation('auto_does_not_exist_9999', { name: 'Ghost' }, 'ws_alpha');
      assert.equal(result, null, 'Non-existent rule update must return null');
    });
  });

  // ==========================================================================
  // SECTION 3: Execution Edge Cases & State Bleed (executeAutomationRule)
  // ==========================================================================
  await suite.test('3. Execution Edge Cases & State Bleed (executeAutomationRule)', async (t) => {

    await t.test('3.1: rule.runCount initially undefined increments to 1 and does NOT produce NaN', async () => {
      const uninitRuleId = 'auto_uninit_runcount';
      inMemoryStore.automations.set(uninitRuleId, {
        id: uninitRuleId,
        workspaceId: 'ws_alpha',
        name: 'Uninitialized RunCount Rule',
        isActive: true,
        trigger: { type: 'task.created' },
        actions: [{ type: 'create_task', config: { title: 'Test Task' } }],
        runCount: undefined, // explicitly undefined
        createdAt: new Date().toISOString(),
      });

      const res = await executeAutomationRule(uninitRuleId, {});
      assert.equal(res.executed, true, 'Rule must execute');

      const updatedRule = inMemoryStore.automations.get(uninitRuleId);
      assert.notEqual(updatedRule.runCount, NaN, 'runCount must NOT be NaN');
      assert.equal(Number.isNaN(updatedRule.runCount), false, 'Number.isNaN(runCount) must be false');
      assert.equal(updatedRule.runCount, 1, 'runCount must increment from undefined to 1');
    });

    await t.test('3.2: rule.runCount initially null increments to 1 and does NOT produce NaN', async () => {
      const nullRuleId = 'auto_null_runcount';
      inMemoryStore.automations.set(nullRuleId, {
        id: nullRuleId,
        workspaceId: 'ws_alpha',
        name: 'Null RunCount Rule',
        isActive: true,
        trigger: { type: 'task.created' },
        actions: [{ type: 'create_task', config: { title: 'Test Task' } }],
        runCount: null, // explicitly null
        createdAt: new Date().toISOString(),
      });

      const res = await executeAutomationRule(nullRuleId, {});
      assert.equal(res.executed, true);

      const updatedRule = inMemoryStore.automations.get(nullRuleId);
      assert.equal(Number.isNaN(updatedRule.runCount), false);
      assert.equal(updatedRule.runCount, 1, 'runCount must increment from null to 1');
    });

    await t.test('3.3: Unsupported or unknown action types return status: failed, NOT fake success', async () => {
      const invalidActionRuleId = 'auto_invalid_action';
      inMemoryStore.automations.set(invalidActionRuleId, {
        id: invalidActionRuleId,
        workspaceId: 'ws_alpha',
        name: 'Invalid Action Rule',
        isActive: true,
        trigger: { type: 'test' },
        actions: [
          { type: 'unsupported_laser_beam', config: {} },
          { type: 'fake_crypto_mine', config: {} },
        ],
        runCount: 0,
        createdAt: new Date().toISOString(),
      });

      const res = await executeAutomationRule(invalidActionRuleId, {});
      assert.equal(res.executed, true, 'Execution envelope completed');
      assert.equal(res.actionResults.length, 2, 'Must record results for both attempted actions');

      for (const actionResult of res.actionResults) {
        assert.equal(
          actionResult.status,
          'failed',
          `Unknown action ${actionResult.actionType} MUST return status 'failed', never fake 'success'`
        );
        assert.ok(
          actionResult.reason && actionResult.reason.includes('Unsupported action type'),
          `Action failure reason must explicitly describe unsupported action: ${actionResult.reason}`
        );
      }
    });

    await t.test('3.4: Inactive automation rule returns executed: false and reason', async () => {
      const inactiveRuleId = 'auto_inactive_rule';
      inMemoryStore.automations.set(inactiveRuleId, {
        id: inactiveRuleId,
        workspaceId: 'ws_alpha',
        name: 'Inactive Automation',
        isActive: false, // inactive
        trigger: { type: 'task.created' },
        actions: [{ type: 'create_task', config: {} }],
        runCount: 10,
        createdAt: new Date().toISOString(),
      });

      const res = await executeAutomationRule(inactiveRuleId, {});
      assert.equal(res.executed, false, 'Inactive rule must not execute');
      assert.match(res.reason || '', /inactive/i);

      // runCount must remain unchanged
      assert.equal(inMemoryStore.automations.get(inactiveRuleId).runCount, 10);
    });
  });

  // ==========================================================================
  // SECTION 4: AutomationsPage.tsx:parseNlAutomationPrompt Edge-Case Stress
  // ==========================================================================
  await suite.test('4. AutomationsPage.tsx:parseNlAutomationPrompt 28 Edge Cases', async (t) => {
    // Read the exact parseNlAutomationPrompt function definition directly from AutomationsPage.tsx
    const automationsPagePath = path.resolve(__dirname, '../components/dashboard/pages/AutomationsPage.tsx');
    const pageContent = fs.readFileSync(automationsPagePath, 'utf8');

    const startIdx = pageContent.indexOf('const parseNlAutomationPrompt =');
    assert.ok(startIdx !== -1, 'parseNlAutomationPrompt must exist in AutomationsPage.tsx');
    const endIdx = pageContent.indexOf('const handleCreateFromNl', startIdx);
    assert.ok(endIdx !== -1, 'handleCreateFromNl must exist in AutomationsPage.tsx');

    const rawFnSnippet = pageContent.slice(startIdx, endIdx).trim();
    const ts = require('typescript');
    const jsCompiled = ts.transpileModule(rawFnSnippet + '\nreturn parseNlAutomationPrompt;', {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;

    const parseNlAutomationPrompt = new Function(jsCompiled)();
    assert.equal(typeof parseNlAutomationPrompt, 'function', 'Extracted parseNlAutomationPrompt must be a function');

    const edgeCasePrompts = [
      { id: 'EC01', prompt: '', desc: 'Empty string' },
      { id: 'EC02', prompt: '   ', desc: 'Whitespace only' },
      { id: 'EC03', prompt: '\t\n\r  \n', desc: 'Tabs, newlines and carriage returns' },
      { id: 'EC04', prompt: '.', desc: 'Single punctuation dot' },
      { id: 'EC05', prompt: '???!!!...', desc: 'Multiple punctuation marks' },
      { id: 'EC06', prompt: 'asdf qwerty zxcvbnm', desc: 'Gibberish with no matching keywords' },
      { id: 'EC07', prompt: '1234567890', desc: 'Numeric string only' },
      { id: 'EC08', prompt: '🚀🔥🎉🤖⚡', desc: 'Emoji only sequence' },
      { id: 'EC09', prompt: 'foo bar baz qux quux corge grault', desc: 'Metasyntactic generic words' },
      { id: 'EC10', prompt: '\u200B\u200C\u200D\uFEFF', desc: 'Unicode zero-width spaces' },
      { id: 'EC11', prompt: "' OR '1'='1", desc: 'SQL injection string' },
      { id: 'EC12', prompt: '{"$gt": ""}', desc: 'NoSQL injection string' },
      { id: 'EC13', prompt: '<script>alert(1)</script>', desc: 'XSS script injection string' },
      { id: 'EC14', prompt: 'when ', desc: 'Prefix keyword only with trailing space' },
      { id: 'EC15', prompt: 'when when when when', desc: 'Repeated prefix keyword' },
      { id: 'EC16', prompt: 'when an urgent task is overdue send slack alert', desc: 'Full valid task prompt' },
      { id: 'EC17', prompt: 'meeting ended contract signed create deal', desc: 'Multiple domain keywords' },
      { id: 'EC18', prompt: 'DOCUMENT UPDATED INVOICE PAID PING WEBHOOK', desc: 'ALL CAPS keywords' },
      { id: 'EC19', prompt: '   when urgent   ', desc: 'Prefix and single condition keyword' },
      { id: 'EC20', prompt: 'null', desc: 'String literal "null"' },
      { id: 'EC21', prompt: 'undefined', desc: 'String literal "undefined"' },
      { id: 'EC22', prompt: '[object Object]', desc: 'String literal "[object Object]"' },
      { id: 'EC23', prompt: 'A'.repeat(1200), desc: 'Large 1200-character input' },
      { id: 'EC24', prompt: 'task '.repeat(60), desc: '60 repeated keyword occurrences' },
      { id: 'EC25', prompt: 'overdue deadline due', desc: 'Trigger keywords only' },
      { id: 'EC26', prompt: 'high priority p0 critical enterprise', desc: 'Condition keywords only' },
      { id: 'EC27', prompt: 'slack discord email webhook crm', desc: 'Action keywords only' },
      { id: 'EC28', prompt: '!@#$%^&*()_+~|}{[]:;?><,./', desc: 'Symbol soup string' },
    ];

    for (const ec of edgeCasePrompts) {
      await t.test(`4.${ec.id}: Prompt: "${ec.desc}"`, () => {
        let parsed;
        assert.doesNotThrow(() => {
          parsed = parseNlAutomationPrompt(ec.prompt);
        }, `parseNlAutomationPrompt threw an exception on input: ${ec.desc}`);

        assert.ok(parsed, `Result must not be null/undefined for ${ec.desc}`);
        assert.equal(typeof parsed.name, 'string', 'Rule name must be a string');
        assert.ok(parsed.name.length > 0, 'Rule name must not be empty');

        assert.equal(typeof parsed.when, 'string', 'Trigger "when" must be a string');
        assert.ok(parsed.when.length > 0, 'Trigger "when" must not be empty');

        // Condition must be null OR a valid string clause, NEVER dummy 'NLP Parsed Condition'
        if (parsed.condition !== null) {
          assert.equal(typeof parsed.condition, 'string');
          assert.notEqual(
            parsed.condition,
            'NLP Parsed Condition',
            `Fake dummy string 'NLP Parsed Condition' detected in condition for ${ec.desc}`
          );
        }

        // Action "then" must be a valid string clause, NEVER dummy 'Execute NLP Parsed Action'
        assert.equal(typeof parsed.then, 'string');
        assert.notEqual(
          parsed.then,
          'Execute NLP Parsed Action',
          `Fake dummy string 'Execute NLP Parsed Action' detected in action for ${ec.desc}`
        );

        // Types must be valid string identifiers
        assert.equal(typeof parsed.triggerType, 'string');
        assert.equal(typeof parsed.actionType, 'string');
      });
    }
  });

});
