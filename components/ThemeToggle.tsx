'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  readThemePreference,
  resolveThemeMode,
  setDashboardTheme,
  THEME_EVENT,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/dashboard/theme';

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
  size?: number;
}

export function ThemeToggle({
  className = '',
  style,
  showLabel = false,
  size = 16,
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>('light');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const sync = () => {
      const pref = readThemePreference();
      setPreference(pref);
      setResolved(resolveThemeMode(pref));
    };
    sync();
    setMounted(true);

    const onThemeEvent = () => sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        sync();
      }
    };
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

    window.addEventListener(THEME_EVENT, onThemeEvent as EventListener);
    window.addEventListener('storage', onStorage);
    media?.addEventListener('change', sync);

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeEvent as EventListener);
      window.removeEventListener('storage', onStorage);
      media?.removeEventListener('change', sync);
    };
  }, []);

  const isDark = mounted && resolved === 'dark';
  const nextMode: ThemePreference = isDark ? 'light' : 'dark';
  const label = isDark ? 'Light mode' : 'Dark mode';
  const titleText = mounted
    ? `${isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}${preference === 'system' ? ' (currently System)' : ''}`
    : 'Toggle theme';

  const handleToggle = () => {
    setDashboardTheme(nextMode);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={className ? `cursis-theme-toggle ${className}` : 'cursis-theme-toggle'}
      style={style}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={titleText}
      data-theme-toggle="true"
    >
      {isDark ? <Sun size={size} strokeWidth={2.1} /> : <Moon size={size} strokeWidth={2.1} />}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
