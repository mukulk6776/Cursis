const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
class PrivacyError extends Error { constructor(message, status) { super(message); this.status = status; } }
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require: name => imports[name] || {}, console: { error() {}, warn() {} }, process: { env: { NODE_ENV: 'production' } },
  });
  return exports;
}
for (const route of ['login', 'signup', 'session']) {
  test(`${route} returns a safe 503 when durable account-status checks fail`, async () => {
    let sessions = 0;
    const response = (data, status) => ({ status, async json() { return data; } });
    const handler = load(`app/api/auth/${route}/route.ts`, {
      'next/server': { NextResponse: { json: (data, options) => response(data, options.status) } },
      '@/lib/api/response': { apiError: (error, status) => response({ error }, status) },
      '@/lib/auth/rateLimit': { getClientIP: () => 'test', checkRateLimit: async () => ({ allowed: true }) },
      '@/lib/privacy/config': { PRIVACY_VERSION: 'test' },
      '@/lib/privacy/core': { PrivacyError, privacyDb: async () => ({}), accountBlocked: async () => { throw new PrivacyError('Internal storage/key details', 503); } },
      '@/lib/db/users': { findUserByEmail: async () => null },
      '@/lib/auth/founder': { isFounderEmail: () => false },
      '@/lib/auth/session': { createSessionToken: () => { sessions++; } },
      '@/lib/auth/firebase-admin': { adminAuth: { verifyIdToken: async () => ({ uid: 'test', email: 'test@gmail.com', email_verified: true }) } },
    });
    const result = await handler.POST({ headers: new Headers(), json: async () => ({ email: 'test@gmail.com', password: 'Safe!Password42', idToken: 'google-test', privacyConsent: true, noticeVersion: 'test' }) });
    assert.equal(result.status, 503);
    const body = await result.json(); assert.equal(body.success, false); assert.equal(body.error, 'Sign-in is temporarily unavailable. Please try again shortly.');
    assert.equal(sessions, 0);
  });
}
