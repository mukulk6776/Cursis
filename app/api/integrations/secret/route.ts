import crypto from 'node:crypto';
import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    // Generates 64-character hex string (total 70 chars with prefix)
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    return apiSuccess({ secret });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to generate webhook secret', 500);
  }
}

export async function GET(request: Request) {
  return POST(request);
}
