const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, imports = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: name => imports[name],
    process: { env: { NEXT_PUBLIC_FIREBASE_API_KEY: 'test-key' } },
    console,
    setTimeout: (fn, delay) => setTimeout(fn, Math.min(delay, 10)),
    clearTimeout,
  });
  return module.exports;
}
const timeout = load('lib/auth/timeout.ts');
function authHelper(overrides = {}) {
  const auth = { currentUser: { getIdToken: () => { throw new Error('Must not reuse stale user'); } } };
  return load('lib/auth/firebase.ts', {
    './timeout': timeout,
    'firebase/app': { getApps: () => [], initializeApp: () => ({}) },
    'firebase/auth': {
      getAuth: () => auth,
      GoogleAuthProvider: class { addScope() {} setCustomParameters() {} },
      getRedirectResult: async () => null,
      ...overrides,
    },
  });
}

test('successful Google popup returns verified credentials', async () => {
  const helper = authHelper({ signInWithPopup: async () => ({ user: {
    uid: 'google-uid', email: 'user@gmail.com', displayName: 'User', photoURL: null,
    getIdToken: async () => 'firebase-token',
  } }) });
  const result = await helper.signInWithGoogle();
  assert.equal(result.idToken, 'firebase-token');
  assert.equal(result.uid, 'google-uid');
});
test('blocked popup gives retry guidance without starting a redirect', async () => {
  let redirects = 0;
  const helper = authHelper({
    signInWithPopup: async () => { throw { code: 'auth/popup-blocked' }; },
    signInWithRedirect: async () => { redirects++; },
  });
  await assert.rejects(helper.signInWithGoogle(), err => err.code === 'auth/popup-blocked' && /Allow popups/.test(err.message));
  assert.equal(redirects, 0);
});
test('popup cancellation preserves the Firebase error code', async () => {
  const helper = authHelper({ signInWithPopup: async () => { throw { code: 'auth/popup-closed-by-user' }; } });
  await assert.rejects(helper.signInWithGoogle(), err => err.code === 'auth/popup-closed-by-user');
});
test('stalled popup and ID token operations reject instead of loading forever', async () => {
  const never = () => new Promise(() => {});
  await assert.rejects(authHelper({ signInWithPopup: never }).signInWithGoogle(), /timed out/);
  await assert.rejects(authHelper({ signInWithPopup: async () => ({ user: { getIdToken: never } }) }).signInWithGoogle(), /verifying/);
});
test('redirect errors reach the UI and stale users do not trigger session exchange', async () => {
  assert.equal(await authHelper().handleGoogleRedirectResult(), null);
  const helper = authHelper({ getRedirectResult: async () => { throw new Error('Redirect blocked'); } });
  await assert.rejects(helper.handleGoogleRedirectResult(), /Redirect blocked/);
  await assert.rejects(authHelper({ getRedirectResult: () => new Promise(() => {}) }).handleGoogleRedirectResult(), /could not be restored/);
});
test('timeout wrapper passes through operation failures and success', async () => {
  assert.equal(await timeout.withAuthTimeout(Promise.resolve('ok'), 1000, 'timeout'), 'ok');
  await assert.rejects(timeout.withAuthTimeout(Promise.reject(new Error('provider failure')), 1000, 'timeout'), /provider failure/);
});
