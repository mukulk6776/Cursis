import { SUPPORT_EMAIL } from '@/lib/site';
import { privacyContact } from '@/lib/privacy/config';
import MarketingPage from '@/components/landing/MarketingPage';
import MarketingForm from '@/components/landing/MarketingForm';
import { marketingMetadata } from '@/lib/seo/marketing';

export const dynamic = 'force-dynamic';

export const metadata = marketingMetadata(
  '/contact',
  'Contact — Cursis Support & Business Inquiries',
  'Reach the Cursis team for Business plan inquiries, billing support, refund requests, or product questions.'
);

export default function Contact() {
  return (
    <MarketingPage
      title="Ask the team."
      intro="Reach out for Business plans, billing and refund assistance, or general questions."
      nextStep="Ready to try it yourself?"
    >
      <div className="marketing-card">
        <MarketingForm kind="contact" />
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color, #E5E7EB)', fontSize: '14px', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 6px' }}>
            <strong>Operating Entity:</strong> {privacyContact.entity}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>Official &amp; Billing Support:</strong>{' '}
            <a href="mailto:official@cursis.in">official@cursis.in</a> ·{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Contact Address:</strong> {privacyContact.address}
          </p>
        </div>
      </div>
    </MarketingPage>
  );
}
