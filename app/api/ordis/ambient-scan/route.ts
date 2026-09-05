import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { OrdisEngine } from '@/lib/ordis/engine';
import { inMemoryStore } from '@/lib/db/store';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const newCards = await OrdisEngine.runAmbientScan(workspaceId);
    const allCards = Array.from(inMemoryStore.ordisCards.values()).filter((c) => c.workspaceId === workspaceId);

    return NextResponse.json({
      success: true,
      newlyDetectedCount: newCards.length,
      activeCards: allCards,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const cards = Array.from(inMemoryStore.ordisCards.values()).filter((c) => c.workspaceId === workspaceId);
    return NextResponse.json({ cards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
