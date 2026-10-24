'use client';

import { useWorkHub } from '@/lib/work-hub/WorkHubContext';
import { workload } from '@/lib/work-hub/types';
import styles from './WorkHub.module.css';

function elapsed(start: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(start)) / 1000));
  return `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
}
export function FocusStatus() {
  const { snapshot, now, run, busy, setTrayOpen } = useWorkHub();
  const focus = snapshot?.focus.find(session => session.userId === snapshot.userId);
  if (snapshot?.otherFocus) return <div className={`${styles.surface} ${styles.row}`} style={{ margin: '12px 20px 0' }}><span>You have a focus timer running in another workspace.</span><button disabled={busy} onClick={() => run({ action: 'stop', sessionId: snapshot.otherFocus!.id })}>Stop other timer & log time</button></div>;
  if (!focus) return null;
  return <div className={`${styles.surface} ${styles.row}`} role="region" aria-label="Current focus" style={{ margin: '12px 20px 0' }}><span>🎯 Working on: <strong>{focus.taskTitle}</strong> · <span role="timer" aria-live="off">{elapsed(focus.startedAt, now)}</span> · Est. done at {new Date(focus.expectedEndAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><div className={styles.actions}><button onClick={() => setTrayOpen(true)}>My Day</button><button disabled={busy} onClick={() => run({ action: 'stop', sessionId: focus._id })}>Stop timer</button></div></div>;
}
export default function MyDayTray() {
  const { snapshot, date, now, trayOpen, setTrayOpen, run, busy, error } = useWorkHub();
  const items = snapshot?.plans.find(plan => plan.userId === snapshot.userId && plan.date === date)?.items || [];
  const assigned = snapshot?.tasks.filter(task => task.assigneeId === snapshot.userId || task.assignees?.includes(snapshot.userId)) || [];
  const mine = assigned.filter(task => task.status !== 'done');
  const validItems = items.filter(item => assigned.some(task => task.id === item.taskId));
  const focus = snapshot?.focus.find(session => session.userId === snapshot.userId);
  const capacity = workload(validItems.reduce((sum,item) => sum + item.hours, 0));
  const save = (next: typeof items) => run({ action: 'plan', date, items: next });
  const add = (taskId: string) => {
    const task = mine.find(task => task.id === taskId);
    if (!task || validItems.some(item => item.taskId === taskId) || validItems.length >= 5 || busy) return;
    void save([...validItems, { taskId, hours: task.estimatedHours || 2 }]);
  };
  return <>
    {!trayOpen && <button className={styles.toggle} style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 900, boxShadow: '4px 4px 0 #0a0a0a' }} onClick={() => setTrayOpen(true)} aria-expanded={false} aria-controls="my-day-tray">{focus ? '🎯 ' : ''}My Day · {validItems.length}/5</button>}
    {trayOpen && <aside id="my-day-tray" className={styles.tray} aria-label="My Day">
      <div className={styles.surface}>
        <div className={styles.row}><h2>My Day</h2><button aria-label="Close My Day" onClick={() => setTrayOpen(false)}>Close ×</button></div>
        <p className={styles.muted}>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · Your local day</p>
        <p>Choose 3–5 tasks to focus on. Start small; you can commit to fewer.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!snapshot && !error && <p>Loading your day…</p>}
        <p><strong>{capacity.hours.toFixed(1)}h / 8h</strong> · {capacity.label}</p><progress className={styles.meter} value={Math.min(capacity.hours,8)} max={8} aria-label="Today's planned hours" />
        {focus && <div className={styles.timer}><span>🎯 {focus.taskTitle}</span><strong>{elapsed(focus.startedAt, now)}</strong><button disabled={busy} onClick={() => run({ action: 'stop', sessionId: focus._id })}>Stop & log time</button></div>}
        <section className={styles.today} aria-label="Doing Today" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); add(event.dataTransfer.getData('text/plain')); }}>
          <h3>Doing Today · {validItems.length}/5</h3>
          {!validItems.length && <p className={styles.muted}>Drag assigned tasks here, or use “Add to today”.</p>}
          {validItems.map((item,index) => {
            const task = assigned.find(task => task.id === item.taskId)!;
            const logged = (snapshot?.loggedHours[task.id] || 0) + (focus?.taskId === task.id ? Math.max(0,now - Date.parse(focus.startedAt)) / 3600000 : 0);
            return <article className={styles.card} key={item.taskId} draggable onDragStart={event => event.dataTransfer.setData('text/plain',task.id)} onDragOver={event => event.preventDefault()} onDrop={event => {
              event.preventDefault(); event.stopPropagation();
              const dragged = event.dataTransfer.getData('text/plain');
              const from = validItems.findIndex(entry => entry.taskId === dragged);
              if (from < 0) { add(dragged); return; }
              const next = [...validItems]; const [moved] = next.splice(from,1); next.splice(index,0,moved); void save(next);
            }}>
              <h3>{task.title}</h3><p className={styles.muted}>{logged.toFixed(2)}h logged on this task</p>
              <label>Today’s estimate (hours)<input type="number" min={0.5} max={24} step={0.5} defaultValue={item.hours} key={item.hours} disabled={busy} onBlur={event => { const hours = Number(event.target.value); if (Number.isFinite(hours) && hours !== item.hours) void save(validItems.map(entry => entry.taskId === item.taskId ? { ...entry, hours } : entry)); }} /></label>
              <div className={styles.actions} style={{ marginTop: 10 }}><button className={styles.primary} disabled={busy || !!focus || task.status === 'done'} onClick={() => run({ action: 'start', taskId: task.id, date })}>{task.status === 'done' ? '✓ Completed today' : '▶ Start Working'}</button><button disabled={busy} onClick={() => save(validItems.filter(entry => entry.taskId !== task.id))}>Remove</button><button aria-label={`Move ${task.title} earlier`} disabled={busy || index === 0} onClick={() => { const next = [...validItems]; [next[index-1],next[index]] = [next[index],next[index-1]]; void save(next); }}>↑</button></div>
            </article>;
          })}
        </section>
        <h3>Assigned to you · all channels</h3>
        {mine.filter(task => !validItems.some(item => item.taskId === task.id)).map(task => <article className={styles.card} key={task.id} draggable onDragStart={event => event.dataTransfer.setData('text/plain',task.id)}><h3>{task.title}</h3><p className={styles.muted}>{task.estimatedHours || 2}h · Due {new Date(task.dueDate).toLocaleDateString()}</p><button disabled={busy || validItems.length >= 5} onClick={() => add(task.id)}>Add to today</button></article>)}
        {!mine.length && snapshot && <p>No unfinished tasks assigned to you yet.</p>}
      </div>
    </aside>}
  </>;
}
