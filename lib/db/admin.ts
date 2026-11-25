import getMongoPromise, { getCollection, getDb } from '@/lib/mongodb';
import { inMemoryStore } from './store';
import { inMemoryMemberships } from './memberships';
import { escapeRegex } from './team';
import { recordAdminAuditLog, getAdminAuditLogs } from './admin-audit';
import type {
  AccountStatus,
  AdminAuditLogEntry,
  Project,
  Task,
  UserPlanSubscription,
  UserProfile,
  Workspace,
  WorkspaceMembership,
  WorkspaceTeamMember,
} from './types';
import type { ActivePlanSummary } from '@/lib/dashboard/types';
import { PLAN_CATALOG, getPlanLimits, resolveActiveUserPlan, type PaidPlanKey } from '@/lib/plans';
import { isAdminEmail } from '@/lib/auth/admin';
import { eventBus } from '@/lib/realtime/event-bus';
import type { PaymentRecord } from './payments';

export interface AdminUserRow {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  accountStatus: AccountStatus;
  platformRole: 'admin' | 'user';
  emailVerified: boolean;
  activePlan: ActivePlanSummary | null;
  subscription: UserPlanSubscription | null;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  activePaidPlans: number;
  planBreakdown: {
    starter: number;
    pro: number;
    business: number;
  };
  totalWorkspaces: number;
  totalProjects: number;
}

export interface AdminUserDetail {
  user: AdminUserRow & {
    suspendedAt?: string | null;
    suspendedReason?: string | null;
    title?: string;
    department?: string;
  };
  workspaces: {
    ownedCount: number;
    memberCount: number;
    totalCount: number;
    items: Array<{
      id: string;
      name: string;
      tier: string;
      relation: 'owned' | 'member';
      memberCount: number;
      createdAt: string;
    }>;
  };
  projects: {
    totalCount: number;
    items: Array<{
      id: string;
      name: string;
      workspaceId: string;
      workspaceName: string;
      taskCount: number;
      completedTaskCount: number;
      health: string;
    }>;
  };
  tasks: {
    totalCount: number;
    projectTaskCount: number;
    standaloneTaskCount: number;
    byProject: Array<{
      projectId: string | null;
      projectName: string;
      workspaceId?: string;
      workspaceName?: string;
      taskCount: number;
      completedTaskCount: number;
    }>;
  };
  payments: Array<{
    id: string;
    orderId: string;
    paymentId?: string;
    planId: string;
    planName: string;
    amount: number;
    currency: string;
    status: string;
    paidAt?: string;
    createdAt: string;
  }>;
  auditHistory: AdminAuditLogEntry[];
}

function toSafeUserRow(u: Partial<UserProfile>): AdminUserRow {
  const uid = String(u.uid || u.id || '');
  const activePlan = resolveActiveUserPlan(u.subscription);
  return {
    uid,
    displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'Cursis User'),
    email: String(u.email || '').toLowerCase(),
    photoURL: u.photoURL || null,
    accountStatus: u.accountStatus === 'suspended' ? 'suspended' : 'active',
    platformRole: u.platformRole === 'admin' && u.emailVerified === true && isAdminEmail(u.email) ? 'admin' : 'user',
    emailVerified: Boolean(u.emailVerified),
    activePlan,
    subscription: u.subscription ?? null,
    createdAt: u.createdAt || new Date().toISOString(),
    lastActiveAt: u.lastActiveAt || null,
  };
}

async function runWithOptionalTransaction<T>(fn: (session?: any) => Promise<T>): Promise<T> {
  try {
    const client = await getMongoPromise;
    if (client) {
      const session = client.startSession();
      try {
        let output!: T;
        await session.withTransaction(async () => {
          output = await fn(session);
        });
        return output;
      } catch (txErr: any) {
        const msg = String(txErr?.message || '');
        if (/Transaction numbers are only allowed|replica set|does not support/i.test(msg)) {
          return await fn(undefined);
        }
        throw txErr;
      } finally {
        await session.endSession().catch(() => {});
      }
    }
  } catch (err: any) {
    if (err?.message && !/Transaction numbers are only allowed|replica set|does not support/i.test(err.message)) {
      throw err;
    }
  }
  return await fn(undefined);
}

/**
 * Computes global platform overview stats directly from MongoDB collections.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const db = await getDb();
  if (db) {
    const [usersDocs, totalWorkspaces, totalProjects] = await Promise.all([
      db
        .collection<UserProfile>('users')
        .find({}, { projection: { accountStatus: 1, subscription: 1 } })
        .toArray(),
      db.collection('workspaces').countDocuments({}),
      db.collection('projects').countDocuments({}),
    ]);

    let activeUsers = 0;
    let suspendedUsers = 0;
    let starter = 0;
    let pro = 0;
    let business = 0;

    for (const u of usersDocs) {
      if (u.accountStatus === 'suspended') {
        suspendedUsers++;
      } else {
        activeUsers++;
      }
      const activePlan = resolveActiveUserPlan(u.subscription);
      if (activePlan?.plan === 'starter') starter++;
      else if (activePlan?.plan === 'pro') pro++;
      else if (activePlan?.plan === 'business') business++;
    }

    return {
      totalUsers: usersDocs.length,
      activeUsers,
      suspendedUsers,
      activePaidPlans: starter + pro + business,
      planBreakdown: { starter, pro, business },
      totalWorkspaces,
      totalProjects,
    };
  }

  const users = Array.from(inMemoryStore.users.values());
  let activeUsers = 0;
  let suspendedUsers = 0;
  let starter = 0;
  let pro = 0;
  let business = 0;

  for (const u of users) {
    if (u.accountStatus === 'suspended') suspendedUsers++;
    else activeUsers++;
    const activePlan = resolveActiveUserPlan(u.subscription);
    if (activePlan?.plan === 'starter') starter++;
    else if (activePlan?.plan === 'pro') pro++;
    else if (activePlan?.plan === 'business') business++;
  }

  return {
    totalUsers: users.length,
    activeUsers,
    suspendedUsers,
    activePaidPlans: starter + pro + business,
    planBreakdown: { starter, pro, business },
    totalWorkspaces: inMemoryStore.workspaces.size,
    totalProjects: inMemoryStore.projects.size,
  };
}

/**
 * Server-side user directory query with search, filtering, sorting, and pagination.
 */
export async function listAdminUsers(params: {
  search?: string;
  status?: 'all' | 'active' | 'suspended';
  plan?: 'all' | 'none' | 'starter' | 'pro' | 'business';
  sortBy?: 'createdAt' | 'displayName' | 'email' | 'lastActiveAt' | 'accountStatus' | 'plan';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}): Promise<{
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const search = (params.search || '').trim();
  const status = params.status || 'all';
  const plan = params.plan || 'all';
  const sortBy = params.sortBy || 'createdAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Math.floor(params.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize || 20)));

  let rawUsers: Partial<UserProfile>[] = [];
  const usersCol = await getCollection<UserProfile>('users');

  if (usersCol) {
    const query: Record<string, any> = {};
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { displayName: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ];
    }
    if (status === 'suspended') {
      query.accountStatus = 'suspended';
    } else if (status === 'active') {
      query.accountStatus = { $ne: 'suspended' };
    }

    rawUsers = await usersCol
      .find(query, {
        projection: {
          _id: 0,
          passwordHash: 0,
          salt: 0,
          passwordReset: 0,
        },
      })
      .toArray();
  } else if (process.env.NODE_ENV !== 'production') {
    const dedup = new Map<string, UserProfile>();
    for (const u of inMemoryStore.users.values()) {
      const uid = u.uid || u.id;
      if (uid) dedup.set(uid, u);
    }
    rawUsers = Array.from(dedup.values()).filter((u) => {
      if (search) {
        const lower = search.toLowerCase();
        const matchesName = (u.displayName || '').toLowerCase().includes(lower);
        const matchesEmail = (u.email || '').toLowerCase().includes(lower);
        if (!matchesName && !matchesEmail) return false;
      }
      if (status === 'suspended' && u.accountStatus !== 'suspended') return false;
      if (status === 'active' && u.accountStatus === 'suspended') return false;
      return true;
    });
  }

  let rows = rawUsers.map(toSafeUserRow);

  if (plan !== 'all') {
    rows = rows.filter((r) => {
      if (plan === 'none') return r.activePlan === null;
      return r.activePlan?.plan === plan;
    });
  }

  const dir = sortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'displayName') {
      cmp = a.displayName.localeCompare(b.displayName);
    } else if (sortBy === 'email') {
      cmp = a.email.localeCompare(b.email);
    } else if (sortBy === 'accountStatus') {
      cmp = a.accountStatus.localeCompare(b.accountStatus);
    } else if (sortBy === 'plan') {
      cmp = (a.activePlan?.planName || '').localeCompare(b.activePlan?.planName || '');
    } else if (sortBy === 'lastActiveAt') {
      const ta = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
      const tb = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
      cmp = (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    } else {
      const ta = Date.parse(a.createdAt || '');
      const tb = Date.parse(b.createdAt || '');
      cmp = (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    }
    return cmp * dir;
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;

  return {
    users: rows.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    totalPages,
  };
}

/**
 * Fetches complete User Detail profile for the Admin Console:
 * owned vs member workspaces, projects count, per-project task counts, payment & audit trail.
 */
export async function getAdminUserDetail(targetUid: string): Promise<AdminUserDetail | null> {
  const cleanUid = (targetUid || '').trim();
  if (!cleanUid) return null;

  const db = await getDb();
  let userDoc: Partial<UserProfile> | null = null;

  if (db) {
    userDoc = await db.collection<UserProfile>('users').findOne(
      { $or: [{ uid: cleanUid }, { id: cleanUid }] },
      { projection: { _id: 0, passwordHash: 0, salt: 0, passwordReset: 0 } }
    );
  } else if (process.env.NODE_ENV !== 'production') {
    userDoc = inMemoryStore.users.get(cleanUid) || null;
  }

  if (!userDoc) return null;
  const uid = String(userDoc.uid || userDoc.id || cleanUid);

  // Gather owned & member-of workspaces
  const ownedWsMap = new Map<string, Workspace>();
  const memberWsMap = new Map<string, Workspace>();

  if (db) {
    const [memDocs, teamDocs, directlyOwnedOrListed] = await Promise.all([
      db.collection<WorkspaceMembership>('workspace_memberships').find({ userId: uid }).toArray(),
      db.collection<WorkspaceTeamMember>('workspace_teams').find({ userId: uid }).toArray(),
      db
        .collection<Workspace>('workspaces')
        .find({
          $or: [
            { ownerId: uid },
            { id: { $in: Array.from(new Set([...(userDoc.workspaceIds || []), userDoc.activeWorkspaceId, `ws_${uid}`].filter(Boolean) as string[])) } },
          ],
        })
        .toArray(),
    ]);

    const extraMemberWsIds = Array.from(
      new Set([
        ...memDocs.map((m) => m.workspaceId).filter(Boolean),
        ...teamDocs.map((t) => t.workspaceId).filter(Boolean),
        ...(userDoc.workspaceIds || []),
      ])
    );

    const missingIds = extraMemberWsIds.filter((id) => !directlyOwnedOrListed.some((w) => w.id === id));
    const additionalWorkspaces = missingIds.length
      ? await db.collection<Workspace>('workspaces').find({ id: { $in: missingIds } }).toArray()
      : [];

    for (const ws of [...directlyOwnedOrListed, ...additionalWorkspaces]) {
      if (ws.ownerId === uid || ws.id === `ws_${uid}`) {
        ownedWsMap.set(ws.id, ws);
        memberWsMap.delete(ws.id);
      } else if (!ownedWsMap.has(ws.id)) {
        memberWsMap.set(ws.id, ws);
      }
    }
  } else {
    const memWsIds = new Set<string>(userDoc.workspaceIds || []);
    for (const mem of inMemoryMemberships.values()) {
      if (mem.userId === uid) memWsIds.add(mem.workspaceId);
    }
    for (const ws of inMemoryStore.workspaces.values()) {
      if (ws.ownerId === uid || ws.id === `ws_${uid}`) {
        ownedWsMap.set(ws.id, ws);
        memberWsMap.delete(ws.id);
      } else if (memWsIds.has(ws.id) && !ownedWsMap.has(ws.id)) {
        memberWsMap.set(ws.id, ws);
      }
    }
  }

  const allWorkspaceIds = Array.from(new Set([...ownedWsMap.keys(), ...memberWsMap.keys()]));
  const workspaceNameLookup = new Map<string, string>();
  ownedWsMap.forEach((w) => workspaceNameLookup.set(w.id, w.name || w.id));
  memberWsMap.forEach((w) => workspaceNameLookup.set(w.id, w.name || w.id));

  // Gather projects across user's workspaces or directly associated with uid
  const projectMap = new Map<string, Project>();
  if (db) {
    const projectFilter: Record<string, any> =
      allWorkspaceIds.length > 0
        ? {
            $or: [
              { workspaceId: { $in: allWorkspaceIds } },
              { ownerId: uid },
              { leadId: uid },
              { teamMemberIds: uid },
            ],
          }
        : {
            $or: [{ ownerId: uid }, { leadId: uid }, { teamMemberIds: uid }],
          };
    const projDocs = await db.collection<Project>('projects').find(projectFilter).toArray();
    for (const p of projDocs) {
      projectMap.set(p.id, p);
    }
  } else {
    for (const p of inMemoryStore.projects.values()) {
      if (allWorkspaceIds.includes(p.workspaceId) || p.ownerId === uid || p.leadId === uid || p.teamMemberIds?.includes(uid)) {
        projectMap.set(p.id, p);
      }
    }
  }

  const projectIds = Array.from(projectMap.keys());
  const taskMap = new Map<string, Task>();
  if (db) {
    const taskOr: any[] = [{ assigneeId: uid }, { assignees: uid }, { creatorId: uid }];
    if (allWorkspaceIds.length > 0) taskOr.push({ workspaceId: { $in: allWorkspaceIds } });
    if (projectIds.length > 0) taskOr.push({ projectId: { $in: projectIds } });
    const taskDocs = await db.collection<Task>('tasks').find({ $or: taskOr }).toArray();
    for (const t of taskDocs) {
      taskMap.set(t.id, t);
    }
  } else {
    for (const t of inMemoryStore.tasks.values()) {
      if (
        allWorkspaceIds.includes(t.workspaceId) ||
        (t.projectId && projectIds.includes(t.projectId)) ||
        t.assigneeId === uid ||
        t.assignees?.includes(uid) ||
        t.creatorId === uid
      ) {
        taskMap.set(t.id, t);
      }
    }
  }

  const countsByProject = new Map<string, { total: number; done: number }>();
  let standaloneTotal = 0;
  let standaloneDone = 0;

  for (const t of taskMap.values()) {
    const isDone = t.status === 'done' || (t.status as string) === 'completed';
    if (t.projectId && projectMap.has(t.projectId)) {
      const current = countsByProject.get(t.projectId) || { total: 0, done: 0 };
      current.total += 1;
      if (isDone) current.done += 1;
      countsByProject.set(t.projectId, current);
    } else {
      standaloneTotal += 1;
      if (isDone) standaloneDone += 1;
    }
  }

  const projectItems = Array.from(projectMap.values())
    .map((p) => {
      const counts = countsByProject.get(p.id) || { total: 0, done: 0 };
      return {
        id: p.id,
        name: p.name,
        workspaceId: p.workspaceId,
        workspaceName: workspaceNameLookup.get(p.workspaceId) || p.workspaceId,
        taskCount: counts.total,
        completedTaskCount: counts.done,
        health: p.health || 'on_track',
      };
    })
    .sort((a, b) => b.taskCount - a.taskCount || a.name.localeCompare(b.name));

  const projectTaskCount = Array.from(countsByProject.values()).reduce((sum, c) => sum + c.total, 0);
  const byProject: AdminUserDetail['tasks']['byProject'] = projectItems.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    workspaceId: p.workspaceId,
    workspaceName: p.workspaceName,
    taskCount: p.taskCount,
    completedTaskCount: p.completedTaskCount,
  }));

  if (standaloneTotal > 0) {
    byProject.push({
      projectId: null,
      projectName: 'Independent Tasks (No Project)',
      taskCount: standaloneTotal,
      completedTaskCount: standaloneDone,
    });
  }

  const payments = db
    ? await db
        .collection<PaymentRecord>('payments')
        .find(
          { $or: [{ userId: uid }, { customerEmail: String(userDoc.email || '').toLowerCase() }] },
          { projection: { _id: 0, signature: 0 } }
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
    : [];

  const auditResult = await getAdminAuditLogs({ targetUserId: uid, page: 1, pageSize: 20 });

  const safeRow = toSafeUserRow(userDoc);
  const workspaceItems = [
    ...Array.from(ownedWsMap.values()).map((w) => ({
      id: w.id,
      name: w.name || w.id,
      tier: w.tier || 'free',
      relation: 'owned' as const,
      memberCount: w.memberCount || 1,
      createdAt: w.createdAt || '',
    })),
    ...Array.from(memberWsMap.values()).map((w) => ({
      id: w.id,
      name: w.name || w.id,
      tier: w.tier || 'free',
      relation: 'member' as const,
      memberCount: w.memberCount || 1,
      createdAt: w.createdAt || '',
    })),
  ];

  return {
    user: {
      ...safeRow,
      suspendedAt: userDoc.suspendedAt || null,
      suspendedReason: userDoc.suspendedReason || null,
      title: userDoc.title,
      department: userDoc.department,
    },
    workspaces: {
      ownedCount: ownedWsMap.size,
      memberCount: memberWsMap.size,
      totalCount: ownedWsMap.size + memberWsMap.size,
      items: workspaceItems,
    },
    projects: {
      totalCount: projectItems.length,
      items: projectItems,
    },
    tasks: {
      totalCount: projectTaskCount + standaloneTotal,
      projectTaskCount,
      standaloneTaskCount: standaloneTotal,
      byProject,
    },
    payments: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      paymentId: p.paymentId,
      planId: p.planId,
      planName: p.planName,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    auditHistory: auditResult.logs,
  };
}

/**
 * Assigns or changes a user's subscription plan transactionally and audits the change.
 */
export async function adminAssignUserPlan(params: {
  adminUser: { uid: string; email: string; displayName?: string };
  targetUid: string;
  plan: PaidPlanKey;
  expiresAt?: string | null;
  reason?: string;
  ipAddress?: string;
}): Promise<{ user: AdminUserRow; affectedWorkspaceIds: string[] }> {
  const cleanTargetUid = (params.targetUid || '').trim();
  const planMeta = PLAN_CATALOG[params.plan];
  if (!planMeta || (params.plan !== 'starter' && params.plan !== 'pro' && params.plan !== 'business')) {
    throw new Error('Invalid plan specified.');
  }

  let normalizedExpiry: string | null = null;
  if (params.expiresAt && String(params.expiresAt).trim()) {
    const parsedMs = Date.parse(String(params.expiresAt).trim());
    if (!Number.isFinite(parsedMs) || parsedMs <= Date.now()) {
      throw new Error('Plan expiry date must be a valid future date.');
    }
    normalizedExpiry = new Date(parsedMs).toISOString();
  }

  const now = new Date().toISOString();
  const limits = getPlanLimits(params.plan);
  const nextOrdisMode = limits.hasOrdisAi ? 'full_power' : 'chill';

  const result = await runWithOptionalTransaction(async (session) => {
    const db = await getDb();
    let existingUser: UserProfile | null = null;
    const touchedWorkspaces = new Set<string>([`ws_${cleanTargetUid}`]);

    if (db) {
      const usersCol = db.collection<UserProfile>('users');
      const wsCol = db.collection<Workspace>('workspaces');
      existingUser = await usersCol.findOne(
        { $or: [{ uid: cleanTargetUid }, { id: cleanTargetUid }] },
        session ? { session } : undefined
      );
      if (!existingUser) {
        throw new Error('Target user not found.');
      }

      const oldSub = existingUser.subscription || null;
      const hadActivePlan = Boolean(resolveActiveUserPlan(oldSub));
      const nextSub: UserPlanSubscription = {
        plan: params.plan,
        planName: planMeta.name,
        status: 'active',
        source: 'admin',
        startedAt: now,
        expiresAt: normalizedExpiry,
        assignedBy: params.adminUser.email,
        updatedAt: now,
      };

      const updatedUser = await usersCol.findOneAndUpdate(
        { uid: existingUser.uid },
        {
          $set: {
            subscription: nextSub,
            updatedAt: now,
          },
        },
        { returnDocument: 'after', ...(session ? { session } : {}) }
      );

      const wsFilter = { $or: [{ ownerId: existingUser.uid }, { id: `ws_${existingUser.uid}` }] };
      const existingWs = await wsCol.find(wsFilter, { projection: { id: 1 }, ...(session ? { session } : {}) }).toArray();
      existingWs.forEach((w) => touchedWorkspaces.add(w.id));

      await wsCol.updateMany(
        wsFilter,
        {
          $set: {
            tier: params.plan,
            ordisMode: nextOrdisMode,
            planSource: 'admin',
            planStartedAt: now,
            planExpiresAt: normalizedExpiry,
            updatedAt: now,
          },
        },
        session ? { session } : undefined
      );

      await recordAdminAuditLog(
        {
          adminId: params.adminUser.uid,
          adminEmail: params.adminUser.email,
          adminName: params.adminUser.displayName,
          targetUserId: existingUser.uid,
          targetUserEmail: existingUser.email,
          targetUserName: existingUser.displayName,
          action: hadActivePlan ? 'plan.changed' : 'plan.assigned',
          oldValue: oldSub ? { plan: oldSub.plan, status: oldSub.status, source: oldSub.source, expiresAt: oldSub.expiresAt || null } : null,
          newValue: { plan: nextSub.plan, status: nextSub.status, source: nextSub.source, expiresAt: nextSub.expiresAt || null },
          details: params.reason?.trim() || `Assigned ${planMeta.name} via Admin Console`,
          ipAddress: params.ipAddress,
        },
        session
      );

      if (updatedUser) {
        inMemoryStore.users.set(updatedUser.uid, updatedUser);
        return { user: toSafeUserRow(updatedUser), affectedWorkspaceIds: Array.from(touchedWorkspaces) };
      }
      throw new Error('Failed to update target user.');
    }

    // Non-production in-memory fallback
    const memUser = inMemoryStore.users.get(cleanTargetUid);
    if (!memUser) {
      throw new Error('Target user not found.');
    }
    const oldSub = memUser.subscription || null;
    const hadActivePlan = Boolean(resolveActiveUserPlan(oldSub));
    const nextSub: UserPlanSubscription = {
      plan: params.plan,
      planName: planMeta.name,
      status: 'active',
      source: 'admin',
      startedAt: now,
      expiresAt: normalizedExpiry,
      assignedBy: params.adminUser.email,
      updatedAt: now,
    };
    memUser.subscription = nextSub;
    inMemoryStore.users.set(memUser.uid, memUser);

    for (const ws of inMemoryStore.workspaces.values()) {
      if (ws.ownerId === memUser.uid || ws.id === `ws_${memUser.uid}`) {
        ws.tier = params.plan;
        ws.ordisMode = nextOrdisMode;
        ws.planSource = 'admin';
        ws.planStartedAt = now;
        ws.planExpiresAt = normalizedExpiry;
        ws.updatedAt = now;
        touchedWorkspaces.add(ws.id);
      }
    }

    await recordAdminAuditLog({
      adminId: params.adminUser.uid,
      adminEmail: params.adminUser.email,
      adminName: params.adminUser.displayName,
      targetUserId: memUser.uid,
      targetUserEmail: memUser.email,
      targetUserName: memUser.displayName,
      action: hadActivePlan ? 'plan.changed' : 'plan.assigned',
      oldValue: oldSub ? { plan: oldSub.plan, status: oldSub.status, source: oldSub.source } : null,
      newValue: { plan: nextSub.plan, status: nextSub.status, source: nextSub.source, expiresAt: nextSub.expiresAt || null },
      details: params.reason?.trim() || `Assigned ${planMeta.name} via Admin Console`,
      ipAddress: params.ipAddress,
    });

    return { user: toSafeUserRow(memUser), affectedWorkspaceIds: Array.from(touchedWorkspaces) };
  });

  // Sync in-memory workspace cache and notify active SSE clients immediately
  for (const wsId of result.affectedWorkspaceIds) {
    const cachedWs = inMemoryStore.workspaces.get(wsId);
    if (cachedWs) {
      cachedWs.tier = params.plan;
      cachedWs.ordisMode = nextOrdisMode;
      cachedWs.planSource = 'admin';
      cachedWs.planStartedAt = now;
      cachedWs.planExpiresAt = normalizedExpiry;
      cachedWs.updatedAt = now;
    }
    eventBus.emit('workspace.updated', wsId, { userId: result.user.uid, reason: 'plan_updated', plan: params.plan });
  }

  return result;
}

/**
 * Revokes a user's active plan transactionally and audits the change.
 */
export async function adminRevokeUserPlan(params: {
  adminUser: { uid: string; email: string; displayName?: string };
  targetUid: string;
  reason?: string;
  ipAddress?: string;
}): Promise<{ user: AdminUserRow; affectedWorkspaceIds: string[] }> {
  const cleanTargetUid = (params.targetUid || '').trim();
  const now = new Date().toISOString();

  const result = await runWithOptionalTransaction(async (session) => {
    const db = await getDb();
    const touchedWorkspaces = new Set<string>([`ws_${cleanTargetUid}`]);

    if (db) {
      const usersCol = db.collection<UserProfile>('users');
      const wsCol = db.collection<Workspace>('workspaces');
      const existingUser = await usersCol.findOne(
        { $or: [{ uid: cleanTargetUid }, { id: cleanTargetUid }] },
        session ? { session } : undefined
      );
      if (!existingUser) {
        throw new Error('Target user not found.');
      }

      const oldSub = existingUser.subscription || null;
      const nextSub: UserPlanSubscription | null = oldSub
        ? { ...oldSub, status: 'revoked', updatedAt: now }
        : null;

      const updatedUser = await usersCol.findOneAndUpdate(
        { uid: existingUser.uid },
        {
          $set: {
            subscription: nextSub,
            updatedAt: now,
          },
        },
        { returnDocument: 'after', ...(session ? { session } : {}) }
      );

      const wsFilter = { $or: [{ ownerId: existingUser.uid }, { id: `ws_${existingUser.uid}` }] };
      const existingWs = await wsCol.find(wsFilter, { projection: { id: 1 }, ...(session ? { session } : {}) }).toArray();
      existingWs.forEach((w) => touchedWorkspaces.add(w.id));

      await wsCol.updateMany(
        wsFilter,
        {
          $set: {
            tier: 'free',
            ordisMode: 'chill',
            planExpiresAt: null,
            updatedAt: now,
          },
        },
        session ? { session } : undefined
      );

      await recordAdminAuditLog(
        {
          adminId: params.adminUser.uid,
          adminEmail: params.adminUser.email,
          adminName: params.adminUser.displayName,
          targetUserId: existingUser.uid,
          targetUserEmail: existingUser.email,
          targetUserName: existingUser.displayName,
          action: 'plan.revoked',
          oldValue: oldSub ? { plan: oldSub.plan, status: oldSub.status, source: oldSub.source } : null,
          newValue: nextSub ? { plan: nextSub.plan, status: nextSub.status, source: nextSub.source } : null,
          details: params.reason?.trim() || 'Plan revoked via Admin Console',
          ipAddress: params.ipAddress,
        },
        session
      );

      if (updatedUser) {
        inMemoryStore.users.set(updatedUser.uid, updatedUser);
        return { user: toSafeUserRow(updatedUser), affectedWorkspaceIds: Array.from(touchedWorkspaces) };
      }
      throw new Error('Failed to revoke user plan.');
    }

    const memUser = inMemoryStore.users.get(cleanTargetUid);
    if (!memUser) {
      throw new Error('Target user not found.');
    }
    const oldSub = memUser.subscription || null;
    const nextSub: UserPlanSubscription | null = oldSub ? { ...oldSub, status: 'revoked', updatedAt: now } : null;
    memUser.subscription = nextSub;
    inMemoryStore.users.set(memUser.uid, memUser);

    for (const ws of inMemoryStore.workspaces.values()) {
      if (ws.ownerId === memUser.uid || ws.id === `ws_${memUser.uid}`) {
        ws.tier = 'free';
        ws.ordisMode = 'chill';
        ws.planExpiresAt = null;
        ws.updatedAt = now;
        touchedWorkspaces.add(ws.id);
      }
    }

    await recordAdminAuditLog({
      adminId: params.adminUser.uid,
      adminEmail: params.adminUser.email,
      adminName: params.adminUser.displayName,
      targetUserId: memUser.uid,
      targetUserEmail: memUser.email,
      targetUserName: memUser.displayName,
      action: 'plan.revoked',
      oldValue: oldSub ? { plan: oldSub.plan, status: oldSub.status, source: oldSub.source } : null,
      newValue: nextSub ? { plan: nextSub.plan, status: nextSub.status, source: nextSub.source } : null,
      details: params.reason?.trim() || 'Plan revoked via Admin Console',
      ipAddress: params.ipAddress,
    });

    return { user: toSafeUserRow(memUser), affectedWorkspaceIds: Array.from(touchedWorkspaces) };
  });

  for (const wsId of result.affectedWorkspaceIds) {
    const cachedWs = inMemoryStore.workspaces.get(wsId);
    if (cachedWs) {
      cachedWs.tier = 'free';
      cachedWs.ordisMode = 'chill';
      cachedWs.planExpiresAt = null;
      cachedWs.updatedAt = now;
    }
    eventBus.emit('workspace.updated', wsId, { userId: result.user.uid, reason: 'plan_revoked' });
  }

  return result;
}

/**
 * Suspends or re-activates a user account.
 * Immediately invalidates active session tokens when suspended.
 */
export async function adminSetUserStatus(params: {
  adminUser: { uid: string; email: string; displayName?: string };
  targetUid: string;
  status: AccountStatus;
  reason?: string;
  ipAddress?: string;
}): Promise<AdminUserRow> {
  const cleanTargetUid = (params.targetUid || '').trim();
  const nextStatus: AccountStatus = params.status === 'suspended' ? 'suspended' : 'active';
  const now = new Date().toISOString();

  const db = await getDb();
  if (db) {
    const usersCol = db.collection<UserProfile>('users');
    const existing = await usersCol.findOne({ $or: [{ uid: cleanTargetUid }, { id: cleanTargetUid }] });
    if (!existing) {
      throw new Error('Target user not found.');
    }

    if (nextStatus === 'suspended' && (existing.uid === params.adminUser.uid || isAdminEmail(existing.email))) {
      throw new Error('Cannot suspend the platform administrator account.');
    }

    const oldStatus: AccountStatus = existing.accountStatus === 'suspended' ? 'suspended' : 'active';
    const setFields: Record<string, any> = {
      accountStatus: nextStatus,
      suspendedAt: nextStatus === 'suspended' ? now : null,
      suspendedReason: nextStatus === 'suspended' ? (params.reason?.trim() || 'Suspended by administrator') : null,
      updatedAt: now,
    };
    if (nextStatus === 'suspended') {
      setFields.passwordChangedAt = Date.now();
    }

    const updated = await usersCol.findOneAndUpdate(
      { uid: existing.uid },
      { $set: setFields },
      { returnDocument: 'after' }
    );

    await recordAdminAuditLog({
      adminId: params.adminUser.uid,
      adminEmail: params.adminUser.email,
      adminName: params.adminUser.displayName,
      targetUserId: existing.uid,
      targetUserEmail: existing.email,
      targetUserName: existing.displayName,
      action: nextStatus === 'suspended' ? 'user.suspended' : 'user.activated',
      oldValue: { accountStatus: oldStatus },
      newValue: { accountStatus: nextStatus, reason: setFields.suspendedReason },
      details: params.reason?.trim() || (nextStatus === 'suspended' ? 'Account suspended' : 'Account re-activated'),
      ipAddress: params.ipAddress,
    });

    if (!updated) throw new Error('Failed to update user status.');
    inMemoryStore.users.set(updated.uid, updated);
    return toSafeUserRow(updated);
  }

  const memUser = inMemoryStore.users.get(cleanTargetUid);
  if (!memUser) throw new Error('Target user not found.');
  if (nextStatus === 'suspended' && (memUser.uid === params.adminUser.uid || isAdminEmail(memUser.email))) {
    throw new Error('Cannot suspend the platform administrator account.');
  }

  const oldStatus: AccountStatus = memUser.accountStatus === 'suspended' ? 'suspended' : 'active';
  memUser.accountStatus = nextStatus;
  memUser.suspendedAt = nextStatus === 'suspended' ? now : null;
  memUser.suspendedReason = nextStatus === 'suspended' ? (params.reason?.trim() || 'Suspended by administrator') : null;
  if (nextStatus === 'suspended') memUser.passwordChangedAt = Date.now();
  inMemoryStore.users.set(memUser.uid, memUser);

  await recordAdminAuditLog({
    adminId: params.adminUser.uid,
    adminEmail: params.adminUser.email,
    adminName: params.adminUser.displayName,
    targetUserId: memUser.uid,
    targetUserEmail: memUser.email,
    targetUserName: memUser.displayName,
    action: nextStatus === 'suspended' ? 'user.suspended' : 'user.activated',
    oldValue: { accountStatus: oldStatus },
    newValue: { accountStatus: nextStatus, reason: memUser.suspendedReason },
    details: params.reason?.trim() || (nextStatus === 'suspended' ? 'Account suspended' : 'Account re-activated'),
    ipAddress: params.ipAddress,
  });

  return toSafeUserRow(memUser);
}
