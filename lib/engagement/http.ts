import { apiError } from '@/lib/api/response';
import { PrivacyError } from '@/lib/privacy/core';
import { SITE_URL } from '@/lib/site';

export async function readAppBody(request: Request, maxBytes = 12000) {
  const expected = new URL(request.url);
  expected.host = request.headers.get('host') || expected.host;
  const origin = request.headers.get('origin');
  if (!origin || (origin !== expected.origin && origin !== new URL(process.env.NEXT_PUBLIC_APP_URL || SITE_URL).origin)) throw new PrivacyError('Invalid request origin.', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new PrivacyError('JSON required.', 415);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) throw new PrivacyError('Request too large.', 413);
  try { return JSON.parse(raw); } catch { throw new PrivacyError('Invalid JSON.', 400); }
}

export function engagementFailure(error: unknown) {
  return apiError(error instanceof PrivacyError ? error.message : 'Unable to save right now. Please try again.', error instanceof PrivacyError ? error.status : 503);
}
