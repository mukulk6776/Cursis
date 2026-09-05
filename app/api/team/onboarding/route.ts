import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { updateOnboardingChecklistItem } from '@/lib/db/team';

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = body.userId || authUser.uid;

    if (!body.itemId || body.completed === undefined) {
      return NextResponse.json({ error: 'itemId and completed (boolean) are required' }, { status: 400 });
    }

    const user = await updateOnboardingChecklistItem(userId, body.itemId, body.completed);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
