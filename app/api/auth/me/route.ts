import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { updateUser } from '@/lib/db/users';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    return apiSuccess({
      user: auth.user,
      authenticated: true,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve profile', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { photoURL } = body;

    if (!photoURL || typeof photoURL !== 'string') {
      return apiError('Invalid photoURL', 400);
    }

    // Validate URL format
    try {
      const url = new URL(photoURL);
      if (!url.protocol.startsWith('http')) {
        return apiError('Invalid URL protocol', 400);
      }
    } catch {
      return apiError('Invalid URL format', 400);
    }

    // Update user in database
    await updateUser(auth.user.uid, { photoURL });

    return apiSuccess({
      message: 'Profile photo updated successfully',
      photoURL,
    });
  } catch (error: any) {
    console.error('Update profile photo error:', error);
    return apiError(error.message || 'Failed to update profile photo', 500);
  }
}
