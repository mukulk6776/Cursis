import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { OrdisEngine } from '@/lib/ordis/engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action || 'approve'; // 'approve' | 'reject'

    const resolved = await OrdisEngine.resolveApprovalItem(id, action, authUser.uid);
    if (!resolved) {
      return NextResponse.json({ error: 'Approval item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: resolved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
