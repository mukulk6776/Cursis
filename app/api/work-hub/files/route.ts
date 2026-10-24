import { randomUUID } from 'node:crypto';
import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { apiError, apiSuccess } from '@/lib/api/response';
import { workCollections, WorkError } from '@/lib/db/work-hub';
import { SITE_URL } from '@/lib/site';

export async function POST(request: Request) {
  try {
    const workspaceId = new URL(request.url).searchParams.get('workspaceId') || undefined;
    const auth = await authorizeWorkspaceAccess(request, workspaceId);
    if (auth.errorResponse) return auth.errorResponse;
    const origin = request.headers.get('origin');
    if (!origin || ![new URL(request.url).origin, new URL(process.env.NEXT_PUBLIC_APP_URL || SITE_URL).origin].includes(origin)) return apiError('Invalid request origin.', 403);
    if (Number(request.headers.get('content-length')) > 11 * 1024 * 1024) return apiError('Files must be 10 MB or smaller.', 413);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) return apiError('Choose a file between 1 byte and 10 MB.', 400);
    const { uploads } = await workCollections();
    const id = randomUUID();
    const saved = { _id: id, id, workspaceId: auth.workspaceId, name: file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 180) || 'attachment', size: file.size, data: Buffer.from(await file.arrayBuffer()) };
    await uploads.insertOne(saved);
    return apiSuccess({ file: { id, name: saved.name, size: saved.size } }, 201);
  } catch (error) { return apiError(error instanceof Error ? error.message : 'Upload failed', error instanceof WorkError ? error.status : 500); }
}
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const auth = await authorizeWorkspaceAccess(request, params.get('workspaceId') || undefined);
    if (auth.errorResponse) return auth.errorResponse;
    const { uploads } = await workCollections();
    const file = await uploads.findOne({ _id: params.get('id') || '', workspaceId: auth.workspaceId });
    if (!file) return apiError('File not found.', 404);
    const bytes = Buffer.isBuffer(file.data) ? file.data : Buffer.from((file.data as unknown as { buffer: Uint8Array }).buffer);
    return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error instanceof Error ? error.message : 'Download failed', error instanceof WorkError ? error.status : 500); }
}
