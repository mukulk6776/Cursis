import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';
import { marketingMetadata } from '@/lib/seo/marketing';
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = marketingMetadata(
  '/shipping-policy',
  'Digital Delivery Policy',
  'CURSIS is 100% digital cloud software. Paid plan limits and features are activated immediately online with no physical shipping.'
);

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Digital Delivery & Access Policy"
      badge="Instant online activation"
      lastUpdated="Updated 25 November 2026"
      activeSlug="shipping-policy"
      contactEmail="official@cursis.in"
      dpoEmail="official@cursis.in"
      summary={
        <p>
          {BRAND_NAME} is a 100% digital Software-as-a-Service (SaaS) platform. No physical goods are shipped; workspace plan upgrades activate digitally upon payment confirmation.
        </p>
      }
    >
      <section>
        <h2>No physical shipping</h2>
        <p>
          All {BRAND_NAME} Starter, Pro, and Business offerings are cloud-based software services accessed directly through{' '}
          <Link href="/">cursis.in</Link>. There are no physical boxes, hardware, or courier shipments, and zero shipping charges apply.
        </p>
      </section>

      <section>
        <h2>Instant workspace activation (Starter &amp; Pro)</h2>
        <p>
          Upon successful payment verification via Razorpay Checkout, your selected plan tier (Starter or Pro) and corresponding workspace limits (team seats, project caps, task limits, Ordis AI, and My Day) are provisioned digitally on your workspace account immediately, and your confirmation receipt is displayed right away.
        </p>
      </section>

      <section>
        <h2>Custom Business engagements</h2>
        <p>
          For custom Business solutions agreed through <Link href="/contact">Contact Us</Link>, custom workflows, dedicated onboarding, and tailored deliverables are provisioned digitally on your workspace according to the schedule set out in your written agreement.
        </p>
      </section>

      <section>
        <h2>Delayed activation or assistance</h2>
        <p>
          If your workspace limits do not reflect your confirmed payment within a few minutes, please email{' '}
          <a href="mailto:official@cursis.in">official@cursis.in</a> or{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your Razorpay Payment ID so we can activate your workspace or issue a refund promptly.
        </p>
      </section>
    </PolicyLayout>
  );
}
