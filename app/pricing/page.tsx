import Link from 'next/link';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import MarketingPage from '@/components/landing/MarketingPage';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { marketingMetadata } from '@/lib/seo/marketing';
import { PLAN_CATALOG } from '@/lib/plans';

export const metadata = marketingMetadata(
  '/pricing',
  'Plans & Pricing',
  'Choose Starter ($9/mo), Pro ($20/mo Recommended), or custom Business plans for your Cursis workspace.'
);

const pricingFaqs = [
  {
    question: 'What is the difference between Cursis Starter and Pro plans?',
    answer:
      'Starter ($9/mo launch price, regular $19) includes up to 6 team members, 10 projects, and 5 tasks per project. Pro ($20/mo launch price, regular $39) expands capacity to 10 members, unlimited projects and tasks, and unlocks both Ordis AI and the My Day focus planner.',
  },
  {
    question: 'Does the Starter plan include Ordis AI or My Day?',
    answer:
      'No. Ordis AI Copilot, My Day daily focus planning, and live Team Pulse are included starting with the Pro Plan ($20/mo) and custom Business deployments.',
  },
  {
    question: 'Who should choose the Cursis Business plan?',
    answer:
      'Established organizations needing custom team management, bespoke AI agents and workflows, dedicated Ordis AI configuration, custom dashboards, or dedicated onboarding can request a tailored quote via Contact Us.',
  },
];

const pricingSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'CURSIS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://cursis.in/pricing',
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter Plan',
          price: '9',
          priceCurrency: 'USD',
          description: '6 team members, 10 projects, 5 tasks per project.',
          url: 'https://cursis.in/pay?plan=starter',
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '20',
          priceCurrency: 'USD',
          description: '10 team members, unlimited projects and tasks, Ordis AI, and My Day.',
          url: 'https://cursis.in/pay?plan=pro',
        },
        {
          '@type': 'Offer',
          name: 'Business Plan',
          description: 'Custom enterprise AI agents, dashboards, and dedicated onboarding.',
          url: 'https://cursis.in/contact?plan=business',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: pricingFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

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
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary, #57534E)' }}>
              Launch Offer
            </p>
            <h2 id="starter-plan-heading" style={{ margin: '0 0 6px' }}>
              {starter.name}
            </h2>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary, #4B5563)', fontSize: '14px' }}>
              {starter.subtitle}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1, color: 'var(--text-tertiary, #6B7280)', textDecoration: 'line-through' }}>
                ${starter.originalPriceUsd}
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>
                ${starter.priceUsd}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary, #4B5563)' }}>
                USD / month
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>6 team members</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>5 tasks per project</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>10 projects</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary, #6B7280)' }}><X size={15} color="var(--text-muted, #9CA3AF)" aria-hidden="true" /><span>No access to Ordis AI</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary, #6B7280)' }}><X size={15} color="var(--text-muted, #9CA3AF)" aria-hidden="true" /><span>No access to My Day feature</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span>Access to all other workspace features</span></li>
            </ul>
          </div>

          <Link
            href="/pay?plan=starter"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none' }}
          >
            Choose Starter — ${starter.priceUsd}/mo <ArrowRight size={15} aria-hidden="true" />
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
            background: 'var(--surface-card, #FFFDF9)',
          }}
        >
          <div>
            <Badge
              variant="solid"
              style={{
                margin: '0 0 10px',
                border: '2px solid var(--border-dark, #0A0A0A)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={11} aria-hidden="true" />
              Recommended
            </Badge>
            <h2 id="pro-plan-heading" style={{ margin: '0 0 6px' }}>
              {pro.name}
            </h2>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary, #4B5563)', fontSize: '14px' }}>
              {pro.subtitle}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1, color: 'var(--text-tertiary, #6B7280)', textDecoration: 'line-through' }}>
                ${pro.originalPriceUsd}
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1, color: '#FF5500' }}>
                ${pro.priceUsd}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary, #4B5563)' }}>
                USD / month
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>10 team members</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>Unlimited tasks</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>Unlimited projects</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>Full access to Ordis AI</strong></span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#047857" aria-hidden="true" /><span><strong>Full access to My Day feature</strong> &amp; every workspace tool</span></li>
            </ul>
          </div>

          <Link
            href="/pay?plan=pro"
            className={buttonVariants({ variant: 'default', size: 'lg' })}
            style={{ width: '100%', justifyContent: 'center', fontWeight: 800, textDecoration: 'none' }}
          >
            Choose Pro — ${pro.priceUsd}/mo <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>

        {/* 3. BUSINESS PLAN (CONTACT US) */}
        <section
          className="marketing-card"
          aria-labelledby="business-plan-heading"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0 }}
        >
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary, #57534E)' }}>
              Enterprise &amp; Bespoke
            </p>
            <h2 id="business-plan-heading" style={{ margin: '0 0 6px' }}>
              {business.name}
            </h2>
            <p style={{ margin: '0 0 18px', color: 'var(--text-secondary, #4B5563)', fontSize: '14px' }}>
              {business.subtitle}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary, #0A0A0A)' }}>Custom</span>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary, #4B5563)', marginTop: '4px' }}>
                Scoped to your organization&apos;s requirements
              </div>
            </div>

            <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>
              Everything in Pro, plus:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px', lineHeight: 1.5 }}>
              {business.features.map((feat) => (
                <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <Check size={14} color="#047857" style={{ marginTop: '3px', flexShrink: 0 }} aria-hidden="true" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/contact?plan=business"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none' }}
          >
            Contact Us <ArrowRight size={15} aria-hidden="true" />
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

      <section className="marketing-card" aria-labelledby="pricing-faq-heading" style={{ marginTop: '20px', padding: '22px 24px' }}>
        <h2 id="pricing-faq-heading" style={{ margin: '0 0 14px', fontSize: '18px' }}>
          Common questions about Cursis pricing
        </h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {pricingFaqs.map((item) => (
            <div key={item.question}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>{item.question}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #4B5563)', lineHeight: 1.55 }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema).replace(/</g, '\\u003c') }}
      />
    </MarketingPage>
  );
}
