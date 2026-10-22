const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
function render(testimonials) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('components/landing/Testimonials.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { exports, require: name => name === '@/content/testimonials' ? { testimonials } : require(name) });
  return renderToStaticMarkup(exports.default());
}
test('testimonial section is absent without real approved entries and can show one approved quote', () => {
  assert.equal(render([]), '');
  assert.equal(render([{ name: 'Test fixture', quote: 'Unapproved fixture', approved: false }]), '');
  assert.match(render([{ name: 'Test fixture', quote: 'Approved fixture', approved: true }]), /Approved fixture/);
});
