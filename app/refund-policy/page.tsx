import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata: Metadata = {
  title: 'Refund Policy — Cursis',
  description: 'Understand our refund policy, cancellation terms, and subscription management options for Cursis.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Refund Policy"
      badge="Subscription & Billing Terms"
      badgeColor="#16A34A"
      lastUpdated="Last Updated: September 24, 2026 • Version 2.0"
      activeSlug="refund-policy"
      contactEmail="billing@cursis.in"
      dpoEmail="compliance@cursis.in"
      summary={
        <p style={{ margin: 0 }}>
          This Refund Policy explains our terms regarding cancellations, refunds, and subscription management for Cursis services. We strive to provide transparent, equitable billing practices for all our workspace customers.
        </p>
      }
    >
      {/* Section 1 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          1. 14-Day Free Trial Period
        </h2>
        <p style={{ margin: 0 }}>
          Cursis offers a 14-day free trial for all new organizations. No credit card is required to initiate your trial. You can cancel at any time during the trial period directly from your workspace settings without incurring any charges.
        </p>
      </section>

      {/* Section 2 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          2. Subscription Cancellation
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          You may cancel your subscription at any time via your Workspace Settings &gt; Billing section. Upon cancellation:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>You retain full access to premium features until the end of your active billing period.</li>
          <li>No further recurring charges will be applied to your payment method.</li>
          <li>Your workspace will transition seamlessly to the Free Tier once the cycle concludes.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          3. 30-Day Money-Back Guarantee
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          If you are unsatisfied with Cursis for any reason, first-time annual or monthly subscribers may request a full refund within 30 days of initial purchase.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0A0A0A', marginBottom: '4px' }}>Monthly Plans</div>
            <div style={{ fontSize: '12px', color: '#525252' }}>Eligible for 100% refund within the first 30 days of initial workspace activation.</div>
          </div>
          <div style={{ padding: '14px', background: '#F5F5F0', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0A0A0A', marginBottom: '4px' }}>Annual Plans</div>
            <div style={{ fontSize: '12px', color: '#525252' }}>Full refund within 30 days. Pro-rated cancellation options available thereafter upon request.</div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          4. How to Request a Refund
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          To initiate a refund request, simply email our billing desk at <a href="mailto:billing@cursis.in" style={{ color: '#0F4CFF', textDecoration: 'none', fontWeight: 700 }}>billing@cursis.in</a> with:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Your Workspace ID or registered account email</li>
          <li>Invoice or transaction identifier</li>
          <li>A brief note explaining the reason for your request</li>
        </ul>
      </section>
    </PolicyLayout>
  );
}
