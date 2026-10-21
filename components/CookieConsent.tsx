'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { hasCurrentCookieChoice } from '@/lib/analytics/privacy';

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {}
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Preferences state
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    // Check DNT/GPC signals
    const dntSignal = typeof navigator !== 'undefined' && (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      (navigator as any).globalPrivacyControl === true
    );

    // Check if user has already made a choice
    const consent = safeGetStorage('cursis_cookie_consent');
    let timer: NodeJS.Timeout | null = null;

    if (!consent) {
      if (dntSignal) {
        setFunctional(false);
        setAnalytics(false);
      }
      // Delay showing banner by 1 second for better UX
      timer = setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        if (!hasCurrentCookieChoice(saved)) throw new Error('Expired consent');
        setFunctional(saved.functional === true);
        setAnalytics(!dntSignal && saved.analytics === true);
      } catch {
        // Corrupt JSON: reset and show banner
        timer = setTimeout(() => setShowBanner(true), 1000);
      }
    }

    const handleOpenPreferences = () => {
      setShowBanner(true);
      setShowPreferences(true);
    };

    window.addEventListener('cursis_open_cookie_preferences', handleOpenPreferences);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('cursis_open_cookie_preferences', handleOpenPreferences);
    };
  }, []);

  const handleAcceptAll = () => {
    const consent = { essential: true, functional: true, analytics: true, timestamp: new Date().toISOString() };
    safeSetStorage('cursis_cookie_consent', JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('cursis_cookie_consent_updated', { detail: consent }));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectOptional = () => {
    const consent = { essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() };
    safeSetStorage('cursis_cookie_consent', JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('cursis_cookie_consent_updated', { detail: consent }));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    const consent = { essential: true, functional, analytics, timestamp: new Date().toISOString() };
    safeSetStorage('cursis_cookie_consent', JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('cursis_cookie_consent_updated', { detail: consent }));
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div
        className="cookie-consent"
        role="region"
        aria-label="Cookie preferences"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          borderRadius: '18px',
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 24px',
          zIndex: 9999,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            {/* Cookie Icon */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)' }}>
              <Cookie size={20} color="#ffffff" />
            </div>

            {/* Content */}
            <div style={{ flex: '1 1 400px', minWidth: '280px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                We Value Your Privacy
              </h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#94a3b8' }}>
                Essential storage keeps Cursis working. Optional analytics stay off unless you accept them. Choose your preferences or reject optional cookies.
                {' '}
                <Link href="/cookie-policy" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                  Read our cookie policy
                </Link>
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Customize
              </button>
              <button
                onClick={handleRejectOptional}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                Reject Optional
              </button>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: '10px 24px',
                  background: '#0f4cff',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(15, 76, 255, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0d42d9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0f4cff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Accept All
              </button>
            </div>
          </div>

          {/* Preferences Panel */}
          {showPreferences && (
            <div
              style={{
                marginTop: '12px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
              }}
            >
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                Cookie Preferences
              </h4>

              {/* Essential Cookies */}
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  aria-label="Essential cookies"
                  checked={true}
                  disabled
                  style={{ marginTop: '2px', cursor: 'not-allowed' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    Essential Cookies <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Always Active)</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Required for authentication, security, and core site functionality.
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  aria-label="Functional cookies"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    Functional Cookies
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Remember your preferences, theme, language, and personalized settings.
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  aria-label="Analytics cookies"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    Analytics &amp; Session Telemetry (Disabled by Default)
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Optional usage measurement is off until you choose it. Input masking is a safeguard, not permission to record private content. No session-replay provider is currently configured.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowPreferences(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  style={{
                    padding: '8px 20px',
                    background: '#0f4cff',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
