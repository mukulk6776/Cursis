export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/auth/admin-guard';
import { listAdminUsers } from '@/lib/db/admin';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.errorResponse) return guard.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusParam = searchParams.get('status') || 'all';
    const planParam = searchParams.get('plan') || 'all';
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const sortDirParam = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const page = Number(searchParams.get('page') || '1') || 1;
    const pageSize = Number(searchParams.get('pageSize') || '20') || 20;

    const status = statusParam === 'active' || statusParam === 'suspended' ? statusParam : 'all';
    const plan = ['none', 'starter', 'pro', 'business'].includes(planParam) ? (planParam as any) : 'all';
    const sortBy = ['createdAt', 'displayName', 'email', 'lastActiveAt', 'accountStatus', 'plan'].includes(sortByParam)
      ? (sortByParam as any)
      : 'createdAt';

    const result = await listAdminUsers({
      search,
      status,
      plan,
      sortBy,
      sortDir: sortDirParam,
      page,
      pageSize,
    });

    return apiSuccess(result, 200, { 'Cache-Control': 'private, no-store' });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to retrieve user directory.', 500);
  }
}
