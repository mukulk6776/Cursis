import { inMemoryStore } from './store';
import { AutomationRule } from './types';
import { logAuditEvent } from './audit';

export async function getAutomations(workspaceId: string): Promise<AutomationRule[]> {
  return Array.from(inMemoryStore.automations.values())
    .filter((a) => a.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createAutomation(workspaceId: string, data: Partial<AutomationRule>): Promise<AutomationRule> {
  const id = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const rule: AutomationRule = {
    id,
    workspaceId,
    name: data.name || 'Untitled Automation',
    description: data.description || '',
    isActive: data.isActive ?? true,
    trigger: data.trigger || { type: 'lead_created' },
    conditions: data.conditions || [],
    actions: data.actions || [],
    runCount: 0,
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.automations.set(id, rule);
  return rule;
}

export async function updateAutomation(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule | null> {
  const rule = inMemoryStore.automations.get(id);
  if (!rule) return null;

  const updated: AutomationRule = {
    ...rule,
    ...updates,
  };

  inMemoryStore.automations.set(id, updated);
  return updated;
}

// Execute automation rule
export async function executeAutomationRule(
  ruleId: string,
  eventPayload: Record<string, any>
): Promise<{ executed: boolean; reason?: string; actionResults: any[] }> {
  const rule = inMemoryStore.automations.get(ruleId);
  if (!rule || !rule.isActive) {
    return { executed: false, reason: 'Rule is inactive or not found', actionResults: [] };
  }

  // 1. Evaluate Conditions
  if (rule.conditions && rule.conditions.length > 0) {
    for (const cond of rule.conditions) {
      const actualValue = eventPayload[cond.field];
      if (cond.operator === 'equals' && actualValue !== cond.value) {
        return { executed: false, reason: `Condition failed: ${cond.field} !== ${cond.value}`, actionResults: [] };
      }
      if (cond.operator === 'greater_than' && Number(actualValue) <= Number(cond.value)) {
        return { executed: false, reason: `Condition failed: ${cond.field} <= ${cond.value}`, actionResults: [] };
      }
      if (cond.operator === 'contains' && !String(actualValue).includes(String(cond.value))) {
        return { executed: false, reason: `Condition failed: ${cond.field} does not contain ${cond.value}`, actionResults: [] };
      }
    }
  }

  // 2. Execute Actions
  const actionResults: any[] = [];
  for (const action of rule.actions) {
    let result = { actionType: action.type, status: 'success', timestamp: new Date().toISOString() };
    actionResults.push(result);
  }

  rule.runCount += 1;
  rule.lastRunAt = new Date().toISOString();
  inMemoryStore.automations.set(ruleId, rule);

  await logAuditEvent(rule.workspaceId, {
    actorType: 'automation_rule',
    actorId: rule.id,
    actorName: rule.name,
    action: 'automation.executed',
    targetType: 'automation_rule',
    targetId: rule.id,
    details: { payload: eventPayload, actionResults },
    isRollbackable: false,
  });

  return { executed: true, actionResults };
}
