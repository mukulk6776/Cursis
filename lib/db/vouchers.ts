import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface Voucher {
  _id?: ObjectId;
  id: string;
  code: string; // Normalized (uppercase, trimmed)
  type: 'premium' | 'pro' | 'enterprise';
  durationDays?: number; // null/undefined = lifetime
  maxRedemptions: number;
  redemptionCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface VoucherRedemption {
  _id?: ObjectId;
  id: string;
  voucherId: string;
  userId: string;
  redeemedAt: Date;
}

/**
 * Normalize voucher code for consistent lookup
 */
function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Find voucher by code
 */
export async function findVoucherByCode(code: string): Promise<Voucher | null> {
  try {
    const col = await getCollection<Voucher>('vouchers');
    if (!col) return null;

    const normalized = normalizeCode(code);
    return await col.findOne({ code: normalized, isActive: true });
  } catch (error) {
    console.warn('findVoucherByCode error:', error);
    return null;
  }
}

/**
 * Check if user has already redeemed a specific voucher
 */
export async function hasUserRedeemedVoucher(voucherId: string, userId: string): Promise<boolean> {
  try {
    const col = await getCollection<VoucherRedemption>('voucher_redemptions');
    if (!col) return false;

    const existing = await col.findOne({ voucherId, userId });
    return !!existing;
  } catch (error) {
    console.warn('hasUserRedeemedVoucher error:', error);
    return false;
  }
}

/**
 * Redeem a voucher (atomic transaction)
 */
export async function redeemVoucher(
  voucherId: string,
  userId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string; planTier?: string; expiresAt?: string }> {
  try {
    const voucherCol = await getCollection<Voucher>('vouchers');
    const redemptionCol = await getCollection<VoucherRedemption>('voucher_redemptions');
    const userCol = await getCollection('users');

    if (!voucherCol || !redemptionCol || !userCol) {
      return { success: false, error: 'Database connection unavailable' };
    }

    // 1. Find voucher
    const voucher = await voucherCol.findOne({ id: voucherId, isActive: true });
    if (!voucher) {
      return { success: false, error: 'Voucher not found or inactive' };
    }

    // 2. Check expiry
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return { success: false, error: 'This voucher has expired' };
    }

    // 3. Check redemption limit
    if (voucher.redemptionCount >= voucher.maxRedemptions) {
      return { success: false, error: 'Voucher redemption limit reached' };
    }

    // 4. Check if user already redeemed
    const alreadyRedeemed = await hasUserRedeemedVoucher(voucherId, userId);
    if (alreadyRedeemed) {
      return { success: false, error: 'You have already redeemed this voucher' };
    }

    // 5. Calculate new premium expiry
    let premiumExpiresAt: Date | undefined;
    if (voucher.durationDays) {
      const currentUser = await userCol.findOne({ $or: [{ uid: userId }, { id: userId }, { email: userEmail }] });
      const baseDate = currentUser?.premiumExpiresAt && new Date(currentUser.premiumExpiresAt) > new Date()
        ? new Date(currentUser.premiumExpiresAt)
        : new Date();

      premiumExpiresAt = new Date(baseDate.getTime() + voucher.durationDays * 24 * 60 * 60 * 1000);
    }

    // 6. Perform atomic redemption increment to prevent concurrent requests from double-redeeming
    const updatedVoucher = await voucherCol.findOneAndUpdate(
      {
        id: voucherId,
        isActive: true,
        $expr: { $lt: ['$redemptionCount', '$maxRedemptions'] },
      },
      { $inc: { redemptionCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!updatedVoucher) {
      return { success: false, error: 'Voucher redemption limit reached or voucher no longer available' };
    }

    const redemptionId = 'vr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    // Create redemption record
    await redemptionCol.insertOne({
      id: redemptionId,
      voucherId,
      userId,
      redeemedAt: new Date(),
    });

    // Update user premium status
    await userCol.updateOne(
      { $or: [{ uid: userId }, { id: userId }, { email: userEmail }] },
      {
        $set: {
          planTier: voucher.type,
          premiumExpiresAt: premiumExpiresAt?.toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
      }
    );

    return {
      success: true,
      planTier: voucher.type,
      expiresAt: premiumExpiresAt?.toISOString(),
    };
  } catch (error) {
    console.error('redeemVoucher error:', error);
    return { success: false, error: 'Failed to process voucher redemption' };
  }
}

/**
 * Create a new voucher (admin only)
 */
export async function createVoucher(voucher: Omit<Voucher, '_id'>): Promise<boolean> {
  try {
    const col = await getCollection<Voucher>('vouchers');
    if (!col) return false;

    // Ensure code is normalized
    const normalized = {
      ...voucher,
      code: normalizeCode(voucher.code),
    };

    await col.insertOne(normalized as Voucher);
    return true;
  } catch (error) {
    console.error('createVoucher error:', error);
    return false;
  }
}

/**
 * Seed initial vouchers (for admin use)
 */
export async function seedVouchers(vouchers: Array<{
  code: string;
  type: 'premium' | 'pro' | 'enterprise';
  durationDays?: number;
  maxRedemptions: number;
  expiresAt?: Date;
}>): Promise<number> {
  let count = 0;

  for (const v of vouchers) {
    const id = 'vc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const success = await createVoucher({
      id,
      code: v.code,
      type: v.type,
      durationDays: v.durationDays,
      maxRedemptions: v.maxRedemptions,
      redemptionCount: 0,
      expiresAt: v.expiresAt,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'system',
    });
    if (success) count++;
  }

  return count;
}
