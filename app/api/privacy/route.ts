import { getAuthenticatedUser } from '@/lib/auth/session';
import { verifyPasswordResultAsync } from '@/lib/db/users';
import { verifyFirebaseIdToken } from '@/lib/auth/firebase-admin';
import { contactDetails, emailField, privacyDb, PrivacyError, privacyFailure, privacyJSON, readPrivacyBody, requireSameOrigin, requestDeadlines, textField } from '@/lib/privacy/core';
import { exportAccount, requestErasure } from '@/lib/privacy/data';
import { PRIVACY_VERSION } from '@/lib/privacy/config';
import crypto from 'crypto';
import { checkRateLimit, recordAttempt } from '@/lib/auth/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) throw new PrivacyError('Please sign in to manage account privacy.', 401);
    if (new URL(request.url).searchParams.get('export') === 'json') {
      const data = await exportAccount(user.uid, user.email);
      return new Response(JSON.stringify({ ...data, contact: contactDetails() }, null, 2), { headers: {
        'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="cursis-account.json"',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      } });
    }
    const db = await privacyDb();
    const profile = await db.collection('users').findOne({ uid: user.uid }, { projection: { _id: 0, displayName: 1, title: 1, department: 1 } });
    const nominee = await db.collection('privacy_nominees').findOne({ uid: user.uid }, { projection: { _id: 0, name: 1, email: 1 } });
    const requests = await db.collection('privacy_requests').find({ uid: user.uid }, { projection: {
      _id: 0, id: 1, kind: 1, status: 1, receivedAt: 1, acknowledgeBy: 1, acknowledgedAt: 1, resolveBy: 1,
    } }).sort({ receivedAt: -1 }).limit(50).toArray();
    return privacyJSON({ profile, nominee, requests, contact: contactDetails() });
  } catch (error) { return privacyFailure(error); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const user = await getAuthenticatedUser(request);
    if (!user) throw new PrivacyError('Please sign in to manage account privacy.', 401);
    const body = await readPrivacyBody(request);
    const db = await privacyDb();
    if (body.action === 'profile') {
      const updates = { displayName: textField(body.displayName, 100, 'name'),
        title: typeof body.title === 'string' ? body.title.trim().slice(0, 100) : '',
        department: typeof body.department === 'string' ? body.department.trim().slice(0, 100) : '' };
      await db.collection('users').updateOne({ uid: user.uid }, { $set: updates });
      const { inMemoryStore } = await import('@/lib/db/store');
      for (const row of inMemoryStore.users.values()) if (row.uid === user.uid) Object.assign(row, updates);
      return privacyJSON({ message: 'Profile corrected. Some session labels update after your next sign-in.' });
    }
    if (body.action === 'nominee') {
      if (body.remove === true) await db.collection('privacy_nominees').deleteOne({ uid: user.uid });
      else {
        if (body.confirmed !== true) throw new PrivacyError('Confirm the nominee has agreed to share these contact details.');
        await db.collection('privacy_nominees').updateOne({ uid: user.uid }, { $set: { uid: user.uid,
          name: textField(body.name, 100, 'nominee name'), email: emailField(body.email), updatedAt: new Date() } }, { upsert: true });
      }
      return privacyJSON({ message: 'Nomination updated. This grants no account access; claims require death/incapacity and identity verification.' });
    }
    if (body.action === 'withdraw') {
      if (body.purpose !== 'account') throw new PrivacyError('Use cookie preferences to withdraw browser analytics consent.');
      // Withdrawal of essential account processing starts the same closure workflow as erasure.
      body.action = 'erase';
    }
    if (body.action === 'erase') {
      const rateKey = `privacy-reauth:${user.uid}`;
      if (!(await checkRateLimit(rateKey)).allowed) throw new PrivacyError('Too many verification attempts. Try again later.', 429);
      await recordAttempt(rateKey);
      if (body.confirmation !== 'DELETE MY ACCOUNT') throw new PrivacyError('Enter DELETE MY ACCOUNT to confirm.');
      const profile = await db.collection('users').findOne({ uid: user.uid });
      let verified = false;
      if (profile?.passwordHash && profile?.salt && typeof body.password === 'string' && body.password.length <= 128) {
        verified = (await verifyPasswordResultAsync(body.password, profile.salt, profile.passwordHash)).valid;
      } else if (typeof body.idToken === 'string') {
        const token = await verifyFirebaseIdToken(body.idToken);
        // Tokens used for erasure must be issued after a recent provider reauthentication.
        verified = token.email_verified === true && token.email === user.email &&
          !!token.auth_time && token.auth_time <= Date.now() / 1000 + 30 && Date.now() / 1000 - token.auth_time < 300;
      }
      if (!verified) throw new PrivacyError('Reauthenticate with your password or a recent Google sign-in.', 403);
      const result = await requestErasure(user.uid, user.email);
      const response = privacyJSON(result, 202);
      response.headers.append('Set-Cookie', 'cursis_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      response.headers.append('Set-Cookie', 'cursis_session=; Domain=cursis.in; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');
      return response;
    }
    if (body.action === 'request') {
      if (!['access', 'correction', 'erasure', 'grievance', 'restriction', 'nominee-claim'].includes(body.kind)) throw new PrivacyError('Invalid request type');
      const recent = await db.collection('privacy_requests').countDocuments({ uid: user.uid, receivedAt: { $gt: new Date(Date.now() - 3600000) } });
      if (recent >= 5) throw new PrivacyError('Please use your existing request or try again in an hour.', 429);
      const id = crypto.randomUUID();
      const deadlines = requestDeadlines();
      await db.collection('privacy_requests').insertOne({ id, uid: user.uid, email: user.email,
        kind: body.kind, message: textField(body.message, 5000, 'request details'), status: 'received',
        ...deadlines, acknowledgedAt: new Date(), expiresAt: new Date(Date.now() + 365 * 86400000) });
      return privacyJSON({ id, ...deadlines, message: 'Request received and acknowledged. Our resolution target is 30 calendar days.', contact: contactDetails() }, 201);
    }
    if (body.action === 'consent') {
      if (typeof body.analytics !== 'boolean' || typeof body.functional !== 'boolean') throw new PrivacyError('Invalid preferences');
      await db.collection('privacy_consents').insertOne({ uid: user.uid, purpose: 'browser-preferences',
        analytics: body.analytics, functional: body.functional, source: 'privacy-centre', version: PRIVACY_VERSION,
        at: new Date(), expiresAt: new Date(Date.now() + 365 * 86400000) });
      return privacyJSON({ message: 'Preferences recorded.' });
    }
    throw new PrivacyError('Unknown privacy action');
  } catch (error) { return privacyFailure(error); }
}
