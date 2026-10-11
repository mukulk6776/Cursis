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

    let sanitizedPhotoURL: string | undefined = undefined;

    if (photoURL !== null && photoURL !== '') {
      if (typeof photoURL !== 'string') {
        return apiError('Invalid photoURL', 400);
      }

      // Check for base64 image data URL
      const isDataUrl = /^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(photoURL);
      if (isDataUrl) {
        // Enforce max 2MB payload size limit on base64 image string
        if (photoURL.length > 2 * 1024 * 1024) {
          return apiError('Image payload exceeds maximum limit of 2MB', 400);
        }
        sanitizedPhotoURL = photoURL;
      } else {
        // Enforce HTTP / HTTPS URL format
        try {
          const url = new URL(photoURL);
          if (!url.protocol.startsWith('http')) {
            return apiError('Invalid URL protocol. Only HTTP and HTTPS are permitted.', 400);
          }
          if (photoURL.length > 2048) {
            return apiError('URL length exceeds maximum limit of 2048 characters', 400);
          }
          sanitizedPhotoURL = photoURL;
        } catch {
          return apiError('Invalid photoURL format. Must be an HTTP(S) URL or valid base64 image.', 400);
        }
      }
    }

    // Update user in database
    await updateUser(auth.user.uid, { photoURL: sanitizedPhotoURL });

    return apiSuccess({
      message: sanitizedPhotoURL ? 'Profile photo updated successfully' : 'Profile photo removed successfully',
      photoURL: sanitizedPhotoURL || null,
    });
  } catch (error: any) {
    console.error('Update profile photo error:', error);
    return apiError(error.message || 'Failed to update profile photo', 500);
  }
}
