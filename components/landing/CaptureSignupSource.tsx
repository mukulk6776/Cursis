'use client';
import { useEffect } from 'react';
import { isSessionReplayAllowed } from '@/lib/analytics/privacy';

export default function CaptureSignupSource() {
  useEffect(() => {
    const capture = () => {
      try {
        if (!isSessionReplayAllowed()) { sessionStorage.removeItem('cursis_signup_source'); return; }
        if (new URLSearchParams(location.search).get('source') === 'ordis-demo') {
          sessionStorage.setItem('cursis_signup_source', JSON.stringify({ source: 'ordis-demo', at: Date.now() }));
        }
      } catch {}
    };
    capture();
    window.addEventListener('cursis_cookie_consent_updated', capture);
    return () => window.removeEventListener('cursis_cookie_consent_updated', capture);
  }, []);
  return null;
}
