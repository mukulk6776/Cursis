import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';
import { marketingMetadata } from '@/lib/seo/marketing';
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = marketingMetadata(
  '/cancellation-policy',
  'Cancellation & Refund Policy',
  'Cancel your Cursis plan anytime without fees. Request a refund by email within our simple refund process.'
);

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout
      title="Cancellation & Refund Policy"
      badge="Billing, cancellation & refunds"
      lastUpdated="Updated 25 November 2026"
      activeSlug="cancellation-policy"
      contactEmail="official@cursis.in"
      dpoEmail="official@cursis.in"
      summary={
        <p>
          Cancel your {BRAND_NAME} workspace anytime with zero lock-in fees. Need a refund? Email{' '}
          <a href="mailto:official@cursis.in" style={{ color: '#FF5500', fontWeight: 600 }}>official@cursis.in</a>{' '}
          with your payment details and we will refund you back to your original payment method.
        </p>
      }
    >
      <section>
        <h2>Cancel anytime without lock-in fees</h2>
        <p>
          There are no long-term contracts or cancellation penalties. You may stop using your Starter ($9/mo) or Pro ($20/mo) plan or close your workspace at any time without mandatory notice periods or early-termination fees.
        </p>
      </section>

      <section>
        <h2>Refund eligibility &amp; how to request a refund</h2>
        <p>
          If you are unsatisfied with your workspace upgrade, changed your mind, or were billed in error, simply send an email to{' '}
          <a href="mailto:official@cursis.in">official@cursis.in</a> (or <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>) from the email address used during checkout. Include your Razorpay Payment ID, Order ID, or receipt reference so we can locate your transaction right away.
        </p>
      </section>

      <section>
        <h2>Refund processing timeline</h2>
        <p>
          Approved refund requests are initiated promptly through Razorpay. Once initiated, refunds are typically credited back to your original payment method (card, bank, or wallet) within <strong>5–7 business days</strong>, depending on your card issuer or bank processing times.
        </p>
      </section>

      <section>
        <h2>Account closure and data erasure</h2>
        <p>
          You can also export your data or request permanent account closure directly through the{' '}
          <Link href="/privacy/rights">Privacy Centre</Link>. See our{' '}
          <Link href="/data-deletion">Data Deletion Policy</Link> for retention timelines and verification details.
        </p>
      </section>
    </PolicyLayout>
  );
}
