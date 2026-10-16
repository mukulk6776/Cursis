// Usage: node --env-file=.env.local migrations/repair-workspace-roles.cjs [--apply]
// Dry run by default. Back up the database and review the report before --apply.
const { MongoClient } = require('mongodb');

const memberRole = value => ['admin', 'manager', 'member', 'viewer', 'guest', 'client'].includes(value) ? value : 'member';

async function repair(db, apply = false, report = console.log) {
  const memberships = db.collection('workspace_memberships');
  const teams = db.collection('workspace_teams');
  const invitations = db.collection('invitations');
  for await (const workspace of db.collection('workspaces').find({})) {
    const workspaceId = workspace.id || workspace.workspaceId;
    if (!workspaceId || !workspace.ownerId) {
      report({ workspaceId, action: 'manual-review', reason: 'Missing authoritative owner; do not infer creator from user roles.' });
      continue;
    }
    if (await invitations.findOne({ workspaceId, inviteeUserId: workspace.ownerId, status: 'accepted' })) {
      report({ workspaceId, userId: workspace.ownerId, action: 'manual-review', reason: 'Recorded owner also accepted an invitation. Verify creator or explicit transfer history; ownerId will be preserved.' });
    }
    const records = new Map();
    for (const record of [...(workspace.members || []), ...await teams.find({ workspaceId }).toArray(), ...await memberships.find({ workspaceId }).toArray()]) {
      if (record.userId) records.set(record.userId, { ...records.get(record.userId), ...record, hadOwnerRole: record.role === 'owner' || records.get(record.userId)?.hadOwnerRole });
    }
    records.set(workspace.ownerId, { userId: workspace.ownerId, role: 'owner' });
    for (const [userId, record] of records) {
      const current = await memberships.findOne({ workspaceId, userId });
      let role = userId === workspace.ownerId ? 'owner' : memberRole(current?.role || record.role);
      if (userId !== workspace.ownerId && (current?.role === 'owner' || record.hadOwnerRole)) {
        const invitation = await invitations.findOne({ workspaceId, inviteeUserId: userId, status: 'accepted' }, { sort: { respondedAt: -1 } });
        role = current && current.role !== 'owner' ? memberRole(current.role) : invitation ? memberRole(invitation.workspaceRole) : 'member';
        report({ workspaceId, userId, from: 'owner', to: role, action: 'repair' });
      } else if (!current) {
        report({ workspaceId, userId, to: role, action: 'backfill-membership' });
      }
      if (apply) {
        await memberships.updateOne({ workspaceId, userId }, { $set: { role }, $setOnInsert: { id: `mem_${workspaceId}_${userId}`, workspaceId, userId, createdAt: record.createdAt || record.joinedAt || new Date().toISOString() } }, { upsert: true });
        await teams.updateMany({ workspaceId, userId }, { $set: { role } });
        if (workspace.members?.some(m => m.userId === userId)) {
          await db.collection('workspaces').updateOne({ _id: workspace._id }, { $set: { 'members.$[member].role': role } }, { arrayFilters: [{ 'member.userId': userId }] });
        }
      }
    }
  }
}

module.exports = { repair };
if (require.main === module) {
  (async () => {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      await repair(client.db(process.env.MONGODB_DB_NAME || undefined), process.argv.includes('--apply'));
    } finally { await client.close(); }
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
