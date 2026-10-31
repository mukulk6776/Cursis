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

test('task names preserve escaped punctuation without turning record text into links', () => {
  const { presentTaskList } = require(path.join(sourceRoot, 'lib/ordis/task-presentation.ts'));
  const response = presentTaskList('show ongoing tasks', [{ ok: true, operation: 'list_tasks', data: { tasks: [{
    title: '[Launch](https://example.com) <mobile> **v2**', status: 'in_progress', priority: 'high',
  }] } }]);
  const html = render(response);
  assert.match(html, /<strong>\[Launch\]\(https:\/\/example.com\) &lt;mobile&gt; \*\*v2\*\*<\/strong>/);
  assert.doesNotMatch(html, /<a |<table|\\\[/);
});

test('sanitizeTaskTable converts markdown table with IDs into clean bullet list', () => {
  const { sanitizeTaskTable } = require(path.join(sourceRoot, 'lib/ordis/task-presentation.ts'));
  const tableContent = `Here’s a snapshot of every active task in the workspace right now:\n\n| ID | Title | Status | Priority | Due | Assignee |\n|---|---|---|---|---|---|\n| **t_1792345092152** | *[Bug Report] New Task* | Todo | High | 2026-10-25 | Saransh Vashistha |\n| **t_1793280020757** | **fn** | Todo | Medium | 2026-11-05 | Mukul |`;
  const result = sanitizeTaskTable(tableContent, []);
  assert.ok(result);
  assert.doesNotMatch(result, /\| ID \|/);
  assert.doesNotMatch(result, /t_1792345092152/);
  assert.match(result, /- \*\*\[Bug Report\] New Task\*\*/);
  assert.match(result, /- \*\*fn\*\*/);
  assert.match(result, /To do/);
  assert.match(result, /High priority/);
  assert.match(result, /Saransh Vashistha/);
});

test('sanitizeTaskTable uses list_tasks action data when available to bypass raw table text', () => {
  const { sanitizeTaskTable } = require(path.join(sourceRoot, 'lib/ordis/task-presentation.ts'));
  const tableContent = `| ID | Title |\n|---|---|\n| t_123 | Something |`;
  const actions = [{
    ok: true,
    operation: 'list_tasks',
    data: {
      tasks: [
        { title: 'Clean Task Title', status: 'in_progress', priority: 'high', assigneeName: 'Alice' }
      ]
    }
  }];
  const result = sanitizeTaskTable(tableContent, actions);
  assert.ok(result);
  assert.doesNotMatch(result, /t_123/);
  assert.match(result, /Clean Task Title/);
  assert.match(result, /In progress/);
  assert.match(result, /Alice/);
});

for (const { name, fn } of tests) { fn(); console.log(`PASS ${name}`); }
console.log(`${tests.length} presentation tests passed.`);
