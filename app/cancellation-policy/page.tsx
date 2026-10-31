import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';
import { marketingMetadata } from '@/lib/seo/marketing';
import { BRAND_NAME, FREE_WORKSPACE_TEXT, SUPPORT_EMAIL, TEAM_USER_LIMIT } from '@/lib/site';

export const metadata = marketingMetadata(
  '/cancellation-policy',
  'Cancellation Policy',
  `${FREE_WORKSPACE_TEXT}. You can cancel or close your Cursis account at any time without fees or notice periods.`
);

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout
      title="Cancellation Policy"
      badge="Workspace cancellation"
      lastUpdated="Updated 22 October 2026"
      activeSlug="cancellation-policy"
      contactEmail={SUPPORT_EMAIL}
      summary={
        <p>
          {BRAND_NAME} is completely free. {FREE_WORKSPACE_TEXT}. You are free to cancel or close your account at any time.
        </p>
      }
    >
      <section>
        <h2>Cancel at any time without fees</h2>
        <p>
          There are no contracts, subscriptions, or lock-in periods. Because {BRAND_NAME} is free for teams of up to {TEAM_USER_LIMIT}, you can cancel your workspace or stop using the service at any time without any cancellation fees, penalty charges, or mandatory advance notice.
        </p>
      </section>

      <section>
        <h2>How to close and cancel your account</h2>
        <p>
          You can initiate account closure directly through the <Link href="/privacy/rights">Privacy Centre</Link>. From there, you can export your workspace data, withdraw consent, or request permanent account deletion. Please review the <Link href="/data-deletion">data deletion information</Link> for details regarding identity verification, processing schedules, and retention policies.
        </p>
      </section>

      <section>
        <h2>Effect of cancellation</h2>
        <p>
          Upon requesting account cancellation and erasure, access to your workspace is promptly disabled. Active personal data and workspace content are queued for permanent deletion in accordance with our standard cleanup timelines, subject only to statutory legal retention requirements.
        </p>
      </section>

      <section>
        <h2>Questions or support</h2>
        <p>
          If you have questions about closing your workspace or need help cancelling your account, email us at <a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </PolicyLayout>
  );
}

