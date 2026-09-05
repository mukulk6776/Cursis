import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { findSmartOpenSlots } from '@/lib/db/calendar';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const slots = await findSmartOpenSlots(workspaceId, {
      durationMinutes: body.durationMinutes,
      daysAhead: body.daysAhead,
      slotsCount: body.slotsCount || 3,
    });

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
