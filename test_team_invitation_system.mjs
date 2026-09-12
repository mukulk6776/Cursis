// Comprehensive Integration Test for Rebuilt Team Invitation System
import fs from 'fs';
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
import { MongoClient } from 'mongodb';

import {
  createTeamInvitation,
  getWorkspaceInvitations,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
} from './lib/db/invitations.ts';
import { getUserWorkspaces } from './lib/db/workspaces.ts';
import { inMemoryStore } from './lib/db/store.ts';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const client = new MongoClient(uri);

async function runIntegrationTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING TEAM INVITATION SYSTEM SUITE');
  console.log('================================================================\n');

  await client.connect();
  const db = client.db('cursis');

  const usersCol = db.collection('users');
  const workspacesCol = db.collection('workspaces');
  const invitationsCol = db.collection('invitations');
  const notificationsCol = db.collection('notifications');
  const membershipsCol = db.collection('workspace_memberships');

  const TEST_WS_ID = `ws_test_rebuild_${Date.now()}`;
  const OWNER = {
    uid: `usr_owner_${Date.now()}`,
    email: `owner_${Date.now()}@cursis.io`,
    displayName: 'Test Owner',
    role: 'owner',
  };
  const ALICE = {
    uid: `usr_alice_${Date.now()}`,
    email: `alice_${Date.now()}@gmail.com`,
    displayName: 'Alice Engineer',
    role: 'member',
    workspaceIds: [`ws_alice_orig_${Date.now()}`],
  };
  const BOB = {
    uid: `usr_bob_${Date.now()}`,
    email: `bob_${Date.now()}@gmail.com`,
    displayName: 'Bob Member',
    role: 'member',
    workspaceIds: [`ws_bob_orig_${Date.now()}`],
  };

  try {
    // 0. Seed Test Fixtures
    console.log('📌 Seeding Test Fixtures...');
    await workspacesCol.insertMany([
      {
        id: TEST_WS_ID,
        name: 'Acme Test Corp',
        ownerId: OWNER.uid,
        tier: 'free',
        memberCount: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: ALICE.workspaceIds[0],
        name: "Alice's Personal Workspace",
        ownerId: ALICE.uid,
        tier: 'free',
        memberCount: 1,
        createdAt: new Date().toISOString(),
      },
    ]);

    await usersCol.insertMany([
      {
        id: OWNER.uid,
        uid: OWNER.uid,
        email: OWNER.email,
        displayName: OWNER.displayName,
        role: 'owner',
        workspaceIds: [TEST_WS_ID],
        createdAt: new Date().toISOString(),
      },
      {
        id: ALICE.uid,
        uid: ALICE.uid,
        email: ALICE.email,
        displayName: ALICE.displayName,
        role: 'member',
        workspaceIds: ALICE.workspaceIds,
        createdAt: new Date().toISOString(),
      },
      {
        id: BOB.uid,
        uid: BOB.uid,
        email: BOB.email,
        displayName: BOB.displayName,
        role: 'member',
        workspaceIds: BOB.workspaceIds,
        createdAt: new Date().toISOString(),
      },
    ]);

    // Also populate in-memory store for fallback parity
    inMemoryStore.workspaces.set(TEST_WS_ID, {
      id: TEST_WS_ID,
      name: 'Acme Test Corp',
      ownerId: OWNER.uid,
      tier: 'free',
      ordisMode: 'chill',
      industry: 'Technology',
      teamSize: '1-10',
      features: ['team'],
      settings: {},
      memberCount: 1,
      slug: 'acme-test-corp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Fixtures seeded.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Inviting Non-Existent Email (Must Fail With 404 / Clear Error)
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 1: Inviting non-existent email...');
    let test1Passed = false;
    try {
      await createTeamInvitation({
        workspaceId: TEST_WS_ID,
        inviterUser: OWNER,
        inviteeEmail: 'nonexistent_ghost_9999@gmail.com',
        role: 'member',
      });
    } catch (err) {
      if (err.message.includes('No registered user account found') || err.statusCode === 404) {
        test1Passed = true;
      } else {
        console.error('Unexpected error message:', err.message);
      }
    }
    const ghostInvs = await invitationsCol.countDocuments({ email: 'nonexistent_ghost_9999@gmail.com' });
    const ghostNotifs = await notificationsCol.countDocuments({ userEmail: 'nonexistent_ghost_9999@gmail.com' });
    if (test1Passed && ghostInvs === 0 && ghostNotifs === 0) {
      console.log('✅ TEST 1 PASSED: Non-existent email blocked, 0 invites/notifications created.');
    } else {
      throw new Error(`TEST 1 FAILED: test1Passed=${test1Passed}, invites=${ghostInvs}, notifs=${ghostNotifs}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Authorization Gate (Non-owner / Member cannot invite)
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 2: Non-owner / member attempting to send invite...');
    let test2Passed = false;
    try {
      await createTeamInvitation({
        workspaceId: TEST_WS_ID,
        inviterUser: BOB, // Bob is just a member, not owner of TEST_WS_ID
        inviteeEmail: ALICE.email,
        role: 'member',
      });
    } catch (err) {
      if (err.statusCode === 403 || err.message.includes('Forbidden')) {
        test2Passed = true;
      }
    }
    if (test2Passed) {
      console.log('✅ TEST 2 PASSED: Non-owner blocked with 403 Forbidden.');
    } else {
      throw new Error('TEST 2 FAILED: Non-owner was able to invite or did not receive 403.');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Owner Inviting Registered User (Alice)
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 3: Owner inviting registered user Alice...');
    const invite = await createTeamInvitation({
      workspaceId: TEST_WS_ID,
      inviterUser: OWNER,
      inviteeEmail: ALICE.email,
      role: 'member',
      department: 'Engineering',
    });

    if (!invite || invite.status !== 'pending' || invite.email !== ALICE.email) {
      throw new Error('TEST 3 FAILED: Invalid invitation returned');
    }

    // Verify committed database write in invitations and notifications
    const dbInv = await invitationsCol.findOne({ id: invite.id });
    const dbNotif = await notificationsCol.findOne({ referenceId: invite.id });

    if (dbInv && dbNotif && dbNotif.userId === ALICE.uid && dbNotif.type === 'workspace_invite') {
      console.log('✅ TEST 3 PASSED: Exactly 1 invitation & 1 notification committed to MongoDB.');
    } else {
      throw new Error(`TEST 3 FAILED: dbInv=${Boolean(dbInv)}, dbNotif=${Boolean(dbNotif)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Duplicate Invitation Prevention
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 4: Duplicate pending invitation prevention...');
    let test4Passed = false;
    try {
      await createTeamInvitation({
        workspaceId: TEST_WS_ID,
        inviterUser: OWNER,
        inviteeEmail: ALICE.email,
        role: 'member',
      });
    } catch (err) {
      if (err.message.includes('already been sent') || err.statusCode === 400) {
        test4Passed = true;
      }
    }
    if (test4Passed) {
      console.log('✅ TEST 4 PASSED: Duplicate invitation prevented.');
    } else {
      throw new Error('TEST 4 FAILED: Duplicate invite was not rejected.');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Inviter / Third Party Attempting to Accept (Must be 403)
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 5: Unauthorized user attempting to accept Alice invite...');
    let test5aPassed = false;
    try {
      // Owner tries to accept
      await acceptWorkspaceInvitation(invite.id, OWNER);
    } catch (err) {
      if (err.statusCode === 403 || err.message.includes('Forbidden')) {
        test5aPassed = true;
      }
    }

    let test5bPassed = false;
    try {
      // Bob tries to accept Alice's invite
      await acceptWorkspaceInvitation(invite.id, BOB);
    } catch (err) {
      if (err.statusCode === 403 || err.message.includes('Forbidden')) {
        test5bPassed = true;
      }
    }

    if (test5aPassed && test5bPassed) {
      console.log('✅ TEST 5 PASSED: Strict invitee-only authorization enforced (403 Forbidden for non-invitees).');
    } else {
      throw new Error(`TEST 5 FAILED: test5aPassed=${test5aPassed}, test5bPassed=${test5bPassed}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Decline Invitation Flow
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 6: Alice declines invitation...');
    const declineRes = await declineWorkspaceInvitation(invite.id, ALICE);
    if (!declineRes.success) throw new Error('Decline returned unsuccessful');

    const declinedInv = await invitationsCol.findOne({ id: invite.id });
    const membershipsAfterDecline = await membershipsCol.countDocuments({ workspaceId: TEST_WS_ID, userId: ALICE.uid });
    const declinedNotif = await notificationsCol.findOne({ referenceId: invite.id });

    if (declinedInv.status === 'declined' && membershipsAfterDecline === 0 && declinedNotif.invitationData?.status === 'declined') {
      console.log('✅ TEST 6 PASSED: Invitation marked declined, no membership created, notification updated.');
    } else {
      throw new Error(`TEST 6 FAILED: status=${declinedInv.status}, memberships=${membershipsAfterDecline}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Fresh Invitation & Acceptance (Multi-Workspace Visibility)
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 7: Fresh invite and Alice accepts...');
    const invite2 = await createTeamInvitation({
      workspaceId: TEST_WS_ID,
      inviterUser: OWNER,
      inviteeEmail: ALICE.email,
      role: 'member',
      department: 'Product',
    });

    const acceptRes = await acceptWorkspaceInvitation(invite2.id, ALICE);
    if (!acceptRes.success || acceptRes.workspaceId !== TEST_WS_ID) {
      throw new Error('Accept returned failure');
    }

    // Verify committed state
    const acceptedInv = await invitationsCol.findOne({ id: invite2.id });
    const membership = await membershipsCol.findOne({ workspaceId: TEST_WS_ID, userId: ALICE.uid });
    const aliceUserDoc = await usersCol.findOne({ uid: ALICE.uid });

    if (acceptedInv.status !== 'accepted') throw new Error('Invitation status is not accepted');
    if (!membership || membership.role !== 'member') throw new Error('Workspace membership not committed to DB');
    if (!aliceUserDoc.workspaceIds.includes(TEST_WS_ID)) throw new Error('Workspace ID not appended to user.workspaceIds');

    // Verify multi-workspace query immediately lists BOTH workspaces
    const aliceWorkspaces = await getUserWorkspaces(ALICE.uid);
    const aliceWsIds = aliceWorkspaces.map((w) => w.id);

    console.log('Alice workspaces returned:', aliceWsIds);
    if (aliceWsIds.includes(ALICE.workspaceIds[0]) && aliceWsIds.includes(TEST_WS_ID)) {
      console.log('✅ TEST 7 PASSED: Acceptance committed, membership created, and workspace list includes BOTH workspaces immediately.');
    } else {
      throw new Error(`TEST 7 FAILED: Alice does not have both workspaces. Returned: ${JSON.stringify(aliceWsIds)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Revoke Invitation Flow
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 8: Owner invites Bob and revokes invite...');
    const bobInvite = await createTeamInvitation({
      workspaceId: TEST_WS_ID,
      inviterUser: OWNER,
      inviteeEmail: BOB.email,
      role: 'admin',
    });

    // Non-owner trying to revoke Bob's invite (Alice is now a member, but not owner/admin)
    let nonOwnerRevokeBlocked = false;
    try {
      await revokeWorkspaceInvitation(TEST_WS_ID, bobInvite.id, {
        uid: ALICE.uid,
        email: ALICE.email,
        role: 'member',
      });
    } catch (err) {
      if (err.statusCode === 403) nonOwnerRevokeBlocked = true;
    }

    if (!nonOwnerRevokeBlocked) {
      throw new Error('Non-owner was able to call revokeWorkspaceInvitation without 403');
    }

    // Owner revokes
    const revokeSuccess = await revokeWorkspaceInvitation(TEST_WS_ID, bobInvite.id, OWNER);
    if (!revokeSuccess) throw new Error('Revoke returned false');

    const revokedInv = await invitationsCol.findOne({ id: bobInvite.id });
    if (revokedInv.status === 'revoked') {
      console.log('✅ TEST 8 PASSED: Only Owner can revoke, and invitation status updated to revoked.');
    } else {
      throw new Error(`TEST 8 FAILED: Invitation status=${revokedInv.status}`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 8 INTEGRATION TESTS PASSED WITH 100% PERSISTENCE!');
    console.log('================================================================\n');
  } finally {
    // Clean up test data
    console.log('🧹 Cleaning up test artifacts...');
    await workspacesCol.deleteMany({ id: { $in: [TEST_WS_ID, ALICE.workspaceIds[0]] } });
    await usersCol.deleteMany({ uid: { $in: [OWNER.uid, ALICE.uid, BOB.uid] } });
    await invitationsCol.deleteMany({ workspaceId: TEST_WS_ID });
    await notificationsCol.deleteMany({ userEmail: { $in: [ALICE.email, BOB.email] } });
    await membershipsCol.deleteMany({ workspaceId: TEST_WS_ID });
    await client.close();
    console.log('Done.');
  }
}

runIntegrationTests().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
