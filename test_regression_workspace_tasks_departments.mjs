import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load .env.local
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('MONGODB_URI=')) {
        process.env.MONGODB_URI = trimmed.replace('MONGODB_URI=', '').replace(/^["']|["']$/g, '').trim();
      }
      if (trimmed.startsWith('AUTH_SESSION_SECRET=')) {
        process.env.AUTH_SESSION_SECRET = trimmed.replace('AUTH_SESSION_SECRET=', '').replace(/^["']|["']$/g, '').trim();
      }
    }
  }
} catch {}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

const client = new MongoClient(uri);

async function runRegressionTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING CRITICAL WORKSPACE ISOLATION & DEPARTMENT REGRESSION SUITE');
  console.log('================================================================\n');

  await client.connect();
  const db = client.db('cursis');

  const usersCol = db.collection('users');
  const workspacesCol = db.collection('workspaces');
  const workspaceTeamsCol = db.collection('workspace_teams');
  const workspaceMembershipsCol = db.collection('workspace_memberships');
  const tasksCol = db.collection('tasks');
  const departmentsCol = db.collection('departments');

  const ts = Date.now();
  const WS_A_ID = `ws_alpha_${ts}`;
  const WS_B_ID = `ws_beta_${ts}`;

  const USER_ALEX = {
    id: `usr_alex_${ts}`,
    uid: `usr_alex_${ts}`,
    email: `alex_${ts}@example.com`,
    displayName: 'Alex Engineer',
    role: 'member',
    workspaceIds: [WS_A_ID, WS_B_ID],
    createdAt: new Date().toISOString(),
  };

  const USER_OUTSIDER = {
    id: `usr_outsider_${ts}`,
    uid: `usr_outsider_${ts}`,
    email: `outsider_${ts}@example.com`,
    displayName: 'Outsider User',
    role: 'member',
    workspaceIds: [`ws_other_${ts}`],
    createdAt: new Date().toISOString(),
  };

  const OWNER_A = {
    id: `usr_owner_a_${ts}`,
    uid: `usr_owner_a_${ts}`,
    email: `owner_a_${ts}@example.com`,
    displayName: 'Owner Alpha',
    role: 'owner',
    workspaceIds: [WS_A_ID],
    createdAt: new Date().toISOString(),
  };

  const ADMIN_A = {
    id: `usr_admin_a_${ts}`,
    uid: `usr_admin_a_${ts}`,
    email: `admin_a_${ts}@example.com`,
    displayName: 'Admin Alpha',
    role: 'admin',
    workspaceIds: [WS_A_ID],
    createdAt: new Date().toISOString(),
  };

  try {
    // 1. Seed Workspaces & Users
    console.log('1. Seeding Workspaces, Users & Memberships...');
    await workspacesCol.insertMany([
      { id: WS_A_ID, name: 'Workspace Alpha', ownerId: OWNER_A.uid, tier: 'free', createdAt: new Date().toISOString() },
      { id: WS_B_ID, name: 'Workspace Beta', ownerId: `usr_owner_b_${ts}`, tier: 'free', createdAt: new Date().toISOString() },
    ]);

    await usersCol.insertMany([USER_ALEX, USER_OUTSIDER, OWNER_A, ADMIN_A]);

    // Alex belongs to both Workspace A (as member) and Workspace B (as member)
    await workspaceMembershipsCol.insertMany([
      { id: `mem_a_${ts}`, workspaceId: WS_A_ID, userId: USER_ALEX.uid, role: 'member', createdAt: new Date().toISOString() },
      { id: `mem_b_${ts}`, workspaceId: WS_B_ID, userId: USER_ALEX.uid, role: 'member', createdAt: new Date().toISOString() },
      { id: `mem_admin_${ts}`, workspaceId: WS_A_ID, userId: ADMIN_A.uid, role: 'admin', createdAt: new Date().toISOString() },
    ]);

    await workspaceTeamsCol.insertMany([
      { id: `wtm_a_${ts}`, workspaceId: WS_A_ID, userId: USER_ALEX.uid, name: USER_ALEX.displayName, email: USER_ALEX.email, role: 'member' },
      { id: `wtm_b_${ts}`, workspaceId: WS_B_ID, userId: USER_ALEX.uid, name: USER_ALEX.displayName, email: USER_ALEX.email, role: 'member' },
      { id: `wtm_admin_${ts}`, workspaceId: WS_A_ID, userId: ADMIN_A.uid, name: ADMIN_A.displayName, email: ADMIN_A.email, role: 'admin' },
      { id: `wtm_owner_${ts}`, workspaceId: WS_A_ID, userId: OWNER_A.uid, name: OWNER_A.displayName, email: OWNER_A.email, role: 'owner' },
    ]);

    console.log('✅ Seeding complete.\n');

    // Dynamically import backend modules after DB connection
    const { getTasks, createTask, updateTask, deleteTask, getTaskById } = await import('./lib/db/tasks.ts');
    const { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentById } = await import('./lib/db/departments.ts');
    const { getUserWorkspaceRole, isWorkspaceMember } = await import('./lib/auth/rbac.ts');

    // -------------------------------------------------------------------------
    // TEST 1: Section 60 Mandatory Regression Test — Workspace Task Isolation
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 1: Section 60 — Workspace Data Isolation for Alex (Member of A and B)');

    const taskA = await createTask(WS_A_ID, {
      id: `tsk_a_${ts}`,
      title: 'Task A Alpha Sprint Work',
      assigneeId: USER_ALEX.uid,
      creatorId: OWNER_A.uid,
      status: 'in_progress',
    });

    const taskB = await createTask(WS_B_ID, {
      id: `tsk_b_${ts}`,
      title: 'Task B Beta Marketing Review',
      assigneeId: USER_ALEX.uid,
      creatorId: `usr_owner_b_${ts}`,
      status: 'todo',
    });

    // Query Workspace A tasks
    const tasksInA = await getTasks(WS_A_ID);
    const hasTaskAInA = tasksInA.some((t) => t.id === taskA.id);
    const hasTaskBInA = tasksInA.some((t) => t.id === taskB.id);

    console.log(`- Querying Workspace A: Task A present = ${hasTaskAInA}, Task B present = ${hasTaskBInA}`);
    if (!hasTaskAInA || hasTaskBInA) {
      throw new Error(`FAIL: Task isolation breached! Task B appeared in Workspace A or Task A missing.`);
    }
    console.log('✅ PASS: Workspace A contains ONLY Task A, zero leakage from Task B.');

    // Query Workspace B tasks
    const tasksInB = await getTasks(WS_B_ID);
    const hasTaskBInB = tasksInB.some((t) => t.id === taskB.id);
    const hasTaskAInB = tasksInB.some((t) => t.id === taskA.id);

    console.log(`- Querying Workspace B: Task B present = ${hasTaskBInB}, Task A present = ${hasTaskAInB}`);
    if (!hasTaskBInB || hasTaskAInB) {
      throw new Error(`FAIL: Task isolation breached! Task A appeared in Workspace B or Task B missing.`);
    }
    console.log('✅ PASS: Workspace B contains ONLY Task B, zero leakage from Task A.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Section 60 — Malicious Cross-Workspace Access & ID Tampering
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 2: Section 60 — Attempting malicious cross-workspace task manipulation');

    // Attempt to access Task A using Workspace B context
    const crossAccess = await getTaskById(taskA.id, WS_B_ID);
    if (crossAccess !== null) {
      throw new Error('FAIL: getTaskById returned Task A when queried with Workspace B context!');
    }
    console.log('✅ PASS: Task A cannot be retrieved under Workspace B context.');

    // Attempt to update Task A while providing Workspace B
    const crossUpdate = await updateTask(taskA.id, { title: 'Hacked Title' }, WS_B_ID);
    if (crossUpdate !== null) {
      throw new Error('FAIL: updateTask allowed modifying Task A under Workspace B context!');
    }
    console.log('✅ PASS: Task A cannot be updated under Workspace B context.');

    // Attempt to delete Task A while providing Workspace B
    const crossDelete = await deleteTask(taskA.id, WS_B_ID);
    if (crossDelete) {
      throw new Error('FAIL: deleteTask deleted Task A under Workspace B context!');
    }
    console.log('✅ PASS: Task A cannot be deleted under Workspace B context.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Section 60 — Assignee Membership Validation
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 3: Section 60 — Assigning Workspace B task to non-member');
    let outsiderErrorCaught = false;
    try {
      await createTask(WS_B_ID, {
        title: 'Unauthorized Outsider Task',
        assigneeId: USER_OUTSIDER.uid, // Not a member of Workspace B
      });
    } catch (err) {
      outsiderErrorCaught = true;
      console.log(`- Caught expected error: "${err.message}"`);
    }

    if (!outsiderErrorCaught) {
      throw new Error('FAIL: Backend accepted assigning Workspace B task to non-member Outsider!');
    }
    console.log('✅ PASS: Backend rejected assigning task to non-member.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Section 61 — Department RBAC Creation Tests
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 4: Section 61 — Department RBAC Creation');

    // Check roles
    const ownerRole = await getUserWorkspaceRole(OWNER_A.uid, WS_A_ID);
    const adminRole = await getUserWorkspaceRole(ADMIN_A.uid, WS_A_ID);
    const memberRole = await getUserWorkspaceRole(USER_ALEX.uid, WS_A_ID);

    console.log(`- Roles in Workspace A: Owner=${ownerRole}, Admin=${adminRole}, Member=${memberRole}`);
    if (ownerRole !== 'owner' || adminRole !== 'admin' || memberRole !== 'member') {
      throw new Error(`FAIL: Unexpected roles resolved: ${ownerRole}, ${adminRole}, ${memberRole}`);
    }

    // Owner creates department -> success
    const dept1 = await createDepartment(WS_A_ID, {
      name: 'Engineering Division',
      description: 'Core systems and platform development',
      createdBy: OWNER_A.uid,
    });
    console.log(`✅ PASS: Owner created department "${dept1.name}".`);

    // Admin creates department -> success
    const dept2 = await createDepartment(WS_A_ID, {
      name: 'Product & Design',
      description: 'UX and Product Research',
      createdBy: ADMIN_A.uid,
    });
    console.log(`✅ PASS: Admin created department "${dept2.name}".`);

    // Duplicate department name check
    let dupCaught = false;
    try {
      await createDepartment(WS_A_ID, {
        name: 'engineering division', // case-insensitive duplicate
        createdBy: OWNER_A.uid,
      });
    } catch (err) {
      dupCaught = true;
      console.log(`- Caught expected duplicate error: "${err.message}"`);
    }
    if (!dupCaught) {
      throw new Error('FAIL: Duplicate department name was allowed in the same workspace!');
    }
    console.log('✅ PASS: Duplicate department name properly rejected.');

    // -------------------------------------------------------------------------
    // TEST 5: Section 61 — Safe Department Deletion With Active Tasks
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 5: Section 61 — Safe Department Deletion With Active Tasks');

    // Assign a task to dept1
    const deptTask = await createTask(WS_A_ID, {
      title: 'Fix Engine Bug',
      departmentId: dept1.id,
      assigneeId: USER_ALEX.uid,
      status: 'in_progress',
    });

    // Attempting blind deletion without taskAction must fail
    let activeTasksPrompt = false;
    try {
      await deleteDepartment(dept1.id, WS_A_ID);
    } catch (err) {
      if (err.code === 'ACTIVE_TASKS_EXIST') {
        activeTasksPrompt = true;
        console.log(`- Caught expected safety prompt: "${err.message}" (Active tasks: ${err.activeTaskCount})`);
      }
    }
    if (!activeTasksPrompt) {
      throw new Error('FAIL: Department with active tasks was deleted blindly without handling prompt!');
    }
    console.log('✅ PASS: Blind deletion blocked; active task handling required.');

    // Reassign tasks to dept2 and complete deletion
    const deleteResult = await deleteDepartment(dept1.id, WS_A_ID, {
      taskAction: 'reassign',
      targetDepartmentId: dept2.id,
    });

    if (!deleteResult.success) {
      throw new Error('FAIL: Safe department deletion with reassign failed!');
    }

    // Verify task was reassigned to dept2
    const updatedTask = await getTaskById(deptTask.id, WS_A_ID);
    if (updatedTask?.departmentId !== dept2.id) {
      throw new Error(`FAIL: Task department was not reassigned to target department (found: ${updatedTask?.departmentId})`);
    }
    console.log(`✅ PASS: Safe department deletion succeeded and task reassigned to "${dept2.name}".`);

    // Verify dept1 is deleted
    const deletedDeptCheck = await getDepartmentById(dept1.id, WS_A_ID);
    if (deletedDeptCheck !== null) {
      throw new Error('FAIL: Deleted department still found in workspace!');
    }
    console.log('✅ PASS: Department record cleanly removed from workspace.');

    // -------------------------------------------------------------------------
    // TEST 6: Section 61 — Cross-Workspace Department Isolation
    // -------------------------------------------------------------------------
    console.log('\n🧪 TEST 6: Section 61 — Cross-Workspace Department Isolation');

    const deptsInB = await getDepartments(WS_B_ID);
    const dept2InB = deptsInB.some((d) => d.id === dept2.id);
    if (dept2InB) {
      throw new Error('FAIL: Department from Workspace A leaked into Workspace B!');
    }
    console.log('✅ PASS: Workspace B does NOT contain Workspace A departments.');

    // Attempt to delete Workspace A department using Workspace B
    let crossDeptDeleteCaught = false;
    try {
      await deleteDepartment(dept2.id, WS_B_ID);
    } catch (err) {
      crossDeptDeleteCaught = true;
    }
    if (!crossDeptDeleteCaught) {
      throw new Error('FAIL: Deleting Workspace A department using Workspace B context succeeded!');
    }
    console.log('✅ PASS: Cross-workspace department manipulation rejected.\n');

    console.log('================================================================');
    console.log('🎉 ALL CRITICAL REGRESSION TESTS PASSED (SECTIONS 60 & 61 VERIFIED)!');
    console.log('================================================================');
  } finally {
    // Cleanup test data
    console.log('\nCleaning up test collections...');
    await workspacesCol.deleteMany({ id: { $in: [WS_A_ID, WS_B_ID] } });
    await usersCol.deleteMany({ uid: { $in: [USER_ALEX.uid, USER_OUTSIDER.uid, OWNER_A.uid, ADMIN_A.uid] } });
    await workspaceMembershipsCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await workspaceTeamsCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await tasksCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await departmentsCol.deleteMany({ workspaceId: { $in: [WS_A_ID, WS_B_ID] } });
    await client.close();
    console.log('Cleanup complete.');
  }
}

runRegressionTestSuite().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
