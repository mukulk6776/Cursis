import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { OrdisEngine } from '@/lib/ordis/engine';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
    }

    const result = await OrdisEngine.processMeeting(body.meetingId, workspaceId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
