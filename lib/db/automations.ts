import { inMemoryStore } from './store';
import { AutomationRule } from './types';
import { logAuditEvent } from './audit';
import { getCollection } from '@/lib/mongodb';

export async function getAutomations(workspaceId: string): Promise<AutomationRule[]> {
  try {
    const col = await getCollection<AutomationRule>('automations');
    if (col) {
      const docs = await col.find({ workspaceId }).sort({ createdAt: -1 }).toArray();
      docs.forEach((a) => inMemoryStore.automations.set(a.id, a));
      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getAutomations notice:', e);
  }

  return Array.from(inMemoryStore.automations.values())
    .filter((a) => a.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAutomationById(id: string): Promise<AutomationRule | null> {
  const mem = inMemoryStore.automations.get(id);
  if (mem) return mem;

  try {
    const col = await getCollection<AutomationRule>('automations');
    if (col) {
      const found = await col.findOne({ id });
      if (found) {
        inMemoryStore.automations.set(id, found);
        return found;
      }
    }
  } catch (e) {
    console.warn('MongoDB getAutomationById notice:', e);
  }

  return null;
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

  try {
    const col = await getCollection<AutomationRule>('automations');
    if (col) {
      await col.insertOne(rule);
    }
  } catch (e) {
    console.warn('MongoDB insert automation notice:', e);
  }

  return rule;
}

export async function updateAutomation(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule | null> {
  const rule = await getAutomationById(id);
  if (!rule) return null;

  const updated: AutomationRule = {
    ...rule,
    ...updates,
  };

  inMemoryStore.automations.set(id, updated);

  try {
    const col = await getCollection<AutomationRule>('automations');
    if (col) {
      await col.updateOne({ id }, { $set: updated }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB update automation notice:', e);
  }

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
    try {
      if ((action.type as string) === 'create_task' || action.type === 'assign_task') {
        const { createTask } = await import('./tasks');
        const task = await createTask(rule.workspaceId, {
          title: action.config?.title || 'Automated Task',
          description: action.config?.description || `Action triggered by automation: ${rule.name}`,
          priority: action.config?.priority || 'medium',
          status: 'todo',
          assigneeId: action.config?.assigneeId,
        });
        actionResults.push({
          actionType: action.type,
          status: 'success',
          taskId: task.id,
          timestamp: new Date().toISOString(),
        });
      } else if (action.type === 'create_crm_deal') {
        const { createDeal } = await import('./crm');
        const deal = await createDeal(rule.workspaceId, action.config || {});
        actionResults.push({
          actionType: action.type,
          status: 'success',
          dealId: deal.id,
          timestamp: new Date().toISOString(),
        });
      } else if (action.type === 'call_webhook') {
        const { executeExternalAction } = await import('./integrations');
        const res = await executeExternalAction(rule.workspaceId, 'trigger_webhook', action.config || {});
        actionResults.push({
          actionType: action.type,
          status: res.success ? 'success' : 'failed',
          details: res.responseMessage,
          timestamp: new Date().toISOString(),
        });
      } else {
        actionResults.push({
          actionType: action.type,
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      actionResults.push({
        actionType: action.type,
        status: 'failed',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  rule.runCount += 1;
  rule.lastRunAt = new Date().toISOString();
  inMemoryStore.automations.set(ruleId, rule);

  try {
    const col = await getCollection<AutomationRule>('automations');
    if (col) {
      await col.updateOne({ id: ruleId }, { $set: { runCount: rule.runCount, lastRunAt: rule.lastRunAt } });
    }
  } catch {}

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
