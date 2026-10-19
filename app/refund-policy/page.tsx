import { marketingMetadata } from '@/lib/seo/marketing';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';

export const metadata = { ...marketingMetadata('/refund-policy', 'Refund and Cancellation Policy', 'Read the current refund and cancellation policy published by Cursis.') };

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Refund Policy"
      badge="Subscription & Billing Terms"
      badgeColor="#16A34A"
      lastUpdated="Last Updated: September 24, 2026 • Version 2.0"
      activeSlug="refund-policy"
      contactEmail="billing@cursis.in"
      dpoEmail="official@cursis.in"
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
          You may cancel your subscription at any time by contacting our billing team at <a href="mailto:billing@cursis.in" style={{ color: '#0F4CFF', fontWeight: 700 }}>billing@cursis.in</a>. Upon cancellation:
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

      {/* Section 5: California Automatic Renewal Law (ARL) Compliance */}
      <section style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #0A0A0A', borderRadius: '12px', padding: '24px 28px', boxShadow: '3px 3px 0 0 #0A0A0A' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 14px 0', borderBottom: '1px solid #E5E0D8', paddingBottom: '8px' }}>
          5. California Automatic Renewal Law (ARL) Compliance &amp; Simple Online Cancellation
        </h2>
        <p style={{ margin: '0 0 12px 0' }}>
          In strict compliance with the California Automatic Renewal Law (Cal. Bus. &amp; Prof. Code §§ 17600–17606) and the FTC Negative Option Rule:
        </p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <strong>Clear Pre-Purchase Disclosure:</strong> All recurring subscription tiers, billing cadences, and charges are conspicuously disclosed in visual proximity to the checkout or subscribe button before completion.
          </li>
          <li>
            <strong>1-Click Online Cancellation Mechanism:</strong> California subscribers can cancel recurring subscriptions immediately online at any time via <em>Workspace Settings → Billing</em>, requiring no telephone calls or complicated cancellation obstacles.
          </li>
          <li>
            <strong>Immediate Cancellation Confirmation:</strong> Upon online cancellation, Cursis immediately sends an automated written cancellation confirmation receipt with the effective termination date.
          </li>
          <li>
            <strong>Notice of Renewal:</strong> For annual subscriptions, Cursis sends an advance reminder email 15 to 45 days prior to the renewal charge date detailing the impending charge and cancellation options.
          </li>
          <li>
            <strong>Direct Assistance:</strong> You may also cancel at any time by emailing our dedicated desk at <a href="mailto:billing@cursis.in" style={{ color: '#0F4CFF', fontWeight: 700 }}>billing@cursis.in</a>.
          </li>
        </ul>
      </section>
    </PolicyLayout>
  );
}
