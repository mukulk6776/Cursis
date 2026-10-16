'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { applyRouteTheme, readThemePreference, THEME_EVENT, ThemePreference } from '@/lib/dashboard/theme';

export function ThemeController() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    let preference = readThemePreference();
    const apply = () => applyRouteTheme(pathname, preference);
    const storage = (event: StorageEvent) => {
      if (event.key === 'cursis_theme' || event.key === null) {
        preference = readThemePreference();
        apply();
      }
    };
    const change = (event: Event) => {
      preference = (event as CustomEvent<ThemePreference>).detail;
      apply();
    };
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    apply();
    system.addEventListener('change', apply);
    window.addEventListener('storage', storage);
    window.addEventListener(THEME_EVENT, change);
    return () => {
      system.removeEventListener('change', apply);
      window.removeEventListener('storage', storage);
      window.removeEventListener(THEME_EVENT, change);
    };
  }, [pathname]);

  return null;
}
