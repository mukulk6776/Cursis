const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { load } = require('cheerio');
const ts = require('typescript');

const output = ts.transpileModule(fs.readFileSync('components/landing/PolicyLayout.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const compiled = { exports: {} };
vm.runInNewContext(output, { exports: compiled.exports, require(name) {
  if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
  if (name === './Footer') return () => null;
  if (name === '@/lib/site') return { SUPPORT_EMAIL: 'support@example.com' };
  if (name.endsWith('.css')) return {};
  return require(name);
} });
const PolicyLayout = compiled.exports.default;
function render(children, props = {}) {
  return load(renderToStaticMarkup(React.createElement(PolicyLayout, {
    title: 'Privacy Notice', badge: 'Privacy', lastUpdated: 'Last Updated: October 18, 2026',
    activeSlug: 'privacy', summary: React.createElement('p', null, 'Overview'), ...props, children,
  })));
}

test('section index stays aligned with numbered headings and preserves content and existing IDs', () => {
  const section = (heading, id) => React.createElement('section', { id }, React.createElement('h2', null, heading), React.createElement('p', null, 'Policy wording stays intact.'));
  const $ = render([section('1. Collection'), section('Your choices', 'choices')]);
  assert.deepEqual($('.policy-content h2').map((_, el) => $(el).text()).get(), ['1. Collection', '2. Your choices']);
  assert.deepEqual($('.policy-contents a').map((_, el) => $(el).attr('href')).get(), ['#policy-section-1', '#choices']);
  for (const el of $('.policy-contents a').toArray()) assert.equal($($(el).attr('href')).attr('tabindex'), '-1');
  assert.equal($('.policy-content p').first().text(), 'Policy wording stays intact.');
  assert.equal($('.policy-updated').text(), 'Last updated: October 18, 2026');
});

test('all policies are reachable and Privacy Centre has its own current state', () => {
  const Centre = () => React.createElement('button', null, 'Privacy action');
  const $ = render(React.createElement(Centre), { activeSlug: 'rights', contactEmail: 'privacy@example.com', dpoEmail: 'privacy@example.com' });
  assert.equal($('.policy-nav a').length, 7);
  assert.equal($('.policy-nav a[aria-current]').length, 1);
  assert.equal($('.policy-nav a[aria-current]').attr('href'), '/privacy/rights');
  assert.equal($('.policy-nav a[href="/data-deletion"]').length, 1);
  assert.equal($('.policy-contents').length, 0);
  assert.equal($('.policy-content button').text(), 'Privacy action');
  assert.equal($('.policy-contact a[href="mailto:privacy@example.com"]').length, 1);
});
