// tests/crm-query-isolation.cjs
// Automated Regression Suite for Milestone 1: CRM & Multi-Tenant Query Scoping
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

// Mock MongoDB layer to intercept and inspect query filters
let mongoCalls = [];
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
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
  },
};

const { inMemoryStore } = require('@/lib/db/store');
const {
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} = require('@/lib/db/crm');
const { getDocumentById, createDocument, updateDocument, deleteDocument } = require('@/lib/db/documents');
const { getMeetingById, createMeeting, updateMeeting, deleteMeeting, processMeetingWithOrdis } = require('@/lib/db/meetings');
const { getProjectById, createProject, updateProject, deleteProject } = require('@/lib/db/projects');

test('CRM: updateLead strips workspaceId and prevents cross-tenant hijacking', async () => {
  const wsAlpha = 'ws_alpha_lead';
  const wsBeta = 'ws_beta_lead';

  const leadA = await createLead(wsAlpha, {
    name: 'Enterprise Alpha Lead',
    company: 'Alpha Corp',
    email: 'alpha@example.com',
  });
  assert.equal(leadA.workspaceId, wsAlpha);

  mongoCalls = [];
  // Malicious attempt to change workspaceId to wsBeta
  const updated = await updateLead(leadA.id, {
    company: 'Compromised Corp',
    workspaceId: wsBeta,
  });

  assert.equal(updated.workspaceId, wsAlpha, 'Lead workspaceId MUST remain wsAlpha');
  assert.equal(updated.company, 'Compromised Corp', 'Legitimate field update succeeded');

  const updateCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'leads');
  assert.ok(updateCall, 'MongoDB updateOne must be called');
  assert.equal(updateCall.filter.id, leadA.id);
  assert.equal(updateCall.filter.workspaceId, wsAlpha, 'Mongo update filter must include workspaceId');
  assert.ok(!updateCall.options?.upsert, 'Upsert must NOT be enabled on lead update');
});

test('CRM: getLeadById, updateLead, and deleteLead enforce workspaceId scoping', async () => {
  const wsAlpha = 'ws_alpha_lead_2';
  const wsBeta = 'ws_beta_lead_2';

  const leadA = await createLead(wsAlpha, { name: 'Alpha Lead 2', email: 'lead2@alpha.com' });

  // Cross-tenant get must return null
  const crossGet = await getLeadById(leadA.id, wsBeta);
  assert.equal(crossGet, null, 'getLeadById with different workspaceId must return null');

  // Cross-tenant update must return null
  const crossUpdate = await updateLead(leadA.id, { company: 'Hacked' }, wsBeta);
  assert.equal(crossUpdate, null, 'updateLead with different workspaceId must return null');

  // Cross-tenant delete must return false
  const crossDelete = await deleteLead(leadA.id, wsBeta);
  assert.equal(crossDelete, false, 'deleteLead with different workspaceId must return false');

  // Valid tenant operations succeed
  const validGet = await getLeadById(leadA.id, wsAlpha);
  assert.ok(validGet, 'getLeadById with matching workspaceId must return lead');

  mongoCalls = [];
  const validDelete = await deleteLead(leadA.id, wsAlpha);
  assert.equal(validDelete, true, 'deleteLead with matching workspaceId must return true');
  const deleteCall = mongoCalls.find((c) => c.op === 'deleteOne' && c.col === 'leads');
  assert.ok(deleteCall);
  assert.equal(deleteCall.filter.workspaceId, wsAlpha, 'Mongo deleteOne must be scoped by workspaceId');
});

test('CRM Deals & Contacts: Multi-tenant scoping on queries and mutations', async () => {
  const wsAlpha = 'ws_alpha_crm';
  const wsBeta = 'ws_beta_crm';

  // Deals
  const dealA = await createDeal(wsAlpha, { title: 'Q4 Deal', value: 100000 });
  assert.equal(dealA.workspaceId, wsAlpha);
  assert.equal(await getDealById(dealA.id, wsBeta), null, 'getDealById rejects foreign workspace');

  mongoCalls = [];
  const updatedDeal = await updateDeal(dealA.id, { value: 120000, workspaceId: wsBeta }, wsAlpha);
  assert.equal(updatedDeal.workspaceId, wsAlpha, 'updateDeal preserves workspaceId');
  const dealUpdateCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'deals');
  assert.ok(dealUpdateCall);
  assert.equal(dealUpdateCall.filter.workspaceId, wsAlpha, 'Mongo deal update scoped to workspaceId');

  assert.equal(await deleteDeal(dealA.id, wsBeta), false, 'deleteDeal rejects foreign workspace');
  assert.equal(await deleteDeal(dealA.id, wsAlpha), true, 'deleteDeal succeeds for owner workspace');

  // Contacts
  const contactA = await createContact(wsAlpha, { name: 'Bob Contact', email: 'bob@example.com' });
  assert.equal(contactA.workspaceId, wsAlpha);
  assert.equal(await getContactById(contactA.id, wsBeta), null, 'getContactById rejects foreign workspace');

  mongoCalls = [];
  const updatedContact = await updateContact(contactA.id, { name: 'Robert Contact', workspaceId: wsBeta }, wsAlpha);
  assert.equal(updatedContact.workspaceId, wsAlpha, 'updateContact preserves workspaceId');
  const contactUpdateCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'contacts');
  assert.ok(contactUpdateCall);
  assert.equal(contactUpdateCall.filter.workspaceId, wsAlpha, 'Mongo contact update scoped to workspaceId');

  assert.equal(await deleteContact(contactA.id, wsBeta), false, 'deleteContact rejects foreign workspace');
  assert.equal(await deleteContact(contactA.id, wsAlpha), true, 'deleteContact succeeds for owner workspace');
});

test('Documents: Strict multi-tenant scoping and no-upsert mutations', async () => {
  const wsAlpha = 'ws_alpha_doc';
  const wsBeta = 'ws_beta_doc';

  const docA = await createDocument(wsAlpha, { title: 'Confidential Strategy', content: 'Top Secret' });
  assert.equal(docA.workspaceId, wsAlpha);

  // Cross-tenant get
  assert.equal(await getDocumentById(docA.id, wsBeta), null, 'getDocumentById rejects foreign workspace');

  mongoCalls = [];
  // Attempt to overwrite workspaceId
  const updatedDoc = await updateDocument(docA.id, { title: 'Updated Strategy', workspaceId: wsBeta }, wsAlpha);
  assert.equal(updatedDoc.workspaceId, wsAlpha, 'Document workspaceId remains wsAlpha');
  const docUpdateCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'documents');
  assert.ok(docUpdateCall);
  assert.equal(docUpdateCall.filter.workspaceId, wsAlpha, 'Mongo document update scoped to workspaceId');
  assert.ok(!docUpdateCall.options?.upsert, 'Document update MUST NOT have upsert: true');

  // Cross-tenant delete
  assert.equal(await deleteDocument(docA.id, wsBeta), false, 'deleteDocument rejects foreign workspace');

  mongoCalls = [];
  assert.equal(await deleteDocument(docA.id, wsAlpha), true, 'deleteDocument succeeds for owner workspace');
  const docDelCall = mongoCalls.find((c) => c.op === 'deleteOne' && c.col === 'documents');
  assert.ok(docDelCall);
  assert.equal(docDelCall.filter.workspaceId, wsAlpha, 'Mongo document delete scoped to workspaceId');
});

test('Meetings: Strict multi-tenant scoping, DB fallback, and Ordis processing isolation', async () => {
  const wsAlpha = 'ws_alpha_mtg';
  const wsBeta = 'ws_beta_mtg';

  const mtgA = await createMeeting(wsAlpha, { title: 'Board Alignment Meeting' });
  assert.equal(mtgA.workspaceId, wsAlpha);

  // Cross-tenant get
  assert.equal(await getMeetingById(mtgA.id, wsBeta), null, 'getMeetingById rejects foreign workspace');

  mongoCalls = [];
  const updatedMtg = await updateMeeting(mtgA.id, { title: 'Q4 Board Meeting', workspaceId: wsBeta }, wsAlpha);
  assert.equal(updatedMtg.workspaceId, wsAlpha, 'Meeting workspaceId remains wsAlpha');
  const mtgUpdateCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'meetings');
  assert.ok(mtgUpdateCall);
  assert.equal(mtgUpdateCall.filter.workspaceId, wsAlpha, 'Mongo meeting update scoped to workspaceId');
  assert.ok(!mtgUpdateCall.options?.upsert, 'Meeting update MUST NOT have upsert: true');

  // Cross-tenant processMeetingWithOrdis must throw
  await assert.rejects(
    async () => {
      await processMeetingWithOrdis(mtgA.id, wsBeta);
    },
    /Meeting not found in active workspace/,
    'processMeetingWithOrdis must reject cross-tenant meeting'
  );

  // Valid processMeetingWithOrdis scopes update
  mongoCalls = [];
  await processMeetingWithOrdis(mtgA.id, wsAlpha);
  const processCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'meetings');
  assert.ok(processCall);
  assert.equal(processCall.filter.workspaceId, wsAlpha, 'processMeetingWithOrdis scopes update to workspaceId');
  assert.ok(!processCall.options?.upsert, 'processMeetingWithOrdis must not have upsert: true');

  // Cross-tenant delete
  assert.equal(await deleteMeeting(mtgA.id, wsBeta), false, 'deleteMeeting rejects foreign workspace');
  assert.equal(await deleteMeeting(mtgA.id, wsAlpha), true, 'deleteMeeting succeeds for owner workspace');
});

test('Projects: Multi-tenant scoping and no-upsert mutations', async () => {
  const wsAlpha = 'ws_alpha_prj';
  const wsBeta = 'ws_beta_prj';

  const prjA = await createProject(wsAlpha, { name: 'Alpha Platform Overhaul' });
  assert.equal(prjA.workspaceId, wsAlpha);

  // Cross-tenant get
  assert.equal(await getProjectById(prjA.id, wsBeta), null, 'getProjectById rejects foreign workspace');

  mongoCalls = [];
  const updatedPrj = await updateProject(prjA.id, { name: 'Overhaul Complete', workspaceId: wsBeta }, wsAlpha);
  assert.equal(updatedPrj.workspaceId, wsAlpha, 'Project workspaceId remains wsAlpha');
  const prjUpdateCall = mongoCalls.find((c) => c.op === 'updateOne' && c.col === 'projects');
  assert.ok(prjUpdateCall);
  assert.equal(prjUpdateCall.filter.workspaceId, wsAlpha, 'Mongo project update scoped to workspaceId');
  assert.ok(!prjUpdateCall.options?.upsert, 'Project update MUST NOT have upsert: true');

  // Cross-tenant delete
  assert.equal(await deleteProject(prjA.id, wsBeta), false, 'deleteProject rejects foreign workspace');

  mongoCalls = [];
  assert.equal(await deleteProject(prjA.id, wsAlpha), true, 'deleteProject succeeds for owner workspace');
  const prjDelCall = mongoCalls.find((c) => c.op === 'deleteOne' && c.col === 'projects');
  assert.ok(prjDelCall);
  assert.equal(prjDelCall.filter.workspaceId, wsAlpha, 'Mongo project delete scoped to workspaceId');
});
