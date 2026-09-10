export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getUserNotifications, markAllNotificationsRead, createNotification } from '@/lib/db/notifications';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    const notifications = await getUserNotifications({
      userId: authUser.uid,
      userEmail: authUser.email,
      workspaceId,
    });

    return apiSuccess({ notifications });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve notifications', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));

    if (body.action === 'mark_all_read' || body.action === 'read_all') {
      await markAllNotificationsRead({
        userId: authUser.uid,
        userEmail: authUser.email,
      });
      return apiSuccess({ message: 'All notifications marked as read' });
    }

    if (body.text) {
      const notification = await createNotification({
        userId: body.userId,
        userEmail: body.userEmail || authUser.email,
        workspaceId: body.workspaceId || authUser.workspaceId || 'ws_public',
        type: body.type || 'system',
        text: body.text,
        icon: body.icon || 'bell',
      });
      return apiSuccess({ notification }, 201);
    }

    return apiError('Invalid notification action', 400);
  } catch (error: any) {
    return apiError(error.message || 'Failed to update notifications', 500);
  }
}
