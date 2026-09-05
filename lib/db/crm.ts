import { inMemoryStore } from './store';
import { Lead, Deal, LeadStatus } from './types';
import { findSmartOpenSlots } from './calendar';

export async function getLeads(workspaceId: string, status?: LeadStatus): Promise<Lead[]> {
  return Array.from(inMemoryStore.leads.values())
    .filter((l) => {
      if (l.workspaceId !== workspaceId) return false;
      if (status && l.status !== status) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLeadById(id: string): Promise<Lead | null> {
  return inMemoryStore.leads.get(id) || null;
}

export async function createLead(workspaceId: string, data: Partial<Lead>): Promise<Lead> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Find 3 smart open call slots for instant follow-up preparation
  const slots = await findSmartOpenSlots(workspaceId, { slotsCount: 3 });
  const slotsText = slots.map((s, idx) => `${idx + 1}. ${s.formattedLabel}`).join('\n');

  const defaultDraftEmail = `Hi ${data.name?.split(' ')[0] || 'there'},\n\nThanks for reaching out to us regarding ${data.company || 'your project'}.\n\nWe would love to discuss your requirements. Here are 3 open call slots with our architecture team:\n${slotsText}\n\nLet us know which time works best for you!\n\nBest regards,\nCursis Team`;

  const lead: Lead = {
    id,
    workspaceId,
    name: data.name || 'New Lead',
    company: data.company || 'Inbound Company',
    email: data.email || 'lead@example.com',
    phone: data.phone,
    budget: data.budget || 500000,
    currency: data.currency || 'INR',
    status: data.status || 'new',
    source: data.source || 'website_form',
    notes: data.notes || 'Inbound inquiry captured via Cursis CRM.',
    renewalDate: data.renewalDate,
    usageScore: data.usageScore,
    drafts: [
      {
        id: `drf_${Date.now()}`,
        type: 'email',
        content: defaultDraftEmail,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.leads.set(id, lead);
  return lead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const lead = inMemoryStore.leads.get(id);
  if (!lead) return null;

  const updated: Lead = {
    ...lead,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.leads.set(id, updated);
  return updated;
}

export async function getDeals(workspaceId: string): Promise<Deal[]> {
  return Array.from(inMemoryStore.deals.values())
    .filter((d) => d.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createDeal(workspaceId: string, data: Partial<Deal>): Promise<Deal> {
  const id = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const deal: Deal = {
    id,
    workspaceId,
    leadId: data.leadId,
    title: data.title || 'New Deal',
    company: data.company || 'Client',
    value: data.value || 500000,
    currency: data.currency || 'INR',
    stage: data.stage || 'discovery',
    probability: data.probability ?? 50,
    expectedCloseDate: data.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    ownerId: data.ownerId || 'usr_owner_demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.deals.set(id, deal);
  return deal;
}

// Ordis Renewal Intelligence Scanner
export async function scanClientRenewals(
  workspaceId: string
): Promise<Array<{ lead: Lead; daysRemaining: number; recommendation: string; pitchDraft: string }>> {
  const leads = await getLeads(workspaceId);
  const results: Array<{ lead: Lead; daysRemaining: number; recommendation: string; pitchDraft: string }> = [];

  for (const lead of leads) {
    if (lead.renewalDate) {
      const msRemaining = new Date(lead.renewalDate).getTime() - Date.now();
      const daysRemaining = Math.round(msRemaining / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 30 && daysRemaining > 0) {
        const usageScore = lead.usageScore || 75;
        const recommendation =
          usageScore > 80
            ? 'High platform usage detected (Score: ' + usageScore + '). Pitch enterprise retainer renewal with VIP perks.'
            : 'Moderate usage (Score: ' + usageScore + '). Schedule strategy call before contract expires.';

        const pitchDraft = `Hi ${lead.name.split(' ')[0]},\n\nHope you are having a fantastic week!\n\nAs your current cycle with Cursis approaches its renewal on ${new Date(lead.renewalDate).toLocaleDateString()}, we wanted to highlight your team's achievements and share our upcoming roadmap.\n\nWe've prepared an exclusive renewal proposal tailored for ${lead.company}.\n\nLet's connect for 15 minutes this week!\n\nBest,\nCursis Team`;

        results.push({ lead, daysRemaining, recommendation, pitchDraft });
      }
    }
  }

  return results;
}
