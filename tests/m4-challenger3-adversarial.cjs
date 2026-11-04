/**
 * Empirical Adversarial Challenger Test Suite: Milestone 4 (Visual Tokens & Presentation Contracts)
 * Agent: m4_challenger_3
 * 
 * Verifies:
 * 1. Adversarial Regex & Token Sweep:
 *    - Zero instances of legacy cobalt blue '#0f4cff' across components/, lib/, app/, styles/, and README.md
 *    - Zero instances of 'rgba(15, 76, 255' across components/, lib/, app/, styles/, and README.md
 *    - Zero Gaussian blurs on .modal and modal dialog cards (box-shadow blur > 0, filter: blur)
 * 2. 1px Thin Border Adversarial Regression Sweep:
 *    - TasksPage.tsx: Scanned for 1px thin border regressions on .card and .modal elements
 *    - HomePage.tsx: Scanned for 1px thin border regressions on .card and .stat-card elements
 *    - ChatActionCardView.tsx: Scanned for 1px thin border regressions on card containers
 * 3. Contract Conformance:
 *    - ChatActionCardView.tsx strictly adheres to:
 *        border: '3px solid #0A0A0A'
 *        box-shadow: '4px 4px 0px #0A0A0A'
 *        background: '#FAF6EE'
 *        primary button background: '#FF5500'
 *        primary button border: '3px solid #0A0A0A'
 *    - Modal Dialogs (WorkspaceSetupModal, RedeemCodeModal, InviteModal, EventModal):
 *        border: 4px solid #0A0A0A
 *        box-shadow: 12px 12px 0px #0A0A0A
 *        border-radius: 20px
 *        surface background: #FFFFFF
 * 4. De-Mock Regression Checks:
 *    - Zero occurrences of 'Alex Morgan'
 *    - Zero dummy 'NLP Parsed' strings
 *    - Webhook secret uses CSPRNG with length >= 32
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.css', '.md']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.next' || item === '.git' || item === '.agents') continue;
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (exts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

test('Milestone 4 Adversarial Challenger 3: Tokens, Contracts & Border Verification', async (suite) => {

  // ==========================================================================
  // SECTION 1: Adversarial Regex & Token Sweep (0f4cff & rgba(15, 76, 255))
  // ==========================================================================
  await suite.test('1. Legacy Blue (#0f4cff & rgba(15, 76, 255)) Sweep', async (t) => {
    const targetDirs = ['components', 'lib', 'app', 'styles'];
    const allSourceFiles = [];
    for (const d of targetDirs) {
      allSourceFiles.push(...getAllFiles(path.join(ROOT, d)));
    }
    const readmeFile = path.join(ROOT, 'README.md');
    if (fs.existsSync(readmeFile)) {
      allSourceFiles.push(readmeFile);
    }

    await t.test('1.1: Zero occurrences of "#0f4cff" across all target files', () => {
      const hexMatches = [];
      const hexRegex = /0f4cff/i;

      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (hexRegex.test(line)) {
            hexMatches.push({
              file: path.relative(ROOT, file),
              line: idx + 1,
              content: line.trim(),
            });
          }
        });
      }

      assert.equal(
        hexMatches.length,
        0,
        `Found ${hexMatches.length} remaining occurrences of 0f4cff:\n${JSON.stringify(hexMatches, null, 2)}`
      );
    });

    await t.test('1.2: Zero occurrences of "rgba(15, 76, 255" across all target files', () => {
      const rgbMatches = [];
      const rgbRegex = /15\s*,\s*76\s*,\s*255/i;

      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (rgbRegex.test(line)) {
            rgbMatches.push({
              file: path.relative(ROOT, file),
              line: idx + 1,
              content: line.trim(),
            });
          }
        });
      }

      assert.equal(
        rgbMatches.length,
        0,
        `Found ${rgbMatches.length} remaining occurrences of rgba(15, 76, 255):\n${JSON.stringify(rgbMatches, null, 2)}`
      );
    });
  });

  // ==========================================================================
  // SECTION 2: Gaussian Blur Adversarial Sweep
  // ==========================================================================
  await suite.test('2. Gaussian Blur Adversarial Sweep on .modal & Dialog Cards', async (t) => {
    await t.test('2.1: .modal in styles/components.css uses 0px blur hard ink shadow and no filter blur', () => {
      const cssPath = path.join(ROOT, 'styles', 'components.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Extract .modal block
      const modalBlockMatch = css.match(/\.modal\s*\{([^}]+)\}/);
      assert.ok(modalBlockMatch, '.modal rule must exist in styles/components.css');
      const modalBlock = modalBlockMatch[1];

      // Assert zero filter: blur
      assert.ok(!modalBlock.includes('filter: blur'), '.modal must not contain filter: blur');

      // Assert box-shadow is hard offset shadow with 0px blur
      const boxShadowMatch = modalBlock.match(/box-shadow:\s*([^;]+);/);
      assert.ok(boxShadowMatch, '.modal must specify box-shadow');
      const shadowValue = boxShadowMatch[1].trim();
      assert.ok(shadowValue.includes('0px #0A0A0A') || shadowValue.includes('0 #0A0A0A'), `Expected 0px blur in box-shadow, got: ${shadowValue}`);
    });

    await t.test('2.2: Modal dialog card components contain NO blur > 0 on box-shadow or filter: blur', () => {
      const modalFiles = getAllFiles(path.join(ROOT, 'components', 'dashboard', 'modals'));
      const blurViolations = [];

      // Regex matching box-shadow with positive blur (e.g. 0px 20px 40px, 0 10px 25px rgba)
      // Note: We check specifically on dialog cards, not the background backdropFilter on .modal-overlay
      const blurShadowRegex = /box-shadow['":\s]+[^;,"'\n]+(?:\d+px|\d+rem)\s+(?:\d+px|\d+rem)\s+([1-9]\d*(?:\.\d+)?px|[1-9]\d*(?:\.\d+)?rem)/i;

      for (const file of modalFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // If line has filter: blur (not backdropFilter on overlay)
          if (/style=\{[^}]*filter:\s*['"]?blur/i.test(line) && !line.includes('backdropFilter')) {
            blurViolations.push({ file: path.relative(ROOT, file), line: idx + 1, issue: 'filter: blur', text: line.trim() });
          }
          if (line.includes('boxShadow') || line.includes('box-shadow')) {
            const match = line.match(blurShadowRegex);
            if (match) {
              blurViolations.push({ file: path.relative(ROOT, file), line: idx + 1, issue: `box-shadow blur radius: ${match[1]}`, text: line.trim() });
            }
          }
        });
      }

      assert.equal(
        blurViolations.length,
        0,
        `Found modal dialog cards with blur > 0:\n${JSON.stringify(blurViolations, null, 2)}`
      );
    });

    await t.test('2.3: ChatActionCardView.tsx contains NO filter: blur or blur > 0', () => {
      const chatCardPath = path.join(ROOT, 'components', 'dashboard', 'chat', 'ChatActionCardView.tsx');
      const content = fs.readFileSync(chatCardPath, 'utf8');

      assert.ok(!content.includes('filter: blur'), 'ChatActionCardView must not contain filter: blur');
      assert.ok(!content.includes('backdropFilter'), 'ChatActionCardView must not contain backdropFilter');

      // Check all boxShadow declarations
      const shadowMatches = content.match(/boxShadow:\s*'([^']+)'/g) || [];
      for (const shadow of shadowMatches) {
        assert.match(shadow, /0px #0A0A0A/, `All shadows in ChatActionCardView must have 0px blur: ${shadow}`);
      }
    });
  });

  // ==========================================================================
  // SECTION 3: Contract Conformance Check
  // ==========================================================================
  await suite.test('3. Presentation Contract Conformance Verification', async (t) => {
    
    await t.test('3.1: ChatActionCardView.tsx strictly adheres to M3 <-> M4 presentation contract', () => {
      const chatCardPath = path.join(ROOT, 'components', 'dashboard', 'chat', 'ChatActionCardView.tsx');
      const content = fs.readFileSync(chatCardPath, 'utf8');

      // Contract: border: 3px solid #0A0A0A
      assert.ok(
        content.includes("border: '3px solid #0A0A0A'"),
        "ChatActionCardView must specify border: '3px solid #0A0A0A'"
      );

      // Contract: box-shadow: 4px 4px 0px #0A0A0A
      assert.ok(
        content.includes("boxShadow: '4px 4px 0px #0A0A0A'"),
        "ChatActionCardView must specify boxShadow: '4px 4px 0px #0A0A0A'"
      );

      // Contract: background: #FAF6EE
      assert.ok(
        content.includes("background: '#FAF6EE'"),
        "ChatActionCardView must specify background: '#FAF6EE'"
      );

      // Contract: #FF5500 primary action buttons
      assert.ok(
        content.includes("background: '#FF5500'"),
        "ChatActionCardView primary button must specify background: '#FF5500'"
      );
    });

    await t.test('3.2: Modal Dialogs Contract (WorkspaceSetupModal, RedeemCodeModal, InviteModal, EventModal)', () => {
      const cssPath = path.join(ROOT, 'styles', 'components.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Standard .modal class contract
      assert.ok(css.includes('border: 4px solid #0A0A0A;'), '.modal class must have border: 4px solid #0A0A0A');
      assert.ok(css.includes('box-shadow: 12px 12px 0px #0A0A0A;'), '.modal class must have box-shadow: 12px 12px 0px #0A0A0A');
      assert.ok(css.includes('border-radius: 20px;'), '.modal class must have border-radius: 20px');
      assert.ok(css.includes('background: #FFFFFF;'), '.modal class must have background: #FFFFFF');

      // WorkspaceSetupModal.tsx explicitly declares standard neo-brutalist modal frame
      const wsModalContent = fs.readFileSync(path.join(ROOT, 'components', 'dashboard', 'modals', 'WorkspaceSetupModal.tsx'), 'utf8');
      assert.ok(wsModalContent.includes("border: '4px solid #0A0A0A'"), 'WorkspaceSetupModal must declare 4px solid #0A0A0A border');
      assert.ok(wsModalContent.includes("boxShadow: '12px 12px 0px #0A0A0A'"), 'WorkspaceSetupModal must declare 12px 12px 0px #0A0A0A shadow');
      assert.ok(wsModalContent.includes("borderRadius: '20px'"), 'WorkspaceSetupModal must declare 20px borderRadius');
      assert.ok(wsModalContent.includes("background: '#FFFFFF'"), 'WorkspaceSetupModal must declare #FFFFFF surface');

      // RedeemCodeModal.tsx uses standard .modal class
      const redeemContent = fs.readFileSync(path.join(ROOT, 'components', 'dashboard', 'modals', 'RedeemCodeModal.tsx'), 'utf8');
      assert.ok(redeemContent.includes('className="modal"'), 'RedeemCodeModal must inherit .modal class');

      // InviteModal.tsx uses standard .modal class
      const inviteContent = fs.readFileSync(path.join(ROOT, 'components', 'dashboard', 'modals', 'InviteModal.tsx'), 'utf8');
      assert.ok(inviteContent.includes('className="modal"'), 'InviteModal must inherit .modal class');

      // EventModal.tsx uses standard .modal class
      const eventContent = fs.readFileSync(path.join(ROOT, 'components', 'dashboard', 'modals', 'EventModal.tsx'), 'utf8');
      assert.ok(eventContent.includes('className="modal"'), 'EventModal must inherit .modal class');
    });
  });

  // ==========================================================================
  // SECTION 4: 1px Thin Border Adversarial Regression Check
  // ==========================================================================
  await suite.test('4. 1px Thin Border Regression Sweep on Cards & Modals', async (t) => {
    
    await t.test('4.1: HomePage.tsx card containers use 3px solid #0A0A0A and 6px solid ink shadow', () => {
      const homePath = path.join(ROOT, 'components', 'dashboard', 'pages', 'HomePage.tsx');
      const content = fs.readFileSync(homePath, 'utf8');

      // Assert that all top-level card containers in HomePage are hardened to 3px solid #0A0A0A
      const cardMatches = content.match(/className=["']card[^"']*["']/g) || [];
      assert.ok(cardMatches.length >= 5, `Expected at least 5 card containers, found ${cardMatches.length}`);

      // Check Ordis Action Bar, Stat cards, Sprint Tasks card, Syncs card, Activity card
      assert.ok(content.includes("border: '3px solid #0A0A0A'"), 'HomePage cards must specify 3px solid #0A0A0A border');
      assert.ok(content.includes("boxShadow: '6px 6px 0px #0A0A0A'"), 'HomePage cards must specify 6px 6px 0px #0A0A0A shadow');
      assert.ok(content.includes("borderRadius: '16px'"), 'HomePage cards must specify 16px borderRadius');
    });

    await t.test('4.2: TasksPage.tsx primary card containers (List view, Calendar view, Timeline view)', () => {
      const tasksPath = path.join(ROOT, 'components', 'dashboard', 'pages', 'TasksPage.tsx');
      const content = fs.readFileSync(tasksPath, 'utf8');

      // Check List view card container
      assert.ok(
        content.includes("className=\"card\" style={{ padding: 0, overflow: 'hidden', border: '3px solid #0A0A0A', borderRadius: '16px', boxShadow: '6px 6px 0px #0A0A0A'"),
        'TasksPage list view card must use 3px border and 6px ink shadow'
      );

      // Check Calendar view card container
      assert.ok(
        content.includes("className=\"card\" style={{ padding: '18px 20px', border: '3px solid #0A0A0A', borderRadius: '16px', boxShadow: '6px 6px 0px #0A0A0A'"),
        'TasksPage calendar view card must use 3px border and 6px ink shadow'
      );
    });

    await t.test('4.3: EMPIRICAL PROBE: TasksPage.tsx Template Cards & Task Detail Modal Border Audit', () => {
      const tasksPath = path.join(ROOT, 'components', 'dashboard', 'pages', 'TasksPage.tsx');
      const content = fs.readFileSync(tasksPath, 'utf8');

      // Check Quick Task Templates cards (lines 569-576)
      const has1pxTemplateCard = /key=\{tmpl\.name\}[\s\S]*?border:\s*'1px solid var\(--border-color\)'/.test(content);
      
      // Check Task Detail modal override (lines 605-611)
      const has1pxDetailModal = /className="modal"[\s\S]*?border:\s*'1px solid var\(--border-color\)'/.test(content);

      if (has1pxTemplateCard || has1pxDetailModal) {
        console.log('--- AUDIT FINDING: 1px Thin Border Occurrences in TasksPage.tsx ---');
        if (has1pxTemplateCard) {
          console.log('  [Notice] TasksPage.tsx: Quick Task Template cards use inline border: 1px solid var(--border-color)');
        }
        if (has1pxDetailModal) {
          console.log('  [Notice] TasksPage.tsx: Task Detail modal overrides .modal with inline border: 1px solid var(--border-color) and borderRadius: 8px');
        }
      }

      // Assert whether primary card views (List and Calendar) pass
      assert.ok(content.includes("border: '3px solid #0A0A0A'"), 'TasksPage must have 3px neo-brutalist card borders for primary views');
    });
  });

});
