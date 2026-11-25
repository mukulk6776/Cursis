export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminOverviewStats } from '@/lib/db/admin';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.errorResponse) return guard.errorResponse;

  try {
    const stats = await getAdminOverviewStats();
    return apiSuccess({ stats }, 200, { 'Cache-Control': 'private, no-store' });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to load platform overview stats.', 500);
  }
}
