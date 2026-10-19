'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { signInWithGoogle } from '@/lib/auth/firebase';
import './privacy-centre.css';

type Ticket = { id: string; kind: string; status: string; resolveBy: string };
function headers() {
  const token = localStorage.getItem('cursis_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
export default function PrivacyCentre({ contactEmail }: { contactEmail: string }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Loading account privacy settings…');
  const [profile, setProfile] = useState({ displayName: '', title: '', department: '' });
  const [nominee, setNominee] = useState({ name: '', email: '' });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [kind, setKind] = useState('access');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/privacy', { credentials: 'include', headers: headers(), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAuthenticated(true);
      if (data.profile) setProfile({ displayName: data.profile.displayName || '', title: data.profile.title || '', department: data.profile.department || '' });
      if (data.nominee) setNominee(data.nominee);
      setTickets(data.requests || []);
      setStatus('Ready. Choose a privacy action below.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to load settings. Please retry.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function send(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch('/api/privacy', { method: 'POST', credentials: 'include', headers: headers(), body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (response.status === 202) {
        // Remove all Cursis local account/chat caches on this device after closure.
        for (const storage of [localStorage, sessionStorage]) {
          for (const key of Object.keys(storage)) if (/cursis|ordis/i.test(key) && key !== 'cursis_cookie_consent') storage.removeItem(key);
        }
        setAuthenticated(false);
      }
      setStatus(`${data.message}${data.id ? ` Reference: ${data.id}` : ''}`);
      return true;
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Request failed; retry or contact the privacy team.'); return false; }
    finally { setBusy(false); }
  }
  async function download() {
    setBusy(true);
    try {
      const response = await fetch('/api/privacy?export=json', { credentials: 'include', headers: headers(), cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'cursis-account.json'; anchor.click();
      URL.revokeObjectURL(url); setStatus('Account JSON downloaded. Submit an access request for shared-content and provider records.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Download failed'); }
    finally { setBusy(false); }
  }
  async function closeAccount(event: FormEvent) {
    event.preventDefault();
    let idToken: string | undefined;
    if (!password) {
      try { idToken = (await signInWithGoogle()).idToken; }
      catch { setStatus('Google reauthentication failed. Try again or contact the privacy team.'); return; }
    }
    await send({ action: 'erase', password, idToken, confirmation });
    setPassword('');
  }
  return <div className="privacy-centre">
    <p role="status" aria-live="polite">{status}</p>
    <p>Cannot sign in, acting for someone else, or withdrawing an inquiry? Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Include your account email and request; do not send passwords, Aadhaar numbers or medical records.</p>
    {!authenticated && <a href="/login?redirect=/privacy/rights">Sign in to manage your data</a>}
    <section><h2>Cookie choices</h2><p>Optional storage and analytics default off. Change or withdraw your choice at any time.</p>
      <button onClick={() => window.dispatchEvent(new Event('cursis_open_cookie_preferences'))}>Manage cookie choices</button>
      <button onClick={() => {
        const preferences = { essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() };
        localStorage.setItem('cursis_cookie_consent', JSON.stringify(preferences));
        window.dispatchEvent(new CustomEvent('cursis_cookie_consent_updated', { detail: preferences }));
        if (authenticated) void send({ action: 'consent', analytics: false, functional: false });
        else setStatus('Optional browser consent withdrawn on this device.');
      }}>Withdraw optional consent</button>
    </section>
    <fieldset disabled={!authenticated || busy}>
      <section><h2>Download your account data</h2><p>JSON includes your account, private AI conversations, memberships, inquiries and privacy records. Shared workspace data and other people’s information require an assisted review.</p><button onClick={download}>Download account JSON</button></section>
      <section><h2>Correct your profile</h2><form onSubmit={event => { event.preventDefault(); void send({ action: 'profile', ...profile }); }}>
        {(['displayName', 'title', 'department'] as const).map(key => <label key={key}>{key === 'displayName' ? 'Display name' : key === 'title' ? 'Job title' : 'Department'}<input required={key === 'displayName'} maxLength={100} value={profile[key]} onChange={event => setProfile({ ...profile, [key]: event.target.value })} /></label>)}
        <p>For email/identity corrections, submit a correction request below so we can verify the new address.</p><button>Save corrections</button>
      </form></section>
      <section><h2>Nominate a representative</h2><p>This person may exercise your privacy rights following verified death or incapacity. Nomination never grants current sign-in access.</p>
        <form onSubmit={event => { event.preventDefault(); void send({ action: 'nominee', ...nominee, confirmed }); }}>
          <label>Nominee full name<input maxLength={100} required value={nominee.name} onChange={event => setNominee({ ...nominee, name: event.target.value })} /></label>
          <label>Nominee email<input type="email" maxLength={254} required value={nominee.email} onChange={event => setNominee({ ...nominee, email: event.target.value })} /></label>
          <label><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I have informed this person and they agree to share these contact details.</label>
          <button>Save nominee</button><button type="button" onClick={() => void send({ action: 'nominee', remove: true })}>Remove nominee</button>
        </form>
      </section>
      <section><h2>Privacy request or grievance</h2><form onSubmit={async event => {
        event.preventDefault(); if (await send({ action: 'request', kind, message })) setMessage('');
      }}><label>Request type<select value={kind} onChange={event => setKind(event.target.value)}>
        <option value="access">Access to personal data and recipient information</option><option value="correction">Correction / completion</option><option value="erasure">Assisted erasure</option><option value="grievance">Grievance</option><option value="restriction">Restriction / objection</option><option value="nominee-claim">Nominee claim</option>
      </select></label><label>Details<textarea required maxLength={5000} rows={4} value={message} onChange={event => setMessage(event.target.value)} /></label><button>Submit request</button></form>
      <p>Online receipt is your acknowledgment. Email acknowledgment target: 72 hours. Resolution target: 30 calendar days. Requests involving customer-controlled data are routed to that customer.</p>
      {tickets.length > 0 && <ul>{tickets.map(ticket => <li key={ticket.id}>{ticket.kind}: {ticket.status}; target {new Date(ticket.resolveBy).toLocaleDateString()} · {ticket.id}</li>)}</ul>}
      </section>
      <section><h2>Withdraw account consent / request erasure</h2><p>This stops account access and starts closure. We aim to erase eligible active data and processor copies within 90 days. Legally retained data, shared customer data and backups need review. We will explain any exceptions. Export your data first.</p>
        <form onSubmit={closeAccount}><label>Current password (leave blank to reauthenticate with Google)<input type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label>
          <label>Type DELETE MY ACCOUNT<input required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
          <button className="privacy-danger">Withdraw account consent and request erasure</button>
        </form>
      </section>
    </fieldset>
  </div>;
}
