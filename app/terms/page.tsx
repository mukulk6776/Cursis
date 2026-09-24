import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

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
    <PolicyLayout
      title="Terms of Service"
      badge="Service Level Agreement & Master Terms"
      badgeColor="#0F4CFF"
      lastUpdated="Last Updated: September 24, 2026 • Version 2.5"
      activeSlug="terms"
      contactEmail="legal@cursis.in"
      dpoEmail="compliance@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          These Terms of Service (&quot;Terms&quot;) govern your access to and utilization of Cursis (&quot;Platform&quot;), including website services available at <Link href="/" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>cursis.in</Link>. By registering, creating a workspace, or accessing our software, you agree to be bound by these Terms and our <Link href="/privacy" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>Privacy Policy</Link>.
        </p>
      }
    >
      {/* Section 1 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          1. Provision of Workspace Services &amp; SLA
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Cursis provides an enterprise workspace platform featuring collaboration, roadmap management, workflow tracking, and Ordis intelligence modules. We commit to a <strong>99.99% monthly scheduled uptime</strong> Service Level Agreement (SLA) for enterprise organizations, backed by automated multi-region failover and real-time health monitoring.
        </p>
        <p style={{ margin: 0 }}>
          Scheduled maintenance windows are announced at least 72 hours in advance and executed outside primary business operating hours.
        </p>
      </section>

      {/* Section 2 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          2. Acceptable Use &amp; Security Conduct
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Users and enterprise organizations agree not to:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Engage in automated extraction, scraping, mining, or vulnerability testing without explicit prior written authorization from our security team.</li>
          <li>Attempt to reverse engineer, decompile, or breach access controls protecting multi-tenant workspace partitions.</li>
          <li>Upload malicious code, exploits, or content infringing third-party intellectual property rights.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          3. Ownership of Workspace Data
        </h2>
        <p style={{ margin: 0 }}>
          You retain all intellectual property rights, title, and ownership in all data, projects, task records, workflows, and documents uploaded into your Cursis workspace. Cursis claims zero ownership over your proprietary business assets and processes your operational activity as a confidential data processor under strict GDPR and SOC-2 safeguards.
        </p>
      </section>

      {/* Section 4 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          4. Termination &amp; Data Export
        </h2>
        <p style={{ margin: 0 }}>
          You may terminate your account at any time. Upon workspace deactivation, you are entitled to export complete snapshots of your workspace data in open data formats. Deletion schedules follow the timelines established in our <Link href="/data-deletion" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>Data Deletion Policy</Link>.
        </p>
      </section>

      {/* Section 5 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          5. Limitation of Liability
        </h2>
        <p style={{ margin: 0 }}>
          To the maximum extent permitted by applicable law, Cursis and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to use the platform. Our aggregate liability for all claims arising under these Terms shall not exceed the amounts paid by you to Cursis during the twelve (12) months preceding the incident.
        </p>
      </section>
    </PolicyLayout>
  );
}
