import { apiSuccess, apiError } from '@/lib/api/response';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { updateOnboardingChecklistItem } from '@/lib/db/team';

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json().catch(() => ({}));

    if (!body.itemId || body.completed === undefined) {
      return apiError('itemId and completed (boolean) are required', 400);
    }

    // Only allow updating own checklist — never accept arbitrary userId from body
    const userId = authUser.uid;

    const user = await updateOnboardingChecklistItem(userId, body.itemId, body.completed);
    if (!user) {
      return apiError('User not found', 404);
    }

    return apiSuccess({ user });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
