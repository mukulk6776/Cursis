import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

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
    <div className="lp-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <main style={{ flex: '1 0 auto', maxWidth: '880px', margin: '0 auto', padding: '120px 24px 80px', color: '#f1f5f9' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '9999px', padding: '6px 14px', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Collection & Tracking
            </span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#ffffff' }}>
            Cookie Policy
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Last Updated: September 19, 2026 • Version 1.0
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px 28px', marginBottom: '48px', backdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#cbd5e1' }}>
            This Cookie Policy explains how Cursis (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar tracking technologies. By using our service, you consent to our use of cookies as described in this policy.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontSize: '15px', lineHeight: 1.75, color: '#94a3b8' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, authenticate your identity, and improve your browsing experience.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              2. Types of Cookies We Use
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                Essential Cookies (Always Active)
              </h3>
              <p>
                These cookies are necessary for the website to function and cannot be disabled:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Authentication:</strong> Keep you logged in to your workspace</li>
                <li><strong>Security:</strong> Prevent CSRF attacks and secure your session</li>
                <li><strong>Load Balancing:</strong> Route your requests to the correct server</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                Functional Cookies (Optional)
              </h3>
              <p>
                These cookies enhance functionality and personalization:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Preferences:</strong> Remember your theme, language, and layout settings</li>
                <li><strong>Workspace State:</strong> Restore your last viewed page and sidebar state</li>
                <li><strong>Feature Flags:</strong> Enable beta features you've opted into</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                Analytics Cookies (Optional)
              </h3>
              <p>
                Help us understand how users interact with Cursis:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Usage Analytics:</strong> Track page views, feature adoption, and performance</li>
                <li><strong>Error Tracking:</strong> Capture technical errors to improve stability</li>
                <li><strong>Session Recording:</strong> Understand user flows (only with explicit consent)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              3. Third-Party Cookies
            </h2>
            <p>
              We use the following third-party services that may set cookies:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Firebase Authentication:</strong> Secure user authentication and session management</li>
              <li><strong>Google Analytics:</strong> Website traffic and usage analytics (optional, can be disabled)</li>
              <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
            </ul>
            <p style={{ marginTop: '16px' }}>
              These third parties have their own cookie policies. We do not control their cookies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              4. Cookie Duration
            </h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain for 30 days or until manually cleared</li>
              <li><strong>Authentication Tokens:</strong> Expire after 14 days of inactivity</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              5. Managing Your Cookie Preferences
            </h2>
            <p>
              You can control cookies through:
            </p>
            <ol style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Cookie Banner:</strong> Accept or reject optional cookies when you first visit</li>
              <li><strong>Account Settings:</strong> Manage cookie preferences in your workspace settings</li>
              <li><strong>Browser Settings:</strong> Block or delete cookies directly in your browser</li>
            </ol>
            <p style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', color: '#fbbf24' }}>
              ⚠️ <strong>Note:</strong> Disabling essential cookies may prevent you from using certain features of Cursis.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              6. Do Not Track (DNT)
            </h2>
            <p>
              Cursis respects Do Not Track browser signals. When DNT is enabled, we:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Disable all optional analytics and tracking cookies</li>
              <li>Only use essential cookies required for core functionality</li>
              <li>Do not share data with third-party analytics providers</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              7. Updates to This Policy
            </h2>
            <p>
              We may update this Cookie Policy periodically. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Continued use of Cursis after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              8. Contact Us
            </h2>
            <p>
              For questions about our use of cookies:
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px 20px', marginTop: '12px' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontWeight: 600 }}>Cursis Data Protection</p>
              <p style={{ margin: '0 0 4px' }}>Email: <a href="mailto:privacy@cursis.app" style={{ color: '#fbbf24' }}>privacy@cursis.app</a></p>
              <p style={{ margin: 0 }}>Privacy Policy: <Link href="/privacy-policy" style={{ color: '#fbbf24' }}>View Policy</Link></p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
