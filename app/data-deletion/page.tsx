import Link from 'next/link';
import PolicyLayout from '@/components/landing/PolicyLayout';
import { privacyContact } from '@/lib/privacy/config';
export const dynamic = 'force-dynamic';
export default function DataDeletionPage() {
  return <PolicyLayout title="Account erasure" badge="Privacy rights" activeSlug="data-deletion" lastUpdated="18 October 2026"
    contactEmail={privacyContact.email} dpoEmail={privacyContact.email} summary={<p>Request closure and erasure through the privacy centre.</p>}>
    <p><Link href="/privacy/rights">Open Privacy Centre</Link> to export data, withdraw consent and request erasure. Accepted verified requests stop account access. Eligible active data, provider copies and backups have a 90-day cleanup target, subject to legal retention and customer-controlled records. Completion requires evidence review.</p>
    <p>Cannot sign in? Email <a href={`mailto:${privacyContact.email}`}>{privacyContact.email}</a> with your account email and request. Do not send passwords. Acknowledgment target: 72 hours; resolution target: 30 calendar days. See the <Link href="/privacy">Privacy Notice</Link> for exceptions and escalation.</p>
  </PolicyLayout>;
}
