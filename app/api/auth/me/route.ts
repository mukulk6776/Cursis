import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    return apiSuccess({
      user: auth.user,
      authenticated: true,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve profile', 500);
  }
}
