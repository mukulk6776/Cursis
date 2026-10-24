'use client';

import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { useWorkHub } from '@/lib/work-hub/WorkHubContext';
import { workload } from '@/lib/work-hub/types';
import styles from './WorkHub.module.css';

export default function TeamPulse() {
  const { employees } = useDashboard();
  const { snapshot, date, error } = useWorkHub();
  if (!snapshot) return <p role="status">{error || 'Loading Team Pulse…'}</p>;
  if (!snapshot.canManage) return <p>Team Pulse is available to workspace owners, admins, and managers. Your commitments are in My Day.</p>;
  return <section className={styles.surface} aria-label="Team Pulse">
    <h2>Team Pulse</h2><p>{date} · Committed hours against an 8-hour day.</p><p className={styles.muted}>Available: under 7h · Full: 7–8h · Overloaded: over 8h. Completed commitments still count toward the day’s hours.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.pulse}>{employees.map(employee => {
      const plan = snapshot.plans.find(plan => plan.userId === employee.id && plan.date === date);
      const items = (plan?.items || []).filter(item => snapshot.tasks.some(task => task.id === item.taskId && (task.assigneeId === employee.id || task.assignees?.includes(employee.id))));
      const capacity = workload(items.reduce((sum,item) => sum + item.hours,0));
      const focus = snapshot.focus.find(session => session.userId === employee.id);
      return <article className={styles.card} key={employee.id}><div className={styles.row}><h3>{employee.name}</h3><span>{capacity.label}</span></div><p><strong>{capacity.hours.toFixed(1)}h / 8h</strong> · {items.length} tasks</p><progress className={styles.meter} value={Math.min(capacity.hours,8)} max={8} aria-label={`${employee.name}'s workload`} />
        <p className={styles.muted}>{focus ? `🎯 Working on: ${focus.taskTitle} (Est. done at ${new Date(focus.expectedEndAt).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })})` : 'No focus timer running'}</p>
        <ul>{items.map(item => <li key={item.taskId}>{snapshot.tasks.find(task => task.id === item.taskId)?.title} · {item.hours}h</li>)}</ul>
      </article>;
    })}</div>
  </section>;
}
