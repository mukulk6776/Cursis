import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { getIntegrations, createOrUpdateIntegration } from '@/lib/db/integrations';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const rawWorkspaceId = searchParams.get('workspaceId') || '';

    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    const integrations = await getIntegrations(wsAuth.workspaceId);
    const isAdminOrOwner = wsAuth.role === 'owner' || wsAuth.role === 'admin';

    // Sanitize credentials from DTO for ordinary members
    const safeIntegrations = integrations.map((item) => {
      const safeConfig = { ...(item.config || {}) };
      if (!isAdminOrOwner) {
        delete safeConfig.secret;
        delete safeConfig.apiKey;
        delete safeConfig.token;
      }
      return {
        ...item,
        config: safeConfig,
      };
    });

    return apiSuccess({ integrations: safeIntegrations });
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const rawWorkspaceId = body.workspaceId || '';

    // Configuring integrations requires admin or owner
    const wsAuth = await authorizeWorkspaceAccess(request, rawWorkspaceId, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;

    if (!body.provider) {
      return apiError('Provider is required', 400);
    }

    const integration = await createOrUpdateIntegration(wsAuth.workspaceId, body);
    return apiSuccess({ integration }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
