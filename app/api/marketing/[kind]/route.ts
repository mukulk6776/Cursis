import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/mongodb';

const common = z.object({ email: z.email().max(254).transform(v => v.trim().toLowerCase()), consent: z.literal('yes'), website: z.string().max(0).optional() });
const contact = common.extend({ name: z.string().trim().min(2).max(100), message: z.string().trim().min(10).max(5000) });
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!['contact', 'newsletter'].includes(kind)) return Response.json({ error: 'Not found' }, { status: 404 });
  const origin = request.headers.get('origin');
  if (!origin || (origin !== new URL(request.url).origin && origin !== 'https://cursis.in')) return Response.json({ error: 'Invalid origin' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'JSON required' }, { status: 415 });
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 12000) return Response.json({ error: 'Request too large' }, { status: 413 });
    input = JSON.parse(raw);
  } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
  const parsed = (kind === 'contact' ? contact : common).safeParse(input);
  if (!parsed.success) return Response.json({ error: 'Please check your details and consent choice.' }, { status: 400 });
  try {
    const db = await getDb();
    if (!db) throw new Error('Storage unavailable');
    // Shared, atomic limit across server instances. Trust only the deployment proxy's IP header.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const bucket = Math.floor(Date.now() / 1800000);
    const key = createHash('sha256').update(`marketing:${kind}:${ip}:${bucket}`).digest('hex');
    const limits = db.collection('marketing_rate_limits');
    await limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    const count = await limits.findOneAndUpdate({ _id: key as never }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 1800000) } }, { upsert: true, returnDocument: 'after' });
    if ((count?.count || 0) > 5) return Response.json({ error: 'Too many requests. Please try again in 30 minutes.' }, { status: 429, headers: { 'Retry-After': '1800' } });
    const now = new Date();
    if (kind === 'newsletter') {
      await db.collection('marketing_subscribers').createIndex({ email: 1 }, { unique: true });
      await db.collection('marketing_subscribers').updateOne({ email: parsed.data.email }, { $set: { email: parsed.data.email, consentAt: now, consentVersion: '2026-10-19', source: 'footer' } }, { upsert: true });
    } else {
      const data = contact.parse(input);
      await db.collection('marketing_contacts').insertOne({ name: data.name, email: data.email, message: data.message, consentAt: now, createdAt: now });
    }
    return Response.json({ success: true });
  } catch { return Response.json({ error: 'Unable to save right now. Please try again or contact cursis.in@gmail.com.' }, { status: 503 }); }
}
