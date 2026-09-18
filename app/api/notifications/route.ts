export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getUserNotifications, markAllNotificationsRead, createNotification } from '@/lib/db/notifications';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId || 'ws_public';

    if (workspaceId !== 'ws_public') {
      const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
      if (wsAuth.errorResponse) return wsAuth.errorResponse;
    }

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
      // You can only mark your own notifications read
      await markAllNotificationsRead({
        userId: authUser.uid,
        userEmail: authUser.email,
      });
      return apiSuccess({ message: 'All notifications marked as read' });
    }

    if (body.text) {
      const workspaceId = body.workspaceId || authUser.workspaceId || 'ws_public';

      if (workspaceId !== 'ws_public') {
        const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
        if (wsAuth.errorResponse) return wsAuth.errorResponse;
      }

      // Force target to be the current user unless it's a broadcast (which requires admin)
      let targetUserId = body.userId;
      let targetUserEmail = body.userEmail;

      if ((targetUserId && targetUserId !== authUser.uid) || (targetUserEmail && targetUserEmail !== authUser.email)) {
        if (workspaceId !== 'ws_public') {
          const roleAuth = await authorizeWorkspaceAccess(request, workspaceId, ['owner', 'admin']);
          if (roleAuth.errorResponse) return apiError('Only admins can create notifications for other users', 403);
        } else {
          return apiError('Cannot create public notifications for other users', 403);
        }
      } else {
        targetUserId = authUser.uid;
        targetUserEmail = authUser.email;
      }

      const notification = await createNotification({
        userId: targetUserId,
        userEmail: targetUserEmail,
        workspaceId,
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
