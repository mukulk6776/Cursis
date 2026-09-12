import { MongoClient } from 'mongodb';
import { getWorkspaceTeam, removeTeamMember } from './lib/db/team.ts';
import { createTeamInvitation, acceptWorkspaceInvitation } from './lib/db/invitations.ts';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

const client = new MongoClient(uri);

async function runIsolationTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING WORKSPACE_TEAMS COLLECTION & TEAM ISOLATION');
  console.log('================================================================\n');

  await client.connect();
  const db = client.db('cursis');

  const usersCol = db.collection('users');
  const workspacesCol = db.collection('workspaces');
  const workspaceTeamsCol = db.collection('workspace_teams');
  const invitationsCol = db.collection('invitations');
  const notificationsCol = db.collection('notifications');
  const membershipsCol = db.collection('workspace_memberships');

  const TIMESTAMP = Date.now();
  const WS_A_ID = `ws_alpha_${TIMESTAMP}`;
  const WS_B_ID = `ws_beta_${TIMESTAMP}`;

  const OWNER_A = {
    uid: `usr_owner_a_${TIMESTAMP}`,
    email: `owner_a_${TIMESTAMP}@example.com`,
    displayName: 'Alice Alpha Owner',
    role: 'owner',
    title: 'Founder & CEO',
    department: 'Leadership',
    presence: 'online',
    workspaceIds: [WS_A_ID],
    activeWorkspaceId: WS_A_ID,
    createdAt: new Date().toISOString(),
  };

  const OWNER_B = {
    uid: `usr_owner_b_${TIMESTAMP}`,
    email: `owner_b_${TIMESTAMP}@example.com`,
    displayName: 'Bob Beta Owner',
    role: 'owner',
    title: 'Founder & CEO',
    department: 'Leadership',
    presence: 'online', // Bob is online!
    workspaceIds: [WS_B_ID],
    activeWorkspaceId: WS_B_ID,
    createdAt: new Date().toISOString(),
  };

  const USER_C = {
    uid: `usr_member_c_${TIMESTAMP}`,
    email: `member_c_${TIMESTAMP}@example.com`,
    displayName: 'Charlie Engineer',
    role: 'member',
    title: 'Staff Engineer',
    department: 'Engineering',
    presence: 'online', // Charlie is also online!
    workspaceIds: [`ws_charlie_${TIMESTAMP}`],
    activeWorkspaceId: `ws_charlie_${TIMESTAMP}`,
    createdAt: new Date().toISOString(),
  };

  try {
    // 1. Seed Workspaces
    console.log('📌 Seeding two independent workspaces...');
    await workspacesCol.insertMany([
      {
        id: WS_A_ID,
        name: 'Alpha Technologies Workspace',
        ownerId: OWNER_A.uid,
        tier: 'free',
        memberCount: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: WS_B_ID,
        name: 'Beta Global Workspace',
        ownerId: OWNER_B.uid,
        tier: 'free',
        memberCount: 1,
        createdAt: new Date().toISOString(),
      },
    ]);

    // Seed Users into users collection
    await usersCol.insertMany([OWNER_A, OWNER_B, USER_C]);
    console.log('✅ Workspaces and users seeded.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Query Workspace A's Team — Must NEVER include online User B or User C
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 1: Verifying team isolation (no online user leakage)...');
    const teamA = await getWorkspaceTeam(WS_A_ID);
    console.log(`Workspace A team count: ${teamA.length}, members: ${teamA.map((m) => m.displayName).join(', ')}`);

    if (teamA.length !== 1 || teamA[0].email !== OWNER_A.email) {
      throw new Error(`TEST 1 FAILED: Expected only Owner A in Workspace A, got: ${JSON.stringify(teamA)}`);
    }

    // Verify workspace_teams collection document contains workspaceName
    const teamADocs = await workspaceTeamsCol.find({ workspaceId: WS_A_ID }).toArray();
    if (teamADocs.length !== 1 || teamADocs[0].workspaceName !== 'Alpha Technologies Workspace') {
      throw new Error(`TEST 1 FAILED: workspace_teams document missing or incorrect workspaceName: ${JSON.stringify(teamADocs)}`);
    }
    console.log(`✅ TEST 1 PASSED: Workspace A has only Owner A. workspace_teams document has workspaceName: "${teamADocs[0].workspaceName}". Online Owner B and User C are NOT added.\n`);

    // -------------------------------------------------------------------------
    // TEST 2: Query Workspace B's Team — Must have only Owner B with Beta Workspace Name
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 2: Verifying Workspace B team...');
    const teamB = await getWorkspaceTeam(WS_B_ID);
    if (teamB.length !== 1 || teamB[0].email !== OWNER_B.email) {
      throw new Error(`TEST 2 FAILED: Expected only Owner B in Workspace B, got: ${JSON.stringify(teamB)}`);
    }
    const teamBDocs = await workspaceTeamsCol.find({ workspaceId: WS_B_ID }).toArray();
    if (teamBDocs.length !== 1 || teamBDocs[0].workspaceName !== 'Beta Global Workspace') {
      throw new Error(`TEST 2 FAILED: workspace_teams document for Workspace B has invalid workspaceName: ${JSON.stringify(teamBDocs)}`);
    }
    console.log(`✅ TEST 2 PASSED: Workspace B has only Owner B. workspaceName: "${teamBDocs[0].workspaceName}".\n`);

    // -------------------------------------------------------------------------
    // TEST 3: Owner A Invites User C → User C Accepts → Added to workspace_teams
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 3: Inviting User C to Workspace A and accepting...');
    const invite = await createTeamInvitation({
      workspaceId: WS_A_ID,
      inviterUser: OWNER_A,
      inviteeEmail: USER_C.email,
      role: 'member',
      department: 'Engineering',
    });

    await acceptWorkspaceInvitation(invite.id, USER_C);

    // Verify User C is in workspace_teams collection with Alpha workspaceName
    const charlieTeamDoc = await workspaceTeamsCol.findOne({ workspaceId: WS_A_ID, userId: USER_C.uid });
    if (!charlieTeamDoc || charlieTeamDoc.workspaceName !== 'Alpha Technologies Workspace' || charlieTeamDoc.email !== USER_C.email) {
      throw new Error(`TEST 3 FAILED: User C not found in workspace_teams with correct workspaceName: ${JSON.stringify(charlieTeamDoc)}`);
    }

    const updatedTeamA = await getWorkspaceTeam(WS_A_ID);
    console.log(`Workspace A members after accept: ${updatedTeamA.map((m) => m.displayName).join(', ')}`);
    if (updatedTeamA.length !== 2) {
      throw new Error(`TEST 3 FAILED: Expected 2 members in Workspace A, got: ${updatedTeamA.length}`);
    }

    // Verify Workspace B was completely unaffected
    const updatedTeamB = await getWorkspaceTeam(WS_B_ID);
    if (updatedTeamB.length !== 1 || updatedTeamB[0].email !== OWNER_B.email) {
      throw new Error(`TEST 3 FAILED: Workspace B was affected by User C joining Workspace A!`);
    }
    console.log('✅ TEST 3 PASSED: User C accepted invite and added to workspace_teams. Workspace B remains isolated.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Removing User C from Workspace A deletes from workspace_teams
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 4: Removing User C from Workspace A...');
    await removeTeamMember(WS_A_ID, USER_C.uid, USER_C.email);

    const charlieAfterRemove = await workspaceTeamsCol.findOne({ workspaceId: WS_A_ID, userId: USER_C.uid });
    if (charlieAfterRemove) {
      throw new Error(`TEST 4 FAILED: User C was not deleted from workspace_teams collection!`);
    }

    const teamAAfterRemove = await getWorkspaceTeam(WS_A_ID);
    if (teamAAfterRemove.length !== 1 || teamAAfterRemove[0].email !== OWNER_A.email) {
      throw new Error(`TEST 4 FAILED: Expected 1 member in Workspace A after removal, got: ${teamAAfterRemove.length}`);
    }
    console.log('✅ TEST 4 PASSED: User C removed and deleted from workspace_teams collection.\n');

    console.log('================================================================');
    console.log('🎉 ALL WORKSPACE_TEAMS ISOLATION TESTS PASSED 100%!');
    console.log('================================================================\n');
  } finally {
    console.log('🧹 Cleaning up test fixtures...');
    await workspacesCol.deleteMany({ id: { $in: [WS_A_ID, WS_B_ID] } });
    await usersCol.deleteMany({ uid: { $in: [OWNER_A.uid, OWNER_B.uid, USER_C.uid] } });
    await workspaceTeamsCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await invitationsCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await notificationsCol.deleteMany({ userEmail: { $in: [OWNER_A.email, OWNER_B.email, USER_C.email] } });
    await membershipsCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await client.close();
    process.exit(0);
  }
}

runIsolationTests().catch((err) => {
  console.error('\n❌ ISOLATION TEST FAILED:', err);
  process.exit(1);
});
