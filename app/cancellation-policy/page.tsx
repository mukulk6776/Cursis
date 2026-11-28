import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';
import { marketingMetadata } from '@/lib/seo/marketing';
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = marketingMetadata(
  '/cancellation-policy',
  'Cancellation & Refund Policy',
  'All Cursis purchases are final with no refunds after purchasing. You can cancel your subscription anytime to stop future renewals.'
);

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout
      title="Cancellation & Refund Policy"
      badge="Billing, cancellation & no-refund policy"
      lastUpdated="Updated 25 November 2026"
      activeSlug="cancellation-policy"
      contactEmail="official@cursis.in"
      dpoEmail="official@cursis.in"
      summary={
        <p>
          All {BRAND_NAME} purchases and plan upgrades are final — <strong>no refunds are provided after purchasing</strong>. You can cancel your subscription at any time with zero lock-in fees to stop future renewals. Questions? Email{' '}
          <a href="mailto:official@cursis.in" style={{ color: '#FF5500', fontWeight: 600 }}>official@cursis.in</a>.
        </p>
      }
    >
      <section>
        <h2>No refunds after purchasing</h2>
        <p>
          All payments, subscription upgrades, and digital plan activations on {BRAND_NAME} are final once processed. There is <strong>no refund after purchasing</strong> — including for unused subscription time, partial billing cycles, forgotten cancellations, or accidental purchases.
        </p>
      </section>

      <section>
        <h2>Cancel anytime to stop future renewals</h2>
        <p>
          There are no long-term contracts or cancellation fees. You may cancel your Starter ($9/mo) or Pro ($20/mo) plan at any time to prevent future recurring charges, and you will retain access to your paid features until the end of your current paid billing period.
        </p>
      </section>

      <section>
        <h2>Duplicate billing or technical errors</h2>
        <p>
          If you were charged more than once due to a verified duplicate billing or payment-gateway error, send an email to{' '}
          <a href="mailto:official@cursis.in">official@cursis.in</a> (or <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>) from your billing email with your Razorpay Payment ID, Order ID, or receipt reference so our billing team can investigate, unless otherwise required by applicable law.
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
