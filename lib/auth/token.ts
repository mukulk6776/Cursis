import crypto from 'crypto';
import { UserRole } from '@/lib/db/types';

export const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'cursis_production_session_secret_secure_key_2026';

export interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  workspaceId: string;
  photoURL?: string;
  createdAt: number;
}

/**
 * Creates a tamper-evident signed session token using HMAC-SHA256
 */
export function createSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `cursis_usr_${data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token with strict HMAC verification and expiration check
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string' || !token.startsWith('cursis_usr_')) return null;

    let cleanToken = token.trim().replace(/^["']|["']$/g, '');
    if (cleanToken.includes('%')) {
      try {
        cleanToken = decodeURIComponent(cleanToken).replace(/^["']|["']$/g, '');
      } catch {}
    }

    const raw = cleanToken.replace('cursis_usr_', '');
    const parts = raw.split('.');
    if (parts.length !== 2) return null;

    const dataPart = parts[0];
    const signaturePart = parts[1];

    if (!dataPart || !signaturePart) return null;

    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(dataPart).digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signaturePart);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(dataPart, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr) as SessionPayload;
    if (!payload.email || !payload.uid) {
      return null;
    }

    // Enforce 7-day expiration window
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (payload.createdAt && Date.now() - payload.createdAt > maxAgeMs) {
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
