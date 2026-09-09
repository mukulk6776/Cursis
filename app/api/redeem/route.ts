import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth/session';

// Persistent in-memory fallback for redeemed codes
const inMemoryRedeemedCodes = new Set<string>();

// Authorized single-use promo codes catalogue
const AUTHORIZED_CODES: Record<string, string[]> = {
  'CURSIS-PRO-2026': [
    'Autonomous Pro Seat Activated',
    'Ordis Full Power Autonomous Copilot Unlocked',
    'Real-Time Bottleneck Detection',
    'Unlimited Multi-Agent Execution',
  ],
  'ENTERPRISE-SCALE-4': [
    '4 Autonomous Pro Seat Licenses Granted',
    'Ordis Autonomous Copilot & Ambient Scanner Active',
    'Full 2,000-User Enterprise Scale Support',
    'Instant Enterprise Telemetry Synthesis',
  ],
  'ORDIS-VIP-ACCESS': [
    'Executive VIP Access Activated',
    'Autonomous Pro Seat Allocated',
    'Ordis Autonomous Agents Active (Bottleneck Scanner & Copilot)',
    'SOC-2 Audit Telemetry Access',
  ],
  'FEATURE-STUDIO-PRO': [
    'Dynamic Feature Builder Studio Unlocked',
    'Autonomous Pro Seat Allocated',
    'Executive KPI Telemetry Synthesized',
    'AI Code Review & Deployment Gatekeeper Active',
  ],
  'SPECIAL-FOUNDER': [
    'Sovereign Founder Tier Activated',
    'Autonomous Pro Seat + VIP Founder Badge',
    'Unlimited Ambient Copilot Cycles',
    'Zero Rate-Limit Autonomy',
  ],
};

function isValidCodeFormat(code: string): boolean {
  if (AUTHORIZED_CODES[code]) return true;
  return /^(CURSIS-[A-Z0-9]{4,12}|VIP-[A-Z0-9]{4,12}|PRO-[A-Z0-9]{4,12}|FOUNDER-[A-Z0-9]{4,12})$/.test(code);
}

export async function GET(request: Request) {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = body.code;

    if (!rawCode || typeof rawCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid redeem code.' },
        { status: 400 }
      );
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Check if already redeemed in in-memory store
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

    // 2. Check MongoDB collection 'redeemed_codes'
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

    // 3. Validate against authorized vouchers catalogue or single-use pattern
    if (!isValidCodeFormat(code)) {
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
      'Autonomous Pro Seat Activated',
      'Ordis Full Power Autonomous Copilot Unlocked',
      'Unlimited Multi-Agent Execution',
    ];

    // 4. Mark code as redeemed permanently
    inMemoryRedeemedCodes.add(code);

    const authUser = await getAuthenticatedUser(request);
    const userId = authUser?.uid || body.userId || 'anonymous';
    const email = authUser?.email || body.email || 'user';
    const workspaceId = authUser?.workspaceId || body.workspaceId || 'default';

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

        // Also update user's planTier to premium in users collection if logged in
        if (authUser?.uid) {
          await db.collection('users').updateOne(
            { uid: authUser.uid },
            { $set: { planTier: 'premium', updatedAt: new Date().toISOString() } }
          );
        }
      } catch (err) {
        console.warn('Mongo insert failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Code "${code}" successfully redeemed!`,
      perks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to redeem code' },
      { status: 500 }
    );
  }
}
