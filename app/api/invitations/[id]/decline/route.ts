export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { declineWorkspaceInvitation } from '@/lib/db/invitations';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { id: invitationId } = await params;
    if (!invitationId) {
      return apiError('Invitation ID is required', 400);
    }

    const result = await declineWorkspaceInvitation(invitationId, {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      role: authUser.role,
    });

    return apiSuccess({
      ...result,
      message: 'Invitation declined successfully.',
    });
  } catch (error: any) {
    return apiError(
      error.message || 'Failed to decline invitation',
      error.statusCode || 500
    );
  }
}
