import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { OrdisEngine } from '@/lib/ordis/server';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.actionType) {
      return NextResponse.json({ error: 'actionType is required (e.g. send_invoice, sync_salesforce_crm, send_docusign_contract, book_calendar_slot)' }, { status: 400 });
    }

    const result = await OrdisEngine.dispatchOutsideAction(
      workspaceId,
      body.actionType,
      body.payload || {}
    );

    return NextResponse.json({ ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
