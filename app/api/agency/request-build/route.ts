import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { createCustomBuildRequest } from '@/lib/db/agency';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.companyName || !body.contactEmail || !body.requestedService) {
      return NextResponse.json({ error: 'Company name, contact email, and requested service are required' }, { status: 400 });
    }

    const customRequest = await createCustomBuildRequest(workspaceId, {
      companyName: body.companyName,
      contactEmail: body.contactEmail,
      requestedService: body.requestedService,
      budgetRange: body.budgetRange || '₹3,50,000 - ₹5,00,000',
      requirements: body.requirements || 'Custom autonomous AI agents and deep workspace integrations.',
    });

    return NextResponse.json({ success: true, request: customRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
