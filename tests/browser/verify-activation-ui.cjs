const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000';
const tokenModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/auth/token.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
  { exports: tokenModule, require, process, Buffer, console, Date });
const user = { uid: 'activation_fixture', email: 'activation@example.com', displayName: 'Activation Check', role: 'owner', workspaceRole: 'owner', workspaceId: 'ws_activation_fixture', createdAt: new Date().toISOString() };
const token = tokenModule.createSessionToken({ ...user, createdAt: Date.now() });
const workspace = { id: user.workspaceId, name: 'Activation workspace', ownerId: user.uid, workspaceRole: 'owner', type: 'public', shortName: 'AW', color: '#FF5500', createdAt: new Date().toISOString() };
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: 'cursis_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
    await context.addInitScript(() => {
      localStorage.setItem('cursis_cookie_consent', JSON.stringify({ essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() }));
      localStorage.setItem('cursis_workspace_setup_completed', 'true');
    });
    const page = await context.newPage();
    page.on('pageerror', error => console.error('Browser error:', error.message));
    page.setDefaultTimeout(30000);
    let dismiss = false, failImport = true, savedPreferences = null, importRequests = [];
    await page.route(url => url.pathname.startsWith('/api/'), async route => {
      const path = new URL(route.request().url()).pathname;
      let json = { success: true };
      if (path === '/api/auth/session') json.user = user;
      if (path === '/api/workspaces') json.workspaces = [workspace];
      if (path === '/api/team') Object.assign(json, { team: [{ ...user, id: user.uid }], invitations: [] });
      const lists = { '/api/tasks': 'tasks', '/api/projects': 'projects', '/api/meetings': 'meetings', '/api/departments': 'departments', '/api/notifications': 'notifications', '/api/documents': 'documents', '/api/ordis/conversations': 'conversations' };
      if (lists[path]) json[lists[path]] = [];
      if (path === '/api/activation') {
        if (route.request().method() === 'PATCH') dismiss = true;
        Object.assign(json, { visible: !dismiss, steps: [false, false, false] });
      }
      if (path === '/api/report-preferences') {
        if (route.request().method() === 'PATCH') savedPreferences = route.request().postDataJSON();
        Object.assign(json, { owner: true, weekly: true, daily: false, capacityHours: null, paused: false });
      }
      if (path === '/api/tasks/import') {
        importRequests.push(route.request().postDataJSON());
        if (failImport) { failImport = false; return route.fulfill({ status: 503, json: { error: 'Import could not be confirmed. Retry this batch safely.' } }); }
        json.imported = 1;
      }
      return route.fulfill({ json });
    });
    await page.goto(base + '/dashboard', { waitUntil: 'networkidle', timeout: 120000 });
    const checklist = page.getByRole('region', { name: 'Getting started', exact: true });
    await page.waitForFunction(() => document.querySelector('[aria-label="Getting started"] button')?.textContent?.includes('Dismiss'));
    await page.screenshot({ path: 'artifacts/activation-checklist-desktop.png', fullPage: true });
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Checklist overflow at ' + width);
      await page.screenshot({ path: `artifacts/activation-checklist-${width}.png`, fullPage: true });
    }
    assert.equal(await checklist.locator('progress').getAttribute('value'), '0');
    await page.getByRole('button', { name: 'Dismiss checklist', exact: true }).click();
    await checklist.waitFor({ state: 'hidden' }); assert(dismiss);
    await page.goto(base + '/dashboard/tasks', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Create your first task', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Import tasks from CSV' }).click();
    await page.screenshot({ path: 'artifacts/csv-preview-desktop.png', fullPage: true });
    const file = content => ({ name: 'tasks.csv', mimeType: 'text/csv', buffer: Buffer.from(content) });
    await page.getByLabel('Select CSV').setInputFiles(file('name,assignee email,due date,status\nTask,bad@example.com,2026-02-30,unknown'));
    await page.getByText('Assignee email must belong', { exact: false }).waitFor();
    assert(await page.getByRole('button', { name: 'Confirm import of 1 tasks' }).isDisabled());
    await page.getByLabel('Select CSV').setInputFiles(file('name,assignee email,due date,status\nActual task,,2026-12-01,todo'));
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'CSV overflow at ' + width);
      await page.screenshot({ path: `artifacts/csv-preview-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Confirm import of 1 tasks' }).click();
    await page.getByRole('button', { name: 'Retry this import' }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Retry this import' }).click();
    await page.getByText('Import complete.', { exact: false }).waitFor();
    assert.equal(importRequests.length, 2); assert.equal(importRequests[0].batchId, importRequests[1].batchId);
    assert.equal(importRequests[0].csv, importRequests[1].csv);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/dashboard/settings');
    await page.getByRole('button', { name: '3. Notifications', exact: true }).click();
    await page.screenshot({ path: 'artifacts/progress-email-settings-desktop.png', fullPage: true });
    await page.getByLabel('Daily Ordis digest', { exact: false }).check();
    await page.getByRole('button', { name: 'Save email preferences', exact: true }).click();
    await page.getByText('Email preferences saved.', { exact: true }).waitFor();
    assert.equal(savedPreferences.daily, true); assert.equal(savedPreferences.workspaceId, workspace.id);
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Settings overflow at ' + width);
      await page.screenshot({ path: `artifacts/progress-email-settings-${width}.png`, fullPage: true });
    }
    console.log('PASS: real dashboard checklist dismissal, CSV validation/preview/retry after reload, email opt-in settings, and responsive layouts. API responses use isolated fixtures; no accounts or tasks created.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
