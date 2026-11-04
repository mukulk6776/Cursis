import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { OrdisEngine } from '@/lib/ordis/server';
import { inMemoryStore } from '@/lib/db/store';
import { getTasks } from '@/lib/db/tasks';
import { getProjects } from '@/lib/db/projects';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const newCards = await OrdisEngine.runAmbientScan(wsAuth.workspaceId);
    const allCards = Array.from(inMemoryStore.ordisCards.values()).filter((c) => c.workspaceId === wsAuth.workspaceId);

    let tasks: any[] = [];
    let projects: any[] = [];
    try {
      tasks = await getTasks(wsAuth.workspaceId);
      projects = await getProjects(wsAuth.workspaceId);
    } catch {}

    const now = Date.now();
    const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now);
    const blockedTasks = tasks.filter((t) => t.status === 'blocked');
    const healthScore = (tasks.length === 0 && projects.length === 0)
      ? 100
      : Math.max(0, 100 - overdueTasks.length * 15 - blockedTasks.length * 20);

    return apiSuccess({
      newlyDetectedCount: newCards.length,
      activeCards: allCards,
      healthScore,
    });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const cards = Array.from(inMemoryStore.ordisCards.values()).filter((c) => c.workspaceId === wsAuth.workspaceId);

    let tasks: any[] = [];
    let projects: any[] = [];
    try {
      tasks = await getTasks(wsAuth.workspaceId);
      projects = await getProjects(wsAuth.workspaceId);
    } catch {}

    const now = Date.now();
    const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now);
    const blockedTasks = tasks.filter((t) => t.status === 'blocked');
    const healthScore = (tasks.length === 0 && projects.length === 0)
      ? 100
      : Math.max(0, 100 - overdueTasks.length * 15 - blockedTasks.length * 20);

    const metrics = {
      totalTasks: tasks.length,
      overdueTasks: overdueTasks.length,
      blockedTasks: blockedTasks.length,
      activeProjects: projects.length,
      activeAlerts: cards.length,
    };

    return apiSuccess({ cards, healthScore, metrics });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
