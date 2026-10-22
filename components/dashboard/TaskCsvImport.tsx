'use client';
import { useEffect, useRef, useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { CSV_TEMPLATE, parseTaskCsv } from '@/lib/engagement/csv';

export default function TaskCsvImport() {
  const { activeWorkspace, employees, user, syncTeamAndNotifications } = useDashboard();
  const [open, setOpen] = useState(false);
  const [batch, setBatch] = useState<{ id: string; csv: string; workspaceId: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [done, setDone] = useState(false);
  const workspaceId = activeWorkspace?.id;
  const currentWorkspace = useRef(workspaceId);
  currentWorkspace.current = workspaceId;
  const storageKey = `cursis_task_import:${user.id}:${workspaceId}`;
  useEffect(() => {
    setBatch(null); setAttempted(false); setDone(false); setError('');
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved?.workspaceId === workspaceId && typeof saved.csv === 'string' && typeof saved.id === 'string') { setBatch(saved); setAttempted(true); setOpen(true); }
    } catch { setError('Could not restore the previous import preview.'); }
  }, [storageKey, workspaceId]);
  let rows: ReturnType<typeof parseTaskCsv> = [], validation = '';
  if (batch && batch.workspaceId === workspaceId) {
    try { rows = parseTaskCsv(batch.csv, [user.email, ...employees.map(employee => employee.email || '')]); }
    catch (error) { validation = (error as Error).message; }
  }
  async function importTasks() {
    if (!batch || batch.workspaceId !== workspaceId) return;
    setBusy(true); setAttempted(true); setError('');
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(batch));
      const response = await fetch('/api/tasks/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, batchId: batch.id, csv: batch.csv }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import could not be confirmed. Retry this batch safely.');
      sessionStorage.removeItem(storageKey);
      if (currentWorkspace.current !== workspaceId) return;
      setDone(true);
      await syncTeamAndNotifications(workspaceId);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <section style={{ marginBottom: 20 }} aria-label="CSV task import">
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(value => !value)} aria-expanded={open}>Import tasks from CSV</button>
    {open && <div className="card" style={{ padding: 20, marginTop: 12 }}>
      <h2>Preview your task import</h2>
      <p>Up to 100 tasks, 64 KB. Leave assignee email blank for unassigned tasks. Dates use YYYY-MM-DD. Status: todo, in-progress, review, completed or blocked. Completed imports have no historical completion date and are excluded from weekly completion counts.</p>
      <p><a download="cursis-tasks.csv" href={'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_TEMPLATE)}>Download CSV template</a></p>
      <label>Select CSV <input type="file" accept=".csv,text/csv" disabled={busy || (attempted && !done)} onChange={async event => {
        const file = event.target.files?.[0];
        setBatch(null); setError(''); setAttempted(false); setDone(false);
        if (!file || !workspaceId) return;
        if (file.size > 64000) { setError('CSV must be 64 KB or smaller.'); return; }
        try { setBatch({ id: crypto.randomUUID(), csv: await file.text(), workspaceId }); } catch { setError('Could not read this file.'); }
      }} /></label>
      {validation && <p role="alert">{validation}</p>}
      {rows.length > 0 && <>
        <p>{rows.length} task{rows.length === 1 ? '' : 's'} in this preview. Nothing is saved until you confirm.</p>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}><table className="table"><thead><tr>{['Row', 'Name', 'Assignee email', 'Due date', 'Status', 'Validation'].map(label => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.line}><td>{row.line}</td><td style={{ overflowWrap: 'anywhere' }}>{row.name}</td><td style={{ overflowWrap: 'anywhere' }}>{row.email || 'Unassigned'}</td><td>{row.dueDate}</td><td>{row.status}</td><td>{row.errors.join('; ') || 'Ready'}</td></tr>)}</tbody></table></div>
        {!done && <button type="button" className="btn btn-primary" disabled={busy || Boolean(validation) || rows.some(row => row.errors.length > 0)} onClick={importTasks}>{busy ? 'Importing…' : attempted ? 'Retry this import' : `Confirm import of ${rows.length} tasks`}</button>}
      </>}
      {done && <p role="status">Import complete. Your tasks have been refreshed.</p>}
      {error && <p role="alert">{error}{attempted && ' Keep this preview open and retry the same batch to avoid duplicates.'}</p>}
      {attempted && !done && <p>This pending batch is saved in this browser tab for safe retries. Do not upload the same file as a new batch after a connection error.</p>}
    </div>}
  </section>;
}
