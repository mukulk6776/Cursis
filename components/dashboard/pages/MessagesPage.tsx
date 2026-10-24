'use client';
import { useEffect, useRef, useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { useWorkHub, workFetch } from '@/lib/work-hub/WorkHubContext';
import { CHANNELS, taskChannel } from '@/lib/work-hub/types';
import type { WorkMessage } from '@/lib/work-hub/types';
import TaskBoard from '@/components/dashboard/work/TaskBoard';
import TaskConversation, { ApprovalCards, WorkComposer, WorkFiles } from '@/components/dashboard/work/TaskConversation';
import styles from '@/components/dashboard/work/WorkHub.module.css';
import MemberFocusStatus from '@/components/dashboard/work/MemberFocusStatus';

export default function MessagesPage() {
  const { projects, employees } = useDashboard();
  const { snapshot, workspaceId, run, error, busy, liveConnected } = useWorkHub();
  const [channelId, setChannelId] = useState('general');
  const [dockOpen, setDockOpen] = useState(true);
  const [thread, setThread] = useState('');
  const [messages, setMessages] = useState<WorkMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const paged = useRef(false);
  const channels = [...CHANNELS, ...projects.map(project => ({ id: `project:${project.id}`, name: project.name }))];
  const tasks = snapshot?.tasks.filter(task => taskChannel(task) === channelId) || [];
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    let queued = false;
    let latestId: string | undefined;
    paged.current = false;
    setMessages([]); setHasMore(false); setLoadError(''); setLoading(true);
    const load = async () => {
      if (pending) { queued = true; return; }
      pending = true;
      try {
        // Include the last millisecond again: different servers can save messages together.
        let cursor = latestId?.slice(0, latestId.lastIndexOf('_') + 1);
        let more = false;
        do {
          const initial = !latestId;
          const data = await workFetch(`/api/work-hub?${new URLSearchParams({ workspaceId, channelId, ...(cursor ? { after: cursor } : {}) })}`, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setMessages(previous => [...new Map([...previous, ...data.messages].map(message => [message.id, message])).values()]);
          if (initial && !paged.current) setHasMore(data.hasMore);
          const last = data.messages.at(-1);
          if (last) { latestId = last.id; cursor = last.id; }
          more = !initial && data.hasMore && !!last;
          setLoadError('');
        } while (more);
      } catch (error) { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Messages unavailable.'); }
      finally {
        pending = false;
        if (!controller.signal.aborted) {
          setLoading(false);
          if (queued) { queued = false; void load(); }
        }
      }
    };
    const receive = async (event: Event) => {
      const detail = (event as CustomEvent<{ message?: WorkMessage; reconnected?: boolean }>).detail;
      if (detail?.message) {
        const message = detail.message;
        if (message.workspaceId === workspaceId && message.channelId === channelId) {
          setMessages(previous => [...new Map([...previous, message].map(item => [item.id, item])).values()]);
          setLoadError('');
        }
        return;
      }
      if (!detail?.reconnected) { void load(); return; }
      try {
        const data = await workFetch(`/api/work-hub?${new URLSearchParams({ workspaceId, channelId })}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setMessages(previous => [...new Map([...previous, ...data.messages].map(message => [message.id, message])).values()]);
        if (detail.reconnected) void load();
      } catch (error) { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Messages unavailable.'); }
    };
    void load();
    window.addEventListener('cursis-work-sent', receive);
    window.addEventListener('focus', load);
    return () => { controller.abort(); window.removeEventListener('cursis-work-sent', receive); window.removeEventListener('focus', load); };
  }, [workspaceId, channelId]);
  const feed = [
    ...messages.map(message => ({ id: message.id, time: message.createdAt, message, task: tasks.find(task => task.collaboration?.sourceMessageId === message.id) })),
    ...tasks.filter(task => !messages.some(message => message.id === task.collaboration?.sourceMessageId)).map(task => ({ id: task.id, time: task.createdAt, task, message: undefined })),
  ].sort((a,b) => a.time.localeCompare(b.time));
  const name = channels.find(channel => channel.id === channelId)?.name || 'general';
  return <div className={styles.surface}>
    <div className={styles.row}><div><h1>Conversations that move work.</h1><p className={styles.muted}>Chat, tasks, files, and sign-offs in one shared workspace.</p></div><button aria-expanded={dockOpen} aria-controls="action-dock" onClick={() => setDockOpen(!dockOpen)}>{dockOpen ? 'Hide Action Dock' : 'Show Action Dock'}</button></div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={`${styles.layout} ${!dockOpen ? styles.closed : ''}`}>
      <nav className={styles.channels} aria-label="Channels">{channels.map(channel => <button key={channel.id} disabled={loading} aria-current={channel.id === channelId ? 'page' : undefined} className={channel.id === channelId ? styles.selected : ''} onClick={() => { setChannelId(channel.id); setThread(''); }}># {channel.name}</button>)}</nav>
      <section className={styles.chat} aria-label={`Channel ${name}`}>
        <h2># {name}</h2>
        <p className={styles.muted} role="status">{liveConnected ? '● Live chat connected' : '○ Live chat disconnected — reconnecting…'}</p>
        {!!snapshot?.focus.length && <details><summary>Team focus status ({snapshot.focus.length})</summary>{snapshot.focus.map(session => <p key={session._id} className={styles.muted}>{employees.find(employee => employee.id === session.userId)?.name || 'Team member'} · 🎯 Working on: {session.taskTitle} (Est. done at {new Date(session.expectedEndAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})</p>)}</details>}
        <div className={styles.feed}>
          {hasMore && <button disabled={loading} onClick={async () => {
            setLoading(true);
            try {
              const oldest = [...messages].sort((a,b) => a.id.localeCompare(b.id))[0]?.id;
              const data = await workFetch(`/api/work-hub?${new URLSearchParams({ workspaceId, channelId, ...(oldest ? { before: oldest } : {}) })}`);
              paged.current = true;
              setMessages(previous => [...new Map([...data.messages, ...previous].map(message => [message.id, message])).values()]); setHasMore(data.hasMore);
            } catch (error) { setLoadError(error instanceof Error ? error.message : 'Could not load older messages.'); }
            finally { setLoading(false); }
          }}>Load older messages</button>}
          {loadError && <div><p role="alert">{loadError}</p><button onClick={() => window.dispatchEvent(new Event('cursis-work-sent'))}>Retry messages</button></div>}
          {loading && !feed.length && <p>Loading messages…</p>}
          {!loading && !feed.length && !loadError && <p>No messages yet. Share the first update or file.</p>}
          {feed.map(item => <article key={item.id} className={styles.message}>
            <div className={styles.row}><strong>{item.message?.authorName || employees.find(employee => employee.id === item.task?.creatorId)?.name || 'Task conversation'}</strong><time className={styles.muted}>{new Date(item.time).toLocaleString()}</time></div>
            <p>{item.message?.text || item.task?.title}</p>
            <div className={styles.muted}><MemberFocusStatus userId={item.message?.authorId || item.task?.creatorId || ''} /></div>
            {item.message && <WorkFiles files={item.message.files} />}
            {item.task ? <><button onClick={() => setThread(item.task!.id)}>Open task thread · {item.task.collaboration?.messages.length || 0} replies</button><ApprovalCards taskId={item.task.id} /></> : item.message && <button className={styles.dockButton} disabled={busy || !snapshot} onClick={async () => {
              const result = await run({ action: 'dock', messageId: item.message!.id, assigneeId: snapshot!.userId, dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), estimatedHours: 2 });
              if (result?.task) { setDockOpen(true); setThread(result.task.id); }
            }}>+ Dock as Task</button>}
          </article>)}
        </div>
        <WorkComposer key={channelId} channelId={channelId} onSent={() => window.dispatchEvent(new Event('cursis-work-sent'))} />
        {thread && <div><div className={styles.row}><h3>Task thread</h3><button onClick={() => setThread('')}>Close thread</button></div><TaskConversation key={thread} taskId={thread} /></div>}
      </section>
      {dockOpen && <aside id="action-dock" className={styles.dock}><TaskBoard channelId={channelId} /></aside>}
    </div>
  </div>;
}
