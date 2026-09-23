// Run with: node tests/ordis-presentation.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.ORDIS_TEST_ROOT || path.resolve(__dirname, '..');
const sourceRoot = process.env.ORDIS_TEST_SOURCES || root;
const ts = require(path.join(root, 'node_modules/typescript'));
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText, filename);
};
const { formatChatMarkdown: render } = require(path.join(sourceRoot, 'lib/dashboard/data.ts'));
const { distressResponse } = require(path.join(sourceRoot, 'lib/ordis/safety.ts'));
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('tables use semantic headers and inherit readable colors in either chat theme', () => {
  const html = render('| Task | Owner |\n| --- | --- |\n| **Design** | Alex |');
  assert.match(html, /<th scope="col"/);
  assert.match(html, /<td style="[^"]*color:inherit/);
  assert.match(html, /<strong>Design<\/strong>/);
  assert.match(html, /overflow-x:auto/);
  assert.doesNotMatch(html, /#e5e7eb|#ffffff|#f3f4f6/);
});
test('HTML and links cannot inject scripts or HTML attributes', () => {
  const html = render('<img src=x onerror=alert(1)>\n[x](javascript:alert(1))\n[x](https://example.com/"onmouseover="alert)');
  assert.doesNotMatch(html, /<img|<script|<a /);
  assert.match(html, /&lt;img/);
  assert.match(html, /&quot;/);
});
test('safe links preserve query parameters without leaking markup', () => {
  const html = render('[Read <this>](https://example.com/?a=1&b=2)');
  assert.match(html, /href="https:\/\/example.com\/\?a=1&amp;b=2"/);
  assert.match(html, /Read &lt;this&gt;/);
  assert.match(html, /rel="noopener noreferrer"/);
});
test('code blocks and inline code remain literal and preserve whitespace', () => {
  const html = render('```js\n  const name = "**raw**";\n  <script>test</script>\n```\n`**literal**`');
  assert.match(html, /  const name = &quot;\*\*raw\*\*&quot;;\n  &lt;script&gt;/);
  assert.doesNotMatch(html, /<strong>|<script>|<br \/>/);
  assert.match(html, /\*\*literal\*\*<\/code>/);
});
test('lists, checklists, headings and paragraphs remain distinct readable blocks', () => {
  const html = render('## Plan\n\nA short answer.\n\n- [x] Design\n- [ ] Build\n\n3. Test\n4. Ship');
  assert.match(html, /<h4 /);
  assert.match(html, /<p style="[^"]*">A short answer\.<\/p>/);
  assert.match(html, /aria-label="Completed"/);
  assert.match(html, /aria-label="Not completed"/);
  assert.match(html, /<ol start="3"/);
  assert.equal((html.match(/<li /g) || []).length, 4);
});
test('table separators do not swallow data containing dashes', () => {
  const html = render('| Name | Notes |\n| --- | --- |\n| Release | alpha---beta |');
  assert.match(html, /alpha---beta/);
  assert.equal((html.match(/<tr>/g) || []).length, 2);
});
test('crisis support stays brief, readable and asks about immediate safety', () => {
  const response = distressResponse('i want to suicide');
  assert.ok(response);
  assert.match(response, /immediate danger/);
  assert.match(response, /someone you trust/);
  assert.ok(response.split(/\s+/).length < 100);
  assert.match(response, /\n\n/);
  assert.doesNotMatch(response, /\||\b\d{3,}\b/);
  assert.equal(distressResponse('Make my project plan less boring'), null);
});
test('empty messages and plain text remain safe', () => {
  assert.equal(render(null), '');
  assert.equal(render(''), '');
  assert.match(render('A < B & C > D'), /A &lt; B &amp; C &gt; D/);
});

for (const { name, fn } of tests) { fn(); console.log(`PASS ${name}`); }
console.log(`${tests.length} presentation tests passed.`);
