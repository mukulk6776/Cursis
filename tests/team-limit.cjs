// Run with: node tests/team-limit.cjs
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

const { MAX_TEAM_MEMBERS } = require('@/lib/db/types');
const { addTeamMember, getWorkspaceTeam } = require('@/lib/db/team');
const { createTeamInvitation, acceptWorkspaceInvitation, inMemoryInvitations } = require('@/lib/db/invitations');
const { inMemoryStore } = require('@/lib/db/store');

async function runTests() {
  console.log(`Starting Team Limit Tests (MAX_TEAM_MEMBERS = ${MAX_TEAM_MEMBERS})...`);
  assert.equal(MAX_TEAM_MEMBERS, 10, 'MAX_TEAM_MEMBERS should equal 10');

  const wsId = `ws_test_limit_${Date.now()}`;
  inMemoryStore.workspaces.set(wsId, {
    id: wsId,
    name: 'Limit Test Workspace',
    slug: 'limit-test',
    tier: 'free',
    ordisMode: 'chill',
    industry: 'tech',
    teamSize: '1-10',
    features: [],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'medium' },
    ownerId: 'owner_usr',
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 1. Add owner
  inMemoryStore.users.set('owner_usr', {
    id: 'owner_usr',
    uid: 'owner_usr',
    email: 'owner@cursis.io',
    displayName: 'Workspace Owner',
    role: 'owner',
    department: 'Leadership',
    title: 'Founder & CEO',
    skills: ['Leadership'],
    workspaceIds: [wsId],
    activeWorkspaceId: wsId,
    onboardingStatus: 'completed',
    onboardingChecklist: [],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  let team = await getWorkspaceTeam(wsId);
  assert.equal(team.length, 1, 'Initial team should have 1 member');
  console.log(`✓ Workspace initialized with ${team.length} member`);

  // 2. Add members up to 10
  for (let i = 2; i <= 10; i++) {
    const member = await addTeamMember(wsId, {
      email: `member${i}@example.com`,
      displayName: `Member ${i}`,
      role: 'member',
      department: 'Engineering',
    });
    assert(member, `Member ${i} should be created`);
  }

  team = await getWorkspaceTeam(wsId);
  assert.equal(team.length, 10, 'Team should now have exactly 10 members');
  console.log(`✓ Filled team to 10 members`);

  // 3. Attempt to add an 11th member directly via addTeamMember -> should throw
  let add11Failed = false;
  try {
    await addTeamMember(wsId, {
      email: 'member11@example.com',
      displayName: 'Member 11',
      role: 'member',
      department: 'Engineering',
    });
  } catch (err) {
    add11Failed = true;
    assert(err.message.includes('10 members'), 'Error message should mention 10 members limit');
  }
  assert(add11Failed, 'addTeamMember should throw when team has 10 members');
  console.log(`✓ Adding 11th member via addTeamMember was rejected`);

  // 4. Attempt to create an invitation when team has 10 members -> should throw
  inMemoryStore.users.set('invitee_usr', {
    id: 'invitee_usr',
    uid: 'invitee_usr',
    email: 'candidate@example.com',
    displayName: 'Candidate User',
    role: 'member',
    workspaceIds: [],
    activeWorkspaceId: '',
    skills: [],
    onboardingStatus: 'completed',
    onboardingChecklist: [],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  let inviteFailed = false;
  try {
    await createTeamInvitation({
      workspaceId: wsId,
      inviterUser: { uid: 'owner_usr', email: 'owner@cursis.io', displayName: 'Workspace Owner', role: 'owner' },
      inviteeEmail: 'candidate@example.com',
    });
  } catch (err) {
    inviteFailed = true;
    assert(err.message.includes('10 members') || err.message.includes('capacity'), 'Error message should mention 10 members or capacity');
  }
  assert(inviteFailed, 'createTeamInvitation should throw when team has 10 members');
  console.log(`✓ Invitation creation was rejected when team is at 10 members`);

  // 5. Test capacity limit with pending invitations:
  // Create a new workspace with 8 members
  const wsId2 = `ws_capacity_test_${Date.now()}`;
  inMemoryStore.workspaces.set(wsId2, {
    id: wsId2,
    name: 'Capacity Workspace',
    slug: 'capacity-test',
    tier: 'free',
    ordisMode: 'chill',
    industry: 'tech',
    teamSize: '1-10',
    features: [],
    settings: { ambientMonitoring: true, approvalRequiredForActions: true, simulationMode: false, riskTolerance: 'medium' },
    ownerId: 'owner_usr2',
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  inMemoryStore.users.set('owner_usr2', {
    id: 'owner_usr2',
    uid: 'owner_usr2',
    email: 'owner2@cursis.io',
    displayName: 'Owner 2',
    role: 'owner',
    workspaceIds: [wsId2],
    activeWorkspaceId: wsId2,
    skills: [],
    onboardingStatus: 'completed',
    onboardingChecklist: [],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  // Add 8 more members (total = 9)
  for (let i = 2; i <= 9; i++) {
    await addTeamMember(wsId2, {
      email: `w2_member${i}@example.com`,
      displayName: `W2 Member ${i}`,
      role: 'member',
    });
  }
  const w2Team = await getWorkspaceTeam(wsId2);
  assert.equal(w2Team.length, 9, 'W2 should have 9 members');

  // Register 2 candidate users
  inMemoryStore.users.set('cand_1', {
    id: 'cand_1',
    uid: 'cand_1',
    email: 'cand1@example.com',
    displayName: 'Cand 1',
    workspaceIds: [],
    skills: [],
    onboardingStatus: 'completed',
    onboardingChecklist: [],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  inMemoryStore.users.set('cand_2', {
    id: 'cand_2',
    uid: 'cand_2',
    email: 'cand2@example.com',
    displayName: 'Cand 2',
    workspaceIds: [],
    skills: [],
    onboardingStatus: 'completed',
    onboardingChecklist: [],
    presence: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  // 1st invite (9 members + 1 pending invite = 10 capacity) -> should succeed
  const inv1 = await createTeamInvitation({
    workspaceId: wsId2,
    inviterUser: { uid: 'owner_usr2', email: 'owner2@cursis.io', displayName: 'Owner 2', role: 'owner' },
    inviteeEmail: 'cand1@example.com',
  });
  assert(inv1, '1st invite should succeed');
  console.log(`✓ 1st invite succeeded (now 9 members + 1 invite = 10 capacity)`);

  // 2nd invite -> should fail because 9 members + 1 pending = 10 max
  let invite2Failed = false;
  try {
    await createTeamInvitation({
      workspaceId: wsId2,
      inviterUser: { uid: 'owner_usr2', email: 'owner2@cursis.io', displayName: 'Owner 2', role: 'owner' },
      inviteeEmail: 'cand2@example.com',
    });
  } catch (err) {
    invite2Failed = true;
    assert(err.message.includes('10'), 'Error message should mention capacity limit of 10');
  }
  assert(invite2Failed, '2nd invite should be blocked by capacity check');
  console.log(`✓ 2nd invite was blocked because workspace is at 10 member capacity`);

  // 6. Cand 1 accepts invitation -> members becomes 10
  const acceptResult = await acceptWorkspaceInvitation(inv1.id, {
    uid: 'cand_1',
    email: 'cand1@example.com',
    displayName: 'Cand 1',
  });
  assert.equal(acceptResult.success, true);
  const w2FinalTeam = await getWorkspaceTeam(wsId2);
  assert.equal(w2FinalTeam.length, 10, 'W2 should now have 10 members');
  console.log(`✓ Cand 1 accepted invitation, workspace now has 10 members`);

  console.log('\nAll Team Member Limit tests PASSED successfully! 🚀');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
