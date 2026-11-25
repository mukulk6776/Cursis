import crypto from 'crypto';
import { DEFAULT_SOVEREIGN_FOUNDER_EMAIL } from './founder';
import type { UserProfile } from '@/lib/db/types';

/**
 * Server-side configured administrator email address.
 * Reads ADMIN_EMAIL first, falling back to SOVEREIGN_FOUNDER_EMAIL and default founder email.
 */
export function getAdminEmail(): string {
  const configured =
    process.env?.ADMIN_EMAIL ||
    process.env?.SOVEREIGN_FOUNDER_EMAIL ||
    DEFAULT_SOVEREIGN_FOUNDER_EMAIL;
  return String(configured).trim().toLowerCase();
}

/**
 * Constant-time, trimmed, case-insensitive check against the configured server ADMIN_EMAIL.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const target = getAdminEmail();
  if (!normalized || !target) return false;
  const a = Buffer.from(normalized, 'utf8');
  const b = Buffer.from(target, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Confirms whether a database user record holds verified platform administrator privileges.
 * Never grants admin access to unverified or suspended accounts.
 */
export function isVerifiedAdminUser(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  if (user.accountStatus === 'suspended') return false;
  if (user.emailVerified !== true) return false;
  if (user.platformRole !== 'admin') return false;
  return isAdminEmail(user.email);
}
