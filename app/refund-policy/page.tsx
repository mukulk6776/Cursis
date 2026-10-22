import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';
import { marketingMetadata } from '@/lib/seo/marketing';
import { BRAND_NAME, FREE_WORKSPACE_TEXT, SUPPORT_EMAIL } from '@/lib/site';
export const metadata = marketingMetadata('/refund-policy', 'Refund & Cancellation', FREE_WORKSPACE_TEXT + '. Nothing is charged, so there is nothing to refund. Learn how to close your account.');
export default function RefundPolicyPage() {
  return <PolicyLayout title="Refund & Cancellation" badge="Free workspace" lastUpdated="Updated 22 October 2026" activeSlug="refund-policy" contactEmail={SUPPORT_EMAIL}
    summary={<p>{BRAND_NAME} is completely free. {FREE_WORKSPACE_TEXT}.</p>}>
    <section><h2>Nothing is charged</h2><p>There are no paid plans, trials or recurring charges. We do not collect payments for your workspace, so there is nothing to refund.</p></section>
    <section><h2>Close your account when you choose</h2><p>Use the <Link href="/privacy/rights">Privacy Centre</Link> to request a data export, withdraw consent or delete your account. Read the <Link href="/data-deletion">account deletion information</Link> for verification, processing timelines and exceptions.</p></section>
    <section><h2>Questions?</h2><p>Email <a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a>.</p></section>
  </PolicyLayout>;
}
