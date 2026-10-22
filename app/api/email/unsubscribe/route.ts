export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiSuccess, apiError } from '@/lib/api/response';
import { SUPPORT_EMAIL } from '@/lib/site';

interface UnsubscribeRecord {
  email: string;
  unsubscribedAt: string;
  userAgent?: string;
  ip?: string;
}

const memoryUnsubscribes = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return apiError('A valid email address is required to process the unsubscribe request.', 400);
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

      const col = await getCollection<UnsubscribeRecord>('unsubscribes');
      if (!col) return apiError('Unsubscribe storage unavailable. Please retry.', 503);
        const subscribers = await getCollection('marketing_subscribers');
        if (subscribers) await subscribers.deleteOne({ email });
        await col.updateOne(
          { email },
          {
            $set: {
              email,
              unsubscribedAt: new Date().toISOString(),
              userAgent,
              ip,
            },
          },
          { upsert: true }
        );
    memoryUnsubscribes.add(email);

    return apiSuccess({
      message: 'You have been successfully unsubscribed from Cursis marketing and non-transactional emails.',
      email,
      unsubscribedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return apiError('Unable to record your unsubscribe. Please retry or email ' + SUPPORT_EMAIL + '.', 503);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ unsubscribed: false });
  }

  const isUnsub = memoryUnsubscribes.has(email);
  return NextResponse.json({ email, unsubscribed: isUnsub });
}
