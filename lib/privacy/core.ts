import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import { SESSION_SECRET } from '@/lib/auth/token';
import { privacyContact, PRIVACY_VERSION } from './config';

export class PrivacyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export async function privacyDb() {
  const db = await getDb();
  if (!db) throw new PrivacyError('Privacy storage unavailable. Please retry; your request has not been recorded.', 503);
  return db;
}
export function subjectKey(value: string) {
  const secret = process.env.PRIVACY_TOMBSTONE_SECRET || (process.env.NODE_ENV !== 'production' ? SESSION_SECRET : '');
  if (secret.length < 32) throw new PrivacyError('Privacy account-status key is not configured.', 503);
  return crypto.createHmac('sha256', secret)
    .update(value.trim().toLowerCase()).digest('hex');
}
export async function accountBlocked(uid: string, email: string) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'production') throw new PrivacyError('Account status unavailable', 503);
    return false;
  }
  return !!(await db.collection('privacy_blocks').findOne({ _id: subjectKey(uid) as never })) ||
    !!(await db.collection('privacy_blocks').findOne({ _id: subjectKey(email) as never }));
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  if (!origin || origin !== expected) throw new PrivacyError('A same-origin request is required.', 403);
}
export async function readPrivacyBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 12_000) throw new PrivacyError('Request too large', 413);
  try { return JSON.parse(raw); } catch { throw new PrivacyError('Invalid JSON'); }
}
export function textField(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new PrivacyError(`Invalid ${label}`);
  return value.trim();
}
export function emailField(value: unknown) {
  const email = textField(value, 254, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PrivacyError('Invalid email');
  return email;
}
export function privacyJSON(data: unknown, status = 200) {
  const payload = data && typeof data === 'object' ? { ...data, contact: contactDetails() } : data;
  return Response.json(payload, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export function privacyFailure(error: unknown) {
  return privacyJSON({ error: error instanceof PrivacyError ? error.message : 'Privacy request failed; please retry.' }, error instanceof PrivacyError ? error.status : 500);
}
export async function recordAccountConsent(uid: string, source: string) {
  const db = await privacyDb();
  await db.collection('privacy_consents').insertOne({ uid, purpose: 'account', granted: true,
    version: PRIVACY_VERSION, source, age18Attested: true, at: new Date(),
    expiresAt: new Date(Date.now() + 365 * 86400000) });
}
export function requestDeadlines(now = new Date()) {
  return { receivedAt: now, acknowledgeBy: new Date(+now + 72 * 3600000), resolveBy: new Date(+now + 30 * 86400000) };
}
export function contactDetails() { return { ...privacyContact, noticeVersion: PRIVACY_VERSION }; }
