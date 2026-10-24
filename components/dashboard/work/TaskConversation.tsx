'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { useWorkHub, workFetch } from '@/lib/work-hub/WorkHubContext';
import { taskChannel } from '@/lib/work-hub/types';
import type { WorkFile } from '@/lib/work-hub/types';
import styles from './WorkHub.module.css';

export function WorkFiles({ files }: { files: WorkFile[] }) {
  const { workspaceId } = useWorkHub();
  return <div className={styles.files}>{files.map(file => <a key={file.id} href={`/api/work-hub/files?${new URLSearchParams({ workspaceId, id: file.id })}`}>↓ {file.name}</a>)}</div>;
}
export function WorkComposer({ taskId, channelId, approval = false, onSent }: { taskId?: string; channelId?: string; approval?: boolean; onSent?: () => void }) {
  const { workspaceId, snapshot, run, busy } = useWorkHub();
  const { employees } = useDashboard();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [files, setFiles] = useState<WorkFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const readOnly = !snapshot || busy || uploading;
  return <form className={styles.compose} onSubmit={async event => {
    event.preventDefault();
    const result = approval && taskId ? await run({ action: 'request_approval', taskId, text, reviewerId: reviewer, url: url || undefined, files: files.map(file => file.id) })
      : taskId ? await run({ action: 'reply', taskId, text, files: files.map(file => file.id) })
        : channelId ? await run({ action: 'send', channelId, text, files: files.map(file => file.id) }) : null;
    if (result) { setText(''); setUrl(''); setFiles([]); onSent?.(); }
  }}>
    <label>{approval ? 'What needs approval?' : taskId ? 'Reply in this task thread' : 'Message this channel'}
      <textarea rows={2} maxLength={4000} value={text} onChange={event => setText(event.target.value)} required={approval} />
    </label>
    {approval && <div className={styles.fields}>
      <label>Reviewer<select aria-label="Reviewer" required value={reviewer} onChange={event => setReviewer(event.target.value)}><option value="">Choose reviewer</option>{employees.filter(employee => employee.id !== snapshot?.userId && employee.workspaceRole !== 'viewer').map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
      <label>Link to review<input type="url" placeholder="https://…" value={url} onChange={event => setUrl(event.target.value)} /></label>
    </div>}
    <label>Attach a file (up to 10 MB)
      <input type="file" disabled={readOnly || files.length >= 5} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file) return;
        if (!file.size || file.size > 10 * 1024 * 1024) { setError('Choose a file between 1 byte and 10 MB.'); return; }
        setUploading(true); setError('');
        try {
          const form = new FormData(); form.set('file', file);
          const result = await workFetch(`/api/work-hub/files?workspaceId=${encodeURIComponent(workspaceId)}`, { method: 'POST', body: form });
          setFiles(previous => [...previous, result.file]);
        } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed.'); }
        finally { setUploading(false); }
      }} />
    </label>
    <div className={styles.files}>{files.map(file => <button key={file.id} type="button" onClick={() => setFiles(previous => previous.filter(item => item.id !== file.id))}>Remove {file.name} ×</button>)}</div>
    {uploading && <p role="status">Uploading…</p>}
    {error && <p role="alert">{error}</p>}
    <button className={styles.primary} disabled={readOnly || (!text.trim() && !files.length)}>{approval ? 'Send approval request' : taskId ? 'Send reply' : 'Send message'}</button>
  </form>;
}
export function ApprovalCards({ taskId }: { taskId: string }) {
  const { snapshot, run, busy } = useWorkHub();
  const { employees } = useDashboard();
  const task = snapshot?.tasks.find(task => task.id === taskId);
  return <>{task?.collaboration?.approvals.map(approval => {
    const canDecide = snapshot && approval.authorId !== snapshot.userId && (approval.reviewerId === snapshot.userId || snapshot.canManage);
    return <article key={approval.id} className={styles.approval} data-status={approval.status}>
      <h3>Approval request</h3><p>{approval.text}</p>
      <p className={styles.muted}>{approval.authorName} → {employees.find(employee => employee.id === approval.reviewerId)?.name || 'Designated reviewer'} · {new Date(approval.createdAt).toLocaleString()}</p>
      {approval.url && <a href={approval.url} target="_blank" rel="noopener noreferrer">Open review link ↗</a>}
      <WorkFiles files={approval.files} />
      {approval.status === 'pending' ? <>{canDecide ? <div className={styles.actions}>
        <button disabled={busy} onClick={() => run({ action: 'decide', taskId, approvalId: approval.id, decision: 'approved' })}>Approve</button>
        <button disabled={busy} onClick={() => run({ action: 'decide', taskId, approvalId: approval.id, decision: 'changes_requested' })}>Request Changes</button>
      </div> : <p>Awaiting reviewer sign-off</p>}</> : <p><strong>{approval.status === 'approved' ? 'Approved' : 'Changes requested'}</strong> by {approval.decidedByName} · {approval.decidedAt && new Date(approval.decidedAt).toLocaleString()}</p>}
    </article>;
  })}</>;
}
export default function TaskConversation({ taskId }: { taskId: string }) {
  const { snapshot, error } = useWorkHub();
  const task = snapshot?.tasks.find(task => task.id === taskId);
  const [approvalOpen, setApprovalOpen] = useState(false);
  if (!task) return <p>{error || 'Loading task conversation…'}</p>;
  return <section className={`${styles.surface} ${styles.conversation}`} aria-label={`Thread: ${task.title}`}>
    <div className={styles.row}><h3>{task.title}</h3><span className={styles.muted}>#{taskChannel(task).replace('project:', 'project / ')}</span></div>
    <p className={styles.muted}>Replies and files are shared with this task’s channel thread.</p>
    <p className={styles.muted}>Logged time: {(snapshot?.loggedHours[task.id] || 0).toFixed(2)}h</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.threadScroll}>
      {(task.collaboration?.messages || []).map(message => <article className={styles.message} key={message.id}><strong>{message.authorName}</strong><p>{message.text}</p><WorkFiles files={message.files} /><time className={styles.muted}>{new Date(message.createdAt).toLocaleString()}</time></article>)}
      <ApprovalCards taskId={taskId} />
    </div>
    {!!task.collaboration?.files.length && <details><summary>Task attachments ({task.collaboration.files.length})</summary><WorkFiles files={task.collaboration.files} /></details>}
    <WorkComposer taskId={taskId} />
    <button type="button" aria-expanded={approvalOpen} onClick={() => setApprovalOpen(!approvalOpen)}>Request approval for a file or link</button>
    {approvalOpen && <WorkComposer taskId={taskId} approval onSent={() => setApprovalOpen(false)} />}
  </section>;
}
