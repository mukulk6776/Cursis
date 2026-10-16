const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('components/landing/OrdisSection.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

// Exercise the actual component handlers and effects with a deterministic hook/timer runtime.
function mount(reduced = false) {
  const slots = [], timers = new Map(), listeners = new Set(), routes = [];
  let cursor = 0, pending = [], tree, now = 0, timerId = 0;
  const viewport = { scrollTop: 0, scrollHeight: 800, focused: false, focus() { this.focused = true; } };
  const schedule = (callback, delay, repeat) => { const id = ++timerId; timers.set(id, { callback, due: now + delay, repeat }); return id; };
  const media = { get matches() { return reduced; }, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const hooks = {
    useReducer(reducer, initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { state: initial };
      return [slots[index].state, action => { slots[index].state = reducer(slots[index].state, action); }];
    },
    useRef(initial) { const index = cursor++; return slots[index] || (slots[index] = { current: initial }); },
    useEffect(create, deps) {
      const index = cursor++;
      const slot = slots[index] || (slots[index] = {});
      if (!slot.deps || deps.some((dep, i) => !Object.is(dep, slot.deps[i]))) pending.push({ slot, create, deps });
    },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: name => name === 'react' ? hooks : name === 'next/navigation' ? { useRouter: () => ({ push: route => routes.push(route) }) } : require(name),
    window: { matchMedia: () => media, setTimeout: (fn, ms) => schedule(fn, ms, 0), setInterval: (fn, ms) => schedule(fn, ms, ms), clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id) },
  });
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(n => nodes(n));
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props?.children)];
  }
  function render() {
    cursor = 0; pending = []; tree = exports.default();
    for (const node of nodes(tree)) if (node.props?.ref) node.props.ref.current = viewport;
    for (const { slot, create, deps } of pending) { slot.cleanup?.(); slot.deps = deps; slot.cleanup = create(); }
    return tree;
  }
  function advance(ms) {
    const until = now + ms;
    for (;;) {
      const next = [...timers].filter(([, value]) => value.due <= until).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      const [id, timer] = next; now = timer.due;
      if (timer.repeat) timer.due += timer.repeat; else timers.delete(id);
      timer.callback(); render();
    }
    now = until;
  }
  render();
  return { exports, render, advance, timers, listeners, routes, viewport,
    get state() { return slots[0].state; },
    get chips() { return nodes(tree).filter(node => node.props?.className === 'lp-ordis-demo-prompt'); },
    get promptGroup() { return nodes(tree).find(node => node.props?.className === 'lp-ordis-demo-prompts'); },
    get cta() { return nodes(tree).find(node => node.props?.className === 'lp-ordis-demo-cta'); },
    get log() { return nodes(tree).find(node => node.props?.role === 'log'); },
    reduceMotion() { reduced = true; listeners.forEach(fn => fn()); render(); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
  };
}

test('one-shot click locks every chip before rendering, streams after 700ms, then reveals signup CTA', () => {
  const demo = mount();
  assert.equal(demo.state.phase, 'idle');
  assert.equal(demo.log.props['aria-live'], 'polite');
  assert.equal(demo.log.props.tabIndex, 0);
  assert.equal(demo.chips.length, 4);
  assert(demo.chips.every(chip => chip.props.disabled === false));
  assert.equal(demo.cta, undefined);
  const staleChips = demo.chips;
  staleChips[0].props.onClick();
  staleChips[1].props.onClick(); // Same event turn: the ref must reject this submission.
  demo.render();
  assert.equal(demo.state.prompt.id, 'priorities');
  assert.equal(demo.state.phase, 'typing');
  assert.equal(demo.viewport.focused, true);
  assert.equal(demo.promptGroup.props['aria-hidden'], true);
  assert.equal(demo.promptGroup.props.inert, true);
  assert(demo.chips.every(chip => chip.props.disabled && chip.props['aria-disabled']));
  assert.equal(demo.cta, undefined);
  demo.advance(699);
  assert.equal(demo.state.phase, 'typing');
  demo.advance(1);
  assert.equal(demo.state.phase, 'streaming');
  demo.advance(24);
  assert.equal(demo.state.answer.length, 4);
  assert.equal(demo.cta, undefined);
  assert.equal(demo.viewport.scrollTop, demo.viewport.scrollHeight);
  demo.advance(10000);
  assert.equal(demo.state.phase, 'complete');
  assert.equal(demo.state.answer, demo.state.prompt.answer);
  assert(demo.chips.every(chip => chip.props.disabled));
  assert.equal(demo.timers.size, 0);
  assert.equal(demo.listeners.size, 0);
  assert.equal(demo.promptGroup.props['aria-hidden'], true);
  assert.equal(demo.cta.type, 'button');
  demo.cta.props.onClick();
  assert.deepEqual(demo.routes, ['/signup']);
  staleChips[2].props.onClick(); demo.render();
  assert.equal(demo.state.prompt.id, 'priorities');
});

test('every prompt maps to its own full answer instantly with reduced motion and no timers', () => {
  for (let i = 0; i < 4; i++) {
    const demo = mount(true);
    demo.chips[i].props.onClick(); demo.render();
    const expected = demo.exports.ORDIS_DEMO_PROMPTS[i];
    assert.equal(demo.state.prompt.id, expected.id);
    assert.equal(demo.state.answer, expected.answer);
    assert.equal(demo.state.phase, 'complete');
    assert(demo.cta);
    assert.equal(demo.timers.size, 0);
  }
});

test('switching to reduced motion finishes an active response and cancels work', () => {
  for (const delay of [0, 750]) {
    const demo = mount(); demo.chips[0].props.onClick(); demo.render(); demo.advance(delay);
    demo.reduceMotion();
    assert.equal(demo.state.phase, 'complete');
    assert.equal(demo.state.answer, demo.state.prompt.answer);
    assert.equal(demo.timers.size, 0);
    assert.equal(demo.listeners.size, 0);
  }
});

test('unmount during typing or streaming clears timers and motion listeners', () => {
  for (const delay of [0, 750]) {
    const demo = mount(); demo.chips[0].props.onClick(); demo.render(); demo.advance(delay);
    assert.equal(demo.timers.size, 1);
    demo.unmount();
    assert.equal(demo.timers.size, 0);
    assert.equal(demo.listeners.size, 0);
    const previous = demo.state;
    demo.advance(10000);
    assert.equal(demo.state, previous);
  }
});
