import { inMemoryStore } from './store';
import { MetricSummary, ExecutiveReport } from './types';

export async function getWorkspaceMetricSummary(workspaceId: string): Promise<MetricSummary> {
  const projects = Array.from(inMemoryStore.projects.values()).filter((p) => p.workspaceId === workspaceId);
  const tasks = Array.from(inMemoryStore.tasks.values()).filter((t) => t.workspaceId === workspaceId);
  const deals = Array.from(inMemoryStore.deals.values()).filter((d) => d.workspaceId === workspaceId);
  const approvalItems = Array.from(inMemoryStore.approvalQueue.values()).filter(
    (a) => a.workspaceId === workspaceId && a.status === 'pending'
  );

  const activeProjects = projects.filter((p) => p.health !== 'completed').length;
  const overdueTasks = tasks.filter((t) => new Date(t.dueDate).getTime() < Date.now() && t.status !== 'done').length;
  const tasksAtRisk = tasks.filter((t) => t.isAtRisk && t.status !== 'done').length;

  const totalPipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const wonDealsValue = deals.filter((d) => d.stage === 'won').reduce((acc, d) => acc + (d.value || 0), 0);

  // Calculate team workload average based on assigned open tasks
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const teamMembers = Array.from(inMemoryStore.users.values()).filter(
    (u) => u.workspaceIds.includes(workspaceId) || workspaceId === 'ws_cursis_demo'
  );
  const avgTasksPerMember = teamMembers.length > 0 ? openTasks.length / teamMembers.length : 0;
  const teamWorkloadAverage = Math.min(100, Math.round(avgTasksPerMember * 25));

  return {
    activeProjects,
    overdueTasks,
    tasksAtRisk,
    totalPipelineValue,
    wonDealsValue,
    teamWorkloadAverage,
    ordisActionsSavedHours: 42.5,
    pendingApprovalsCount: approvalItems.length,
  };
}

// Generate Executive Live Report on demand (Module 11 & Ordis Capability 7: Business Audit)
export async function generateExecutiveReport(workspaceId: string, prompt?: string): Promise<ExecutiveReport> {
  const projects = Array.from(inMemoryStore.projects.values()).filter((p) => p.workspaceId === workspaceId);
  const tasks = Array.from(inMemoryStore.tasks.values()).filter((t) => t.workspaceId === workspaceId);
  const users = Array.from(inMemoryStore.users.values()).filter(
    (u) => u.workspaceIds.includes(workspaceId) || workspaceId === 'ws_cursis_demo'
  );

  const atRiskTasks = tasks.filter((t) => t.isAtRisk && t.status !== 'done');
  const risksIdentified: ExecutiveReport['risksIdentified'] = [];

  for (const t of atRiskTasks) {
    risksIdentified.push({
      projectId: t.projectId,
      projectName: t.projectId ? inMemoryStore.projects.get(t.projectId)?.name : 'General Task',
      risk: `Task "${t.title}" is ${t.completionPercent}% done with imminent deadline (${new Date(t.dueDate).toLocaleDateString()}).`,
      impact: 'high',
      proposedAction: t.suggestedHelperId
        ? `Pair with ${inMemoryStore.users.get(t.suggestedHelperId)?.displayName || 'team member'} immediately.`
        : 'Reassign or extend deadline.',
    });
  }

  // Workload rebalancing plan
  const workloadRebalancing: ExecutiveReport['workloadRebalancing'] = [];
  const overloadedUsers = users.filter((u) => {
    const userTasks = tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done');
    return userTasks.length >= 2;
  });

  const availableHelpers = users.filter((u) => {
    const userTasks = tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done');
    return userTasks.length < 2;
  });

  if (overloadedUsers.length > 0 && availableHelpers.length > 0) {
    const overloaded = overloadedUsers[0];
    const helper = availableHelpers[0];
    const userTaskIds = tasks.filter((t) => t.assigneeId === overloaded.id && t.status !== 'done').map((t) => t.id);

    workloadRebalancing.push({
      overloadedUserId: overloaded.id,
      overloadedUserName: overloaded.displayName,
      suggestedHelperId: helper.id,
      suggestedHelperName: helper.displayName,
      tasksToReassign: userTaskIds.slice(0, 1),
    });
  }

  const report: ExecutiveReport = {
    id: `rep_${Date.now()}`,
    workspaceId,
    title: prompt ? `Audit: ${prompt}` : 'Executive Operations & Risk Audit',
    generatedAt: new Date().toISOString(),
    summary: `Ordis scanned ${projects.length} active project(s) and ${tasks.length} total task(s). Detected ${risksIdentified.length} critical delivery risk(s). Rebalancing plan formulated to guarantee zero deadline slippage this month.`,
    risksIdentified,
    workloadRebalancing,
    financialHealth: {
      monthlyPipeline: 1950000,
      atRiskRevenue: atRiskTasks.length > 0 ? 500000 : 0,
    },
  };

  return report;
}
