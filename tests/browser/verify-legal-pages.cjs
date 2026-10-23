const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { load } = require('cheerio');
const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3100';
const documents = ['/privacy', '/terms', '/cookie-policy', '/dmca', '/refund-policy', '/data-deletion'];
const routes = [...documents, '/privacy-policy', '/privacy/rights'];
(async () => {
  const baselinePath = process.env.LEGAL_CONTENT_BASELINE;
  if (baselinePath) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    for (const route of documents) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route);
      const $ = load(await response.text());
      const body = $('.policy-content').children('section,p').map((_, el) => {
        const copy = $(el).clone(); copy.find('h2,caption,thead').remove();
        return copy.text().replace(/\s+/g, ' ').trim();
      }).get().join(' ');
      assert.equal(body, baseline[route], route + ': policy wording preserved');
    }
  }
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('cursis_cookie_consent', JSON.stringify({ essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() })));
    await context.route('**/api/auth/session', route => route.fulfill({ status: 200, json: {} }));
    await context.route('**/api/privacy', route => {
      assert.equal(route.request().method(), 'GET', 'No privacy mutations during layout checks');
      return route.fulfill({ status: 401, json: { error: 'Sign in to manage your data.' } });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto(base + route, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('main h1').count(), 1, route);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ': overflow at ' + width);
        assert.equal(await page.locator('.policy-nav a').count(), 7);
        assert.equal(await page.locator('.policy-nav [aria-current="page"]').count(), 1);
        if (route === '/privacy/rights') assert.equal(await page.locator('.policy-nav [aria-current]').getAttribute('href'), route);
        if (route !== '/privacy/rights') {
          const summary = page.locator('.policy-contents summary');
          await summary.focus(); await page.keyboard.press('Enter');
          assert(await page.locator('.policy-contents').evaluate(el => el.open), route + ': keyboard section index');
          const links = await page.locator('.policy-contents a').evaluateAll(els => els.map(el => el.hash));
          assert.equal(links.length, await page.locator('.policy-content>section').count());
          for (const href of links) assert.equal(await page.locator(href).count(), 1, route + href);
          await page.locator('.policy-contents a').first().click();
          assert(await page.evaluate(() => document.activeElement.id === location.hash.slice(1)), route + ': anchor focus');
        }
        if (route === '/privacy') {
          const table = page.locator('.policy-table-scroll');
          await table.focus();
          assert.equal(await table.getAttribute('tabindex'), '0');
          assert.equal(await table.locator('thead th[scope="col"]').count(), 3);
          if (width < 768) {
            await page.keyboard.press('ArrowRight');
            await page.waitForFunction(() => document.querySelector('.policy-table-scroll').scrollLeft > 0);
          }
        }
        if (route === '/cookie-policy') {
          await page.locator('main').getByRole('button', { name: 'Customize Cookie Preferences', exact: true }).click();
          await page.getByRole('region', { name: 'Cookie preferences', exact: true }).waitFor({ state: 'visible' });
          await page.getByRole('region', { name: 'Cookie preferences', exact: true }).getByRole('button', { name: 'Reject Optional', exact: true }).click();
        }
      }
      if ([390, 1440].includes(width)) {
        await page.goto(base + '/privacy', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'artifacts/legal-privacy-' + width + '.png' });
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 8 legal routes, 4 widths, keyboard index and table, cookie controls, no browser errors' + (baselinePath ? ', original policy wording preserved.' : '.'));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
