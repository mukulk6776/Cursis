const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('cheerio');
const { chromium } = require('playwright');
const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3100';
const posts = fs.readdirSync('content/blog').filter(f => f.endsWith('.md')).map(f => '/blog/' + f.slice(0,-3));
const sales = ['/', '/pricing', '/faq', '/contact', '/blog', ...posts, '/compare', '/creators', '/about', '/social', '/changelog'];
const legal = ['/privacy', '/privacy/rights', '/terms', '/cookie-policy', '/refund-policy', '/data-deletion', '/dmca'];
const routes = [...sales, ...legal];
(async () => {
  const pages = new Map(), links = new Set(), titles = new Set(), intros = new Set(), prose = new Map();
  for (const route of routes) {
    const response = await fetch(base + route); assert.equal(response.status, 200, route);
    const $ = load(await response.text()); pages.set(route, $);
    assert.equal($('main h1').length, 1, route + ': one heading');
    assert(!titles.has($('title').text()), route + ': unique title'); titles.add($('title').text());
    assert.equal(new URL($('link[rel="canonical"]').attr('href')).pathname, route, route + ': canonical');
    if (sales.includes(route)) {
      const intro = $('main > header > .lp-section-subtitle').text();
      if (intro) { assert(!intros.has(intro), route + ': repeated intro'); intros.add(intro); }
      assert($('main a[href="/signup"]').length, route + ': signup path');
      $('main p').each((_, node) => { const paragraph = $(node).clone(); paragraph.find('a').remove(); const body = paragraph.text().trim(); if (body.length > 35) { assert(!prose.has(body) || prose.get(body) === route, route + ': repeated prose from ' + prose.get(body)); prose.set(body, route); } });
      assert(!/Draft for review|TODO_CONFIRM|500\+|99\.99|award.winning|guaranteed results/i.test($('main').text()), route + ': fabricated or unfinished copy');
    }
    $('a[href]').each((_, node) => { const href = $(node).attr('href'); if (href.startsWith('/') && !href.startsWith('//')) links.add(href); });
  }
  for (const href of links) {
    const url = new URL(href, base), route = url.pathname;
    if (!pages.has(route)) { const res = await fetch(base + route); assert(res.status < 400, 'Broken route: ' + href); pages.set(route, load(await res.text())); }
    if (url.hash) assert(pages.get(route)('[id]').toArray().some(n => pages.get(route)(n).attr('id') === decodeURIComponent(url.hash.slice(1))), 'Broken anchor: ' + href);
  }
  assert.equal(pages.get('/')('main > section').length, 5);
  assert.equal((pages.get('/')('main').text().match(/Demo data/g) || []).length, 1);
  assert.equal(pages.get('/')('#connected, #modules, .lp-bento-stages-row').length, 0);
  for (const selector of ['.marketing-newsletter', '.marketing-exit']) assert.equal(pages.get('/')(selector).length, 0);
  const sitemap = await (await fetch(base + '/sitemap.xml')).text(); assert(sitemap.includes('/creators'));
  const browser = await chromium.launch({ headless: true });
  const errors = [], screenshots = [];
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => { if (!localStorage.getItem('cursis_cookie_consent')) localStorage.setItem('cursis_cookie_consent', JSON.stringify({essential:true,functional:false,analytics:false,timestamp:new Date().toISOString()})); });
    await context.route('**/api/auth/session', route => route.fulfill({status:200,contentType:'application/json',body:'{}'}));
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({width,height:900});
      for (const route of routes) {
        await page.goto(base + route, {waitUntil:'networkidle',timeout:120000});
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ': page overflow ' + width);
        assert(await page.evaluate(() => [...document.querySelectorAll('main p, main h1, main h2, main h3, main td, main th, main button, main input, main textarea')].every(el => { if (el.closest('[aria-hidden="true"], .sr-only')) return true; const r = el.getBoundingClientRect(); return !r.width || (r.left >= -1 && r.right <= innerWidth + 1); })), route + ': clipped content ' + width);
      }
      await page.goto(base, {waitUntil:'networkidle'});
      assert(!(await page.locator('.lp-nav-signup').isVisible()), 'Sticky signup before hero ends');
      if (width <= 390) assert.equal(await page.locator('.lp-ordis-demo').count(), 0, 'Demo deferred below fold');
      const before = await page.locator('#compare').boundingBox();
      await page.locator('#ordis').scrollIntoViewIfNeeded();
      await page.locator('.lp-ordis-demo-prompt').first().waitFor();
      const heightBefore = await page.locator('.lp-demo-reserved').evaluate(el => el.offsetHeight);
      await page.locator('.lp-ordis-demo-prompt').first().click();
      await page.locator('.lp-ordis-demo[data-phase="complete"]').waitFor();
      assert.equal(await page.locator('.lp-ordis-demo-prompt:disabled').count(),4);
      assert.equal(await page.locator('.lp-demo-reserved').evaluate(el => el.offsetHeight), heightBefore);
      assert.equal(await page.locator('#compare').evaluate(el => el.offsetTop), Math.round(before.y + 0));
      assert(await page.locator('.lp-nav-signup').isVisible(), 'Sticky signup after hero');
      assert(await page.locator('[role="log"]').evaluate(el => el === document.activeElement), 'Focus stays in answer');
      assert.equal(await page.locator('.lp-ordis-demo-cta').evaluate(el => el.scrollWidth <= el.clientWidth),true);
      if ([390,1440].includes(width)) { const path = 'artifacts/minimal-home-' + width + '.png'; await page.screenshot({path,fullPage:true}); screenshots.push(path); }
      await page.locator('.lp-ordis-demo-cta').click(); await page.waitForURL('**/signup?source=ordis-demo');
      await page.getByRole('button',{name:'Continue with Google',exact:true}).waitFor({state:'visible'});
      await page.goto(base + '/compare', {waitUntil:'networkidle'});
      if ([390,1440].includes(width)) await page.screenshot({path:'artifacts/minimal-compare-' + width + '.png',fullPage:true});
    }
    const events = [];
    await context.route('**/api/marketing-events', route => { events.push(route.request().postDataJSON()); return route.fulfill({status:204}); });
    await page.goto(base,{waitUntil:'networkidle'}); await page.locator('#ordis').scrollIntoViewIfNeeded(); await page.locator('.lp-ordis-demo-prompt').first().click();
    assert.equal(events.length,0,'No analytics without consent');
    await page.evaluate(() => localStorage.setItem('cursis_cookie_consent',JSON.stringify({essential:true,functional:false,analytics:true,timestamp:new Date().toISOString()})));
    await page.goto(base,{waitUntil:'networkidle'});
    await page.locator('[data-marketing="hero_button_click"]').click(); await page.waitForURL('**/signup');
    await page.goto(base,{waitUntil:'networkidle'}); await page.locator('#ordis').scrollIntoViewIfNeeded(); await page.locator('.lp-ordis-demo-prompt').first().click();
    await page.locator('.lp-ordis-demo-cta').click(); await page.waitForURL('**/signup?source=ordis-demo');
    await page.goto(base + '/compare',{waitUntil:'networkidle'});
    for (const [event,path,value] of [['cta_click','/',''],['cta_click','/','signup'],['demo_interaction','/',''],['demo_interaction','/','100'],['page_view','/compare','']]) assert(events.some(e => e.event===event && e.path===path && e.value===value), 'Missing analytics ' + [event,path,value]);
    assert.deepEqual(errors,[],'Browser errors');
    fs.writeFileSync('artifacts/minimal-public-verification.json',JSON.stringify({routes:routes.length,links:links.size,widths:[320,390,768,1440],errors,analytics:'5 requested actions verified with consent; none without',screenshots},null,2));
    console.log('PASS: '+routes.length+' routes, '+links.size+' internal links/anchors, four widths, instant demo, stable layout, signup and consent-gated analytics.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
