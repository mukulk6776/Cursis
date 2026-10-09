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

function isValidCodeFormat(code: string): boolean {
  if (AUTHORIZED_CODES[code]) return true;
  return /^(CURSIS-[A-Z0-9]{4,12}|VIP-[A-Z0-9]{4,12}|PRO-[A-Z0-9]{4,12}|FOUNDER-[A-Z0-9]{4,12})$/.test(code);
}

export async function GET(request: Request) {
  // Only authenticated owners/admins can view redeemed codes
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (authUser.role !== 'owner' && authUser.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = await getDb();
    let codes: string[] = Array.from(inMemoryRedeemedCodes);

    if (db) {
      try {
        const found = await db.collection('redeemed_codes').find({}).project({ code: 1 }).toArray();
        const mongoCodes = found.map((doc: any) => doc.code);
        codes = Array.from(new Set([...codes, ...mongoCodes]));
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

    // 5. Validate against authorized vouchers catalogue or single-use pattern
    if (!isValidCodeFormat(code)) {
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

    // Determine perks
    const perks = AUTHORIZED_CODES[code] || [
      'Executive Copilot Feature Pack Activated',
      'Ordis Full Power Autonomous Copilot Unlocked',
      'Unlimited Multi-Agent Execution',
    ];

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
