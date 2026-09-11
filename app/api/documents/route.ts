import { getAuthOrError, apiSuccess, apiError } from '@/lib/api/response';
import { getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } from '@/lib/db/documents';

// Allowed document file extensions
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'json', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg']);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function validateFileMetadata(fileType?: string, fileSize?: number | string): string | null {
  if (fileType) {
    const ext = fileType.replace(/^\./, '').toLowerCase().trim();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return `Unsupported file format ".${ext}". Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`;
    }
  }

  if (fileSize !== undefined && fileSize !== null) {
    let sizeBytes = 0;
    if (typeof fileSize === 'number') {
      sizeBytes = fileSize;
    } else if (typeof fileSize === 'string') {
      const match = fileSize.match(/^([\d.]+)\s*(MB|KB|B|GB)?$/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = (match[2] || 'MB').toUpperCase();
        if (unit === 'GB') sizeBytes = val * 1024 * 1024 * 1024;
        else if (unit === 'MB') sizeBytes = val * 1024 * 1024;
        else if (unit === 'KB') sizeBytes = val * 1024;
        else sizeBytes = val;
      }
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds the 25MB maximum limit (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB provided).`;
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || authUser.workspaceId;
    const category = searchParams.get('category') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const isCompanyBrain = searchParams.get('isCompanyBrain') !== null ? searchParams.get('isCompanyBrain') === 'true' : undefined;

    let documents = await getDocuments(workspaceId, { category, projectId, isCompanyBrain });

    if (query) {
      documents = documents.filter((d) =>
        (d.title && d.title.toLowerCase().includes(query)) ||
        (d.content && d.content.toLowerCase().includes(query)) ||
        (d.authorName && d.authorName.toLowerCase().includes(query)) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    return apiSuccess({ documents, total: documents.length });
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve documents', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    // RBAC: Only owner, admin, manager can create documents
    const allowedRoles = ['owner', 'admin', 'manager'];
    if (!allowedRoles.includes(authUser.role)) {
      return apiError('Forbidden: Only workspace owners, admins, or managers can create documents.', 403);
    }

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || authUser.workspaceId;

    const title = (body.title || body.name || '').trim();
    if (!title) {
      return apiError('Validation Error: Document title is required.', 400);
    }

    // File validation
    const fileError = validateFileMetadata(body.fileType, body.fileSize);
    if (fileError) {
      return apiError(`Validation Error: ${fileError}`, 400);
    }

    const doc = await createDocument(workspaceId, {
      title,
      content: body.content || '',
      category: body.category || 'general',
      tags: Array.isArray(body.tags) ? body.tags : [],
      projectId: body.projectId || undefined,
      fileUrl: body.fileUrl || undefined,
      fileType: body.fileType ? body.fileType.replace(/^\./, '').toLowerCase() : undefined,
      fileSize: body.fileSize ? String(body.fileSize) : undefined,
      authorId: authUser.uid,
      authorName: authUser.displayName,
      isCompanyBrainResource: body.isCompanyBrainResource ?? true,
      summary: body.summary || undefined,
    });

    return apiSuccess({ document: doc, message: 'Document created successfully' }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create document', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    // RBAC: Only owner, admin, manager can update documents
    const allowedRoles = ['owner', 'admin', 'manager'];
    if (!allowedRoles.includes(authUser.role)) {
      return apiError('Forbidden: Only workspace owners, admins, or managers can update documents.', 403);
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id || body.documentId;
    if (!id) {
      return apiError('Document ID is required for update.', 400);
    }

    const existing = await getDocumentById(id);
    if (!existing) {
      return apiError(`Document with ID "${id}" not found.`, 404);
    }

    // File validation if updated
    if (body.fileType || body.fileSize) {
      const fileError = validateFileMetadata(body.fileType, body.fileSize);
      if (fileError) {
        return apiError(`Validation Error: ${fileError}`, 400);
      }
    }

    const updates: any = {};
    if (body.title || body.name) updates.title = (body.title || body.name).trim();
    if (body.content !== undefined) updates.content = body.content;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.fileUrl !== undefined) updates.fileUrl = body.fileUrl;
    if (body.fileType !== undefined) updates.fileType = body.fileType.replace(/^\./, '').toLowerCase();
    if (body.fileSize !== undefined) updates.fileSize = String(body.fileSize);
    if (body.isCompanyBrainResource !== undefined) updates.isCompanyBrainResource = body.isCompanyBrainResource;

    const updated = await updateDocument(id, updates);
    return apiSuccess({ document: updated, message: 'Document updated successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update document', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthOrError(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    // RBAC: Only owner and admin can delete documents
    const allowedRoles = ['owner', 'admin'];
    if (!allowedRoles.includes(authUser.role)) {
      return apiError('Forbidden: Only workspace owners or admins can delete documents.', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiError('Document ID parameter "id" is required for deletion.', 400);
    }

    const deleted = await deleteDocument(id);
    if (!deleted) {
      return apiError(`Document with ID "${id}" not found.`, 404);
    }

    return apiSuccess({ message: 'Document deleted successfully', id });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete document', 500);
  }
}
