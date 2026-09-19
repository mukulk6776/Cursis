import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

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
    <div className="lp-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />
      <main style={{ flex: '1 0 auto', maxWidth: '880px', margin: '0 auto', padding: '120px 24px 80px', color: '#f1f5f9' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 76, 255, 0.1)', border: '1px solid rgba(15, 76, 255, 0.3)', borderRadius: '9999px', padding: '6px 14px', marginBottom: '16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f4cff' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f4cff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subscription & Billing Terms
            </span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#ffffff' }}>
            Refund Policy
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Last Updated: September 19, 2026 • Version 1.0
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px 28px', marginBottom: '48px', backdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#cbd5e1' }}>
            This Refund Policy explains our policies regarding cancellations, refunds, and subscription management for Cursis services.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontSize: '15px', lineHeight: 1.75, color: '#94a3b8' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              1. Free Trial Period
            </h2>
            <p>
              Cursis offers a 14-day free trial for new users. No credit card is required to start your trial. You can cancel anytime during the trial period without being charged.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              2. Subscription Cancellation
            </h2>
            <p>
              You may cancel your subscription at any time through your account settings. Upon cancellation:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>You will retain access to paid features until the end of your current billing period</li>
              <li>No further charges will be applied after the current period expires</li>
              <li>You can export all your data before downgrading to the free plan</li>
              <li>Your workspace will be preserved with read-only access after downgrade</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              3. Refund Eligibility
            </h2>
            <p>
              <strong style={{ color: '#ffffff' }}>30-Day Money-Back Guarantee:</strong> If you are not satisfied with Cursis, you may request a full refund within 30 days of your initial purchase. This applies to:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>First-time subscribers only</li>
              <li>Annual or monthly subscription plans</li>
              <li>Purchases made directly through Cursis (not third-party resellers)</li>
            </ul>
            <p style={{ marginTop: '16px' }}>
              <strong style={{ color: '#ffffff' }}>Refunds are NOT available for:</strong>
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Subscription renewals beyond the first billing cycle</li>
              <li>Custom enterprise agreements (governed by separate MSA terms)</li>
              <li>Add-on services or integrations purchased separately</li>
              <li>Violations of our Terms of Service resulting in account suspension</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              4. Refund Process
            </h2>
            <p>
              To request a refund:
            </p>
            <ol style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Contact our support team at <a href="mailto:support@cursis.app" style={{ color: '#0f4cff' }}>support@cursis.app</a></li>
              <li>Include your workspace ID and reason for refund request</li>
              <li>Our team will review within 2 business days</li>
              <li>Approved refunds are processed within 5-7 business days to your original payment method</li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              5. Billing Disputes
            </h2>
            <p>
              If you believe you have been incorrectly charged or notice unauthorized transactions:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Contact us immediately at <a href="mailto:billing@cursis.app" style={{ color: '#0f4cff' }}>billing@cursis.app</a></li>
              <li>We will investigate and resolve disputes within 7 business days</li>
              <li>Billing errors will be corrected and refunded promptly</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              6. Annual Subscription Refunds
            </h2>
            <p>
              Annual subscriptions are eligible for pro-rated refunds within the first 30 days. After 30 days, annual subscriptions are non-refundable but can be cancelled to prevent auto-renewal.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              7. Contact Information
            </h2>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px 20px', marginTop: '12px' }}>
              <p style={{ margin: '0 0 6px', color: '#ffffff', fontWeight: 600 }}>Cursis Billing & Support</p>
              <p style={{ margin: '0 0 4px' }}>Email: <a href="mailto:billing@cursis.app" style={{ color: '#0f4cff' }}>billing@cursis.app</a></p>
              <p style={{ margin: '0 0 4px' }}>Support: <a href="mailto:support@cursis.app" style={{ color: '#0f4cff' }}>support@cursis.app</a></p>
              <p style={{ margin: 0 }}>Business Hours: Monday-Friday, 9 AM - 6 PM IST</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
