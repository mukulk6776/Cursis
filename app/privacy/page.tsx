import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — Cursis Enterprise Workspace',
  description: 'Learn how Cursis protects your data, enforces GDPR and CCPA compliance, and secures enterprise workspaces.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      badge="GDPR & Privacy Compliance"
      badgeColor="#FF5500"
      lastUpdated="Effective Date: September 24, 2026 • Version 2.5 (Enterprise Assurance)"
      activeSlug="privacy"
      contactEmail="privacy@cursis.in"
      dpoEmail="dpo@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          At <strong>Cursis</strong> (operated by Cursis Inc., &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we are committed to safeguarding the privacy, integrity, and confidentiality of your personal and enterprise information. This Privacy Policy delineates how we collect, process, store, and protect information when you access <Link href="/" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>cursis.in</Link> and our integrated business workspace applications.
        </p>
      }
    >
      {/* Section 1 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          1. Information We Collect
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          We adhere strictly to the principle of data minimization. We only collect information strictly requisite to providing high-reliability enterprise workspace capabilities:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong style={{ color: '#0A0A0A' }}>Account Identification:</strong> Business email address, name, organization identifier, and secure authentication tokens when you register or sign in via email or federated Google OAuth.
          </li>
          <li>
            <strong style={{ color: '#0A0A0A' }}>Workspace Operational Data:</strong> Team rosters, project tasks, roadmaps, modules, and workflow state created by your authorized team members within your private workspace.
          </li>
          <li>
            <strong style={{ color: '#0A0A0A' }}>Telemetry &amp; Security Logs:</strong> Cryptographic session tokens, client IP addresses (anonymized for telemetry), user-agent strings, and request payloads exclusively for service availability monitoring, DDoS defense, audit logs, and SOC-2 audit compliance.
          </li>
        </ul>
      </section>

      {/* Section 2 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          2. Zero Third-Party Advertising &amp; Commercialization
        </h2>
        <p style={{ margin: '0 0 14px 0' }}>
          Cursis operates with zero third-party tracking or advertising networks. We do not sell your personal information or monetize browsing behaviors. Our cookie utilization is strictly restricted to essential session preservation and tenant isolation.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0A0A0A', marginBottom: '4px' }}>cursis_token</div>
            <div style={{ fontSize: '12px', color: '#525252' }}>Cryptographically signed session verification for authenticated workspace access. Rotated dynamically.</div>
          </div>
          <div style={{ padding: '14px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0A0A0A', marginBottom: '4px' }}>cursis_cookie_consent</div>
            <div style={{ fontSize: '12px', color: '#525252' }}>Stores user consent preferences for compliance auditing under GDPR and ePrivacy Directive.</div>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          3. GDPR &amp; International Privacy Rights
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Under the General Data Protection Regulation (GDPR), individuals within the European Economic Area (EEA) possess specific statutory rights regarding their personal data:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong style={{ color: '#0A0A0A' }}>Right of Access:</strong> You have the right to request comprehensive overviews of your data.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Rectification:</strong> You may update or correct inaccurate personal information.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You may request permanent deletion of your data via our dedicated <Link href="/data-deletion" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>Data Deletion</Link> facility.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Restriction:</strong> You may request temporary suspension of data processing during disputes.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Data Portability:</strong> You have the right to export your workspace data in structured, machine-readable formats (JSON / CSV).</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          4. Infrastructure Security &amp; Data Isolation
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Cursis implements multi-layered defensive security architectures aligned with SOC-2, ISO 27001, and HIPAA best practices:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong style={{ color: '#0A0A0A' }}>Encryption at Rest &amp; Transit:</strong> TLS 1.3 enforced for all transport connections; AES-256 with automated key rotation for database storage.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Tenant Data Isolation:</strong> Every workspace operates within an isolated cryptographic namespace, ensuring workspace data cannot bleed across accounts.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Access Control:</strong> Zero-trust role-based access control (RBAC) preventing horizontal privilege escalation across workspaces.</li>
        </ul>
      </section>

      {/* Section 5: Notice the standard <a> tag instead of <Link> for robots.txt */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          5. Automated Bot &amp; Scraping Policy
        </h2>
        <p style={{ margin: 0 }}>
          Cursis strictly prohibits unauthorized automated harvesting, web scraping, or training of machine learning and large language models (LLMs) on private user or workspace content. We publish explicit machine-readable rules in our{' '}
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}
          >
            robots.txt
          </a>{' '}
          file blocking unauthorized crawler agents including GPTBot, ChatGPT-User, CCBot, anthropic-ai, and related scrapers.
        </p>
      </section>
    </PolicyLayout>
  );
}
