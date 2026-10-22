'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function ActivationChecklist() {
  const { activeWorkspace, projects, invitations, chatHistory, openModal, setCurrentPage } = useDashboard();
  const [state, setState] = useState<{ workspaceId: string; visible: boolean; steps: boolean[] } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const workspaceId = activeWorkspace?.id;
  useEffect(() => {
    if (!workspaceId) return;
    const controller = new AbortController();
    fetch(`/api/activation?workspaceId=${encodeURIComponent(workspaceId)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { setState({ workspaceId, visible: data.visible, steps: data.steps || [] }); setError(''); })
      .catch(error => { if (error.name !== 'AbortError') setError('Checklist unavailable.'); });
    return () => controller.abort();
  }, [workspaceId, projects.length, invitations.length, chatHistory.length, retry]);
  if (!workspaceId) return null;
  if (error) return <p role="status">{error} <button className="btn btn-sm" onClick={() => setRetry(value => value + 1)}>Retry</button></p>;
  if (!state?.visible || state.workspaceId !== workspaceId) return null;
  const completed = state.steps.filter(Boolean).length;
  const actions = [() => openModal('project-modal'), () => openModal('invite-modal'), () => setCurrentPage('ordis')];
  async function dismiss() {
    setSaving(true);
    try {
      const response = await fetch('/api/activation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, dismissed: true }) });
      if (!response.ok) throw new Error();
      setState(previous => previous?.workspaceId === workspaceId ? { ...previous, visible: false } : previous);
    } catch { setError('Could not dismiss the checklist.'); }
    finally { setSaving(false); }
  }
  return <section className="card" aria-label="Getting started" style={{ padding: 20, marginBottom: 24 }}>
    <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <h2 style={{ margin: 0 }}>Your first week</h2>
      <button className="btn btn-sm" disabled={saving} onClick={dismiss}>Dismiss checklist</button>
    </div>
    <p>{completed} of 3 steps complete</p>
    <progress value={completed} max={3} aria-label="Getting started progress" style={{ width: '100%', accentColor: '#FF5500' }} />
    <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingLeft: 24 }}>
      {['Create a project', 'Invite a teammate by email', 'Ask Ordis a question'].map((label, index) => <li key={label}>
        {state.steps[index] ? <span>✓ {label}</span> : <button className="btn btn-sm" onClick={actions[index]}>{label}</button>}
      </li>)}
    </ol>
  </section>;
}
