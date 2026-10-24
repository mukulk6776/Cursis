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
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/signup', { waitUntil: 'networkidle', timeout: 60000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Signup overflows at ' + width);
      await page.getByRole('button', { name: 'Continue with Google', exact: true }).waitFor();
      if ([390, 1440].includes(width)) await page.screenshot({ path: 'artifacts/signup-lakai-' + width + '.png', fullPage: true });
    }
    await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
    assert.equal(await page.locator('.auth-consent input').count(), 2);
    await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
    assert.equal(await page.locator('#signup-age-gate').evaluate(el => el.validity.valueMissing), true);
    await page.getByRole('button', { name: /Change/ }).click();
    await page.getByLabel('Work email').fill('test@gmail.com');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    let fail = true;
    const result = { success: true, user: { uid: 'test', email: 'test@gmail.com', displayName: 'Test' }, token: 'cursis_usr_test_fixture' };
    await page.route('**/api/auth/signup', route => route.fulfill({ status: fail ? 400 : 201, json: fail ? { error: 'Choose a stronger password.' } : result }));
    await page.getByLabel('Name', { exact: true }).fill('Test');
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
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#ordis').scrollIntoViewIfNeeded();
      const demo = page.locator('.lp-ordis-demo');
      await demo.waitFor();
      await page.waitForFunction(() => document.querySelector('.lp-ordis-demo')?.dataset.visible === 'true');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Demo overflows at ' + width);
      const height = await page.locator('.lp-demo-reserved').evaluate(el => el.offsetHeight);
      assert.equal(await page.locator('.lp-ordis-demo-spark').evaluate(el => getComputedStyle(el).animationPlayState), 'running');
      await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
      assert.equal(await page.locator('.lp-ordis-demo-spark').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
      if ([390, 1440].includes(width)) await demo.screenshot({ path: 'artifacts/ordis-motion-' + width + '.png' });
      await page.locator('.lp-ordis-demo-prompt').first().click();
      assert.equal(await page.locator('.lp-ordis-demo-answer').evaluate(el => getComputedStyle(el).opacity), '1', 'Paused motion must not hide the answer');
      assert.equal(await page.locator('.lp-demo-reserved').evaluate(el => el.offsetHeight), height);
      await page.locator('#hero').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.lp-ordis-demo')?.dataset.visible === 'false');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#ordis').scrollIntoViewIfNeeded();
    await page.locator('.lp-ordis-demo-spark').waitFor();
    assert.equal(await page.locator('.lp-ordis-demo-spark').evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.locator('.lp-ordis-demo-prompt').first().click();
    assert.equal(await page.locator('.lp-ordis-demo-answer').evaluate(el => getComputedStyle(el).animationName), 'none');
    console.log('PASS: Four responsive widths, consent gates, signup/login responses and redirects, Ordis pause/offscreen/reduced-motion behavior, stable layout. Auth APIs stubbed; no accounts created.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
