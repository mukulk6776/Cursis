import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { executeAutomationRule, getAutomations } from '@/lib/db/automations';
import { createLead } from '@/lib/db/crm';
import { getIntegrations } from '@/lib/db/integrations';

// In-memory replay cache: signature/nonce -> timestamp
const processedSignatures = new Map<string, number>();

function isReplay(signature: string): boolean {
  const now = Date.now();
  // Clean up older than 10 minutes
  for (const [sig, time] of processedSignatures.entries()) {
    if (now - time > 10 * 60 * 1000) processedSignatures.delete(sig);
  }
  if (processedSignatures.has(signature)) return true;
  processedSignatures.set(signature, now);
  return false;
}

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    // Bound body size (max 1MB)
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // Verify webhook authentication secret
    const secret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-cursis-signature') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!secret) {
      return NextResponse.json(
        { error: 'Unauthorized: Webhook authentication secret is required.' },
        { status: 401 }
      );
    }

    // Check timestamp / replay protection if provided
    const timestampHeader = request.headers.get('x-webhook-timestamp');
    if (timestampHeader) {
      const ts = Number(timestampHeader);
      if (!isNaN(ts) && Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Request timestamp expired' }, { status: 400 });
      }
    }

    const nonce = request.headers.get('x-webhook-nonce') || secret;
    if (isReplay(nonce)) {
      return NextResponse.json({ error: 'Replay detected' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const eventType = body.event || body.type || 'generic_webhook';
    let targetWorkspaceId = body.workspaceId || 'ws_public';

    const expectedSecret = process.env.CURSIS_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

    let isAuthorized = false;

    // Check workspace-specific integration secret first
    if (targetWorkspaceId && secret) {
      const integrations = await getIntegrations(targetWorkspaceId);
      const webhookInt = integrations.find(
        (i) => i.provider === 'custom_webhook' || (i.provider as string) === 'webhook'
      );
      if (webhookInt?.config?.secret && safeCompare(secret, webhookInt.config.secret)) {
        isAuthorized = true;
      }
    }

    // Check global secret with constant-time comparison
    if (!isAuthorized && expectedSecret && secret && safeCompare(secret, expectedSecret)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Webhook authentication secret is required and must be valid.' },
        { status: 401 }
      );
    }


    // If incoming lead form submission
    if (eventType === 'contact_form_submission' || body.email) {
      const lead = await createLead(targetWorkspaceId, {
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
        message: 'Lead captured via inbound webhook.',
        leadId: lead.id,
      });
    }

    // Trigger any active automations matching webhook from durable storage
    const matchingRules = (await getAutomations(targetWorkspaceId)).filter(
      (r) => r.isActive && r.trigger.type === 'webhook'
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
