/**
 * Cursis E2E Test Suite Harness & Opaque HTTP Dispatcher
 * Provides:
 * - Next.js App Router environment shim (next/server, next/headers)
 * - Module resolution (@/ -> project root)
 * - TypeScript compilation on the fly
 * - In-memory store management and isolation
 * - Cryptographic session token generation
 * - Opaque HTTP client for requirement-driven endpoint testing
 */

const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../../..');

// Environment bootstrap
process.env.NODE_ENV = 'test';
process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_e2e_secret_key_minimum_32_characters_needed!';
process.env.SOVEREIGN_FOUNDER_EMAIL = process.env.SOVEREIGN_FOUNDER_EMAIL || 'founder@cursis.in';

// Module resolver for @/
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  if (name.startsWith('@/')) {
    return resolve.call(this, path.join(root, name.slice(2)), ...args);
  }
  return resolve.call(this, name, ...args);
};

// TypeScript on-the-fly compiler
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const code = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  module._compile(compiled, filename);
};

// Next.js & external service shims
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
      cookies: () => ({
        get: (key) => undefined,
        set: () => {},
        delete: () => {},
      }),
      headers: () => new Headers(),
    };
  }
  if (name === 'groq-sdk') {
    return class MockGroq {
      chat = {
        completions: {
          create: async () => ({
            choices: [{ message: { content: 'Mock Ordis Response' } }],
          }),
        },
      };
    };
  }
  if (name === 'firebase-admin') {
    return {
      auth: () => ({
        verifyIdToken: async (token) => ({
          uid: 'usr_firebase_mock',
          email: 'firebase@cursis.in',
          email_verified: true,
        }),
      }),
    };
  }
  if (name === 'resend') {
    return {
      Resend: class {
        emails = {
          send: async () => ({ id: 'mock_resend_email_id' }),
        };
      },
    };
  }
  if (name === 'jose') {
    return {
      createRemoteJWKSet: () => ({}),
      jwtVerify: async (token) => ({
        payload: {
          sub: 'usr_mock_jose',
          email: 'test@cursis.in',
          email_verified: true,
          displayName: 'Jose Mock User',
        },
      }),
      SignJWT: class {
        setProtectedHeader() { return this; }
        setIssuedAt() { return this; }
        setExpirationTime() { return this; }
        async sign() { return 'mock_signed_jwt'; }
      },
    };
  }
  return origLoad.apply(this, arguments);
};

// Mock MongoDB to enforce in-memory store fallback
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async () => null,
    getDb: async () => null,
    isMongoConnected: () => false,
  },
};

// Import stores and token generators
const { inMemoryStore } = require('@/lib/db/store');
const { inMemoryMemberships } = require('@/lib/db/memberships');
const { createSessionToken } = require('@/lib/auth/token');

// Standard Test Personas
const USERS = {
  ownerAlpha: {
    uid: 'usr_owner_alpha',
    email: 'owner@alpha.cursis.in',
    displayName: 'Alpha Owner',
    role: 'owner',
    workspaceId: 'ws_alpha',
  },
  adminAlpha: {
    uid: 'usr_admin_alpha',
    email: 'admin@alpha.cursis.in',
    displayName: 'Alpha Admin',
    role: 'admin',
    workspaceId: 'ws_alpha',
  },
  managerAlpha: {
    uid: 'usr_manager_alpha',
    email: 'manager@alpha.cursis.in',
    displayName: 'Alpha Manager',
    role: 'manager',
    workspaceId: 'ws_alpha',
  },
  memberAlpha: {
    uid: 'usr_member_alpha',
    email: 'member@alpha.cursis.in',
    displayName: 'Alpha Member',
    role: 'member',
    workspaceId: 'ws_alpha',
  },
  viewerAlpha: {
    uid: 'usr_viewer_alpha',
    email: 'viewer@alpha.cursis.in',
    displayName: 'Alpha Viewer',
    role: 'viewer',
    workspaceId: 'ws_alpha',
  },
  ownerBeta: {
    uid: 'usr_owner_beta',
    email: 'owner@beta.cursis.in',
    displayName: 'Beta Owner',
    role: 'owner',
    workspaceId: 'ws_beta',
  },
  memberBeta: {
    uid: 'usr_member_beta',
    email: 'member@beta.cursis.in',
    displayName: 'Beta Member',
    role: 'member',
    workspaceId: 'ws_beta',
  },
  founder: {
    uid: 'usr_founder',
    email: 'founder@cursis.in',
    displayName: 'Sovereign Founder',
    role: 'owner',
    workspaceId: 'ws_alpha',
  },
};

function getAuthToken(userKey) {
  const user = typeof userKey === 'string' ? USERS[userKey] : userKey;
  if (!user) throw new Error(`Unknown user key: ${userKey}`);
  return createSessionToken({
    ...user,
    createdAt: Date.now(),
  });
}

function resetStore() {
  // Clear all in-memory maps
  inMemoryStore.workspaces.clear();
  inMemoryStore.users.clear();
  inMemoryStore.tasks.clear();
  inMemoryStore.projects.clear();
  inMemoryStore.calendarEvents.clear();
  inMemoryStore.meetings.clear();
  inMemoryStore.documents.clear();
  inMemoryStore.departments.clear();
  inMemoryStore.automations.clear();
  inMemoryStore.leads.clear();
  inMemoryStore.deals.clear();
  inMemoryStore.contacts.clear();
  inMemoryStore.auditLogs.clear();
  inMemoryStore.ordisCards.clear();
  inMemoryStore.approvalQueue.clear();
  inMemoryStore.riskRadar.clear();
  inMemoryStore.simulations.clear();
  inMemoryStore.dynamicTools.clear();
  inMemoryStore.goalPlans.clear();
  inMemoryStore.companyBrain.clear();
  inMemoryStore.integrations.clear();
  inMemoryStore.agencyRequests.clear();
  inMemoryStore.agencyCatalog.clear();
  inMemoryMemberships.clear();

  // Seed Workspace Alpha (Tenant A)
  const now = new Date().toISOString();
  inMemoryStore.workspaces.set('ws_alpha', {
    id: 'ws_alpha',
    name: 'Alpha Enterprise Corp',
    slug: 'alpha-corp',
    tier: 'free',
    ordisMode: 'chill',
    industry: 'Technology',
    teamSize: '1-4',
    features: ['ordis', 'crm', 'tasks', 'docs'],
    settings: {
      ambientMonitoring: true,
      approvalRequiredForActions: true,
      simulationMode: false,
      riskTolerance: 'medium',
    },
    ownerId: USERS.ownerAlpha.uid,
    memberCount: 4,
    createdAt: now,
    updatedAt: now,
  });

  // Seed Workspace Beta (Tenant B)
  inMemoryStore.workspaces.set('ws_beta', {
    id: 'ws_beta',
    name: 'Beta Global Industries',
    slug: 'beta-corp',
    tier: 'pro',
    ordisMode: 'balanced',
    industry: 'Healthcare',
    teamSize: '1-4',
    features: ['ordis', 'crm'],
    settings: {
      ambientMonitoring: true,
      approvalRequiredForActions: true,
      simulationMode: false,
      riskTolerance: 'low',
    },
    ownerId: USERS.ownerBeta.uid,
    memberCount: 2,
    createdAt: now,
    updatedAt: now,
  });

  // Seed Memberships for Alpha
  inMemoryMemberships.set('ws_alpha_' + USERS.ownerAlpha.uid, {
    id: 'mem_owner_alpha',
    workspaceId: 'ws_alpha',
    userId: USERS.ownerAlpha.uid,
    role: 'owner',
    joinedAt: now,
  });
  inMemoryMemberships.set('ws_alpha_' + USERS.adminAlpha.uid, {
    id: 'mem_admin_alpha',
    workspaceId: 'ws_alpha',
    userId: USERS.adminAlpha.uid,
    role: 'admin',
    joinedAt: now,
  });
  inMemoryMemberships.set('ws_alpha_' + USERS.managerAlpha.uid, {
    id: 'mem_manager_alpha',
    workspaceId: 'ws_alpha',
    userId: USERS.managerAlpha.uid,
    role: 'manager',
    joinedAt: now,
  });
  inMemoryMemberships.set('ws_alpha_' + USERS.memberAlpha.uid, {
    id: 'mem_member_alpha',
    workspaceId: 'ws_alpha',
    userId: USERS.memberAlpha.uid,
    role: 'member',
    joinedAt: now,
  });
  inMemoryMemberships.set('ws_alpha_' + USERS.viewerAlpha.uid, {
    id: 'mem_viewer_alpha',
    workspaceId: 'ws_alpha',
    userId: USERS.viewerAlpha.uid,
    role: 'viewer',
    joinedAt: now,
  });

  // Seed Memberships for Beta
  inMemoryMemberships.set('ws_beta_' + USERS.ownerBeta.uid, {
    id: 'mem_owner_beta',
    workspaceId: 'ws_beta',
    userId: USERS.ownerBeta.uid,
    role: 'owner',
    joinedAt: now,
  });
  inMemoryMemberships.set('ws_beta_' + USERS.memberBeta.uid, {
    id: 'mem_member_beta',
    workspaceId: 'ws_beta',
    userId: USERS.memberBeta.uid,
    role: 'member',
    joinedAt: now,
  });
}

// Map from API route URL path pattern to file relative to repo root
const ROUTE_TABLE = [
  { pattern: /^\/api\/workspaces\/current$/, file: 'app/api/workspaces/current/route.ts' },
  { pattern: /^\/api\/workspaces\/switch$/, file: 'app/api/workspaces/switch/route.ts' },
  { pattern: /^\/api\/workspaces$/, file: 'app/api/workspaces/route.ts' },
  { pattern: /^\/api\/tasks\/([^/]+)$/, file: 'app/api/tasks/[id]/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/tasks$/, file: 'app/api/tasks/route.ts' },
  { pattern: /^\/api\/crm\/leads$/, file: 'app/api/crm/leads/route.ts' },
  { pattern: /^\/api\/crm\/deals$/, file: 'app/api/crm/deals/route.ts' },
  { pattern: /^\/api\/crm\/contacts$/, file: 'app/api/crm/contacts/route.ts' },
  { pattern: /^\/api\/crm\/renewals$/, file: 'app/api/crm/renewals/route.ts' },
  { pattern: /^\/api\/documents\/generate$/, file: 'app/api/documents/generate/route.ts' },
  { pattern: /^\/api\/documents$/, file: 'app/api/documents/route.ts' },
  { pattern: /^\/api\/meetings\/([^/]+)\/process$/, file: 'app/api/meetings/[id]/process/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/meetings\/([^/]+)$/, file: 'app/api/meetings/[id]/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/meetings$/, file: 'app/api/meetings/route.ts' },
  { pattern: /^\/api\/team\/([^/]+)$/, file: 'app/api/team/[id]/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/team$/, file: 'app/api/team/route.ts' },
  { pattern: /^\/api\/invitations\/([^/]+)\/accept$/, file: 'app/api/invitations/[id]/accept/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/invitations\/([^/]+)\/decline$/, file: 'app/api/invitations/[id]/decline/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/invitations$/, file: 'app/api/invitations/route.ts' },
  { pattern: /^\/api\/ordis\/approval-queue\/([^/]+)$/, file: 'app/api/ordis/approval-queue/[id]/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/ordis\/approval-queue$/, file: 'app/api/ordis/approval-queue/route.ts' },
  { pattern: /^\/api\/ordis\/external-action$/, file: 'app/api/ordis/external-action/route.ts' },
  { pattern: /^\/api\/ordis\/ambient-scan$/, file: 'app/api/ordis/ambient-scan/route.ts' },
  { pattern: /^\/api\/ordis\/audit$/, file: 'app/api/ordis/audit/route.ts' },
  { pattern: /^\/api\/ordis\/brain$/, file: 'app/api/ordis/brain/route.ts' },
  { pattern: /^\/api\/ordis\/build-tool$/, file: 'app/api/ordis/build-tool/route.ts' },
  { pattern: /^\/api\/ordis\/chat$/, file: 'app/api/ordis/chat/route.ts' },
  { pattern: /^\/api\/ordis\/conversations$/, file: 'app/api/ordis/conversations/route.ts' },
  { pattern: /^\/api\/ordis\/drafts$/, file: 'app/api/ordis/drafts/route.ts' },
  { pattern: /^\/api\/ordis\/execute$/, file: 'app/api/ordis/execute/route.ts' },
  { pattern: /^\/api\/auth\/login$/, file: 'app/api/auth/login/route.ts' },
  { pattern: /^\/api\/auth\/signup$/, file: 'app/api/auth/signup/route.ts' },
  { pattern: /^\/api\/auth\/session$/, file: 'app/api/auth/session/route.ts' },
  { pattern: /^\/api\/auth\/me$/, file: 'app/api/auth/me/route.ts' },
  { pattern: /^\/api\/automations\/([^/]+)\/execute$/, file: 'app/api/automations/[id]/execute/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/automations\/([^/]+)$/, file: 'app/api/automations/[id]/route.ts', paramKey: 'id' },
  { pattern: /^\/api\/automations$/, file: 'app/api/automations/route.ts' },
  { pattern: /^\/api\/integrations\/secret$/, file: 'app/api/integrations/secret/route.ts' },
  { pattern: /^\/api\/departments$/, file: 'app/api/departments/route.ts' },
  { pattern: /^\/api\/projects$/, file: 'app/api/projects/route.ts' },
];

/**
 * Dispatch an HTTP request to the designated route handler
 * @param {string} endpoint - Path e.g. '/api/tasks' or '/api/tasks?workspaceId=ws_alpha'
 * @param {object} options - { method, headers, body, user }
 */
async function apiCall(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(`http://localhost${endpoint}`);
  const pathname = urlObj.pathname;

  let matchedRoute = null;
  let params = {};
  for (const item of ROUTE_TABLE) {
    const match = pathname.match(item.pattern);
    if (match) {
      matchedRoute = item;
      if (item.paramKey && match[1]) {
        params[item.paramKey] = decodeURIComponent(match[1]);
      }
      break;
    }
  }

  if (!matchedRoute) {
    throw new Error(`[apiCall] No matching route found for: ${pathname}`);
  }

  const routeFilePath = path.join(root, matchedRoute.file);
  if (!fs.existsSync(routeFilePath)) {
    throw new Error(`[apiCall] Route file does not exist: ${routeFilePath}`);
  }

  const routeModule = require(routeFilePath);
  const handler = routeModule[method];
  if (!handler) {
    return {
      status: 405,
      ok: false,
      headers: new Headers(),
      json: async () => ({ error: `Method ${method} Not Allowed` }),
      text: async () => `Method ${method} Not Allowed`,
    };
  }

  // Construct headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('content-type') && options.body && typeof options.body === 'object') {
    headers.set('content-type', 'application/json');
  }

  // Attach auth if user passed
  if (options.user) {
    const token = typeof options.user === 'string' ? getAuthToken(options.user) : createSessionToken(options.user);
    headers.set('authorization', `Bearer ${token}`);
  }

  // Build Request
  const bodyString = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined;
  const requestInit = {
    method,
    headers,
  };
  if (method !== 'GET' && method !== 'HEAD' && bodyString !== undefined) {
    requestInit.body = bodyString;
  }

  const req = new Request(urlObj.toString(), requestInit);

  // Invoke route handler with params context
  const context = { params: Promise.resolve(params) };
  let response;
  try {
    response = await handler(req, context);
  } catch (err) {
    return {
      status: 500,
      ok: false,
      headers: new Headers(),
      json: async () => ({ success: false, error: err.message || 'Internal Server Error' }),
      text: async () => err.message || 'Internal Server Error',
    };
  }

  if (!response) {
    return {
      status: 204,
      ok: true,
      headers: new Headers(),
      json: async () => ({}),
      text: async () => '',
    };
  }

  const status = response.status || 200;
  const ok = status >= 200 && status < 300;
  const resHeaders = response.headers || new Headers();

  // Clone or capture body
  let cachedText = null;
  let cachedJson = null;

  return {
    status,
    ok,
    headers: resHeaders,
    async text() {
      if (cachedText === null) {
        cachedText = await response.text();
      }
      return cachedText;
    },
    async json() {
      if (cachedJson === null) {
        const txt = await this.text();
        try {
          cachedJson = JSON.parse(txt);
        } catch {
          cachedJson = { raw: txt };
        }
      }
      return cachedJson;
    },
  };
}

module.exports = {
  root,
  USERS,
  getAuthToken,
  resetStore,
  apiCall,
  inMemoryStore,
  inMemoryMemberships,
};
