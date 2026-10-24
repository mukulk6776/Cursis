'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import type { WorkSnapshot } from './types';
import { localDay } from './types';
import type { WorkCommand } from '@/lib/db/work-hub';
import { useRealtime } from '@/lib/realtime/use-realtime';

export async function workFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('cursis_token');
  const response = await fetch(url, { ...options, credentials: 'include', cache: 'no-store', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.error || 'Could not save your changes. Please retry.');
  return result;
}
interface WorkHub {
  snapshot: WorkSnapshot | null; workspaceId: string; date: string; now: number;
  error: string; busy: boolean; trayOpen: boolean; setTrayOpen: (open: boolean) => void;
  liveConnected: boolean;
  run: (command: WorkCommand) => Promise<Record<string, any> | null>;
  refresh: () => Promise<void>;
}
const Context = createContext<WorkHub | null>(null);
export function WorkHubProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspaceId } = useDashboard();
  return <WorkspaceWorkHub key={activeWorkspaceId} workspaceId={activeWorkspaceId}>{children}</WorkspaceWorkHub>;
}
function WorkspaceWorkHub({ children, workspaceId }: { children: React.ReactNode; workspaceId: string }) {
  const { syncTeamAndNotifications } = useDashboard();
  const [snapshot, setSnapshot] = useState<WorkSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const revision = useRef(0);
  const saving = useRef(false);
  const date = localDay(new Date(now));
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const data = await workFetch(`/api/work-hub?${new URLSearchParams({ workspaceId, date })}`);
      if (current === revision.current) { setSnapshot(data); setLoadError(''); }
    } catch (error) { setLoadError(error instanceof Error ? error.message : 'Workspace unavailable.'); }
  }, [workspaceId, date]);
  const { connected: liveConnected } = useRealtime({
    workspaceId,
    endpoint: '/api/work-hub/events',
    onConnectionChange: connected => {
      if (connected) {
        void refresh();
        window.dispatchEvent(new CustomEvent('cursis-work-sent', { detail: { reconnected: true } }));
      }
    },
    onEvent: { 'work.changed': event => {
      if (event.payload.collection !== 'channel_messages') void refresh();
      window.dispatchEvent(new CustomEvent('cursis-work-sent', { detail: { message: event.payload.message } }));
    } },
  });
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      const current = ++revision.current;
      try {
        const data = await workFetch(`/api/work-hub?${new URLSearchParams({ workspaceId, date })}`, { signal: controller.signal });
        if (!controller.signal.aborted && current === revision.current) { setSnapshot(data); setLoadError(''); }
      } catch (error) { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Workspace unavailable.'); }
      finally { pending = false; }
    };
    void load();
    // Refresh summary data for deletions; messages and task changes are pushed over SSE.
    const poll = setInterval(load, 5000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener('focus', load);
    return () => { controller.abort(); clearInterval(poll); clearInterval(clock); window.removeEventListener('focus', load); };
  }, [workspaceId, date]);
  const run = async (command: WorkCommand) => {
    if (saving.current) return null;
    saving.current = true;
    setBusy(true); setError('');
    try {
      const result = await workFetch('/api/work-hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId, ...command }) });
      if (result.message) {
        window.dispatchEvent(new CustomEvent('cursis-work-sent', { detail: { message: result.message } }));
        return result;
      }
      if (result.task) void syncTeamAndNotifications(workspaceId);
      await refresh(); return result;
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save your changes.'); return null; }
    finally { saving.current = false; setBusy(false); }
  };
  return <Context.Provider value={{ snapshot, workspaceId, date, now, error: error || loadError, busy, trayOpen, setTrayOpen, run, refresh, liveConnected }}>{children}</Context.Provider>;
}
export function useWorkHub() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkHubProvider is required.');
  return value;
}
