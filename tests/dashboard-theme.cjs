const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function environment(pathname, preference, systemDark = false, blocked = false) {
  const classes = new Set();
  const properties = new Map();
  const attributes = { 'data-density': 'compact' };
  const root = {
    dataset: {},
    setAttribute: (name, value) => { root.dataset[name.replace(/^data-/, '')] = value; },
    removeAttribute: name => delete attributes[name],
    classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
    style: { removeProperty: name => properties.delete(name) },
  };
  const events = [];
  const context = {
    exports: {}, document: { documentElement: root }, location: { pathname },
    localStorage: { getItem: () => { if (blocked) throw Error('denied'); return preference; }, setItem: (_, value) => { if (blocked) throw Error('denied'); preference = value; } },
    window: { location: { pathname }, matchMedia: () => ({ matches: systemDark }), dispatchEvent: event => events.push(event) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  };
  vm.createContext(context);
  vm.runInContext(ts.transpileModule(fs.readFileSync('lib/dashboard/theme.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return { context, theme: context.exports, root, properties, attributes, classes, events };
}

test('public pages always use light mode, including a saved dark preference and dark OS', () => {
  for (const path of ['/', '/about', '/login', '/signup', '/privacy', '/terms', '/dashboard-public']) {
    const env = environment(path, 'dark', true);
    vm.runInContext(env.theme.THEME_BOOTSTRAP, env.context);
    assert.equal(env.root.dataset.theme, 'light', path);
    env.theme.applyRouteTheme(path);
    assert.equal(env.root.dataset.dashboard, 'false');
    assert.equal(env.classes.has('dark'), false);
  }
});

test('dashboard and all nested pages respect light, dark, and system preferences before paint', () => {
  for (const path of ['/dashboard', '/dashboard/tasks', '/dashboard/w/acme/settings']) {
    for (const [preference, os, expected] of [['dark', false, 'dark'], ['light', true, 'light'], ['system', true, 'dark'], ['system', false, 'light'], [null, true, 'dark']]) {
      const env = environment(path, preference, os);
      vm.runInContext(env.theme.THEME_BOOTSTRAP, env.context);
      assert.equal(env.root.dataset.theme, expected);
      env.theme.applyRouteTheme(path);
      assert.equal(env.root.dataset.theme, expected);
      assert.equal(env.root.style.colorScheme, expected);
    }
  }
});

test('leaving the dashboard clears theme, density, and custom accents without erasing preference', () => {
  const env = environment('/dashboard/tasks', 'dark');
  env.properties.set('--c-brand', '#ff5500');
  env.theme.applyRouteTheme('/dashboard/tasks');
  assert.equal(env.root.dataset.theme, 'dark');
  env.theme.applyRouteTheme('/about');
  assert.equal(env.root.dataset.theme, 'light');
  assert.equal(env.properties.size, 0);
  assert.equal(env.attributes['data-density'], undefined);
  env.theme.applyRouteTheme('/dashboard/projects');
  assert.equal(env.root.dataset.theme, 'dark');
});

test('blocked storage does not break rendering or theme controls', () => {
  const env = environment('/dashboard', null, true, true);
  vm.runInContext(env.theme.THEME_BOOTSTRAP, env.context);
  assert.equal(env.root.dataset.theme, 'dark');
  env.theme.setDashboardTheme('light');
  assert.equal(env.root.dataset.theme, 'light');
  assert.equal(env.events[0].detail, 'light');
});

test('controller follows live system changes, cross-tab preference changes, and removes listeners', () => {
  const env = environment('/dashboard/tasks', 'system', false);
  const listeners = new Map();
  const mediaListeners = new Set();
  let dark = false;
  const system = { get matches() { return dark; }, addEventListener: (_, callback) => mediaListeners.add(callback), removeEventListener: (_, callback) => mediaListeners.delete(callback) };
  env.context.window.matchMedia = () => system;
  env.context.window.addEventListener = (name, callback) => listeners.set(name, callback);
  env.context.window.removeEventListener = name => listeners.delete(name);
  let cleanup;
  const module = { exports: {} };
  const requireMock = name => {
    if (name === 'react') return { useLayoutEffect: effect => { cleanup = effect(); } };
    if (name === 'next/navigation') return { usePathname: () => '/dashboard/tasks' };
    return env.theme;
  };
  const source = ts.transpileModule(fs.readFileSync('components/ThemeController.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInContext(`(function(require, exports){${source}\n})`, env.context)(requireMock, module.exports);
  module.exports.ThemeController();
  assert.equal(env.root.dataset.theme, 'light');
  dark = true;
  mediaListeners.forEach(callback => callback());
  assert.equal(env.root.dataset.theme, 'dark');
  env.context.localStorage.setItem('cursis_theme', 'light');
  listeners.get('storage')({ key: 'cursis_theme' });
  assert.equal(env.root.dataset.theme, 'light');
  dark = false;
  mediaListeners.forEach(callback => callback());
  assert.equal(env.root.dataset.theme, 'light');
  listeners.get(env.theme.THEME_EVENT)({ detail: 'dark' });
  assert.equal(env.root.dataset.theme, 'dark');
  cleanup();
  assert.equal(listeners.size, 0);
  assert.equal(mediaListeners.size, 0);
});
