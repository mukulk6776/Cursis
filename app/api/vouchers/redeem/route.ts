import { NextRequest, NextResponse } from 'next/server';
import { findVoucherByCode, redeemVoucher } from '@/lib/db/vouchers';
import { verifySessionToken } from '@/lib/auth/token';
import { checkRateLimit, recordAttempt, getClientIP } from '@/lib/auth/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting to prevent brute-forcing
    const ip = getClientIP(req);

    const rateLimitCheck = await checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitCheck.message || 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Record this attempt
    await recordAttempt(ip);

    // SECURITY FIX: Properly verify the session token with HMAC signature check
    let sessionToken: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }
    if (!sessionToken) {
      const cookieHeader = req.headers.get('cookie');
      const match = cookieHeader?.match(/cursis_session=([^;]+)/);
      if (match) sessionToken = decodeURIComponent(match[1]);
    }

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const verified = verifySessionToken(sessionToken);
    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Voucher code is required' },
        { status: 400 }
      );
    }

    // Find voucher
    const voucher = await findVoucherByCode(code);

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'Invalid voucher code' },
        { status: 404 }
      );
    }

    // Redeem voucher
    const result = await redeemVoucher(voucher.id, verified.uid, verified.email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Redemption failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher redeemed successfully!',
      planTier: result.planTier,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Voucher redemption API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
