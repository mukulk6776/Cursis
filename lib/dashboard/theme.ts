export type ThemePreference = 'light';
export const THEME_EVENT = 'cursis:theme-change';

export function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

export function readThemePreference(): ThemePreference {
  return 'light';
}

export function applyRouteTheme(pathname: string, _preference = readThemePreference()): void {
  const dashboard = isDashboardPath(pathname);
  const root = document.documentElement;
  root.dataset.dashboard = String(dashboard);
  root.dataset.theme = 'light';
  root.classList.remove('dark');
  root.style.colorScheme = 'light';
  if (!dashboard) {
    root.removeAttribute('data-density');
    ['--c-brand', '--c-brand-hover', '--c-info'].forEach(property => root.style.removeProperty(property));
  }
}

export function setDashboardTheme(_preference?: any): void {
  try { localStorage.setItem('cursis_theme', 'light'); } catch { /* Keep the current session usable. */ }
  applyRouteTheme(window.location.pathname, 'light');
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: 'light' }));
}

// Runs before first paint; locks strictly to light mode (cream palette)
export const THEME_BOOTSTRAP = `(function(){var r=document.documentElement,d=location.pathname==='/dashboard'||location.pathname.indexOf('/dashboard/')===0;try{localStorage.removeItem('cursis_theme')}catch(e){}r.setAttribute('data-dashboard',String(d));r.setAttribute('data-theme','light');r.classList.remove('dark');r.style.colorScheme='light'})();`;
