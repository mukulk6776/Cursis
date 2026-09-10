import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

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
    <div className="lp-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <main style={{ flex: '1 0 auto', maxWidth: '880px', margin: '0 auto', padding: '120px 24px 80px', color: '#f1f5f9' }}>
        {/* Header Badge & Title */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 85, 0, 0.1)', border: '1px solid rgba(255, 85, 0, 0.3)', borderRadius: '9999px', padding: '6px 14px', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF5500' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF5500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GDPR & Privacy Compliance
            </span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#ffffff' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Effective Date: September 10, 2026 • Version 2.4 (Enterprise Assurance)
          </p>
        </div>

        {/* Overview Box */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px 28px', marginBottom: '48px', backdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#cbd5e1' }}>
            At <strong>Cursis</strong> (operated by Cursis Inc., &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we are committed to safeguarding the privacy, integrity, and confidentiality of your personal and enterprise information. This Privacy Policy delineates how we collect, process, store, and protect information when you access <Link href="/" style={{ color: '#FF5500', textDecoration: 'underline' }}>www.cursis.in</Link> and our integrated business workspace applications.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontSize: '15px', lineHeight: 1.75, color: '#94a3b8' }}>
          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              1. Information We Collect
            </h2>
            <p>
              We adhere strictly to the principle of data minimization. We only collect information strictly requisite to providing high-reliability enterprise workspace capabilities:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong style={{ color: '#e2e8f0' }}>Account Identification:</strong> Business email address, name, organization identifier, and secure authentication tokens when you register or sign in via email or federated Google OAuth.
              </li>
              <li>
                <strong style={{ color: '#e2e8f0' }}>Workspace Operational Data:</strong> Team rosters, project tasks, roadmaps, modules, and workflow state created by your authorized team members within your private workspace.
              </li>
              <li>
                <strong style={{ color: '#e2e8f0' }}>Security & Telemetry Logs:</strong> Timestamped access logs, client IP address (anonymized for telemetry), user-agent strings, and request URLs utilized exclusively for security intrusion detection, DDOS defense, and audit assurance.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              2. Cookies & Local State Management
            </h2>
            <p>
              Cursis operates with zero third-party tracking or advertising cookies. We do not sell your personal information or monetize browsing behaviors. Our cookie utilization is limited to strictly necessary security cookies:
            </p>
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                    <th style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Cookie Name</th>
                    <th style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Purpose</th>
                    <th style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Type</th>
                    <th style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'var(--font-mono)' }}>cursis_session</td>
                    <td style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>Cryptographically signed session verification for authorized workspace access</td>
                    <td style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>Strictly Necessary (HttpOnly, SameSite=Lax, Secure)</td>
                    <td style={{ padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>Session / 7 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              3. GDPR Data Protection Rights (EU Residents)
            </h2>
            <p>
              Under the General Data Protection Regulation (GDPR), individuals within the European Economic Area (EEA) possess specific statutory rights regarding their personal data:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong style={{ color: '#e2e8f0' }}>Right of Access (Article 15):</strong> You have the right to obtain confirmation and copies of your personal data held by Cursis.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Rectification (Article 16):</strong> You have the right to request immediate correction of inaccurate or incomplete personal information.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Erasure (&quot;Right to be Forgotten&quot;, Article 17):</strong> You may request the permanent deletion of your personal account and associated data.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Restrict Processing (Article 18):</strong> You may request temporary suspension of data processing under statutory dispute conditions.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Data Portability (Article 20):</strong> You have the right to export your workspace records in structured, machine-readable JSON/CSV formats.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Object (Article 21):</strong> You may object at any time to the processing of your data based on legitimate interests.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              To exercise any GDPR statutory right, please contact our Data Protection Officer at <a href="mailto:privacy@cursis.app" style={{ color: '#FF5500', textDecoration: 'underline' }}>privacy@cursis.app</a>. Requests are responded to within thirty (30) days without charge.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              4. Technical & Organizational Security Measures
            </h2>
            <p>
              Cursis implements multi-layered defensive security architecture aligned with SOC-2, ISO 27001, and PCI DSS best practices:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong style={{ color: '#e2e8f0' }}>Encryption in Transit:</strong> Strict HTTPS with TLS 1.3, automated HSTS (Strict-Transport-Security) enforced for 63,072,000 seconds with subdomain preloading.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Headers Defense:</strong> Deterministic Content-Security-Policy (CSP), X-Frame-Options DENY, and X-Content-Type-Options nosniff headers preventing clickjacking, MIME sniffing, and cross-site scripting (XSS).</li>
              <li><strong style={{ color: '#e2e8f0' }}>Encryption at Rest:</strong> Database volumes and credential keys encrypted using AES-256 standards with KMS isolation.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Access Control:</strong> Zero-trust role-based access control (RBAC) preventing horizontal privilege escalation across workspaces.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              5. Automated Bot & Scraping Policy
            </h2>
            <p>
              Cursis strictly prohibits unauthorized automated harvesting, web scraping, or training of machine learning and large language models (LLMs) on private user or workspace content. We publish explicit machine-readable rules in our <Link href="/robots.txt" style={{ color: '#FF5500', textDecoration: 'underline' }}>robots.txt</Link> file blocking unauthorized crawler agents including GPTBot, ChatGPT-User, CCBot, anthropic-ai, and related scrapers.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              6. Contact Information & Data Protection Officer
            </h2>
            <p>
              If you have any questions, grievances, or inquiries regarding our data handling practices or this Privacy Policy, our dedicated security office can be contacted directly:
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px 20px', marginTop: '12px' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontWeight: 600 }}>Cursis Security & Privacy Office</p>
              <p style={{ margin: '0 0 4px' }}>Email: <a href="mailto:privacy@cursis.app" style={{ color: '#FF5500' }}>privacy@cursis.app</a> / <a href="mailto:security@cursis.app" style={{ color: '#FF5500' }}>security@cursis.app</a></p>
              <p style={{ margin: 0 }}>Website: <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'underline' }}>https://www.cursis.in</Link></p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
