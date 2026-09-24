import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata: Metadata = {
  title: 'Data Deletion Request — Cursis',
  description: 'Submit a request to delete your personal data from Cursis in compliance with GDPR and data protection regulations.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function DataDeletionPage() {
  return (
    <PolicyLayout
      title="Data Deletion Request"
      badge="GDPR & Data Protection Rights"
      badgeColor="#DC2626"
      lastUpdated="Last Updated: September 24, 2026 • Version 2.0"
      activeSlug="data-deletion"
      contactEmail="privacy@cursis.in"
      dpoEmail="dpo@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          You have the statutory right to request permanent deletion of your personal data under GDPR, CCPA, and global privacy standards. We process deletion requests within 30 days of verified identity confirmation.
        </p>
      }
    >
      {/* Section 1 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          1. Your Statutory Data Protection Rights
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Under GDPR, CCPA, and comparable international data privacy frameworks, you maintain:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request permanent purging of personal profile information and authentication credentials.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Data Portability:</strong> Obtain a complete snapshot export of your documents and workspace activity before deletion.</li>
          <li><strong style={{ color: '#0A0A0A' }}>Right to Revoke Consent:</strong> Terminate any optional processing permissions previously granted.</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          2. Scope of Deletion
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          When a data deletion request is processed:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '16px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 6px 0' }}>
              Permanently Purged
            </h3>
            <ul style={{ fontSize: '13px', color: '#262626', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>User account identifiers, email records, and hashed authentication tokens</li>
              <li>Personal profile details, avatars, and linked identity provider tokens</li>
              <li>Personal notification histories and private chat threads</li>
              <li>Workspace task assignments created exclusively by you in deactivated workspaces</li>
            </ul>
          </div>

          <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#92400E', margin: '0 0 6px 0' }}>
              Legally Mandated Retention Exceptions
            </h3>
            <p style={{ fontSize: '13px', color: '#78350F', margin: 0 }}>
              Transaction receipts and billing invoices are retained for up to 7 years in compliance with tax and financial accounting statutes. Security audit logs are retained in anonymized format for SOC-2 compliance for 90 days.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          3. How to Submit a Deletion Request
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '12px' }}>
          <div style={{ padding: '18px', background: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '10px', boxShadow: '2px 2px 0 0 #0A0A0A' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0A', marginBottom: '6px' }}>Option A: In-App Self-Service</div>
            <p style={{ fontSize: '13px', color: '#525252', margin: 0, lineHeight: 1.6 }}>
              Log into your Cursis dashboard, navigate to <strong>Settings &gt; Organization &gt; Security &amp; Data Deletion</strong>, and click <em>Request Data Purge</em>.
            </p>
          </div>

          <div style={{ padding: '18px', background: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '10px', boxShadow: '2px 2px 0 0 #0A0A0A' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0A', marginBottom: '6px' }}>Option B: Direct Email Submission</div>
            <p style={{ fontSize: '13px', color: '#525252', margin: 0, lineHeight: 1.6 }}>
              Send an email from your registered account to <a href="mailto:privacy@cursis.in" style={{ color: '#0F4CFF', fontWeight: 700, textDecoration: 'none' }}>privacy@cursis.in</a> with the subject line: <em>Data Deletion Request</em>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '14px', background: '#F5F5F0', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '13px', color: '#525252', lineHeight: 1.6 }}>
          <strong>Important:</strong> Data deletion is permanent and cannot be undone. Make sure to export any workspace records you wish to preserve prior to initiating your deletion request.
        </div>
      </section>
    </PolicyLayout>
  );
}
