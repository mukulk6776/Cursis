import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getDocuments, createDocument } from '@/lib/db/documents';

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;
    const category = searchParams.get('category') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const isCompanyBrain = searchParams.get('isCompanyBrain') !== null ? searchParams.get('isCompanyBrain') === 'true' : undefined;

    const documents = await getDocuments(workspaceId, { category, projectId, isCompanyBrain });
    return apiSuccess({ documents });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve documents', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const title = body.title || body.name;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError('Document title is required', 400);
    }

    const doc = await createDocument(workspaceId, {
      ...body,
      title: title.trim(),
      authorId: authUser.uid,
      authorName: authUser.displayName,
    });

    return apiSuccess({ document: doc }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create document', 500);
  }
}
