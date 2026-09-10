import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: 'Terms of Service — Cursis Enterprise Workspace',
  description: 'Understand the terms of service, SLA guarantees, acceptable use policies, and subscription details for Cursis.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="lp-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <main style={{ flex: '1 0 auto', maxWidth: '880px', margin: '0 auto', padding: '120px 24px 80px', color: '#f1f5f9' }}>
        {/* Header Badge & Title */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 85, 0, 0.1)', border: '1px solid rgba(255, 85, 0, 0.3)', borderRadius: '9999px', padding: '6px 14px', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF5500' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF5500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Service Level Agreement & Master Terms
            </span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#ffffff' }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Last Updated: September 10, 2026 • Version 2.4
          </p>
        </div>

        {/* Overview Box */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px 28px', marginBottom: '48px', backdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#cbd5e1' }}>
            These Terms of Service (&quot;Terms&quot;) govern your access to and utilization of Cursis (&quot;Platform&quot;), including website services available at <Link href="/" style={{ color: '#FF5500', textDecoration: 'underline' }}>www.cursis.in</Link>. By registering, creating a workspace, or accessing our software, you agree to be bound by these Terms and our <Link href="/privacy" style={{ color: '#FF5500', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontSize: '15px', lineHeight: 1.75, color: '#94a3b8' }}>
          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              1. Provision of Workspace Services & SLA
            </h2>
            <p>
              Cursis provides an enterprise workspace platform featuring collaboration, roadmap management, workflow tracking, and Ordis intelligence modules. We commit to a 99.99% monthly scheduled uptime Service Level Agreement (SLA) for enterprise organizations, backed by automated multi-region failover and real-time health monitoring.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              2. Acceptable Use & Security Conduct
            </h2>
            <p>
              Users and enterprise organizations agree not to:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Engage in automated extraction, scraping, crawling, or vulnerability fuzzing without explicit prior written authorization from our security team.</li>
              <li>Attempt to reverse-engineer, decompile, or breach access controls protecting multi-tenant workspace partitions.</li>
              <li>Upload malicious code, exploits, or content infringing intellectual property rights.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              3. Data Ownership & Confidentiality
            </h2>
            <p>
              You retain all intellectual property rights, title, and ownership in all data, projects, tasks, workflows, and documents inputted into your Cursis workspace. Cursis claims zero ownership over your proprietary business assets and processes your information solely as a confidential data processor under strict GDPR and SOC-2 safeguards.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              4. Termination & Export
            </h2>
            <p>
              You may terminate your account at any time. Upon workspace deactivation, you are entitled to export complete snapshots of your workspace data in open formats. Data retention and deletion follow the timelines delineated in our <Link href="/privacy" style={{ color: '#FF5500', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              5. Contact & Support
            </h2>
            <p>
              For legal inquiries, enterprise agreements, or compliance validations:
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px 20px', marginTop: '12px' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontWeight: 600 }}>Cursis Legal & Enterprise Relations</p>
              <p style={{ margin: '0 0 4px' }}>Email: <a href="mailto:enterprise@cursis.app" style={{ color: '#FF5500' }}>enterprise@cursis.app</a></p>
              <p style={{ margin: 0 }}>Security Desk: <a href="mailto:security@cursis.app" style={{ color: '#FF5500' }}>security@cursis.app</a></p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
