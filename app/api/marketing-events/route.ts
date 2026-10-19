import { z } from 'zod';
import { getDb } from '@/lib/mongodb';
const eventSchema = z.object({ consent: z.literal(true), event: z.enum(['page_view', 'signup_start', 'engaged_view', 'cta_click', 'demo_interaction', 'scroll_depth', 'exit_shown', 'exit_dismissed', 'exit_converted']), path: z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/).max(150), value: z.enum(['', 'signup', '25', '50', '75', '100']).default('') });
export async function POST(request: Request) {
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return new Response(null, { status: 204 });
  const origin = request.headers.get('origin');
  if (!origin || (origin !== new URL(request.url).origin && origin !== 'https://cursis.in')) return new Response(null, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 1000) return new Response(null, { status: 413 });
    const parsed = eventSchema.safeParse(JSON.parse(text));
    if (!parsed.success || /^\/(dashboard|workspace|api)(\/|$)/.test(parsed.data.path)) return new Response(null, { status: 400 });
    const db = await getDb();
    if (!db) return new Response(null, { status: 503 });
    const { event, path, value } = parsed.data;
    // Aggregate counters only; no visitor or session records are created.
    await db.collection('marketing_event_totals').updateOne({ day: new Date().toISOString().slice(0, 10), event, path, value }, { $inc: { count: 1 } }, { upsert: true });
    return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 400 }); }
}
