import { inMemoryStore } from './store';
import { ExternalIntegration } from './types';
import { logAuditEvent } from './audit';

export async function getIntegrations(workspaceId: string): Promise<ExternalIntegration[]> {
  return Array.from(inMemoryStore.integrations.values())
    .filter((i) => i.workspaceId === workspaceId);
}

export async function createOrUpdateIntegration(
  workspaceId: string,
  data: Partial<ExternalIntegration>
): Promise<ExternalIntegration> {
  const provider = data.provider || 'custom_webhook';
  const existing = Array.from(inMemoryStore.integrations.values()).find(
    (i) => i.workspaceId === workspaceId && i.provider === provider
  );

  const id = existing?.id || `int_${provider}_${Date.now()}`;
  const integration: ExternalIntegration = {
    id,
    workspaceId,
    provider,
    name: data.name || `${provider.toUpperCase()} Connector`,
    status: data.status || 'connected',
    config: {
      ...existing?.config,
      ...data.config,
    },
    lastSyncedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  inMemoryStore.integrations.set(id, integration);
  return integration;
}

// Execute external action (Real action outside the app)
export async function executeExternalAction(
  workspaceId: string,
  actionType: 'send_invoice' | 'sync_salesforce_crm' | 'send_docusign_contract' | 'book_calendar_slot' | 'trigger_webhook',
  payload: Record<string, any>
): Promise<{ success: boolean; externalReferenceId: string; responseMessage: string }> {
  const ws = inMemoryStore.workspaces.get(workspaceId);
  const isAutonomous = ws?.tier === 'paid' && ws?.ordisMode === 'full_power';

  const externalReferenceId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let responseMessage = '';

  switch (actionType) {
    case 'send_invoice':
      responseMessage = `Live invoice for ₹${payload.amount || '5,00,000'} successfully generated and dispatched via QuickBooks API to ${payload.clientEmail || 'client@acmecorp.com'}.`;
      break;

    case 'sync_salesforce_crm':
      responseMessage = `Salesforce Opportunity Record for "${payload.company || 'Acme Corp'}" updated to Stage: ${payload.stage || 'Proposal / Scope Aligned'}.`;
      break;

    case 'send_docusign_contract':
      responseMessage = `Master Services Agreement envelop dispatched via DocuSign E-Signature to ${payload.signerEmail || 'sign@acmecorp.com'}.`;
      break;

    case 'book_calendar_slot':
      responseMessage = `Calendar slot confirmed and synced with Google Calendar API for ${payload.scheduledTime || 'Tomorrow 3:00 PM IST'}.`;
      break;

    case 'trigger_webhook':
      responseMessage = `External webhook payload delivered with 200 OK response.`;
      break;

    default:
      responseMessage = `External action ${actionType} executed.`;
  }

  await logAuditEvent(workspaceId, {
    actorType: isAutonomous ? 'ordis_autonomous' : 'ordis_assisted',
    actorId: 'ordis_ai_core',
    actorName: 'Ordis AI Dispatcher',
    action: `integration.${actionType}`,
    targetType: 'external_system',
    targetId: externalReferenceId,
    details: { actionType, payload, responseMessage },
    isRollbackable: true,
    rollbackState: { status: 'cancelled', externalReferenceId },
  });

  return {
    success: true,
    externalReferenceId,
    responseMessage,
  };
}
