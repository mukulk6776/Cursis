'use client';
import { useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { isSessionReplayAllowed } from '@/lib/analytics/privacy';

export default function RecordSignupSource() {
  const { user } = useDashboard();
  useEffect(() => {
    const controller = new AbortController();
    async function record() {
      try {
        const raw = sessionStorage.getItem('cursis_signup_source');
        if (!raw) return;
        const pending = JSON.parse(raw);
        if (!isSessionReplayAllowed() || pending.source !== 'ordis-demo' || !Number.isFinite(pending.at) || pending.at > Date.now() || Date.now() - pending.at > 1800000) {
          sessionStorage.removeItem('cursis_signup_source'); return;
        }
        const response = await fetch('/api/acquisition', { method: 'POST', credentials: 'include', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: pending.source, consent: true }),
        });
        if (response.ok) sessionStorage.removeItem('cursis_signup_source');
      } catch {}
    }
    void record();
    return () => controller.abort();
  }, [user.id]);
  return null;
}
