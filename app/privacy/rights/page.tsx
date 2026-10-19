import { marketingMetadata } from '@/lib/seo/marketing';
import PolicyLayout from '@/components/landing/PolicyLayout';
import PrivacyCentre from '@/components/privacy/PrivacyCentre';
import { privacyContact } from '@/lib/privacy/config';

export const dynamic = 'force-dynamic';
export const metadata = { ...marketingMetadata('/privacy/rights', 'Privacy Centre', 'Manage your Cursis privacy choices and submit access, correction or deletion requests.'), robots: { index: false, follow: false } };
export default function PrivacyRightsPage() {
  return <PolicyLayout title="Your privacy, your choices" badge="Privacy centre" activeSlug="privacy" lastUpdated="18 October 2026" contactEmail={privacyContact.email} dpoEmail={privacyContact.email}
    summary={<p>Access, correct, nominate, withdraw consent or request erasure. Contact: {privacyContact.name}, {privacyContact.title}.</p>}>
    <PrivacyCentre contactEmail={privacyContact.email} />
  </PolicyLayout>;
}
