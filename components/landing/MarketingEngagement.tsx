'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isSessionReplayAllowed } from '@/lib/analytics/privacy';

export function trackMarketing(event: string, path: string, value = '') {
  if (!isSessionReplayAllowed()) return;
  // No identifiers, query strings, referrers, form values or third-party scripts.
  void fetch('/api/marketing-events', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, path, value, consent: true }), keepalive: true }).catch(() => {});
}
export default function MarketingEngagement() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!path || /^(\/dashboard|\/workspace|\/api)(\/|$)/.test(path)) return;
    let viewed = false;
    const pageView = () => { if (!viewed && isSessionReplayAllowed()) { viewed = true; trackMarketing('page_view', path); if (path === '/signup') trackMarketing('signup_start', path); } };
    pageView();
    const consentChange = () => pageView();
    window.addEventListener('cursis_cookie_consent_updated', consentChange);
    const sent = new Set<number>();
    const show = () => {
      if (path === '/signup' || path === '/login') return;
      try { if (sessionStorage.getItem('cursis_exit_seen')) return; sessionStorage.setItem('cursis_exit_seen', '1'); } catch { return; }
      setOpen(true); trackMarketing('exit_shown', path);
    };
    const scroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const depth = available > 0 ? window.scrollY / available * 100 : 0;
      for (const milestone of [25, 50, 75, 100]) if (depth >= milestone - 1 && !sent.has(milestone) && isSessionReplayAllowed()) { sent.add(milestone); trackMarketing('scroll_depth', path, String(milestone)); }
      if (matchMedia('(pointer: coarse)').matches && depth >= 60) show();
    };
    const exit = (event: MouseEvent) => { if (!event.relatedTarget && (event.clientY <= 0 || event.clientY >= innerHeight || event.clientX <= 0 || event.clientX >= innerWidth) && matchMedia('(pointer: fine)').matches) show(); };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest('a');
      if (anchor?.getAttribute('href') === '/signup') trackMarketing('cta_click', path, 'signup');
      if (target?.closest('#ordis button, #hero button, a[href="#ordis"]')) trackMarketing('demo_interaction', path);
    };
    const timer = window.setTimeout(() => trackMarketing('engaged_view', path), 10000);
    window.addEventListener('scroll', scroll, { passive: true }); document.addEventListener('mouseout', exit); document.addEventListener('click', click);
    return () => { clearTimeout(timer); window.removeEventListener('cursis_cookie_consent_updated', consentChange); window.removeEventListener('scroll', scroll); document.removeEventListener('mouseout', exit); document.removeEventListener('click', click); };
  }, [path]);
  useEffect(() => {
    if (!open) return;
    // Non-modal prompt: focus is not stolen from the visitor's current interaction.
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trackMarketing('exit_dismissed', path); } };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [open, path]);
  if (!open || path === '/login' || path === '/signup') return null;
  return <aside className="marketing-exit" aria-label="Start a free workspace"><button ref={closeRef} aria-label="Dismiss signup prompt" className="marketing-exit-close" onClick={() => { setOpen(false); trackMarketing('exit_dismissed', path); }}>×</button><h2>Start your free workspace: up to 10 teammates, no credit card</h2><a className="btn btn-primary" href="/signup" onClick={() => trackMarketing('exit_converted', path)}>Start Free</a></aside>;
}
