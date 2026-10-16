export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_EVENT = 'cursis:theme-change';

export function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

export function readThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem('cursis_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch { /* Storage may be blocked; system preference still works. */ }
  return 'system';
}

export function applyRouteTheme(pathname: string, preference = readThemePreference()): void {
  const dashboard = isDashboardPath(pathname);
  const dark = dashboard && (preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const root = document.documentElement;
  root.dataset.dashboard = String(dashboard);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  if (!dashboard) {
    root.removeAttribute('data-density');
    ['--c-brand', '--c-brand-hover', '--c-info'].forEach(property => root.style.removeProperty(property));
  }
}

export function setDashboardTheme(preference: ThemePreference): void {
  try { localStorage.setItem('cursis_theme', preference); } catch { /* Keep the current session usable. */ }
  applyRouteTheme(window.location.pathname, preference);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: preference }));
}

// Runs before first paint; keep the same route boundary as applyRouteTheme.
export const THEME_BOOTSTRAP = `(function(){var r=document.documentElement,d=location.pathname==='/dashboard'||location.pathname.indexOf('/dashboard/')===0,t='system';try{t=localStorage.getItem('cursis_theme')||'system'}catch(e){}if(t!=='light'&&t!=='dark'&&t!=='system')t='system';var dark=d&&(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches));r.setAttribute('data-dashboard',String(d));r.setAttribute('data-theme',dark?'dark':'light');r.classList.toggle('dark',dark);r.style.colorScheme=dark?'dark':'light'})();`;
