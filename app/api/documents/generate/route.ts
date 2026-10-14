import { apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { generateDocumentFromPrompt } from '@/lib/db/documents';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    if (!body.prompt) {
      return apiError('Prompt is required', 400);
    }

    const document = await generateDocumentFromPrompt(
      wsAuth.workspaceId,
      body.prompt,
      body.category || 'kickoff',
      body.projectId
    );

    return apiSuccess({ document }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
