import { isSessionReplayAllowed } from './privacy';

// Keep these actions compatible with the existing aggregate-only analytics API.
export const MARKETING_EVENTS = {
  hero_button_click: { event: 'cta_click', value: '' },
  signup_click: { event: 'cta_click', value: 'signup' },
  demo_question_click: { event: 'demo_interaction', value: '' },
  demo_completion: { event: 'demo_interaction', value: '100' },
  compare_view: { event: 'page_view', value: '' },
} as const;
export function trackMarketing(name: string, path: string, value = '') {
  if (!isSessionReplayAllowed()) return;
  const mapped = MARKETING_EVENTS[name as keyof typeof MARKETING_EVENTS];
  void fetch('/api/marketing-events', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: mapped?.event ?? name, path, value: mapped?.value ?? value, consent: true }), keepalive: true }).catch(() => {});
}
