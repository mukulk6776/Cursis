'use client';

import { useEffect } from 'react';
import { initDynamicPrivacyMasking, isSessionReplayAllowed } from '@/lib/analytics/privacy';

/**
 * PrivacyTelemetryGuard
 * Ensures:
 * 1. Session Replay is OFF by default.
 * 2. Inputs & textareas are continuously masked to block California wiretapping (CIPA § 631) exposure.
 * 3. Respects Global Privacy Control (GPC) and Do Not Track (DNT).
 */
export function PrivacyTelemetryGuard() {
  useEffect(() => {
    // 1. Initialize universal input masking across all forms and text fields
    const cleanupMasking = initDynamicPrivacyMasking();

    // 2. Telemetry / Replay gate: Log privacy status in development
    if (process.env.NODE_ENV === 'development') {
      const allowed = isSessionReplayAllowed();
      console.log(`[Cursis Privacy Guard] Session Replay Allowed: ${allowed} (Default: OFF per CIPA § 631)`);
    }

    // 3. Listen to cookie consent updates
    const handleConsentUpdate = () => {
      // Re-apply masking to ensure newly exposed forms are shielded
      initDynamicPrivacyMasking();
    };

    window.addEventListener('cursis_cookie_consent_updated', handleConsentUpdate);

    return () => {
      cleanupMasking();
      window.removeEventListener('cursis_cookie_consent_updated', handleConsentUpdate);
    };
  }, []);

  return null;
}
