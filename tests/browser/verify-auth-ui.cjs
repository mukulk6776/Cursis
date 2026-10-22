const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.addInitScript(() => {
      localStorage.setItem('cursis_cookie_consent', JSON.stringify({ essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() }));
    });
    await page.route(url => url.pathname.startsWith('/dashboard'), route => route.fulfill({ status: 200, body: '<h1>Test dashboard</h1>', contentType: 'text/html' }));
    await page.goto(base + '/signup', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Confirm that you are at least 18' }).waitFor();
    let fail = true;
    const result = { success: true, user: { uid: 'test', email: 'test@gmail.com', displayName: 'Test' }, token: 'cursis_usr_test_fixture' };
    await page.route('**/api/auth/signup', route => route.fulfill({ status: fail ? 400 : 201, json: fail ? { error: 'Choose a stronger password.' } : result }));
    await page.getByLabel('Name', { exact: true }).fill('Test');
    await page.getByLabel('Work email').fill('test@gmail.com');
    await page.locator('#signup-password').fill('Safe!Password42');
    await page.locator('.auth-consent input').nth(0).check();
    await page.locator('.auth-consent input').nth(1).check();
    await page.getByRole('button', { name: 'Create my free workspace', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Choose a stronger password.' }).waitFor();
    fail = false;
    await page.getByRole('button', { name: 'Create my free workspace', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/dashboard' && url.searchParams.get('setup') === 'true');
    await page.goto(base + '/login?redirect=/dashboard/tasks', { waitUntil: 'networkidle' });
    fail = true;
    await page.route('**/api/auth/login', route => route.fulfill({ status: fail ? 401 : 200, json: fail ? { error: 'Incorrect email or password.' } : result }));
    await page.getByLabel('Email address').fill('test@gmail.com');
    await page.getByLabel('Password', { exact: true }).fill('Safe!Password42');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Incorrect email or password.' }).waitFor();
    fail = false;
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/dashboard/tasks');
    assert.equal(new URL(page.url()).pathname, '/dashboard/tasks');
    console.log('PASS: Google consent gate, signup/login error and success states, and redirects. API responses are stubbed; no accounts created.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
