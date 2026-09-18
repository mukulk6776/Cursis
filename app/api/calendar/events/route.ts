import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/lib/db/calendar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;

    const resolvedWsId = workspaceId || auth.user.workspaceId;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const events = await getCalendarEvents(resolvedWsId, { startDate, endDate });
    return apiSuccess({ events });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || '';

    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const resolvedWsId = workspaceId || authUser.workspaceId;

    if (!body.title) return apiError('Title is required', 400);

    const event = await createCalendarEvent(resolvedWsId, {
      title: body.title,
      description: body.description,
      startTime: body.startTime,
      endTime: body.endTime,
      allDay: body.allDay,
      type: body.type,
      meetLink: body.meetLink,
      attendeeIds: Array.isArray(body.attendeeIds) ? body.attendeeIds : [authUser.uid],
    });

    return apiSuccess({ event }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiError('Event ID is required', 400);

    // Fetch the event to get its workspaceId for auth
    const { getCalendarEventById: getEvtById } = await import('@/lib/db/calendar');
    const existing = await getEvtById(id);
    if (!existing) return apiError('Event not found', 404);

    const auth = await authorizeWorkspaceAccess(request, existing.workspaceId, ['owner', 'admin', 'manager']);
    if (auth.errorResponse) return auth.errorResponse;

    const success = await deleteCalendarEvent(id);
    return apiSuccess({ success });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
