import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { generateExecutiveReport } from '@/lib/db/dashboards';

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const report = await generateExecutiveReport(workspaceId, body.prompt);
    return apiSuccess({ report });
  } catch (error: any) {
    return apiError(error.message || 'Failed to generate executive report', 500);
  }
}
