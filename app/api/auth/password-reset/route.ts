import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/mongodb';
import type { UserProfile } from '@/lib/db/types';
import { generateSalt, hashPasswordAsync } from '@/lib/db/users';
import { SESSION_SECRET } from '@/lib/auth/token';
import { getClientIP } from '@/lib/auth/rateLimit';
import { passwordValidationError } from '@/lib/auth/password';
import { accountBlocked } from '@/lib/privacy/core';
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from '@/lib/email/notifications';

export const runtime = 'nodejs';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('request'), email }),
  z.object({ action: z.literal('reset'), email, code: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(128) }),
]);
const reply = (data: object, status = 200) => NextResponse.json(data, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const digest = (value: string) => createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
const requested = { success: true, message: 'If an account with a password uses this email, a reset code will arrive shortly. Check your spam folder too.' };
const invalid = { error: 'This code is invalid or expired. Request a new code and try again.' };

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const requestOrigin = new URL(request.url);
  if (request.headers.get('host')) requestOrigin.host = request.headers.get('host')!;
  if (!origin || (origin !== requestOrigin.origin && origin !== new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cursis.in').origin)) {
    return reply({ error: 'Invalid request origin.' }, 403);
  }
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'JSON required.' }, 415);
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4096) return reply({ error: 'Request too large.' }, 413);
    body = JSON.parse(raw);
  } catch { return reply({ error: 'Invalid request.' }, 400); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return reply({ error: 'Enter a valid email and, when resetting, a six-digit code and a password of 8–128 characters.' }, 400);
  const input = parsed.data;
  if (input.action === 'reset') {
    const error = passwordValidationError(input.password);
    if (error) return reply({ error }, 400);
  }
  if (input.action === 'request' && !isPasswordResetEmailConfigured()) {
    return reply({ error: 'Reset email is temporarily unavailable. Please try again later.' }, 503);
  }

  try {
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    const now = new Date();
    const bucket = Math.floor(now.getTime() / 1800000);
    const limits = db.collection('password_reset_limits');
    await limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    // The deployment proxy must overwrite client IP headers.
    const keys: [string, number][] = [[`ip:${getClientIP(request)}`, 20]];
    if (input.action === 'request') keys.push([`email:${input.email}`, 5]);
    for (const [key, maximum] of keys) {
      const count = await limits.findOneAndUpdate({ _id: digest(`${key}:${bucket}`) as never }, {
        $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 1800000) },
      }, { upsert: true, returnDocument: 'after' });
      if ((count?.count || 0) > maximum) {
        const response = reply({ error: 'Too many requests. Please try again in 30 minutes.' }, 429);
        response.headers.set('Retry-After', '1800');
        return response;
      }
    }

    const users = db.collection<UserProfile>('users');
    if (input.action === 'request') {
      if (await accountBlocked('', input.email)) return reply(requested);
      const code = randomInt(0, 1000000).toString().padStart(6, '0');
      const hash = digest(`${input.email}:${code}`);
      const user = await users.findOneAndUpdate({
        email: input.email, passwordHash: { $type: 'string', $ne: '' }, salt: { $type: 'string', $ne: '' },
        $or: [{ 'passwordReset.sentAt': { $exists: false } }, { 'passwordReset.sentAt': { $lte: new Date(now.getTime() - 60000) } }],
      }, { $set: { passwordReset: { hash, sentAt: now, expiresAt: new Date(now.getTime() + 600000), attempts: 0 } } }, { returnDocument: 'after' });
      if (!user) return reply(requested);
      try {
        await sendPasswordResetEmail(input.email, code);
      } catch {
        await users.updateOne({ email: input.email, 'passwordReset.hash': hash }, { $unset: { passwordReset: '' } });
        throw new Error('Delivery unavailable');
      }
      return reply(requested);
    }

    if (await accountBlocked('', input.email)) return reply(invalid, 400);
    // Increment atomically before checking, so concurrent guesses share the five-attempt limit.
    const user = await users.findOneAndUpdate({ email: input.email,
      'passwordReset.expiresAt': { $gt: now }, 'passwordReset.attempts': { $lt: 5 },
    }, { $inc: { 'passwordReset.attempts': 1 } }, { returnDocument: 'after' });
    const reset = user?.passwordReset;
    const submitted = digest(`${input.email}:${input.code}`);
    if (!reset || reset.hash.length !== submitted.length || !timingSafeEqual(Buffer.from(reset.hash), Buffer.from(submitted))) return reply(invalid, 400);
    const salt = generateSalt();
    const passwordHash = await hashPasswordAsync(input.password, salt);
    const result = await users.updateOne({ email: input.email, 'passwordReset.hash': reset.hash,
      'passwordReset.expiresAt': { $gt: new Date() }, 'passwordReset.attempts': { $lte: 5 },
    }, { $set: { salt, passwordHash, passwordChangedAt: Date.now() }, $unset: { passwordReset: '' } });
    if (result.modifiedCount !== 1) return reply(invalid, 400);
    const response = reply({ success: true, message: 'Password updated. Sign in with your new password.' });
    const hostname = requestOrigin.hostname;
    response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      ...(hostname === 'cursis.in' || hostname.endsWith('.cursis.in') ? { domain: '.cursis.in' } : {}),
    });
    return response;
  } catch {
    return reply({ error: 'We could not complete this request. Please try again later.' }, 503);
  }
}
