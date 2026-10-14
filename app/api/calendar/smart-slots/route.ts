import { NextResponse } from 'next/server';
import { getAuthOrError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { findSmartOpenSlots } from '@/lib/db/calendar';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const targetWs = searchParams.get('workspaceId') || authUser.workspaceId;

    const wsAuth = await authorizeWorkspaceAccess(request, targetWs);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const durationStr = searchParams.get('duration') || searchParams.get('durationMinutes');
    const durationMinutes = durationStr ? parseInt(durationStr, 10) : 30;
    const attendeesParam = searchParams.get('attendees') || searchParams.get('attendeeIds');
    const attendeeIds = attendeesParam ? attendeesParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const timezone = searchParams.get('timezone') || undefined;

    const slots = await findSmartOpenSlots(workspaceId, {
      durationMinutes,
      attendeeIds,
      timezone,
      slotsCount: 3,
    });

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const wsAuth = await authorizeWorkspaceAccess(request, workspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const slots = await findSmartOpenSlots(wsAuth.workspaceId, {
      durationMinutes: body.durationMinutes || body.duration || 30,
      attendeeIds: body.attendeeIds || body.attendees || undefined,
      daysAhead: body.daysAhead || 3,
      slotsCount: body.slotsCount || 3,
      timezone: body.timezone || undefined,
    });

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
