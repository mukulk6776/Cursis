import { inMemoryStore } from './store';
import { ExternalIntegration } from './types';
import { logAuditEvent } from './audit';
import { getCollection } from '@/lib/mongodb';
import { isValidUrl } from '@/lib/link-preview/fetcher';

export async function getIntegrations(workspaceId: string): Promise<ExternalIntegration[]> {
  try {
    const col = await getCollection<ExternalIntegration>('integrations');
    if (col) {
      const docs = await col.find({ workspaceId }).toArray();
      docs.forEach((i) => inMemoryStore.integrations.set(i.id, i));
      return docs;
    }
  } catch (e) {
    console.warn('MongoDB getIntegrations notice:', e);
  }

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

  try {
    const col = await getCollection<ExternalIntegration>('integrations');
    if (col) {
      await col.updateOne({ id }, { $set: integration }, { upsert: true });
    }
  } catch (e) {
    console.warn('MongoDB upsert integration notice:', e);
  }

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
  const integrations = await getIntegrations(workspaceId);

  switch (actionType) {
    case 'send_invoice': {
      const qb = integrations.find((i) => i.provider === 'quickbooks');
      if (!qb || !qb.config?.apiKey) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: QuickBooks is not connected. Add your API credentials in Workspace Integrations.',
        };
      }
      const endpoint = qb.config?.apiEndpoint || qb.config?.url || 'https://quickbooks.api.intuit.com/v3/company/invoice';
      if (!isValidUrl(endpoint)) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Valid QuickBooks HTTPS endpoint is required.',
        };
      }
      const refId = `qb_${Date.now()}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${qb.config.apiKey}`,
          },
          body: JSON.stringify({ ...payload, referenceId: refId }),
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
        });
        if (!res.ok) {
          return {
            success: false,
            externalReferenceId: '',
            responseMessage: `QuickBooks API rejected invoice dispatch (HTTP ${res.status}).`,
          };
        }
        return { success: true, externalReferenceId: refId, responseMessage: `Invoice dispatched via QuickBooks API (Ref: ${refId}).` };
      } catch (err: any) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: `QuickBooks dispatch failed: ${err.message}`,
        };
      }
    }

    case 'sync_salesforce_crm': {
      const sf = integrations.find((i) => i.provider === 'salesforce');
      if (!sf || !sf.config?.apiKey) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Salesforce CRM is not connected. Add your Salesforce credentials in Workspace Integrations.',
        };
      }
      const endpoint = sf.config?.apiEndpoint || sf.config?.url || 'https://api.salesforce.com/services/data/v58.0/sobjects/Opportunity';
      if (!isValidUrl(endpoint)) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Valid Salesforce HTTPS endpoint is required.',
        };
      }
      const refId = `sf_${Date.now()}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sf.config.apiKey}`,
          },
          body: JSON.stringify({ ...payload, referenceId: refId }),
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
        });
        if (!res.ok) {
          return {
            success: false,
            externalReferenceId: '',
            responseMessage: `Salesforce API rejected opportunity sync (HTTP ${res.status}).`,
          };
        }
        return { success: true, externalReferenceId: refId, responseMessage: `Opportunity synced to Salesforce (Ref: ${refId}).` };
      } catch (err: any) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: `Salesforce sync failed: ${err.message}`,
        };
      }
    }

    case 'send_docusign_contract': {
      const ds = integrations.find((i) => i.provider === 'docusign');
      if (!ds || !ds.config?.apiKey) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: DocuSign is not connected. Add your DocuSign credentials in Workspace Integrations.',
        };
      }
      const endpoint = ds.config?.apiEndpoint || ds.config?.url || 'https://demo.docusign.net/restapi/v2.1/envelopes';
      if (!isValidUrl(endpoint)) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Valid DocuSign HTTPS endpoint is required.',
        };
      }
      const refId = `ds_${Date.now()}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ds.config.apiKey}`,
          },
          body: JSON.stringify({ ...payload, referenceId: refId }),
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
        });
        if (!res.ok) {
          return {
            success: false,
            externalReferenceId: '',
            responseMessage: `DocuSign API rejected envelope dispatch (HTTP ${res.status}).`,
          };
        }
        return { success: true, externalReferenceId: refId, responseMessage: `Envelope dispatched via DocuSign (Ref: ${refId}).` };
      } catch (err: any) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: `DocuSign dispatch failed: ${err.message}`,
        };
      }
    }

    case 'book_calendar_slot': {
      const gcal = integrations.find((i) => i.provider === 'google_calendar');
      if (!gcal || !gcal.config?.apiKey) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Google Calendar is not connected. Connect your calendar in Workspace Integrations.',
        };
      }
      const endpoint = gcal.config?.apiEndpoint || gcal.config?.url || 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      if (!isValidUrl(endpoint)) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Valid Google Calendar HTTPS endpoint is required.',
        };
      }
      const refId = `gcal_${Date.now()}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gcal.config.apiKey}`,
          },
          body: JSON.stringify({ ...payload, referenceId: refId }),
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
        });
        if (!res.ok) {
          return {
            success: false,
            externalReferenceId: '',
            responseMessage: `Google Calendar API rejected event booking (HTTP ${res.status}).`,
          };
        }
        return { success: true, externalReferenceId: refId, responseMessage: `Slot synced to Google Calendar (Ref: ${refId}).` };
      } catch (err: any) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: `Google Calendar booking failed: ${err.message}`,
        };
      }
    }

    case 'trigger_webhook': {
      const targetUrl = payload.url || integrations.find((i) => i.provider === 'custom_webhook')?.config?.webhookUrl;
      if (!targetUrl || typeof targetUrl !== 'string' || !isValidUrl(targetUrl)) {
        return {
          success: false,
          externalReferenceId: '',
          responseMessage: 'Configuration required: Valid public HTTPS webhook target URL is required.',
        };
      }

      const externalReferenceId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
        });
        if (!res.ok) {
          return {
            success: false,
            externalReferenceId,
            responseMessage: `Webhook delivery failed with HTTP status ${res.status}.`,
          };
        }
        return {
          success: true,
          externalReferenceId,
          responseMessage: 'External webhook delivered successfully.',
        };
      } catch (err: any) {
        return {
          success: false,
          externalReferenceId,
          responseMessage: `Webhook delivery error: ${err.message}`,
        };
      }
    }

    default:
      return {
        success: false,
        externalReferenceId: '',
        responseMessage: `Unsupported external action: ${actionType}`,
      };
  }
}
