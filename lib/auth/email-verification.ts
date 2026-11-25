import crypto, { randomInt } from 'crypto';
import { getDb } from '@/lib/mongodb';
import { SESSION_SECRET } from './token';
import { isVerificationEmailConfigured, sendAdminVerificationEmail } from '@/lib/email/notifications';

const COLLECTION = 'email_verifications';
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

interface VerificationRecord {
  _id: string;
  email: string;
  purpose: 'admin_signup' | 'admin_login';
  codeHash: string;
  attempts: number;
  sentAt: Date;
  expiresAt: Date;
}

const inMemoryChallenges = new Map<string, VerificationRecord>();

function challengeKey(email: string, purpose: 'admin_signup' | 'admin_login'): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(`${purpose}:${email.trim().toLowerCase()}`).digest('hex');
}

function hashCode(email: string, purpose: 'admin_signup' | 'admin_login', code: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${purpose}:${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

export async function issueAdminEmailVerificationCode(
  email: string,
  purpose: 'admin_signup' | 'admin_login'
): Promise<{ sent: boolean; cooldown?: boolean; unconfigured?: boolean }> {
  if (!isVerificationEmailConfigured()) {
    return { sent: false, unconfigured: true };
  }

  const normalized = email.trim().toLowerCase();
  const key = challengeKey(normalized, purpose);
  const now = new Date();
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const codeHash = hashCode(normalized, purpose, code);
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<VerificationRecord>(COLLECTION);
      await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
      const existing = await col.findOne({ _id: key });
      if (existing && now.getTime() - new Date(existing.sentAt).getTime() < RESEND_COOLDOWN_MS && existing.expiresAt > now) {
        return { sent: true, cooldown: true };
      }
      await col.updateOne(
        { _id: key },
        {
          $set: {
            email: normalized,
            purpose,
            codeHash,
            attempts: 0,
            sentAt: now,
            expiresAt,
          },
        },
        { upsert: true }
      );
    } else if (process.env.NODE_ENV !== 'production') {
      const existing = inMemoryChallenges.get(key);
      if (existing && now.getTime() - existing.sentAt.getTime() < RESEND_COOLDOWN_MS && existing.expiresAt > now) {
        return { sent: true, cooldown: true };
      }
      inMemoryChallenges.set(key, {
        _id: key,
        email: normalized,
        purpose,
        codeHash,
        attempts: 0,
        sentAt: now,
        expiresAt,
      });
    } else {
      throw new Error('Verification storage unavailable');
    }

    await sendAdminVerificationEmail(normalized, code);
    return { sent: true };
  } catch (err) {
    console.warn('[email-verification] Failed to issue code:', err instanceof Error ? err.message : 'unknown error');
    try {
      const db = await getDb();
      if (db) await db.collection<VerificationRecord>(COLLECTION).deleteOne({ _id: key });
    } catch {}
    inMemoryChallenges.delete(key);
    throw err;
  }
}

export async function verifyAdminEmailCode(
  email: string,
  purpose: 'admin_signup' | 'admin_login',
  submittedCode: string
): Promise<boolean> {
  const cleanCode = String(submittedCode || '').trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const normalized = email.trim().toLowerCase();
  const key = challengeKey(normalized, purpose);
  const expectedHash = hashCode(normalized, purpose, cleanCode);
  const now = new Date();

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<VerificationRecord>(COLLECTION);
      const record = await col.findOneAndUpdate(
        {
          _id: key,
          expiresAt: { $gt: now },
          attempts: { $lt: MAX_VERIFY_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
        { returnDocument: 'after' }
      );

      if (!record || !record.codeHash || record.codeHash.length !== expectedHash.length) {
        return false;
      }

      const valid = crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(expectedHash));
      if (!valid) return false;

      await col.deleteOne({ _id: key });
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      const mem = inMemoryChallenges.get(key);
      if (!mem || mem.expiresAt <= now || mem.attempts >= MAX_VERIFY_ATTEMPTS) return false;
      mem.attempts += 1;
      if (mem.codeHash.length !== expectedHash.length) return false;
      const valid = crypto.timingSafeEqual(Buffer.from(mem.codeHash), Buffer.from(expectedHash));
      if (!valid) return false;
      inMemoryChallenges.delete(key);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
