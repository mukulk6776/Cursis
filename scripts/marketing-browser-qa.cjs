const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = 'http://localhost:3001';
const paths = ['/', '/pricing', '/faq', '/contact', '/blog', '/compare', '/creators', '/about', '/social', '/blog/workload-balancing-small-teams', '/blog/agency-project-management', '/blog/catch-delayed-tasks'];
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Keep smoke tests separate from the live database and consent writes.
  await context.route('**/api/auth/session', route => route.fulfill({ status: 401, json: {} }));
  await context.route('**/api/marketing-events', route => route.fulfill({ status: 204 }));
  await page.addInitScript(() => localStorage.setItem('cursis_cookie_consent', JSON.stringify({ essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() })));
  for (const route of paths) {
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, route);
    assert.ok(await page.locator('h1').first().textContent(), route + ' heading');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://cursis.in' + (route === '/' ? '' : route));
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), 'https://cursis.in/marketing-og.png');
    assert.equal(await page.locator('meta[property="og:image:width"]').getAttribute('content'), '1200');
    assert.equal(await page.locator('meta[property="og:image:height"]').getAttribute('content'), '630');
    assert.ok(await page.locator('a[href="/signup"]').count());
    const invalidExternal = await page.locator('a[href^="http"]').evaluateAll(links => links.filter(a => a.target !== '_blank' || !a.rel.includes('noopener') || !a.rel.includes('noreferrer')).map(a => a.href));
    assert.deepEqual(invalidExternal, [], route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, route + ' desktop overflow');
    if (['/pricing','/contact','/about'].includes(route)) await page.screenshot({path:'artifacts/marketing/' + route.slice(1) + '-desktop.png'});
    results.push({ route, desktop: 'pass', title: await page.title() });
  }
  await page.goto(base + '/faq');
  await page.locator('summary').first().press('Enter');
  assert.equal(await page.locator('details').first().getAttribute('open'), '');
  await page.goto(base + '/contact');
  await context.route('**/api/marketing/contact', route => route.fulfill({ status: 200, json: { success: true } }));
  await page.getByLabel('Your name').fill('QA Person');
  await page.getByLabel('Email address', { exact: true }).first().fill('qa@example.com');
  await page.getByLabel('Message', { exact: true }).fill('Testing the contact success presentation.');
  await page.getByLabel('I agree to my details').check();
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('Your message has been received. Thank you for getting in touch.').waitFor();
  await page.goto(base);
  await page.getByRole('link', { name: 'Try the Demo' }).click();
  assert.ok(await page.locator('#ordis').evaluate(el => el.getBoundingClientRect().top < 180));
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, relatedTarget: null })));
  await page.getByLabel('Start a free workspace', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Dismiss signup prompt' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, relatedTarget: null })));
  assert.equal(await page.locator('.marketing-exit').count(), 0);
  for (const route of ['/login', '/signup']) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => { sessionStorage.removeItem('cursis_exit_seen'); document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, relatedTarget: null })); });
    assert.equal(await page.locator('.marketing-exit').count(), 0);
  }
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await mobile.route('**/api/auth/session', route => route.fulfill({ status: 401, json: {} }));
  await mobile.addInitScript(() => localStorage.setItem('cursis_cookie_consent', JSON.stringify({ essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() })));
  const phone = await mobile.newPage();
  for (const route of paths) {
    await phone.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route + ' mobile overflow');
    results.find(r => r.route === route).mobile = 'pass';
  }
  await phone.goto(base, { waitUntil: 'networkidle' });
  await phone.evaluate(() => { sessionStorage.removeItem('cursis_exit_seen'); scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * .65); });
  await phone.getByLabel('Start a free workspace', { exact: true }).waitFor();
  await phone.getByRole('button', { name: 'Dismiss signup prompt' }).click();
  assert.ok(await phone.locator('.lp-nav-actions').getByRole('link', { name: 'Sign In', exact: true }).isVisible());
  assert.ok(await phone.locator('.lp-nav-actions').getByRole('link', { name: 'Get Started', exact: true }).isVisible());
  for (const link of await phone.locator('.lp-nav-actions a').all()) { const rect = await link.boundingBox(); assert.ok(rect && rect.y >= 0 && rect.y + rect.height <= 844); }
  await phone.getByRole('button', { name: 'Toggle navigation' }).click();
  assert.equal(await phone.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'true');
  await phone.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await phone.waitForURL('**/pricing');
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/marketing/home-desktop.png', fullPage: true });
  await phone.goto(base, { waitUntil: 'networkidle' });
  await phone.screenshot({ path: 'artifacts/marketing/home-mobile.png', fullPage: true });
  await page.screenshot({ path: 'artifacts/marketing/home-desktop-viewport.png' });
  await phone.screenshot({ path: 'artifacts/marketing/home-mobile-viewport.png' });
  for (const width of [320, 768, 1100]) {
    await phone.setViewportSize({width,height:844});
    const toggle = phone.getByRole('button',{name:'Toggle navigation'});
    assert.ok(await toggle.isVisible(),'menu at ' + width);
    const rect = await toggle.boundingBox(); assert.ok(rect.x + rect.width <= width,'header fits at ' + width);
    assert.ok(await phone.locator('.lp-nav-actions').getByRole('link',{name:'Get Started',exact:true}).isVisible());
  }
  await phone.setViewportSize({width:390,height:844});
  const signedIn = await browser.newContext();
  await signedIn.route('**/api/auth/session', route => route.fulfill({ status: 200, json: { user: { email: 'qa@example.com' } } }));
  const account = await signedIn.newPage();
  await account.goto(base, {waitUntil:'networkidle'});
  assert.ok(await account.locator('footer a[href="/dashboard"]').isVisible());
  const events = [];
  await page.unroute('**/api/marketing-events');
  await page.route('**/api/marketing-events', route => {events.push(route.request().postDataJSON()); return route.fulfill({status:204});});
  await page.reload({waitUntil:'networkidle'});
  assert.equal(events.length, 0, 'analytics off before consent');
  await page.evaluate(() => {localStorage.setItem('cursis_cookie_consent', JSON.stringify({essential:true,functional:false,analytics:true,timestamp:new Date().toISOString()}));window.dispatchEvent(new Event('cursis_cookie_consent_updated'));});
  await page.waitForResponse(response => response.url().endsWith('/api/marketing-events'));
  assert.ok(events.some(event => event.event === 'page_view'));
  assert.ok(events.every(event => !('email' in event) && !('sessionId' in event)));
  await page.evaluate(() => {localStorage.setItem('cursis_cookie_consent', JSON.stringify({essential:true,functional:false,analytics:false,timestamp:new Date().toISOString()}));window.dispatchEvent(new Event('cursis_cookie_consent_updated'));});
  const count = events.length;
  await page.getByRole('link', {name:'Try the Demo'}).click();
  assert.equal(events.length,count,'analytics off after revocation');
  assert.deepEqual(errors, []);
  fs.writeFileSync('artifacts/marketing/browser-qa.json', JSON.stringify({ results, runtimeErrors: errors, interactions: ['FAQ keyboard', 'contact success (mocked)', 'demo anchor', 'desktop exit', 'session dismissal', 'auth exclusions', 'mobile scroll prompt', 'sticky mobile auth actions', 'mobile menu'] }, null, 2));
  await browser.close();
  console.log('Desktop/mobile routes and interaction checks passed.');
})().catch(error => { console.error(error); process.exit(1); });
