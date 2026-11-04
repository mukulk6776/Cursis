// tests/adversarial-tenant-isolation.cjs
// Milestone 1 Challenger 1: Adversarial Stress Testing — CRM & Multi-Tenant Query Isolation
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
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
        json: (data, init) => {
          const status = init?.status || 200;
          const headers = new Headers(init?.headers);
          headers.set('content-type', 'application/json');
          return new Response(JSON.stringify(data), { status, headers });
        },
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
  if (name === 'resend') {
    return {
      Resend: class {
        emails = { send: async () => ({ id: 'mock_resend_id' }) };
      },
    };
  }
  if (name === 'groq-sdk') {
    return class MockGroq {
      chat = { completions: { create: async () => ({ choices: [{ message: { content: 'Mock' } }] }) } };
    };
  }
  if (name === 'firebase-admin') {
    return {
      auth: () => ({
        verifyIdToken: async () => ({ uid: 'usr_mock', email: 'mock@cursis.in' }),
      }),
    };
  }
  if (name === 'jose') {
    return {
      createRemoteJWKSet: () => ({}),
      jwtVerify: async () => ({ payload: { sub: 'usr_mock', email: 'mock@cursis.in' } }),
      SignJWT: class {
        setProtectedHeader() { return this; }
        setIssuedAt() { return this; }
        setExpirationTime() { return this; }
        async sign() { return 'mock_jwt'; }
      },
    };
  }
  return origLoad.apply(this, arguments);
};

// Dynamic current user session mock
let currentAuthUser = null;
require.cache[path.join(root, 'lib/auth/session.ts')] = {
  id: path.join(root, 'lib/auth/session.ts'),
  filename: path.join(root, 'lib/auth/session.ts'),
  loaded: true,
  exports: {
    getAuthenticatedUser: async () => currentAuthUser,
    isSessionRevoked: async () => false,
    createSessionToken: () => 'mock_token',
    verifySessionToken: () => currentAuthUser,
    isSessionTokenValid: () => true,
    SESSION_SECRET: 'test-secret',
  },
};

// Intercepting MongoDB Mock
let mongoCalls = [];
const mongoDbMock = {
  getCollection: async (name) => ({
    findOne: async (query) => {
      mongoCalls.push({ op: 'findOne', col: name, query });
      return null;
    },
    updateOne: async (filter, update, options) => {
      mongoCalls.push({ op: 'updateOne', col: name, filter, update, options });
      return { modifiedCount: 1, matchedCount: 1 };
    },
    deleteOne: async (filter) => {
      mongoCalls.push({ op: 'deleteOne', col: name, filter });
      return { deletedCount: 1 };
    },
    insertOne: async (doc) => {
      mongoCalls.push({ op: 'insertOne', col: name, doc });
      return { insertedId: 'mock_inserted_id' };
    },
    find: (query) => {
      const cursor = {
        sort: () => cursor,
        toArray: async () => {
          mongoCalls.push({ op: 'find', col: name, query });
          return [];
        },
      };
      return cursor;
    },
  }),
  getDb: async () => ({
    collection: (name) => ({
      findOne: async (query) => {
        mongoCalls.push({ op: 'findOne', col: name, query });
        return null;
      },
      updateOne: async (filter, update, options) => {
        mongoCalls.push({ op: 'updateOne', col: name, filter, update, options });
        return { modifiedCount: 1, matchedCount: 1 };
      },
      deleteOne: async (filter) => {
        mongoCalls.push({ op: 'deleteOne', col: name, filter });
        return { deletedCount: 1 };
      },
    }),
  }),
  isMongoConnected: () => false,
};

require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: mongoDbMock,
};

const { inMemoryStore } = require('@/lib/db/store');
const { inMemoryMemberships } = require('@/lib/db/memberships');

// DB functions
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  scanClientRenewals,
} = require('@/lib/db/crm');

const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  generateDocumentFromPrompt,
} = require('@/lib/db/documents');

const {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  processMeetingWithOrdis,
} = require('@/lib/db/meetings');

const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('@/lib/db/projects');

// Route handlers
const leadsRoute = require('@/app/api/crm/leads/route.ts');
const dealsRoute = require('@/app/api/crm/deals/route.ts');
const contactsRoute = require('@/app/api/crm/contacts/route.ts');
const renewalsRoute = require('@/app/api/crm/renewals/route.ts');
const documentsRoute = require('@/app/api/documents/route.ts');
const docGenerateRoute = require('@/app/api/documents/generate/route.ts');
const meetingsRoute = require('@/app/api/meetings/route.ts');
const meetingIdRoute = require('@/app/api/meetings/[id]/route.ts');
const meetingProcessRoute = require('@/app/api/meetings/[id]/process/route.ts');
const projectsRoute = require('@/app/api/projects/route.ts');
const projectIdRoute = require('@/app/api/projects/[id]/route.ts');

// Test Environment Fixtures
const WS_VICTIM = 'ws_victim_enterprise';
const WS_ATTACKER = 'ws_attacker_adversary';

const UID_VICTIM_OWNER = 'usr_victim_owner';
const UID_ATTACKER = 'usr_attacker_agent';

inMemoryStore.workspaces.set(WS_VICTIM, {
  id: WS_VICTIM,
  name: 'Victim Enterprise Workspace',
  ownerId: UID_VICTIM_OWNER,
  settings: { companyTone: 'Strict' },
});

inMemoryStore.workspaces.set(WS_ATTACKER, {
  id: WS_ATTACKER,
  name: 'Attacker Workspace',
  ownerId: UID_ATTACKER,
  settings: { companyTone: 'Hostile' },
});

inMemoryMemberships.set(`${WS_VICTIM}_${UID_VICTIM_OWNER}`, {
  id: 'm_victim_owner',
  workspaceId: WS_VICTIM,
  userId: UID_VICTIM_OWNER,
  role: 'owner',
});

inMemoryMemberships.set(`${WS_ATTACKER}_${UID_ATTACKER}`, {
  id: 'm_attacker_owner',
  workspaceId: WS_ATTACKER,
  userId: UID_ATTACKER,
  role: 'owner',
});

function asAttacker() {
  currentAuthUser = {
    uid: UID_ATTACKER,
    email: 'attacker@threat-actor.org',
    displayName: 'Attacker',
    role: 'owner',
    workspaceId: WS_ATTACKER,
  };
}

function asVictim() {
  currentAuthUser = {
    uid: UID_VICTIM_OWNER,
    email: 'owner@victim-corp.com',
    displayName: 'Victim Owner',
    role: 'owner',
    workspaceId: WS_VICTIM,
  };
}

// =========================================================================
// SUITE 1: Route-Level Spoofed workspaceId Rejection
// =========================================================================
test('ADVERSARIAL: Full-stack route rejection on spoofed workspaceId in bodies, params, & headers', async () => {
  asAttacker();

  // 1. Leads GET with spoofed workspaceId
  const getLeadsReq = new Request(`http://localhost/api/crm/leads?workspaceId=${WS_VICTIM}`, {
    method: 'GET',
    headers: { 'x-workspace-id': WS_VICTIM },
  });
  const getLeadsRes = await leadsRoute.GET(getLeadsReq);
  assert.equal(getLeadsRes.status, 403, 'GET /api/crm/leads with victim workspaceId must return 403');

  // 2. Leads POST with spoofed workspaceId in body
  const postLeadReq = new Request('http://localhost/api/crm/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-workspace-id': WS_VICTIM },
    body: JSON.stringify({
      workspaceId: WS_VICTIM,
      name: 'Trojan Infiltration Lead',
      company: 'Trojan LLC',
      email: 'trojan@evil.com',
    }),
  });
  const postLeadRes = await leadsRoute.POST(postLeadReq);
  assert.equal(postLeadRes.status, 403, 'POST /api/crm/leads with victim workspaceId in body must return 403');

  // 3. Deals GET & POST with spoofed workspaceId
  const getDealsReq = new Request(`http://localhost/api/crm/deals?workspaceId=${WS_VICTIM}`);
  const getDealsRes = await dealsRoute.GET(getDealsReq);
  assert.equal(getDealsRes.status, 403, 'GET /api/crm/deals with victim workspaceId must return 403');

  const postDealReq = new Request('http://localhost/api/crm/deals', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: WS_VICTIM, title: 'Malicious Deal', company: 'Target Co' }),
  });
  const postDealRes = await dealsRoute.POST(postDealReq);
  assert.equal(postDealRes.status, 403, 'POST /api/crm/deals with victim workspaceId must return 403');

  // 4. Contacts GET & POST with spoofed workspaceId
  const getContactsReq = new Request(`http://localhost/api/crm/contacts?workspaceId=${WS_VICTIM}`);
  const getContactsRes = await contactsRoute.GET(getContactsReq);
  assert.equal(getContactsRes.status, 403, 'GET /api/crm/contacts with victim workspaceId must return 403');

  const postContactReq = new Request('http://localhost/api/crm/contacts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: WS_VICTIM, name: 'Spy Contact', company: 'Target Co' }),
  });
  const postContactRes = await contactsRoute.POST(postContactReq);
  assert.equal(postContactRes.status, 403, 'POST /api/crm/contacts with victim workspaceId must return 403');

  // 5. CRM Renewals with spoofed workspaceId
  const renewalsReq = new Request('http://localhost/api/crm/renewals', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: WS_VICTIM }),
  });
  const renewalsRes = await renewalsRoute.POST(renewalsReq);
  assert.equal(renewalsRes.status, 403, 'POST /api/crm/renewals with victim workspaceId must return 403');

  // 6. Documents GET & POST with spoofed workspaceId
  const getDocsReq = new Request(`http://localhost/api/documents?workspaceId=${WS_VICTIM}`);
  const getDocsRes = await documentsRoute.GET(getDocsReq);
  assert.equal(getDocsRes.status, 403, 'GET /api/documents with victim workspaceId must return 403');

  const postDocReq = new Request('http://localhost/api/documents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: WS_VICTIM, title: 'Malicious Document' }),
  });
  const postDocRes = await documentsRoute.POST(postDocReq);
  assert.equal(postDocRes.status, 403, 'POST /api/documents with victim workspaceId must return 403');

  // 7. Meetings GET & POST with spoofed workspaceId
  const getMeetingsReq = new Request(`http://localhost/api/meetings?workspaceId=${WS_VICTIM}`);
  const getMeetingsRes = await meetingsRoute.GET(getMeetingsReq);
  assert.equal(getMeetingsRes.status, 403, 'GET /api/meetings with victim workspaceId must return 403');

  const postMeetingReq = new Request('http://localhost/api/meetings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: WS_VICTIM, title: 'Spying Session' }),
  });
  const postMeetingRes = await meetingsRoute.POST(postMeetingReq);
  assert.equal(postMeetingRes.status, 403, 'POST /api/meetings with victim workspaceId must return 403');

  // 8. Projects GET & POST with spoofed workspaceId
  const getProjectsReq = new Request(`http://localhost/api/projects?workspaceId=${WS_VICTIM}`);
  const getProjectsRes = await projectsRoute.GET(getProjectsReq);
  assert.equal(getProjectsRes.status, 403, 'GET /api/projects with victim workspaceId must return 403');

  const postProjectReq = new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId: WS_VICTIM, name: 'Hijacked Project' }),
  });
  const postProjectRes = await projectsRoute.POST(postProjectReq);
  assert.equal(postProjectRes.status, 403, 'POST /api/projects with victim workspaceId must return 403');
});

// =========================================================================
// SUITE 2: Target Entity ID Guessing & Cross-Workspace Access Attempts
// =========================================================================
test('ADVERSARIAL: Target Entity ID Guessing and Cross-Workspace Mutation Hijacking', async () => {
  // Create victim entities in WS_VICTIM
  const victimLead = await createLead(WS_VICTIM, {
    name: 'Top Secret Prospect',
    company: 'Fortune 50 Corp',
    email: 'secret@fortune50.com',
  });
  const victimDeal = await createDeal(WS_VICTIM, {
    title: 'Multi-Million Dollar Deal',
    value: 5000000,
  });
  const victimContact = await createContact(WS_VICTIM, {
    name: 'Executive Contact',
    company: 'Fortune 50 Corp',
    email: 'exec@fortune50.com',
  });
  const victimDoc = await createDocument(WS_VICTIM, {
    title: 'Secret Financial Ledger',
    content: 'Unreleased Q4 projections',
  });
  const victimMeeting = await createMeeting(WS_VICTIM, {
    title: 'Closed-Door Merger Negotiation',
  });
  const victimProject = await createProject(WS_VICTIM, {
    name: 'Stealth Acquisition',
  });

  // Switch context to Attacker
  asAttacker();

  // 1. Direct DB cross-workspace access attempts
  assert.equal(await getLeadById(victimLead.id, WS_ATTACKER), null);
  assert.equal(await getDealById(victimDeal.id, WS_ATTACKER), null);
  assert.equal(await getContactById(victimContact.id, WS_ATTACKER), null);
  assert.equal(await getDocumentById(victimDoc.id, WS_ATTACKER), null);
  assert.equal(await getMeetingById(victimMeeting.id, WS_ATTACKER), null);
  assert.equal(await getProjectById(victimProject.id, WS_ATTACKER), null);

  assert.equal(await updateLead(victimLead.id, { name: 'Pwned' }, WS_ATTACKER), null);
  assert.equal(await updateDeal(victimDeal.id, { title: 'Pwned' }, WS_ATTACKER), null);
  assert.equal(await updateContact(victimContact.id, { name: 'Pwned' }, WS_ATTACKER), null);
  assert.equal(await updateDocument(victimDoc.id, { title: 'Pwned' }, WS_ATTACKER), null);
  assert.equal(await updateMeeting(victimMeeting.id, { title: 'Pwned' }, WS_ATTACKER), null);
  assert.equal(await updateProject(victimProject.id, { name: 'Pwned' }, WS_ATTACKER), null);

  assert.equal(await deleteLead(victimLead.id, WS_ATTACKER), false);
  assert.equal(await deleteDeal(victimDeal.id, WS_ATTACKER), false);
  assert.equal(await deleteContact(victimContact.id, WS_ATTACKER), false);
  assert.equal(await deleteDocument(victimDoc.id, WS_ATTACKER), false);
  assert.equal(await deleteMeeting(victimMeeting.id, WS_ATTACKER), false);
  assert.equal(await deleteProject(victimProject.id, WS_ATTACKER), false);

  await assert.rejects(
    async () => {
      await processMeetingWithOrdis(victimMeeting.id, WS_ATTACKER);
    },
    /Meeting not found in active workspace/
  );

  // 2. HTTP Route cross-workspace mutation attempts using guessed victim IDs
  // PATCH /api/crm/leads with victim's lead ID
  const patchLeadReq = new Request('http://localhost/api/crm/leads', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: victimLead.id, company: 'Ransomed LLC', workspaceId: WS_ATTACKER }),
  });
  const patchLeadRes = await leadsRoute.PATCH(patchLeadReq);
  assert.ok(
    patchLeadRes.status === 403 || patchLeadRes.status === 404,
    `PATCH lead cross-tenant must be 403 or 404, got ${patchLeadRes.status}`
  );

  // PATCH /api/documents with victim's doc ID
  const patchDocReq = new Request('http://localhost/api/documents', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: victimDoc.id, title: 'Defaced Ledger' }),
  });
  const patchDocRes = await documentsRoute.PATCH(patchDocReq);
  assert.equal(patchDocRes.status, 403, 'PATCH /api/documents with victim doc ID must return 403');

  // DELETE /api/documents with victim's doc ID
  const deleteDocReq = new Request(`http://localhost/api/documents?id=${victimDoc.id}`, {
    method: 'DELETE',
  });
  const deleteDocRes = await documentsRoute.DELETE(deleteDocReq);
  assert.equal(deleteDocRes.status, 403, 'DELETE /api/documents with victim doc ID must return 403');

  // PATCH /api/meetings with victim's meeting ID
  const patchMeetingReq = new Request('http://localhost/api/meetings', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: victimMeeting.id, title: 'Defaced Meeting' }),
  });
  const patchMeetingRes = await meetingsRoute.PATCH(patchMeetingReq);
  assert.equal(patchMeetingRes.status, 403, 'PATCH /api/meetings with victim meeting ID must return 403');

  // DELETE /api/meetings with victim's meeting ID
  const deleteMeetingReq = new Request(`http://localhost/api/meetings?id=${victimMeeting.id}`, {
    method: 'DELETE',
  });
  const deleteMeetingRes = await meetingsRoute.DELETE(deleteMeetingReq);
  assert.equal(deleteMeetingRes.status, 403, 'DELETE /api/meetings with victim meeting ID must return 403');

  // GET /api/meetings/[id]
  const getMeetingIdRes = await meetingIdRoute.GET(
    new Request(`http://localhost/api/meetings/${victimMeeting.id}`),
    { params: Promise.resolve({ id: victimMeeting.id }) }
  );
  assert.equal(getMeetingIdRes.status, 403, 'GET /api/meetings/[id] on victim meeting must return 403');

  // PATCH /api/meetings/[id]
  const patchMeetingIdRes = await meetingIdRoute.PATCH(
    new Request(`http://localhost/api/meetings/${victimMeeting.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Hijacked' }),
    }),
    { params: Promise.resolve({ id: victimMeeting.id }) }
  );
  assert.equal(patchMeetingIdRes.status, 403, 'PATCH /api/meetings/[id] on victim meeting must return 403');

  // DELETE /api/meetings/[id]
  const deleteMeetingIdRes = await meetingIdRoute.DELETE(
    new Request(`http://localhost/api/meetings/${victimMeeting.id}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id: victimMeeting.id }) }
  );
  assert.equal(deleteMeetingIdRes.status, 403, 'DELETE /api/meetings/[id] on victim meeting must return 403');

  // POST /api/meetings/[id]/process
  const processMeetingRes = await meetingProcessRoute.POST(
    new Request(`http://localhost/api/meetings/${victimMeeting.id}/process`, { method: 'POST' }),
    { params: Promise.resolve({ id: victimMeeting.id }) }
  );
  assert.equal(processMeetingRes.status, 403, 'POST /api/meetings/[id]/process on victim meeting must return 403');

  // GET /api/projects/[id]
  const getProjectIdRes = await projectIdRoute.GET(
    new Request(`http://localhost/api/projects/${victimProject.id}`),
    { params: Promise.resolve({ id: victimProject.id }) }
  );
  assert.equal(getProjectIdRes.status, 403, 'GET /api/projects/[id] on victim project must return 403');

  // PATCH /api/projects/[id]
  const patchProjectIdRes = await projectIdRoute.PATCH(
    new Request(`http://localhost/api/projects/${victimProject.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Hijacked Project' }),
    }),
    { params: Promise.resolve({ id: victimProject.id }) }
  );
  assert.equal(patchProjectIdRes.status, 403, 'PATCH /api/projects/[id] on victim project must return 403');

  // DELETE /api/projects/[id]
  const deleteProjectIdRes = await projectIdRoute.DELETE(
    new Request(`http://localhost/api/projects/${victimProject.id}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id: victimProject.id }) }
  );
  assert.equal(deleteProjectIdRes.status, 403, 'DELETE /api/projects/[id] on victim project must return 403');

  // Verify victim records are completely intact
  const verifiedLead = inMemoryStore.leads.get(victimLead.id);
  assert.equal(verifiedLead.name, 'Top Secret Prospect');
  assert.equal(verifiedLead.company, 'Fortune 50 Corp');

  const verifiedDoc = inMemoryStore.documents.get(victimDoc.id);
  assert.equal(verifiedDoc.title, 'Secret Financial Ledger');

  const verifiedMeeting = inMemoryStore.meetings.get(victimMeeting.id);
  assert.equal(verifiedMeeting.title, 'Closed-Door Merger Negotiation');

  const verifiedProject = inMemoryStore.projects.get(victimProject.id);
  assert.equal(verifiedProject.name, 'Stealth Acquisition');
});

// =========================================================================
// SUITE 3: NoSQL Injection Key Fuzzing & Operator Defense
// =========================================================================
test('ADVERSARIAL: Comprehensive NoSQL Operator & Key Injection Defense', async () => {
  asAttacker();
  const testLead = await createLead(WS_ATTACKER, { name: 'Attacker Lead', email: 'att@evil.com' });
  const testDeal = await createDeal(WS_ATTACKER, { title: 'Attacker Deal' });
  const testContact = await createContact(WS_ATTACKER, { name: 'Attacker Contact' });
  const testDoc = await createDocument(WS_ATTACKER, { title: 'Attacker Doc' });
  const testMeeting = await createMeeting(WS_ATTACKER, { title: 'Attacker Meeting' });
  const testProject = await createProject(WS_ATTACKER, { name: 'Attacker Project' });

  const adversarialPayloads = [
    { '$gt': '' },
    { '$ne': null },
    { '$regex': '.*' },
    { '$where': 'this.workspaceId === "ws_victim"' },
    { '$exists': true },
    { '$expr': { '$gt': [ '$budget', 0 ] } },
    { '$or': [{ 'role': 'owner' }] },
    { '$set': { 'workspaceId': WS_VICTIM } },
    { '$unset': { 'workspaceId': 1 } },
    { '$rename': { 'name': 'renamed' } },
    { 'role.$': 'owner' },
    { 'user.permissions': 'superadmin' },
    { 'settings.theme.nested': 'hacked' },
    { '__proto__.polluted': true },
    { 'constructor.prototype.pwned': true },
  ];

  for (const payload of adversarialPayloads) {
    mongoCalls = [];

    // Lead
    await assert.rejects(
      async () => updateLead(testLead.id, payload, WS_ATTACKER),
      /Invalid lead update field/,
      `updateLead must reject payload: ${JSON.stringify(payload)}`
    );

    // Deal
    await assert.rejects(
      async () => updateDeal(testDeal.id, payload, WS_ATTACKER),
      /Invalid deal update field/,
      `updateDeal must reject payload: ${JSON.stringify(payload)}`
    );

    // Contact
    await assert.rejects(
      async () => updateContact(testContact.id, payload, WS_ATTACKER),
      /Invalid contact update field/,
      `updateContact must reject payload: ${JSON.stringify(payload)}`
    );

    // Document
    await assert.rejects(
      async () => updateDocument(testDoc.id, payload, WS_ATTACKER),
      /Invalid document update field/,
      `updateDocument must reject payload: ${JSON.stringify(payload)}`
    );

    // Meeting
    await assert.rejects(
      async () => updateMeeting(testMeeting.id, payload, WS_ATTACKER),
      /Invalid meeting update field/,
      `updateMeeting must reject payload: ${JSON.stringify(payload)}`
    );

    // Project
    await assert.rejects(
      async () => updateProject(testProject.id, payload, WS_ATTACKER),
      /Invalid project update field/,
      `updateProject must reject payload: ${JSON.stringify(payload)}`
    );

    // Verify 0 MongoDB update calls executed for rejected payloads
    const dangerousCalls = mongoCalls.filter(c => c.op === 'updateOne');
    assert.equal(dangerousCalls.length, 0, 'No MongoDB updateOne may execute on malicious keys');
  }
});

// =========================================================================
// SUITE 4: Dynamic Randomized Payload Fuzzer & Boundary Invariants
// =========================================================================
test('ADVERSARIAL: Generative Randomized Payload Fuzzer maintains tenant boundary invariants', async () => {
  asAttacker();
  const lead = await createLead(WS_ATTACKER, { name: 'Fuzz Lead', company: 'Fuzz Inc' });
  const doc = await createDocument(WS_ATTACKER, { title: 'Fuzz Doc' });

  const candidateKeys = [
    'name', 'title', 'company', 'budget', 'workspaceId', '_id', 'id', 'createdAt',
    '$malicious', 'nested.key', '__proto__', 'status', 'value', 'tags'
  ];

  const candidateValues = [
    WS_VICTIM, null, undefined, '', 12345, true, false, ['a', 'b'], { nested: true },
    'A'.repeat(5000), '\0nullbyte', '$gt', {}
  ];

  for (let i = 0; i < 50; i++) {
    // Generate random mutation payload
    const payload = {};
    const keyCount = Math.floor(Math.random() * 4) + 1;
    for (let k = 0; k < keyCount; k++) {
      const randomKey = candidateKeys[Math.floor(Math.random() * candidateKeys.length)];
      const randomVal = candidateValues[Math.floor(Math.random() * candidateValues.length)];
      payload[randomKey] = randomVal;
    }

    const hasInjectionKey = Object.keys(payload).some(k => k.includes('.') || k.startsWith('$'));

    mongoCalls = [];
    if (hasInjectionKey) {
      await assert.rejects(async () => updateLead(lead.id, payload, WS_ATTACKER));
      await assert.rejects(async () => updateDocument(doc.id, payload, WS_ATTACKER));
    } else {
      const updatedLead = await updateLead(lead.id, payload, WS_ATTACKER);
      const updatedDoc = await updateDocument(doc.id, payload, WS_ATTACKER);

      if (updatedLead) {
        assert.equal(updatedLead.workspaceId, WS_ATTACKER, 'Lead workspaceId invariant violated');
        assert.equal(updatedLead.id, lead.id, 'Lead id invariant violated');
      }

      if (updatedDoc) {
        assert.equal(updatedDoc.workspaceId, WS_ATTACKER, 'Doc workspaceId invariant violated');
        assert.equal(updatedDoc.id, doc.id, 'Doc id invariant violated');
      }

      // Check all MongoDB update calls adhere to invariants
      for (const call of mongoCalls.filter(c => c.op === 'updateOne')) {
        assert.equal(call.filter.workspaceId, WS_ATTACKER, 'Mongo update filter workspaceId must match target');
        assert.ok(!call.options?.upsert, 'Upsert must NEVER be enabled on updates');
      }
    }
  }
});

// =========================================================================
// SUITE 5: Concurrent Race Condition Stress Harness
// =========================================================================
test('ADVERSARIAL: 30 concurrent async mutations preserve data consistency and isolation', async () => {
  asAttacker();
  const lead = await createLead(WS_ATTACKER, { name: 'Concurrent Lead', company: 'Base Co' });
  const doc = await createDocument(WS_ATTACKER, { title: 'Concurrent Doc' });

  const updatePromises = [];
  for (let i = 0; i < 30; i++) {
    const isEvil = i % 5 === 0;
    const leadPayload = isEvil
      ? { company: `Co_${i}`, workspaceId: WS_VICTIM, id: 'hacked_id' }
      : { company: `Company_Update_${i}` };

    const docPayload = isEvil
      ? { title: `Doc_${i}`, workspaceId: WS_VICTIM, authorId: 'evil_author' }
      : { title: `Document_Update_${i}` };

    updatePromises.push(updateLead(lead.id, leadPayload, WS_ATTACKER));
    updatePromises.push(updateDocument(doc.id, docPayload, WS_ATTACKER));
  }

  const results = await Promise.all(updatePromises);
  assert.equal(results.length, 60, 'All 60 concurrent updates must resolve');

  // Verify memory store integrity
  const finalLead = inMemoryStore.leads.get(lead.id);
  assert.equal(finalLead.workspaceId, WS_ATTACKER, 'Concurrent mutation broke lead workspaceId');
  assert.equal(finalLead.id, lead.id, 'Concurrent mutation broke lead id');

  const finalDoc = inMemoryStore.documents.get(doc.id);
  assert.equal(finalDoc.workspaceId, WS_ATTACKER, 'Concurrent mutation broke document workspaceId');
  assert.equal(finalDoc.id, doc.id, 'Concurrent mutation broke document id');
});

// =========================================================================
// SUITE 6: Empty, Null, Whitespace & Extreme Boundary Parameters
// =========================================================================
test('ADVERSARIAL: Extreme boundary inputs (empty, whitespace, null, unicode, long strings) handled gracefully', async () => {
  const extremeInputs = [
    '',
    '   ',
    '\t\n\r',
    null,
    undefined,
    '\0nullbyte',
    '../../../../etc/shadow',
    "' OR '1'='1",
    '🚀🔥✨🔒',
    'Z'.repeat(10000),
  ];

  for (const input of extremeInputs) {
    // Lead
    assert.equal(await getLeadById(input, WS_VICTIM), null);
    assert.equal(await updateLead(input, { name: 'Test' }, WS_VICTIM), null);
    assert.equal(await deleteLead(input, WS_VICTIM), false);

    // Deal
    assert.equal(await getDealById(input, WS_VICTIM), null);
    assert.equal(await updateDeal(input, { title: 'Test' }, WS_VICTIM), null);
    assert.equal(await deleteDeal(input, WS_VICTIM), false);

    // Contact
    assert.equal(await getContactById(input, WS_VICTIM), null);
    assert.equal(await updateContact(input, { name: 'Test' }, WS_VICTIM), null);
    assert.equal(await deleteContact(input, WS_VICTIM), false);

    // Document
    assert.equal(await getDocumentById(input, WS_VICTIM), null);
    assert.equal(await updateDocument(input, { title: 'Test' }, WS_VICTIM), null);
    assert.equal(await deleteDocument(input, WS_VICTIM), false);

    // Meeting
    assert.equal(await getMeetingById(input, WS_VICTIM), null);
    assert.equal(await updateMeeting(input, { title: 'Test' }, WS_VICTIM), null);
    assert.equal(await deleteMeeting(input, WS_VICTIM), false);

    // Project
    assert.equal(await getProjectById(input, WS_VICTIM), null);
    assert.equal(await updateProject(input, { name: 'Test' }, WS_VICTIM), null);
    assert.equal(await deleteProject(input, WS_VICTIM), false);
  }
});
