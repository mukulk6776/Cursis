const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('cheerio');
const { chromium } = require('playwright');

const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000';
const posts = fs.readdirSync('content/blog').filter(name => name.endsWith('.md')).map(name => '/blog/' + name.slice(0, -3));
const routes = ['/', '/pricing', '/faq', '/about', '/compare', '/blog', ...posts, '/contact', '/signup', '/login', '/social', '/refund-policy', '/privacy', '/terms', '/cookie-policy', '/dmca', '/data-deletion'];
if (fs.existsSync('app/changelog/page.tsx')) routes.push('/changelog');

(async () => {
  const titles = new Set(), descriptions = new Set(), links = new Set(), results = [];
  for (const route of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route + ': status');
    const $ = load(await response.text());
    const title = $('title').text(), description = $('meta[name="description"]').attr('content');
    assert(title && !titles.has(title), route + ': unique title'); titles.add(title);
    assert(description && !descriptions.has(description), route + ': unique description'); descriptions.add(description);
    assert.equal(new URL($('link[rel="canonical"]').attr('href')).href, new URL(route, 'https://cursis.in').href, route + ': canonical');
    assert(!($('meta[name="robots"]').attr('content') || '').includes('noindex'), route + ': indexable');
    assert.equal($('meta[property="og:image"]').first().attr('content'), 'https://cursis.in/marketing-og.png', route + ': image');
    assert.equal($('meta[name="twitter:creator"]').attr('content'), '@cursis_', route + ': handle');
    assert.equal($('meta[property="og:title"]').attr('content'), title, route + ': OG title');
    assert.equal($('meta[property="og:description"]').attr('content'), description, route + ': OG description');
    assert(!/\bSOC\b|\bSLA\b|99\.99|500\+|TODO_CONFIRM|Editorial review|Draft for review|Cursis Inc\./i.test($('main').text()), route + ': unsupported claims');
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href.startsWith('/') && !href.startsWith('//')) links.add(href.split('#')[0]);
    });
    results.push({ route, status: response.status, title, canonical: $('link[rel="canonical"]').attr('href') });
  }
  for (const href of links) assert((await fetch(base + href)).status < 400, 'Broken internal link: ' + href);
  assert.equal((await fetch(base + '/creators')).status, 404, 'Creators stays deleted');
  const sitemap = await (await fetch(base + '/sitemap.xml')).text();
  for (const post of posts) assert(sitemap.includes(post), 'Published post in sitemap: ' + post);
  assert(!sitemap.includes('/creators'));
  assert((await (await fetch(base + '/robots.txt')).text()).includes('https://cursis.in/sitemap.xml'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      sessionStorage.setItem('cursis_exit_seen', '1');
      localStorage.setItem('cursis_cookie_consent', JSON.stringify({ essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() }));
    });
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/', '/signup', '/login', '/about', '/compare']) {
        await page.goto(base + route, { waitUntil: 'networkidle', timeout: 120000 });
        const reject = page.getByRole('button', { name: 'Reject Optional', exact: true });
        if (await reject.isVisible()) await reject.click();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ': overflow at ' + width);
        if (route === '/') {
          assert(!(await page.locator('.lp-nav-signup').isVisible()), 'Header signup stays hidden before the hero');
          await page.evaluate(() => { const hero = document.getElementById('hero'); window.scrollTo(0, hero.offsetTop + hero.offsetHeight + 20); });
          await page.locator('.lp-nav-signup').waitFor({ state: 'visible' });
        }
        if (route === '/signup') {
          assert(await page.getByRole('heading', { name: 'Create your free workspace', exact: true }).isVisible());
          assert(await page.getByRole('button', { name: 'Continue with Google', exact: true }).isVisible());
        }
        if (route === '/signup' || route === '/compare') await page.screenshot({ path: `artifacts/marketing-${route.slice(1)}-${width}.png`, fullPage: true });
      }
    }
  } finally { await browser.close(); }
  fs.writeFileSync('artifacts/marketing-route-checks.json', JSON.stringify({ results, internalLinks: links.size, widths: [360, 768, 1440] }, null, 2));
  console.log(`PASS: ${routes.length} public routes, ${links.size} internal links, metadata, sitemap, robots and responsive layouts.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
