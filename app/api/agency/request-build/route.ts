import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiSuccess, apiError } from '@/lib/api/response';
import { createCustomBuildRequest } from '@/lib/db/agency';
import { privacyDb } from '@/lib/privacy/core';
import { PRIVACY_VERSION } from '@/lib/privacy/config';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.privacyConsent !== true || body.ageConfirmed !== true || body.noticeVersion !== PRIVACY_VERSION) {
      return apiError('Please confirm you are 18 or older and consent to inquiry processing in the current privacy notice.', 400);
    }
    const db = await privacyDb();
    const rawWsId = body.workspaceId || '';

    const auth = await authorizeWorkspaceAccess(request, rawWsId);
    let workspaceId = 'ws_public_inquiry';
    let userEmail = '';

    if (!auth.errorResponse && auth.user) {
      workspaceId = rawWsId && rawWsId !== 'ws_default' && rawWsId !== 'ws_public'
        ? rawWsId
        : auth.user.workspaceId || `ws_${auth.user.uid}`;
      userEmail = auth.user.email || '';
    }

    const companyName = (body.companyName || body.company || body.name || '').trim();
    const contactEmail = (body.contactEmail || body.email || userEmail || '').trim();
    const requestedService = (body.requestedService || body.solutionType || body.service || '').trim();

    if (!companyName || !contactEmail || !requestedService) {
      return apiError('Company name / your name, contact email, and requested service are required', 400);
    }

    const customRequest = await createCustomBuildRequest(workspaceId, {
      companyName,
      contactEmail,
      requestedService,
      budgetRange: body.budgetRange || '₹3,50,000 - ₹5,00,000',
      requirements: body.requirements || 'Custom autonomous AI agents and deep workspace integrations.',
    });
    await db.collection('privacy_consents').insertOne({ inquiryId: customRequest.id,
      email: contactEmail.toLowerCase(), purpose: 'inquiry', granted: true, version: PRIVACY_VERSION,
      age18Attested: true, source: 'agency-form', at: new Date(), expiresAt: new Date(Date.now() + 365 * 86400000) });

    return apiSuccess({ request: customRequest }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

