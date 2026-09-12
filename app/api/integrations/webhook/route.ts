import { NextResponse } from 'next/server';
import { inMemoryStore } from '@/lib/db/store';
import { executeAutomationRule } from '@/lib/db/automations';
import { createLead } from '@/lib/db/crm';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = body.event || body.type || 'generic_webhook';
    const workspaceId = body.workspaceId || 'ws_public';

    // If incoming lead form submission
    if (eventType === 'contact_form_submission' || body.email) {
      const lead = await createLead(workspaceId, {
        name: body.name || 'Inbound Webhook Lead',
        company: body.company || 'Website Visitor',
        email: body.email,
        phone: body.phone,
        budget: body.budget,
        notes: body.message || body.notes || 'Received via public webhook endpoint.',
        source: 'website_form',
      });

      return NextResponse.json({
        success: true,
        message: 'Lead captured and follow-up drafts generated.',
        leadId: lead.id,
      });
    }

    // Trigger any active automations matching webhook
    const matchingRules = Array.from(inMemoryStore.automations.values()).filter(
      (r) => r.workspaceId === workspaceId && r.isActive && r.trigger.type === 'webhook'
    );

    for (const rule of matchingRules) {
      await executeAutomationRule(rule.id, body);
    }

    return NextResponse.json({
      success: true,
      received: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
