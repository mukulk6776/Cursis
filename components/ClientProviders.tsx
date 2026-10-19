'use client';

import dynamic from 'next/dynamic';
import { ThemeController } from './ThemeController';
import { PrivacyTelemetryGuard } from './PrivacyTelemetryGuard';

// Lazy load CookieConsent - it's not needed for initial render
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
});

export function ClientProviders() {
  return (
    <>
      <ThemeController />
      <PrivacyTelemetryGuard />
      <CookieConsent />
    </>
  );
}
