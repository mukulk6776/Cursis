import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { OrdisEngine } from '@/lib/ordis/engine';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;

    const memories = await OrdisEngine.getCompanyBrain(workspaceId);
    return NextResponse.json({ memories });
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

    if (!body.category || !body.key || !body.value) {
      return NextResponse.json({ error: 'category, key, and value are required' }, { status: 400 });
    }

    const memory = await OrdisEngine.addCompanyBrainKnowledge(workspaceId, {
      category: body.category,
      key: body.key,
      value: body.value,
      confidence: body.confidence,
    });

    return NextResponse.json({ success: true, memory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
