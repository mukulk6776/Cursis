export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cursis_theme';
export const THEME_EVENT = 'cursis:theme-change';

function normalizeThemePreference(value: unknown): ThemePreference {
  if (value === 'dark' || value === 'light' || value === 'system') {
    return value;
  }
  return 'light';
}

export function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  try {
    return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

export function resolveThemeMode(preference: ThemePreference = readThemePreference()): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function applyRouteTheme(pathname: string, preference: ThemePreference = readThemePreference()): void {
  if (typeof document === 'undefined') return;
  const dashboard = isDashboardPath(pathname);
  const normalizedPreference = normalizeThemePreference(preference);
  const resolved = resolveThemeMode(normalizedPreference);
  const root = document.documentElement;
  root.dataset.dashboard = String(dashboard);
  root.dataset.theme = resolved;
  root.dataset.themePreference = normalizedPreference;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  if (!dashboard) {
    root.removeAttribute('data-density');
    ['--c-brand', '--c-brand-hover', '--c-info'].forEach(property => root.style.removeProperty(property));
  }
}

export function setDashboardTheme(preference: ThemePreference = 'light'): void {
  const next = normalizeThemePreference(preference);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* Keep the current session usable. */
  }
  applyRouteTheme(window.location.pathname, next);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
}

export const setSiteTheme = setDashboardTheme;

// Runs before first paint; defaults to Cream Light unless user picked dark or system
export const THEME_BOOTSTRAP = `(function(){var r=document.documentElement,d=location.pathname==='/dashboard'||location.pathname.indexOf('/dashboard/')===0,p='light';try{var s=localStorage.getItem('cursis_theme');if(s==='light'||s==='dark'||s==='system'){p=s}}catch(e){}var t=p==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;r.setAttribute('data-dashboard',String(d));r.setAttribute('data-theme',t);r.setAttribute('data-theme-preference',p);if(t==='dark'){r.classList.add('dark')}else{r.classList.remove('dark')}r.style.colorScheme=t})();`;
