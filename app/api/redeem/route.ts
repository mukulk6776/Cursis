import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { checkRateLimit, recordAttempt, clearRateLimit, getClientIP } from '@/lib/auth/rateLimit';

// Persistent in-memory fallback for redeemed codes
const inMemoryRedeemedCodes = new Set<string>();

// Authorized single-use promo codes catalogue
const AUTHORIZED_CODES: Record<string, string[]> = {
  'CURSIS-PRO-2026': [
    'Executive Autonomous Copilot Unlocked',
    'Real-Time Bottleneck Detection',
    'Unlimited Multi-Agent Execution',
  ],
  'ENTERPRISE-SCALE-4': [
    'Enterprise Feature Pack Granted',
    'Ordis Autonomous Copilot & Ambient Scanner Active',
    'Full 2,000-User Enterprise Scale Support',
    'Instant Enterprise Telemetry Synthesis',
  ],
  'ORDIS-VIP-ACCESS': [
    'Executive VIP Access Activated',
    'Ordis Autonomous Agents Active (Bottleneck Scanner & Copilot)',
    'SOC-2 Audit Telemetry Access',
  ],
  'FEATURE-STUDIO-PRO': [
    'Dynamic Feature Builder Studio Unlocked',
    'Executive KPI Telemetry Synthesized',
    'AI Code Review & Deployment Gatekeeper Active',
  ],
  'SPECIAL-FOUNDER': [
    'Sovereign Founder Tier Activated',
    'VIP Founder Badge Unlocked',
    'Unlimited Ambient Copilot Cycles',
    'Zero Rate-Limit Autonomy',
  ],
};

import { findVoucherByCode, redeemVoucher } from '@/lib/db/vouchers';

function isValidCodeFormat(code: string): boolean {
  return Boolean(AUTHORIZED_CODES[code]);
}

import { authorizeWorkspaceAccess } from '@/lib/auth/rbac';
import { inMemoryStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetWs = searchParams.get('workspaceId') || undefined;

    const wsAuth = await authorizeWorkspaceAccess(request, targetWs, ['owner', 'admin']);
    if (wsAuth.errorResponse) return wsAuth.errorResponse;
    const workspaceId = wsAuth.workspaceId;

    const db = await getDb();
    let codes: string[] = [];

    if (db) {
      try {
        const found = await db.collection('redeemed_codes').find({ workspaceId }).project({ code: 1 }).toArray();
        codes = found.map((doc: any) => doc.code);
      } catch (err) {
        console.warn('Could not query redeemed_codes from mongo:', err);
      }
    }

    return NextResponse.json({ success: true, redeemedCodes: codes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve redeemed codes' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    // 1. Enforce rate limiting to prevent brute-force attacks on promo codes
    const clientIP = getClientIP(request);
    const rateCheck = await checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: rateCheck.message || 'Too many redemption attempts. Please try again in 30 minutes.',
        },
        { status: 429 }
      );
    }

    // 2. Enforce authentication — codes cannot be consumed anonymously
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      await recordAttempt(clientIP);
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please sign in to redeem a promo code.' },
        { status: 401 }
      );
    }

    // Per-user throttling to prevent user-level brute force attacks
    const userRateKey = `user:${authUser.uid}`;
    const userRateCheck = await checkRateLimit(userRateKey);
    if (!userRateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: userRateCheck.message || 'Too many redemption attempts for this account. Please try again later.',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawCode = body.code;

    if (!rawCode || typeof rawCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid redeem code.' },
        { status: 400 }
      );
    }

    const code = rawCode.trim().toUpperCase();

    // 3. Check if already redeemed in in-memory store
    if (inMemoryRedeemedCodes.has(code)) {
      return NextResponse.json(
        {
          success: false,
          alreadyRedeemed: true,
          message: `Code "${code}" has already been redeemed and can only be used once.`,
        },
        { status: 400 }
      );
    }

    // 4. Check MongoDB collection 'redeemed_codes'
    const db = await getDb();
    if (db) {
      try {
        const existing = await db.collection('redeemed_codes').findOne({ code });
        if (existing) {
          inMemoryRedeemedCodes.add(code);
          return NextResponse.json(
            {
              success: false,
              alreadyRedeemed: true,
              message: `Code "${code}" has already been redeemed and can only be used once.`,
            },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn('Mongo check failed:', err);
      }
    }

    // 5. Validate against authorized catalogue OR database vouchers
    const isAuthorized = Boolean(AUTHORIZED_CODES[code]);
    let dbVoucher = null;
    if (!isAuthorized) {
      dbVoucher = await findVoucherByCode(code);
    }

    if (!isAuthorized && !dbVoucher) {
      await recordAttempt(clientIP);
      await recordAttempt(userRateKey);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired redeem code. Please verify your code and try again.',
        },
        { status: 400 }
      );
    }

    // If database voucher, redeem atomically through redeemVoucher
    if (dbVoucher) {
      const result = await redeemVoucher(dbVoucher.id, authUser.uid, authUser.email);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            message: result.error || 'Failed to redeem voucher',
          },
          { status: 400 }
        );
      }
      inMemoryRedeemedCodes.add(code);
      await clearRateLimit(clientIP);
      await clearRateLimit(userRateKey);
      return NextResponse.json({
        success: true,
        message: `Voucher "${code}" successfully redeemed!`,
        perks: [`${dbVoucher.type.toUpperCase()} plan tier unlocked`],
        planTier: result.planTier,
      });
    }

    // Determine perks from authorized catalogue
    const perks = AUTHORIZED_CODES[code];
    const userId = authUser.uid;
    const email = authUser.email;
    const workspaceId = authUser.workspaceId || 'default';

    // 6. Mark code as redeemed permanently (atomic check)
    if (inMemoryRedeemedCodes.has(code)) {
      return NextResponse.json(
        {
          success: false,
          alreadyRedeemed: true,
          message: `Code "${code}" has already been redeemed and can only be used once.`,
        },
        { status: 400 }
      );
    }
    inMemoryRedeemedCodes.add(code);

    if (db) {
      try {
        await db.collection('redeemed_codes').insertOne({
          code,
          userId,
          email,
          workspaceId,
          redeemedAt: new Date(),
          perks,
        });

        // Normalize user planTier to standard if user is logged in
        if (authUser.uid) {
          const cachedUser = inMemoryStore.users.get(authUser.uid);
          if (cachedUser) {
            cachedUser.planTier = 'standard';
          }
          await db.collection('users').updateOne(
            { uid: authUser.uid },
            { $set: { planTier: 'standard', updatedAt: new Date().toISOString() } }
          );
        }

      } catch (err: any) {
        if (err?.code === 11000) {
          inMemoryRedeemedCodes.add(code);
          return NextResponse.json(
            {
              success: false,
              alreadyRedeemed: true,
              message: `Code "${code}" has already been redeemed and can only be used once.`,
            },
            { status: 400 }
          );
        }
        console.warn('Mongo insert failed:', err);
      }
    }

    // Clear rate limits on successful redemption
    await clearRateLimit(clientIP);
    await clearRateLimit(userRateKey);

    return NextResponse.json({
      success: true,
      message: `Code "${code}" successfully redeemed!`,
      perks,
    });
  } catch (error: any) {
    console.error('Redeem error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to redeem code due to an internal server error.' },
      { status: 500 }
    );
  }
}
