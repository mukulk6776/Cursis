import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { FREE_WORKSPACE_TEXT, SUPPORT_EMAIL, TEAM_USER_LIMIT } from '@/lib/site';

export default function PayComingSoonPage() {
  return (
    <MarketingPage
      title="Paid plans coming soon."
      intro="Online checkout and paid workspace upgrades are not live yet."
      nextStep="Use Cursis free with your team today"
    >
      <section className="marketing-card marketing-free-plan" aria-labelledby="coming-soon-heading">
        <p
          style={{
            display: 'inline-block',
            margin: '0 0 16px',
            padding: '4px 12px',
            borderRadius: '999px',
            border: '2px solid #0A0A0A',
            background: '#FFC233',
            color: '#0A0A0A',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Coming Soon
        </p>
        <h2 id="coming-soon-heading">Online billing &amp; paid upgrades are not yet active</h2>
        <p>
          We are completing legal, tax, and compliance reviews before launching paid plans.
          No payments, billing details, or subscription charges are being collected on <strong>cursis.in</strong> right now.
        </p>
        <p>
          In the meantime, <strong>CURSIS is ₹0 free</strong>. {FREE_WORKSPACE_TEXT}, with all core workspace tools included and no payment card required.
        </p>
        <p>
          Questions for a team larger than {TEAM_USER_LIMIT} or general inquiries?{' '}
          <Link href="/contact">Contact our team</Link> or email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <div className="marketing-link-list" style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <Link className="marketing-link" href="/pricing">Plans</Link>
          <Link className="marketing-link" href="/terms">Terms of Service</Link>
          <Link className="marketing-link" href="/privacy">Privacy Notice</Link>
          <Link className="marketing-link" href="/cancellation-policy">Cancellation Policy</Link>
        </div>
      </section>
    </MarketingPage>
  );
}
