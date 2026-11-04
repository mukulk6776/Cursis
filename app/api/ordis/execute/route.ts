import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getTasks, createTask } from '@/lib/db/tasks';
import { createProject } from '@/lib/db/projects';
import { logAuditEvent } from '@/lib/db/audit';

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

 const rawWorkspaceId = body.workspaceId || '';
 const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
 if (wsAuth.errorResponse) return wsAuth.errorResponse;
 const workspaceId = wsAuth.workspaceId;
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
 const dueStr = newTask.dueDate ? ` · Due ${new Date(newTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}` : '';
 responseText = `**Task Created**\n\n- **${newTask.title}** — To do · ${newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1)} priority · Assigned${dueStr}`;
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
 responseText = `**Project Initialized**\n\n- **${newProj.name}** — In planning · Budget ₹${(newProj.budget || 0).toLocaleString()}`;
 }
 // 3. Query Tasks / Telemetry
 else if (lower.includes('tasks') || lower.includes('deadlines')) {
 const tasks = await getTasks(workspaceId);
 actionExecuted = 'tasks.query';
 resultPayload = { count: tasks.length, tasks };
 if (tasks.length === 0) {
    responseText = 'No tasks found. Create your first task to start tracking velocity.';
  } else {
    const taskLines = tasks.slice(0, 5).map((t) => {
      const dueStr = t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}` : '';
      const statusStr = (t.status || 'todo').replace(/_/g, ' ');
      const capStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
      const prioStr = (t.priority || 'medium').charAt(0).toUpperCase() + (t.priority || 'medium').slice(1) + ' priority';
      return `- **${t.title}** — ${capStatus} · ${prioStr}${dueStr}`;
    });
    responseText = `Here are your ${Math.min(5, tasks.length)} active tasks:\n\n${taskLines.join('\n')}`;
  }
 }
 // 4. Default / Knowledge Synthesis
 else {
 actionExecuted = 'ordis.query';
 responseText = `**Ordis Intelligence Engine**\n\nParsed request: "${text}".\nSupported operations: Task creation, project initialization, meeting booking, CRM lead tracking, and automated document generation.`;
 }

  // Record audit log entry
  try {
    await logAuditEvent(workspaceId, {
      actorType: 'ordis_assisted',
      actorId: authUser.uid,
      actorName: authUser.displayName || 'Ordis User',
      action: actionExecuted,
      targetType: 'ordis_command',
      targetId: text.substring(0, 40),
      details: { command: text, result: resultPayload },
      isRollbackable: false,
    });
  } catch (e) {
    console.warn('Ordis execute audit logging notice:', e);
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
