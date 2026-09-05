import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { generateDocumentFromPrompt } from '@/lib/db/documents';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body.workspaceId || authUser.workspaceId;

    if (!body.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const document = await generateDocumentFromPrompt(
      workspaceId,
      body.prompt,
      body.category || 'kickoff',
      body.projectId
    );

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
