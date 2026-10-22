import { BRAND_NAME, FREE_WORKSPACE_TEXT, INCLUDED_TOOLS } from '@/lib/site';
import { marketingMetadata } from '@/lib/seo/marketing';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata = { ...marketingMetadata('/terms', 'Terms of Service', 'Read the terms for using the Cursis team workspace and Ordis AI.') };

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      badge="Workspace terms"
      badgeColor="#0F4CFF"
      lastUpdated="Last Updated: September 24, 2026 • Version 2.5"
      activeSlug="terms"
      contactEmail="official@cursis.in"
      dpoEmail="official@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          These Terms govern use of Cursis at <Link href="/" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>cursis.in</Link>. Personal data handling is explained separately in our <Link href="/privacy" style={{ color: '#0F4CFF', textDecoration: 'underline', fontWeight: 600 }}>Privacy Notice</Link>. Accepting these Terms does not itself grant consent to personal data processing or optional analytics.
        </p>
      }
    >
      {/* Section 1 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          1. Free workspace services
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          {BRAND_NAME} is completely free. {FREE_WORKSPACE_TEXT}. {INCLUDED_TOOLS.join(', ')} are included. There are no paid plans, trials or charges.
        </p>
        <p style={{ margin: 0 }}>
          Service availability may be affected by maintenance or interruptions.
        </p>
      </section>

      {/* Section 2 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          2. Acceptable Use &amp; Security Conduct
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Users and workspace administrators agree not to:
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
          You retain your rights in the projects, task records, workflows and documents you upload. Cursis processes customer-controlled personal data under documented instructions and the agreed processing terms. Our separate Privacy Notice explains when Cursis acts as Data Fiduciary and how to exercise your rights.
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
          To the maximum extent permitted by applicable law, Cursis and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to use the platform.
        </p>
      </section>
    </PolicyLayout>
  );
}
