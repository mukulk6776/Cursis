const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('components/landing/OrdisSection.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function mount() {
  const slots = [], routes = [], events = [];
  let cursor = 0, tree;
  const viewport = { focused: false, focus() { this.focused = true; } };
  const hooks = {
    useReducer(reducer, initial) { const i = cursor++; slots[i] ??= { state: initial }; return [slots[i].state, action => { slots[i].state = reducer(slots[i].state, action); }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => name === 'react' ? hooks : name === 'next/navigation' ? { useRouter: () => ({ push: route => routes.push(route) }) } : name === '@/lib/analytics/marketing' ? { trackMarketing: (...args) => events.push(args) } : require(name) });
  function nodes(node) { return Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []; }
  function render() { cursor = 0; tree = exports.default(); for (const node of nodes(tree)) if (node.props?.ref) node.props.ref.current = viewport; }
  render();
  const find = className => nodes(tree).find(node => node.props?.className === className);
  return { exports, render, routes, events, viewport,
    get state() { return slots[0].state; },
    get chips() { return nodes(tree).filter(node => node.props?.className === 'lp-ordis-demo-prompt'); },
    get cta() { return find('lp-ordis-demo-cta'); },
    get group() { return find('lp-ordis-demo-prompts'); },
    get log() { return nodes(tree).find(node => node.props?.role === 'log'); },
  };
}
test('each question gives its own complete answer immediately and leads to signup', () => {
  for (let i = 0; i < 4; i++) {
    const demo = mount();
    assert.equal(demo.cta, undefined);
    assert.equal(demo.log.props['aria-live'], 'polite');
    assert(demo.chips.every(chip => !chip.props.disabled));
    demo.chips[i].props.onClick(); demo.render();
    assert.equal(demo.state.phase, 'complete');
    assert.equal(demo.state.answer, demo.exports.ORDIS_DEMO_PROMPTS[i].answer);
    assert(demo.chips.every(chip => chip.props.disabled && chip.props['aria-disabled']));
    assert.equal(demo.group.props.inert, true);
    assert.equal(demo.viewport.focused, true);
    assert.deepEqual(demo.events, [['demo_question_click', '/'], ['demo_completion', '/']]);
    demo.cta.props.onClick();
    assert.deepEqual(demo.routes, ['/signup?source=ordis-demo']);
    assert.deepEqual(demo.events.at(-1), ['signup_click', '/']);
  }
});
test('rapid clicks before React renders cannot overwrite the answer or double count events', () => {
  const demo = mount(), stale = demo.chips;
  stale[0].props.onClick(); stale[1].props.onClick(); demo.render();
  stale[2].props.onClick(); demo.render();
  assert.equal(demo.state.prompt.id, 'priorities');
  assert.equal(demo.events.length, 2);
});
