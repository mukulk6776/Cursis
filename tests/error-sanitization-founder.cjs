// tests/error-sanitization-founder.cjs
// Automated Regression Suite for Milestone 1: Error Sanitization & Sovereign Founder Parameterization
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const resolve = Module._resolveFilename;

Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};

require.extensions['.ts'] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );
};

// Next.js & external runtime shims
const origLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === 'next/server') {
    return {
      NextResponse: {
        json: (data, init) => Response.json(data, init),
        redirect: (url, init) => Response.redirect(url, init),
        next: () => new Response(null, { status: 200 }),
      },
      NextRequest: Request,
    };
  }
  if (name === 'next/headers') {
    return {
      cookies: async () => ({
        get: () => undefined,
        set: () => {},
        delete: () => {},
      }),
      headers: async () => new Headers(),
    };
  }
  return origLoad.apply(this, arguments);
};

// Mock MongoDB
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async () => null,
    getDb: async () => ({
      collection: () => ({
        findOne: async () => null,
        updateOne: async () => ({ modifiedCount: 1 }),
        deleteOne: async () => ({ deletedCount: 1 }),
        insertOne: async () => ({ insertedId: 'mock' }),
      }),
    }),
    isMongoConnected: () => false,
  },
};

// ---------------------------------------------------------------------------
// SUITE 1: Sovereign Founder Parameterization & Role Integrity
// ---------------------------------------------------------------------------
test('Sovereign Founder: Default fallback to mukulk3962364@gmail.com', () => {
  delete process.env.SOVEREIGN_FOUNDER_EMAIL;
  delete process.env.NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL;
  const { getSovereignFounderEmail, isFounderEmail, getAuthorizedRole, getAuthorizedTitle } = require('@/lib/auth/founder.ts');

  assert.equal(getSovereignFounderEmail(), 'mukulk3962364@gmail.com');
  assert.equal(isFounderEmail('mukulk3962364@gmail.com'), true);
  assert.equal(isFounderEmail('MUKULK3962364@GMAIL.COM'), true, 'Case-insensitive match');
  assert.equal(isFounderEmail('attacker@evil.com'), false);
  assert.equal(getAuthorizedRole('mukulk3962364@gmail.com'), 'owner');
  assert.equal(getAuthorizedTitle('mukulk3962364@gmail.com'), 'Founder & CEO');
});

test('Sovereign Founder: Dynamic parameterization via SOVEREIGN_FOUNDER_EMAIL', () => {
  process.env.SOVEREIGN_FOUNDER_EMAIL = 'enterprise-admin@company.com';
  const { getSovereignFounderEmail, isFounderEmail, getAuthorizedRole, getAuthorizedTitle } = require('@/lib/auth/founder.ts');

  assert.equal(getSovereignFounderEmail(), 'enterprise-admin@company.com');
  assert.equal(isFounderEmail('enterprise-admin@company.com'), true);
  assert.equal(isFounderEmail('ENTERPRISE-ADMIN@COMPANY.COM'), true, 'Case-insensitive override');
  assert.equal(isFounderEmail('mukulk3962364@gmail.com'), false, 'Previous default is no longer founder');
  assert.equal(getAuthorizedRole('enterprise-admin@company.com'), 'owner');
  assert.equal(getAuthorizedTitle('enterprise-admin@company.com'), 'Founder & CEO');

  // Usurpation prevention
  assert.equal(getAuthorizedRole('mukulk3962364@gmail.com', 'admin'), 'admin');
  assert.equal(getAuthorizedTitle('attacker@evil.com', 'Founder & CEO'), 'User');

  delete process.env.SOVEREIGN_FOUNDER_EMAIL;
});

// ---------------------------------------------------------------------------
// SUITE 2: apiError Sanitization & Correlation IDs
// ---------------------------------------------------------------------------
test('apiError: Redacts sensitive database connection strings and secrets in 500 responses', async () => {
  const { apiError } = require('@/lib/api/response.ts');

  const dangerousError = 'MongoServerError: connection error at mongodb+srv://app_user:SuperSecretPassword123@cluster0.abc.mongodb.net/prod';
  const response = apiError(dangerousError, 500);
  assert.equal(response.status, 500);

  const body = JSON.parse(await response.text());
  assert.equal(body.success, false);
  assert.equal(body.error, 'An unexpected internal error occurred. Please try again later.');
  assert.ok(body.correlationId, 'Must include correlationId for debugging');
  assert.ok(!JSON.stringify(body).includes('SuperSecretPassword123'), 'Never leaks passwords');
  assert.ok(!JSON.stringify(body).includes('cluster0.abc.mongodb.net'), 'Never leaks cluster hostnames');
});

// ---------------------------------------------------------------------------
// SUITE 3: Static AST / Regex Guard — Zero Raw error.message Disclosures
// ---------------------------------------------------------------------------
test('Static AST Guard: Zero routes in app/api return raw error.message via NextResponse.json', () => {
  const apiDir = path.join(root, 'app/api');
  function findRouteFiles(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(findRouteFiles(fullPath));
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        files.push(fullPath);
      }
    }
    return files;
  }

  const rawErrorPattern = /NextResponse\.json\(\s*\{\s*error:\s*error\.message/g;
  const violations = [];

  for (const file of findRouteFiles(apiDir)) {
    const content = fs.readFileSync(file, 'utf8');
    if (rawErrorPattern.test(content)) {
      violations.push(path.relative(root, file));
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Expected 0 routes disclosing raw error.message, but found violations in: ${violations.join(', ')}`
  );
});
