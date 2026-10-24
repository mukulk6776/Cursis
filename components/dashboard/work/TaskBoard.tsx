'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { useWorkHub } from '@/lib/work-hub/WorkHubContext';
import { taskChannel, taskStage } from '@/lib/work-hub/types';
import TaskConversation from './TaskConversation';
import styles from './WorkHub.module.css';

const stages = [['todo', 'To do'], ['in_progress', 'Doing'], ['in_review', 'Review'], ['approved', 'Approved'], ['done', 'Done'], ['blocked', 'Blocked']];
export default function TaskBoard({ channelId, projectId }: { channelId?: string; projectId?: string }) {
  const { snapshot, run, busy, error } = useWorkHub();
  const { employees } = useDashboard();
  const [view, setView] = useState('kanban');
  const [selected, setSelected] = useState('');
  const tasks = snapshot?.tasks.filter(task => projectId ? task.projectId === projectId : taskChannel(task) === channelId) || [];
  return <section className={`${styles.surface} ${channelId ? styles.dock : ''}`} aria-label="Live Action Dock">
    <div className={styles.row}><h2>Live Action Dock</h2><div className={styles.actions}>{['kanban', 'table'].map(mode => <button key={mode} aria-pressed={view === mode} className={view === mode ? styles.selected : ''} onClick={() => setView(mode)}>{mode === 'kanban' ? 'Kanban' : 'Table'}</button>)}</div></div>
    <p className={styles.muted}>One task. One conversation. Shared with the project board.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!snapshot ? <p>Loading tasks…</p> : !tasks.length ? <p>Dock a message to turn a conversation into a task.</p> : view === 'kanban' ? <div className={styles.board}>{stages.map(([stage, label]) => <section className={styles.column} key={stage} aria-label={label}><h3>{label} · {tasks.filter(task => taskStage(task) === stage).length}</h3>{tasks.filter(task => taskStage(task) === stage).map(task => <article key={task.id} className={styles.card}>
      <button onClick={() => setSelected(task.id)}>{task.title}</button><p className={styles.muted}>{employees.find(employee => employee.id === task.assigneeId)?.name || 'Unassigned'} · {task.estimatedHours || 4}h</p><p className={styles.muted}>Due {new Date(task.dueDate).toLocaleDateString()}</p>
    </article>)}</section>)}</div> : <div className={styles.table}><table><thead><tr><th>Task / thread</th><th>Owner</th><th>Due date</th><th>Effort</th><th>Stage</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id}>
      <td><button onClick={() => setSelected(task.id)}>{task.title}</button></td>
      <td><select aria-label={`Owner for ${task.title}`} disabled={busy} value={task.assigneeId || ''} onChange={event => run({ action: 'edit', taskId: task.id, assigneeId: event.target.value })}><option value="" disabled>Unassigned</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></td>
      <td><input aria-label={`Due date for ${task.title}`} type="date" disabled={busy} value={task.dueDate.slice(0, 10)} onChange={event => { if (event.target.value) void run({ action: 'edit', taskId: task.id, dueDate: event.target.value }); }} /></td>
      <td><select aria-label={`Effort for ${task.title}`} disabled={busy} value={task.estimatedHours || 4} onChange={event => run({ action: 'edit', taskId: task.id, estimatedHours: Number(event.target.value) })}>{[...new Set([1,2,4,task.estimatedHours || 4])].sort((a,b) => a-b).map(hours => <option key={hours} value={hours}>{hours}h</option>)}</select></td>
      <td><select aria-label={`Stage for ${task.title}`} disabled={busy} value={taskStage(task)} onChange={event => run({ action: 'edit', taskId: task.id, status: event.target.value as 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' })}>{stages.map(([stage,label]) => <option key={stage} value={stage} disabled={stage === 'approved'}>{label}</option>)}</select></td>
    </tr>)}</tbody></table></div>}
    {selected && <div><div className={styles.row}><h3>Task conversation</h3><button onClick={() => setSelected('')}>Close thread</button></div><TaskConversation key={selected} taskId={selected} /></div>}
  </section>;
}
