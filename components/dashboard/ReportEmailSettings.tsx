'use client';
import { useEffect, useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function ReportEmailSettings() {
  const { activeWorkspace } = useDashboard();
  const [settings, setSettings] = useState<{ workspaceId: string; owner: boolean; weekly: boolean; capacityHours: number | null; paused: boolean } | null>(null);
  const [resume, setResume] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const workspaceId = activeWorkspace?.id;
  useEffect(() => {
    if (!workspaceId) return;
    const controller = new AbortController();
    setMessage(''); setResume(false);
    fetch(`/api/report-preferences?workspaceId=${encodeURIComponent(workspaceId)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => setSettings({ ...data, workspaceId }))
      .catch(error => { if (error.name !== 'AbortError') setMessage('Email settings unavailable. Reopen this tab to retry.'); });
    return () => controller.abort();
  }, [workspaceId]);
  async function save() {
    if (!settings || settings.workspaceId !== workspaceId) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/report-preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, weekly: settings.weekly, capacityHours: settings.capacityHours, resume }) });
      if (!response.ok) throw new Error();
      setSettings(previous => previous?.workspaceId === workspaceId ? { ...previous, paused: resume ? false : previous.paused } : previous);
      setMessage('Email preferences saved.'); setResume(false);
    } catch { setMessage('Could not save email preferences. Please retry.'); }
    finally { setBusy(false); }
  }
  const current = settings?.workspaceId === workspaceId ? settings : null;
  return <section className="card" aria-label="Progress emails" style={{ padding: 24 }}>
    <h3>Progress emails</h3>
    <p>Weekly reports cover the previous Monday–Sunday in UTC. Delivery runs daily from 03:30 UTC and retries unsent reports.</p>
    {current?.owner && <>
      <label style={{ display: 'block', marginBottom: 12 }}><input type="checkbox" checked={current.weekly} onChange={event => setSettings({ ...current, weekly: event.target.checked })} /> Weekly progress report to me, the workspace owner</label>
      <label style={{ display: 'block', marginBottom: 12 }}>Open-work limit per person, in estimated hours (optional)
        <input type="number" min={1} max={168} value={current.capacityHours ?? ''} onChange={event => setSettings({ ...current, capacityHours: event.target.value === '' ? null : Number(event.target.value) })} style={{ display: 'block', maxWidth: 180 }} />
      </label>
      <p>Overload means open estimated hours exceed this limit. Shared task hours are split evenly. Without a limit, reports say overload has not been assessed.</p>
      {current.paused && <label style={{ display: 'block', marginBottom: 12 }}><input type="checkbox" checked={resume} onChange={event => setResume(event.target.checked)} /> Resume progress emails after my earlier unsubscribe. Marketing stays unsubscribed.</label>}
      <button type="button" className="btn btn-primary" disabled={busy || (current.capacityHours !== null && (!Number.isFinite(current.capacityHours) || current.capacityHours < 1 || current.capacityHours > 168))} onClick={save}>{busy ? 'Saving…' : 'Save email preferences'}</button>
    </>}
    {current && !current.owner && <p>Weekly progress reports are managed by the workspace owner.</p>}
    {current?.paused && <p>Progress emails are paused by your unsubscribe.</p>}
    <p role="status">{message}</p>
  </section>;
}
