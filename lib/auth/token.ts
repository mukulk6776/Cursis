import crypto from 'crypto';
import { PlatformRole, UserRole } from '@/lib/db/types';

if (!process.env.AUTH_SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: AUTH_SESSION_SECRET environment variable is required in production. Set a strong random secret.');
  }
  console.warn('[auth/token] WARNING: AUTH_SESSION_SECRET is not set. Using insecure default — set this env var before deploying.');
}
export const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_dev_only_secret_do_not_use_in_production';

export interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  platformRole?: PlatformRole;
  workspaceId: string;
  photoURL?: string;
  createdAt: number;
  iat?: number;
  exp?: number;
}

const TOKEN_AAD = Buffer.from('cursis_usr_v2', 'utf8');

function deriveSessionKeys() {
  const macSecret = (process.env.AUTH_SESSION_SECRET || SESSION_SECRET).trim();
  const encSecret = (process.env.SESSION_ENCRYPTION_SECRET || macSecret).trim();
  return {
    encKey: crypto.createHmac('sha256', encSecret).update('cursis:session:aes256gcm:v2').digest(),
    macKey: crypto.createHmac('sha256', macSecret).update('cursis:session:hmacsha256:v2').digest(),
  };
}

/**
 * Creates a 2-way encrypted & tamper-proof session token (AES-256-GCM + HMAC-SHA256)
 */
export function createSessionToken(payload: SessionPayload): string {
  const now = Date.now();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const sanitizedPayload = { ...payload } as any;
  for (const imgKey of ['photoURL', 'photoUrl', 'avatar', 'image']) {
    if (
      sanitizedPayload[imgKey] &&
      (String(sanitizedPayload[imgKey]).startsWith('data:') || String(sanitizedPayload[imgKey]).length > 512)
    ) {
      delete sanitizedPayload[imgKey];
    }
  }

  const enriched: SessionPayload = {
    ...sanitizedPayload,
    createdAt: sanitizedPayload.createdAt || now,
    iat: sanitizedPayload.iat || Math.floor((sanitizedPayload.createdAt || now) / 1000),
    exp: sanitizedPayload.exp || Math.floor(((sanitizedPayload.createdAt || now) + maxAgeMs) / 1000),
  };

  const { encKey, macKey } = deriveSessionKeys();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(enriched), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const envelope = `${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${authTag.toString('base64url')}`;
  const signature = crypto.createHmac('sha256', macKey).update(envelope).digest('base64url');
  return `cursis_usr_${envelope}.${signature}`;
}

/**
 * Verifies outer HMAC-SHA256 signature and decrypts AES-256-GCM session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string' || !token.startsWith('cursis_usr_')) return null;

    let cleanToken = token.trim().replace(/^["']|["']$/g, '');
    if (cleanToken.includes('%')) {
      try {
        cleanToken = decodeURIComponent(cleanToken).replace(/^["']|["']$/g, '');
      } catch { }
    }

    const raw = cleanToken.replace('cursis_usr_', '');
    const parts = raw.split('.');
    if (parts.length !== 4) return null;

    const [ivB64, ctB64, tagB64, macB64] = parts;
    if (!ivB64 || !ctB64 || !tagB64 || !macB64) return null;

    const { encKey, macKey } = deriveSessionKeys();
    const envelope = `${ivB64}.${ctB64}.${tagB64}`;
    const expectedMac = crypto.createHmac('sha256', macKey).update(envelope).digest('base64url');

    const macBuf = Buffer.from(macB64);
    const expectedMacBuf = Buffer.from(expectedMac);
    if (macBuf.length !== expectedMacBuf.length || !crypto.timingSafeEqual(macBuf, expectedMacBuf)) {
      return null;
    }

    const iv = Buffer.from(ivB64, 'base64url');
    const ciphertext = Buffer.from(ctB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) {
      return null;
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
    decipher.setAAD(TOKEN_AAD);
    decipher.setAuthTag(authTag);
    const jsonStr = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const payload = JSON.parse(jsonStr) as SessionPayload;
    if (!payload.email || !payload.uid) {
      return null;
    }

    // Enforce expiration window using exp claim and createdAt
    const now = Date.now();
    const nowSec = Math.floor(now / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return null;
    }

    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (payload.createdAt && now - payload.createdAt > maxAgeMs) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Fast synchronous session verification for proxy/middleware without touching DB/stores
 */
export function isSessionTokenValid(token?: string | null): boolean {
  if (!token) return false;
  return verifySessionToken(token) !== null;
}
