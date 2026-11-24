import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
import { TEAM_USER_LIMIT } from '@/lib/site';

export const metadata = marketingMetadata('/pricing', 'Plans & Upgrades', `The Cursis workspace starts free for teams of up to ${TEAM_USER_LIMIT}. Upgrade to Pro or Enterprise via Razorpay.`);

export default function Pricing() {
  return (
    <MarketingPage title="Plans & Upgrades" intro="Flexible options from standard free teams to autonomous enterprise power." nextStep="Explore or upgrade your workspace">
      <section className="marketing-card marketing-free-plan" aria-labelledby="free-plan-heading">
        <p className="marketing-price">₹0</p>
        <h2 id="free-plan-heading">Free for a team of up to {TEAM_USER_LIMIT}</h2>
        <p>Every core workspace tool is included. You will not be asked for payment details.</p>
        <p>Need more seats or custom engineering? <Link href="/contact">Ask us about your team’s needs</Link>.</p>
        <p><Link className="marketing-link" href="/cancellation-policy">Account closure and cancellation information</Link></p>
      </section>

      <section className="marketing-card" style={{ marginTop: '24px', border: '1px solid var(--border-color, #E5E7EB)', padding: '24px', borderRadius: '14px', background: '#FFFFFF' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>Looking to Upgrade with Razorpay?</h3>
        <p style={{ fontSize: '14px', color: '#4B5563', margin: '0 0 16px', lineHeight: 1.5 }}>
          Unlock unlimited team seats, dedicated autonomous AI copilot execution, and custom client portals with our secure checkout.
        </p>
        <Link
          href="/pay"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700, borderRadius: '8px', textDecoration: 'none' }}
        >
          View Plans & Secure Checkout →
        </Link>
      </section>
    </MarketingPage>
  );
}
