import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { inMemoryStore } from '@/lib/db/store';
import { getTasks } from '@/lib/db/tasks';
import { getProjects } from '@/lib/db/projects';
import type { RiskRadarItem } from '@/lib/db/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetWorkspace = searchParams.get('workspaceId') || undefined;

    const wsAuth = await authorizeWorkspaceAccess(request, targetWorkspace);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const staticItems = Array.from(inMemoryStore.riskRadar.values()).filter((r) => r.workspaceId === workspaceId);

    let tasks: any[] = [];
    let projects: any[] = [];
    try {
      tasks = await getTasks(workspaceId);
      projects = await getProjects(workspaceId);
    } catch (e) {
      console.warn('Risk radar data fetch notice:', e);
    }

    const now = Date.now();
    const dynamicItems: RiskRadarItem[] = [];

    // Overdue tasks
    const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now);
    for (const t of overdueTasks) {
      dynamicItems.push({
        id: `risk_task_${t.id}`,
        workspaceId,
        targetType: 'task',
        targetId: t.id,
        targetName: t.title,
        riskScore: 85,
        reason: `Task is overdue since ${t.dueDate?.split('T')[0] || 'past deadline'}`,
        watchingSince: t.createdAt || new Date().toISOString(),
        suggestedMitigation: 'Reassign or extend delivery milestone',
        status: 'monitoring',
      });
    }

    // Blocked tasks
    const blockedTasks = tasks.filter((t) => t.status === 'blocked');
    for (const t of blockedTasks) {
      dynamicItems.push({
        id: `risk_blocked_${t.id}`,
        workspaceId,
        targetType: 'task',
        targetId: t.id,
        targetName: t.title,
        riskScore: 90,
        reason: 'Workstream blocked by unresolved dependency',
        watchingSince: t.updatedAt || t.createdAt || new Date().toISOString(),
        suggestedMitigation: 'Convene unblocking sync with assigned owner',
        status: 'escalated',
      });
    }

    // Delayed or at-risk projects
    const delayedProjects = projects.filter((p: any) => p.health === 'delayed' || p.health === 'at_risk');
    for (const p of delayedProjects) {
      dynamicItems.push({
        id: `risk_proj_${p.id}`,
        workspaceId,
        targetType: 'project',
        targetId: p.id,
        targetName: p.name,
        riskScore: (p as any).health === 'delayed' ? 85 : 70,
        reason: `Project health status is '${(p as any).health}' against deliverable target`,
        watchingSince: p.createdAt || new Date().toISOString(),
        suggestedMitigation: 'Conduct sprint review and revise milestone roadmap',
        status: 'monitoring',
      });
    }

    const allItems = [...staticItems, ...dynamicItems];
    const uniqueMap = new Map();
    for (const item of allItems) {
      uniqueMap.set(item.id, item);
    }
    const radarItems = Array.from(uniqueMap.values());

    return NextResponse.json({ radarItems });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to fetch risk radar items', 500);
  }
}
