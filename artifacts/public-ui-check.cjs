const { chromium, expect } = require('playwright/test');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000');
  await page.getByRole('button', { name: 'Customize', exact: true }).click();
  await page.getByLabel('Functional cookies', { exact: true }).check();
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Cookie preferences' })).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1300);
  await expect(page.getByRole('region', { name: 'Cookie preferences' })).toHaveCount(0);
  await page.locator('.lp-footer-cookie').click();
  await expect(page.getByLabel('Functional cookies', { exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Reject Optional', exact: true }).click();
  const choice = await page.evaluate(() => JSON.parse(localStorage.getItem('cursis_cookie_consent')));
  assert.equal(choice.functional, false);
  assert.equal(choice.analytics, false);
  console.log('Cookie choice persists; footer reopens preferences; rejection is saved.');

  for (const [button, title] of [['Work Progress', 'Work Progress'], ['Who Is Busy? (4)', 'Who Has Room to Help?'], ['Project Stages', 'From Video Idea to Published'], ['Ordis AI Assistant', 'Active Tasks']]) {
    await page.locator('.lp-mockup-tab').filter({ hasText: button }).click();
    await page.waitForTimeout(600);
    const heading = await page.locator('.lp-mockup-view-title').innerText();
    console.log('Tab:', button, '→', heading);
    assert.equal(heading, title);
    await expect(page.locator('.lp-tab-content')).toHaveCount(1);
    await expect(page.locator('.lp-mockup-tab[aria-pressed="true"]')).toHaveCount(1);
  }
  const cta = page.locator('.lp-hero-ctas .btn-primary');
  await expect(cta).toContainText('Make my workspace');
  await cta.hover();
  await expect(cta).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.mouse.move(0, 0);
  await page.keyboard.press('Escape');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.locator('.lp-bento-card, .tano-module-card, .lp-footer-inner, .lp-hero-ctas').evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 1).map(n => n.className));
    assert.deepEqual(overflow, [], `${width}px card overflow`);
    if (width === 1440 || width === 390) {
      await page.locator('#features').screenshot({ path: `artifacts/features-final-${width}.png` });
    }
  }
  console.log('Desktop, tablet and mobile cards fit; CTA hover uses white text.');

  await page.goto('http://127.0.0.1:3000/login');
  await page.getByLabel('Email address', { exact: true }).fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await page.route('**/api/auth/login', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid test credentials' }) }));
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.auth-error')).toContainText('Invalid test credentials');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
  await expect(page.locator('.auth-success')).toContainText('security@cursis.in');
  console.log('Password visibility, login error recovery and reset guidance pass.');

  for (const route of ['/privacy', '/terms', '/cookie-policy']) {
    await page.goto('http://127.0.0.1:3000' + route);
    assert.equal(await page.locator('.policy-main').count(), 1);
    const fonts = await page.locator('.policy-content h2, .policy-content p').evaluateAll(nodes => [...new Set(nodes.map(n => getComputedStyle(n).fontFamily))]);
    assert.equal(fonts.length, 1);
    if (route === '/privacy') {
      const content = await page.locator('.policy-content').innerText();
      assert.ok(!content.includes('Recipients and sub-processors'));
      assert.ok(!content.includes('Supabase, Razorpay and Upstash'));
      assert.ok(!content.includes('AI requests can contain selected workspace context'));
    }
    console.log(route + ': consistent heading and paragraph fonts.');
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
