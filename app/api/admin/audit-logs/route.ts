export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminAuditLogs } from '@/lib/db/admin-audit';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.errorResponse) return guard.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId') || undefined;
    const page = Number(searchParams.get('page') || '1') || 1;
    const pageSize = Number(searchParams.get('pageSize') || '25') || 25;

    const result = await getAdminAuditLogs({ targetUserId, page, pageSize });
    return apiSuccess(result, 200, { 'Cache-Control': 'private, no-store' });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to retrieve admin audit logs.', 500);
  }
}
