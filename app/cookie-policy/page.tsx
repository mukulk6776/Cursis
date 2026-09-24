import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata: Metadata = {
  title: 'Cookie Policy — Cursis',
  description: 'Learn about how Cursis uses cookies and similar technologies to enhance your experience.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiePolicyPage() {
  return (
    <PolicyLayout
      title="Cookie Policy"
      badge="Data Collection & Tracking"
      badgeColor="#D97706"
      lastUpdated="Last Updated: September 24, 2026 • Version 2.0"
      activeSlug="cookie-policy"
      contactEmail="privacy@cursis.in"
      dpoEmail="dpo@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          This Cookie Policy explains how Cursis (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar tracking technologies. By accessing our platform, you consent to our use of essential cookies as described in this policy. We do not use advertising or surveillance trackers.
        </p>
      }
    >
      {/* Section 1 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          1. What Are Cookies?
        </h2>
        <p style={{ margin: 0 }}>
          Cookies are small, cryptographically secure text files stored on your device when you visit a website. They enable web applications to preserve your authenticated session, remember workspace preferences, and ensure tenant isolation across browser tabs.
        </p>
      </section>

      {/* Section 2 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          2. Types of Cookies We Use
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div style={{ padding: '16px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 6px 0' }}>
              Essential Cookies (Always Active)
            </h3>
            <p style={{ fontSize: '13px', color: '#525252', margin: '0 0 8px 0' }}>
              These cookies are strictly necessary for the platform to function and cannot be deactivated in our systems.
            </p>
            <ul style={{ fontSize: '13px', color: '#262626', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Authentication:</strong> Keeps you logged into your secure workspace session.</li>
              <li><strong>Security &amp; CSRF Defense:</strong> Protects against Cross-Site Request Forgery attacks.</li>
              <li><strong>Load Balancing:</strong> Routes client traffic to the closest low-latency region server.</li>
            </ul>
          </div>

          <div style={{ padding: '16px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 6px 0' }}>
              Functional Cookies (Preferences)
            </h3>
            <p style={{ fontSize: '13px', color: '#525252', margin: '0 0 8px 0' }}>
              These cookies remember your interface customization preferences.
            </p>
            <ul style={{ fontSize: '13px', color: '#262626', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Workspace State:</strong> Stores active workspace selection and sidebar layout state.</li>
              <li><strong>Theme Settings:</strong> Remembers your display preferences and accessibility settings.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          3. Zero Advertising &amp; Tracking Guarantee
        </h2>
        <p style={{ margin: 0 }}>
          Cursis does not use third-party behavioral tracking cookies, ad retargeting pixels, or surveillance scripts. Your workspace content and usage patterns are never shared with advertising brokers or data aggregators.
        </p>
      </section>

      {/* Section 4 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          4. Managing Cookie Settings
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          You can adjust your browser settings to block or notify you about cookies. Please note: disabling essential cookies may impact authentication and prevent workspace features from functioning properly.
        </p>
        <div style={{ padding: '14px', background: '#FEF3C7', border: '1.5px solid #D97706', borderRadius: '8px', fontSize: '13px', color: '#92400E', lineHeight: 1.6 }}>
          <strong>Note:</strong> Cursis fully respects the <em>Do Not Track (DNT)</em> and <em>Global Privacy Control (GPC)</em> browser signals by default.
        </div>
      </section>
    </PolicyLayout>
  );
}
