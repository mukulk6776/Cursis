import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
import { PLAN_CATALOG } from '@/lib/plans';

export const metadata = marketingMetadata(
  '/pricing',
  'Plans & Pricing',
  'Choose Starter ($9/mo), Pro ($20/mo Recommended), or custom Business plans for your Cursis workspace.'
);

export default function Pricing() {
  const starter = PLAN_CATALOG.starter;
  const pro = PLAN_CATALOG.pro;
  const business = PLAN_CATALOG.business;

  return (
    <MarketingPage
      title="Simple, transparent plans."
      intro="Launch pricing in USD. Upgrade anytime or request a custom Business deployment."
      nextStep="Ready to get started?"
    >
      <div
        className="marketing-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* 1. STARTER PLAN */}
        <section
          className="marketing-card"
          aria-labelledby="starter-plan-heading"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0 }}
        >
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#57534E' }}>
              Launch Offer
            </p>
            <h2 id="starter-plan-heading" style={{ margin: '0 0 6px' }}>
              {starter.name}
            </h2>
            <p style={{ margin: '0 0 20px', color: '#4B5563', fontSize: '14px' }}>
              {starter.subtitle}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#6B7280', textDecoration: 'line-through' }}>
                ${starter.originalPriceUsd}
              </span>
              <span className="marketing-price" style={{ fontSize: '46px', fontWeight: 900, lineHeight: 1 }}>
                ${starter.priceUsd}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#4B5563' }}>
                USD / month
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>✓ <strong>6 team members</strong></li>
              <li>✓ <strong>5 tasks per project</strong></li>
              <li>✓ <strong>10 projects</strong></li>
              <li style={{ color: '#6B7280' }}>✕ No access to Ordis AI</li>
              <li style={{ color: '#6B7280' }}>✕ No access to My Day feature</li>
              <li>✓ Access to all other workspace features</li>
            </ul>
          </div>

          <Link
            href="/pay?plan=starter"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none' }}
          >
            Choose Starter — ${starter.priceUsd}/mo →
          </Link>
        </section>

        {/* 2. PRO PLAN (RECOMMENDED) */}
        <section
          className="marketing-card"
          aria-labelledby="pro-plan-heading"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            marginBottom: 0,
            borderColor: '#FF5500',
            background: '#FFFDF9',
          }}
        >
          <div>
            <p
              style={{
                display: 'inline-block',
                margin: '0 0 10px',
                padding: '3px 10px',
                borderRadius: '999px',
                border: '2px solid #0A0A0A',
                background: '#FF5500',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Recommended
            </p>
            <h2 id="pro-plan-heading" style={{ margin: '0 0 6px' }}>
              {pro.name}
            </h2>
            <p style={{ margin: '0 0 20px', color: '#4B5563', fontSize: '14px' }}>
              {pro.subtitle}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#6B7280', textDecoration: 'line-through' }}>
                ${pro.originalPriceUsd}
              </span>
              <span className="marketing-price" style={{ fontSize: '46px', fontWeight: 900, lineHeight: 1, color: '#FF5500' }}>
                ${pro.priceUsd}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#4B5563' }}>
                USD / month
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>✓ <strong>10 team members</strong></li>
              <li>✓ <strong>Unlimited tasks</strong></li>
              <li>✓ <strong>Unlimited projects</strong></li>
              <li>✓ <strong>Full access to Ordis AI</strong></li>
              <li>✓ <strong>Full access to My Day feature</strong> &amp; every workspace tool</li>
            </ul>
          </div>

          <Link
            href="/pay?plan=pro"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 800, textDecoration: 'none' }}
          >
            Choose Pro — ${pro.priceUsd}/mo →
          </Link>
        </section>

        {/* 3. BUSINESS PLAN (CONTACT US) */}
        <section
          className="marketing-card"
          aria-labelledby="business-plan-heading"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0 }}
        >
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#57534E' }}>
              Enterprise &amp; Bespoke
            </p>
            <h2 id="business-plan-heading" style={{ margin: '0 0 6px' }}>
              {business.name}
            </h2>
            <p style={{ margin: '0 0 18px', color: '#4B5563', fontSize: '14px' }}>
              {business.subtitle}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#0A0A0A' }}>Custom</span>
              <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '4px' }}>
                Scoped to your organization&apos;s requirements
              </div>
            </div>

            <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>
              Everything in Pro, plus:
            </p>
            <ul style={{ paddingLeft: '18px', margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', lineHeight: 1.5 }}>
              {business.features.map((feat) => (
                <li key={feat}>{feat}</li>
              ))}
            </ul>
          </div>

          <Link
            href="/contact?plan=business"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none' }}
          >
            Contact Us →
          </Link>
        </section>
      </div>

      <div className="marketing-card" style={{ marginTop: '28px', padding: '20px 24px' }}>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
          Payments are processed securely via Razorpay. Cancel anytime —{' '}
          <Link href="/refund-policy">read our Cancellation &amp; Refund Policy</Link>,{' '}
          <Link href="/shipping-policy">Digital Delivery Policy</Link>, and{' '}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </div>
    </MarketingPage>
  );
}
