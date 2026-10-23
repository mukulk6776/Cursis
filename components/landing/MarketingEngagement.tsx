'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isSessionReplayAllowed } from '@/lib/analytics/privacy';
import { trackMarketing } from '@/lib/analytics/marketing';
export default function MarketingEngagement() {
  const path = usePathname();
  useEffect(() => {
    if (!path || /^(\/dashboard|\/workspace|\/api)(\/|$)/.test(path)) return;
    let viewed = false;
    const pageView = () => {
      if (viewed || !isSessionReplayAllowed()) return;
      viewed = true;
      trackMarketing(path === '/compare' ? 'compare_view' : 'page_view', path);
      if (path === '/signup') trackMarketing('signup_start', path);
    };
    pageView();
    window.addEventListener('cursis_cookie_consent_updated', pageView);
    const sent = new Set<number>();
    const scroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const depth = available > 0 ? window.scrollY / available * 100 : 0;
      for (const milestone of [25, 50, 75, 100]) if (depth >= milestone - 1 && !sent.has(milestone) && isSessionReplayAllowed()) { sent.add(milestone); trackMarketing('scroll_depth', path, String(milestone)); }
    };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest('a');
      const href = anchor?.getAttribute('href');
      if (href && /^\/signup(?:[?#]|$)/.test(href)) trackMarketing('signup_click', path);
      if (anchor?.dataset.marketing === 'hero_button_click') trackMarketing('hero_button_click', path);
    };
    const timer = window.setTimeout(() => trackMarketing('engaged_view', path), 10000);
    window.addEventListener('scroll', scroll, { passive: true }); document.addEventListener('click', click);
    return () => { clearTimeout(timer); window.removeEventListener('cursis_cookie_consent_updated', pageView); window.removeEventListener('scroll', scroll); document.removeEventListener('click', click); };
  }, [path]);
  return null;
}
