'use client';
import { useState } from 'react';

export default function MarketingForm({ kind }: { kind: 'contact' | 'newsletter' }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/marketing/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again later.');
      setDone(true); setStatus(kind === 'contact' ? 'Your message has been received. Thank you for getting in touch.' : 'You’re subscribed to product updates.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to send. Please try again.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="marketing-form" aria-label={kind === 'contact' ? 'Contact Cursis' : 'Product updates'}>
    {!done && <><div className="marketing-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {kind === 'contact' && <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>}
    <label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>
    {kind === 'contact' && <label>Message<textarea name="message" required minLength={10} maxLength={5000} rows={6} /></label>}
    <label className="marketing-consent"><input type="checkbox" name="consent" value="yes" required />{kind === 'newsletter' ? 'I want email product updates. I can unsubscribe at any time.' : 'I agree to my details being used to respond to this message.'}</label>
    <p><a href="/privacy">How we use your data</a></p><button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Sending…' : kind === 'contact' ? 'Send message' : 'Subscribe'}</button></>}
    <p role="status" aria-live="polite">{status}</p>
  </form>;
}
