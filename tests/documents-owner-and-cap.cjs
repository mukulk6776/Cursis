// Run with: node tests/documents-owner-and-cap.cjs
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
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    }
  }).outputText, filename);
};

// Mock mongodb
require.cache[path.join(root, 'lib/mongodb.ts')] = {
  id: path.join(root, 'lib/mongodb.ts'),
  filename: path.join(root, 'lib/mongodb.ts'),
  loaded: true,
  exports: {
    getCollection: async () => null,
  }
};

let mockSessionUser = null;
require.cache[path.join(root, 'lib/auth/session.ts')] = {
  id: path.join(root, 'lib/auth/session.ts'),
  filename: path.join(root, 'lib/auth/session.ts'),
  loaded: true,
  exports: {
    getAuthenticatedUser: async () => mockSessionUser,
  }
};

const { inMemoryStore } = require('@/lib/db/store');
const { POST, GET } = require('@/app/api/documents/route');

async function runTests() {
  console.log('Starting Document Permissions & 5MB Cap Tests...');

  const wsId = 'ws_doc_test';
  inMemoryStore.workspaces.set(wsId, {
    id: wsId,
    name: 'Doc Test Workspace',
    slug: 'doc-test',
    tier: 'free',
    ordisMode: 'chill',
    industry: 'tech',
    teamSize: '1-10',
    features: [],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'medium' },
    ownerId: 'usr_owner_1',
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Test 1: Workspace Owner creating a document (valid size: 2MB)
  mockSessionUser = {
    uid: 'usr_owner_1',
    email: 'owner@company.com',
    displayName: 'Workspace Owner',
    role: 'owner',
    workspaceId: wsId,
  };

  const req1 = new Request('http://localhost:3000/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: wsId,
      title: 'Q3 Product Strategy.pdf',
      category: 'technical',
      fileType: 'pdf',
      fileSize: 2 * 1024 * 1024, // 2MB
      content: 'Product roadmap specifications',
    }),
  });

  const res1 = await POST(req1);
  const data1 = await res1.json();
  assert.equal(res1.status, 201, `Owner should be able to create document, got status ${res1.status}: ${JSON.stringify(data1)}`);
  assert(data1.success, 'Response should indicate success');
  const createdDoc = data1.document || data1.data?.document;
  assert(createdDoc, 'Created document should be present in response');
  assert.equal(createdDoc.title, 'Q3 Product Strategy.pdf');
  console.log('✓ Workspace Owner successfully created document (2MB)');

  // Test 2: Uploading file exceeding 5MB (e.g. 6MB) -> should be rejected with 400
  const req2 = new Request('http://localhost:3000/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: wsId,
      title: 'Huge Archive.zip',
      category: 'general',
      fileType: 'pdf',
      fileSize: 6 * 1024 * 1024, // 6MB
    }),
  });

  const res2 = await POST(req2);
  const data2 = await res2.json();
  assert.equal(res2.status, 400, 'File > 5MB should return status 400');
  assert(data2.error.includes('5MB'), `Error message should mention 5MB limit, got: ${data2.error}`);
  console.log(`✓ 6MB upload rejected with message: "${data2.error}"`);

  // Test 3: Uploading file with string size "5.5 MB" -> should be rejected
  const req3 = new Request('http://localhost:3000/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: wsId,
      title: 'Big Deck.pptx',
      category: 'proposal',
      fileType: 'pptx',
      fileSize: '5.5 MB',
    }),
  });

  const res3 = await POST(req3);
  const data3 = await res3.json();
  assert.equal(res3.status, 400, 'File with 5.5 MB should return status 400');
  assert(data3.error.includes('5MB'), `Error message should mention 5MB limit, got: ${data3.error}`);
  console.log(`✓ 5.5MB upload rejected with message: "${data3.error}"`);

  // Test 4: Uploading file exactly within limit (4.9 MB) -> should succeed
  const req4 = new Request('http://localhost:3000/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: wsId,
      title: 'Acceptable Deck.pptx',
      category: 'proposal',
      fileType: 'pptx',
      fileSize: '4.9 MB',
    }),
  });

  const res4 = await POST(req4);
  const data4 = await res4.json();
  assert.equal(res4.status, 201, `4.9MB upload should succeed, got status ${res4.status}`);
  assert(data4.success, 'Response should indicate success');
  console.log('✓ 4.9MB document upload succeeded');

  // Test 5: Sovereign Founder (mukulk3962364@gmail.com) accessing any workspace
  mockSessionUser = {
    uid: 'usr_founder',
    email: 'mukulk3962364@gmail.com',
    displayName: 'Founder',
    role: 'owner',
    workspaceId: 'ws_other',
  };

  const req5 = new Request('http://localhost:3000/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: wsId,
      title: 'Founder Directive.pdf',
      category: 'contract',
      fileType: 'pdf',
      fileSize: 1024 * 1024,
    }),
  });

  const res5 = await POST(req5);
  const data5 = await res5.json();
  assert.equal(res5.status, 201, `Founder should be able to create doc in any workspace, got ${res5.status}`);
  console.log('✓ Sovereign Founder has full owner rights to create documents');

  // Test 6: Verify documents can be retrieved via GET
  const getReq = new Request(`http://localhost:3000/api/documents?workspaceId=${wsId}`);
  const getRes = await GET(getReq);
  const getData = await getRes.json();
  assert.equal(getRes.status, 200);
  const docList = getData.documents || getData.data?.documents || [];
  assert(docList.length >= 3, `Expected at least 3 documents, got ${docList.length}`);
  console.log(`✓ Retrieved ${docList.length} documents successfully`);

  console.log('\nAll Document Permissions & 5MB Cap Tests PASSED! 🎉');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
