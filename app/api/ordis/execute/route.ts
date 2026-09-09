import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getTasks, createTask } from '@/lib/db/tasks';
import { createProject } from '@/lib/db/projects';
import { getCollection } from '@/lib/mongodb';
import { AuditLogEntry } from '@/lib/db/types';

export async function POST(request: Request) {
 try {
 const auth = await getAuthOrError(request);
 if (auth.errorResponse) return auth.errorResponse;
 const authUser = auth.user;

 const body = await request.json().catch(() => ({}));
 const text = body.prompt || body.text || body.command;

 if (!text || typeof text !== 'string' || !text.trim()) {
 return apiError('Command or prompt text is required', 400);
 }

 const workspaceId = body.workspaceId || authUser.workspaceId || 'ws_cursis_main';
 const lower = text.toLowerCase().trim();

 let actionExecuted = 'general_query';
 let responseText = '';
 let resultPayload: any = null;

 // 1. Task Creation
 if (lower.includes('create task') || lower.includes('add task') || lower.includes('task for')) {
 const taskName = text.includes(':') ? text.split(':')[1].trim() : text.replace(/create task|add task|task for/gi, '').trim() || 'Sprint Deliverable';
 const newTask = await createTask(workspaceId, {
 title: taskName,
 creatorId: authUser.uid,
 status: 'todo',
 priority: lower.includes('urgent') ? 'urgent' : 'high',
 });
 actionExecuted = 'task.created';
 resultPayload = { task: newTask };
 responseText = ` **Task Created in MongoDB**\n\n• **Title**: "${newTask.title}"\n• **ID**: \`${newTask.id}\`\n• **Priority**: ${newTask.priority.toUpperCase()}\n• **Status**: TODO\n\n Persisted to MongoDB tasks collection.`;
 }
 // 2. Project Creation
 else if (lower.includes('create project') || lower.includes('new project')) {
 const projName = text.includes(':') ? text.split(':')[1].trim() : text.replace(/create project|new project/gi, '').trim() || 'Core Initiative';
 const newProj = await createProject(workspaceId, {
 name: projName,
 ownerId: authUser.uid,
 });
 actionExecuted = 'project.created';
 resultPayload = { project: newProj };
 responseText = ` **Project Initialized in MongoDB**\n\n• **Name**: "${newProj.name}"\n• **ID**: \`${newProj.id}\`\n• **Budget**: ₹${newProj.budget.toLocaleString()}\n\n Stored in MongoDB projects collection.`;
 }
 // 3. Query Tasks / Telemetry
 else if (lower.includes('tasks') || lower.includes('deadlines')) {
 const tasks = await getTasks(workspaceId);
 actionExecuted = 'tasks.query';
 resultPayload = { count: tasks.length, tasks };
 responseText = ` **Active Workspace Tasks (${tasks.length})**\n\n${tasks.slice(0, 5).map((t, i) => `${i + 1}. **${t.title}** (${t.status.toUpperCase()} - Due: ${t.dueDate.split('T')[0]})`).join('\n') || 'No tasks found. Create your first task to start tracking velocity.'}`;
 }
 // 4. Default / Knowledge Synthesis
 else {
 actionExecuted = 'ordis.query';
 responseText = `**Ordis Intelligence Engine**\n\nParsed request: "${text}".\nSupported operations: Task creation, project initialization, meeting booking, CRM lead tracking, and automated document generation.`;
 }

 // Record audit log entry in MongoDB
 try {
 const auditCol = await getCollection<AuditLogEntry>('audit_logs');
 if (auditCol) {
 await auditCol.insertOne({
 id: 'aud_' + Date.now(),
 workspaceId,
 actorType: 'ordis_assisted',
 actorId: authUser.uid,
 actorName: authUser.displayName,
 action: actionExecuted,
 targetType: 'ordis_command',
 targetId: text.substring(0, 40),
 details: { command: text, result: resultPayload },
 isRollbackable: false,
 createdAt: new Date().toISOString(),
 });
 }
 } catch (e) {
 console.warn('MongoDB audit logging notice:', e);
 }

 return apiSuccess({
 responseText,
 actionExecuted,
 result: resultPayload,
 });
 } catch (error: any) {
 return apiError(error.message || 'Failed to execute Ordis command', 500);
 }
}
