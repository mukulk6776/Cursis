import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/site';
import { marketingMetadata } from '@/lib/seo/marketing';
import React from 'react';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata = {
  ...marketingMetadata(
    '/terms',
    'Terms of Service',
    'Read the terms, plan limits, billing, and acceptable use rules for using the Cursis workspace and Ordis AI.'
  ),
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      badge="Workspace & billing terms"
      badgeColor="#FF5500"
      lastUpdated="Last Updated: November 25, 2026 • Version 3.0"
      activeSlug="terms"
      contactEmail="official@cursis.in"
      dpoEmail="official@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          These Terms govern use of {BRAND_NAME} at{' '}
          <Link href="/" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>cursis.in</Link>,
          including Starter, Pro, and Business workspace plans. Personal data handling is explained separately in our{' '}
          <Link href="/privacy" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Privacy Notice</Link>.
          Accepting these Terms does not itself grant consent to optional analytics.
        </p>
      }
    >
      {/* Section 1 */}
      <section>
        <h2>1. Workspace Plans, Pricing &amp; Billing</h2>
        <p style={{ margin: '0 0 12px 0' }}>
          {BRAND_NAME} offers paid subscription tiers alongside limited preview access upon signup:
        </p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <strong>Starter Plan ($9 USD/month launch offer; standard rate $19 USD/month):</strong> Up to 6 team members, up to 10 projects, and up to 5 tasks per project, excluding Ordis AI and the My Day feature, with access to remaining core workspace tools.
          </li>
          <li>
            <strong>Pro Plan ($20 USD/month launch offer; standard rate $39 USD/month):</strong> Up to 10 team members, unlimited projects, unlimited tasks per project, full access to Ordis AI, full access to the My Day feature, and all core workspace features.
          </li>
          <li>
            <strong>Business Plan (Custom):</strong> Scoped and priced separately by written agreement via{' '}
            <Link href="/contact" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Contact Us</Link>.
          </li>
        </ul>
        <p style={{ margin: '0 0 12px 0' }}>
          Payments are processed securely in INR or USD through Razorpay. Displayed plan prices reflect the total charge from {BRAND_NAME}; any currency conversion or card issuer charges applied by your bank or card network are separate. Subscriptions can be cancelled anytime, and refund requests are handled under our{' '}
          <Link href="/refund-policy" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Cancellation &amp; Refund Policy</Link>.
        </p>
        <p style={{ margin: 0 }}>
          You must be at least 13 years old to use {BRAND_NAME}. Service availability may be affected by scheduled maintenance or third-party infrastructure interruptions.
        </p>
      </section>

      {/* Section 2 */}
      <section>
        <h2>2. Acceptable Use &amp; Security Conduct</h2>
        <p style={{ margin: '0 0 12px 0' }}>
          Users and workspace administrators agree not to:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Engage in automated extraction, scraping, mining, or vulnerability testing without explicit prior written authorization from our security team.</li>
          <li>Attempt to reverse engineer, decompile, circumvent plan limits, or breach access controls protecting multi-tenant workspace partitions.</li>
          <li>Upload malicious code, exploits, or content infringing third-party intellectual property rights.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section>
        <h2>3. Ownership of Workspace Data</h2>
        <p style={{ margin: 0 }}>
          You retain your rights in the projects, task records, workflows, and documents you upload. {BRAND_NAME} processes customer-controlled personal data under documented instructions and agreed terms. Our separate{' '}
          <Link href="/privacy" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Privacy Notice</Link>{' '}
          explains when {BRAND_NAME} acts as Data Fiduciary and how to exercise your rights.
        </p>
      </section>

      {/* Section 4 */}
      <section>
        <h2>4. Termination &amp; Data Export</h2>
        <p style={{ margin: 0 }}>
          You may cancel your plan or terminate your account at any time. Upon workspace deactivation, you are entitled to export snapshots of your workspace data via the Privacy Centre. Deletion schedules follow the timelines established in our{' '}
          <Link href="/data-deletion" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Data Deletion Policy</Link>.
        </p>
      </section>

      {/* Section 5 */}
      <section>
        <h2>5. Limitation of Liability &amp; Governing Law</h2>
        <p style={{ margin: '0 0 12px 0' }}>
          To the maximum extent permitted by applicable law, {BRAND_NAME} and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to use the platform.
        </p>
        <p style={{ margin: 0 }}>
          These Terms are governed by the laws of India. Before initiating formal action, please contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>{SUPPORT_EMAIL}</a>{' '}
          or <a href="mailto:official@cursis.in" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>official@cursis.in</a> so we can resolve concerns in good faith.
        </p>
      </section>
    </PolicyLayout>
  );
}
