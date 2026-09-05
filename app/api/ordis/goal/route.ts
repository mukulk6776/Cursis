import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { OrdisEngine } from '@/lib/ordis/engine';
import { inMemoryStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const goals = Array.from(inMemoryStore.goalPlans.values()).filter((g) => g.workspaceId === workspaceId);
    return NextResponse.json({ goals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.goal) {
      return NextResponse.json({ error: 'Goal description is required' }, { status: 400 });
    }

    const plan = await OrdisEngine.solveGoal(workspaceId, body.goal);
    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
