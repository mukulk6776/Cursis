export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/admin-guard';
import {
  adminAssignUserPlan,
  adminRevokeUserPlan,
  adminSetUserStatus,
  getAdminUserDetail,
} from '@/lib/db/admin';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getClientIP } from '@/lib/auth/rateLimit';

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('assign_plan'),
    plan: z.enum(['starter', 'pro', 'business']),
    expiresAt: z.string().nullable().optional(),
    reason: z.string().max(300).optional(),
  }),
  z.object({
    action: z.literal('revoke_plan'),
    reason: z.string().max(300).optional(),
  }),
  z.object({
    action: z.literal('suspend'),
    reason: z.string().max(300).optional(),
  }),
  z.object({
    action: z.literal('activate'),
    reason: z.string().max(300).optional(),
  }),
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const guard = await requireAdmin(request);
  if (guard.errorResponse) return guard.errorResponse;

  try {
    const { uid } = await params;
    const detail = await getAdminUserDetail(uid);
    if (!detail) {
      return apiError('User not found.', 404);
    }
    return apiSuccess({ detail }, 200, { 'Cache-Control': 'private, no-store' });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to fetch user detail.', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const guard = await requireAdmin(request);
  if (guard.errorResponse || !guard.adminUser) {
    return guard.errorResponse || apiError('Forbidden: Platform administrator access is restricted.', 403);
  }

  try {
    const { uid } = await params;
    const rawBody = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError('Invalid admin action payload.', 400);
    }

    const ipAddress = getClientIP(request);
    const adminUser = {
      uid: guard.adminUser.uid,
      email: guard.adminUser.email,
      displayName: guard.adminUser.displayName,
    };

    const payload = parsed.data;
    if (payload.action === 'assign_plan') {
      await adminAssignUserPlan({
        adminUser,
        targetUid: uid,
        plan: payload.plan,
        expiresAt: payload.expiresAt,
        reason: payload.reason,
        ipAddress,
      });
    } else if (payload.action === 'revoke_plan') {
      await adminRevokeUserPlan({
        adminUser,
        targetUid: uid,
        reason: payload.reason,
        ipAddress,
      });
    } else if (payload.action === 'suspend') {
      await adminSetUserStatus({
        adminUser,
        targetUid: uid,
        status: 'suspended',
        reason: payload.reason,
        ipAddress,
      });
    } else if (payload.action === 'activate') {
      await adminSetUserStatus({
        adminUser,
        targetUid: uid,
        status: 'active',
        reason: payload.reason,
        ipAddress,
      });
    }

    const updatedDetail = await getAdminUserDetail(uid);
    if (!updatedDetail) {
      return apiError('User not found after update.', 404);
    }

    return apiSuccess({ detail: updatedDetail, message: 'Admin update applied.' }, 200, {
      'Cache-Control': 'private, no-store',
    });
  } catch (error: any) {
    const msg = error?.message || 'Admin update failed.';
    const status = /not found/i.test(msg)
      ? 404
      : /Invalid|Cannot suspend|must be/i.test(msg)
      ? 400
      : 500;
    return apiError(msg, status);
  }
}
