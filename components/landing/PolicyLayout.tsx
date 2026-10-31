import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import Link from 'next/link';
import Footer from './Footer';
import { SUPPORT_EMAIL } from '@/lib/site';
import '@/styles/landing.css';

interface PolicyLayoutProps {
  title: string;
  badge: string;
  badgeColor?: string;
  lastUpdated: string;
  summary: ReactNode;
  activeSlug: 'privacy' | 'rights' | 'terms' | 'cookie-policy' | 'cancellation-policy' | 'data-deletion' | 'dmca';
  children: ReactNode;
  contactEmail?: string;
  dpoEmail?: string;
}

const POLICY_NAV_ITEMS = [
  { slug: 'privacy', label: 'Privacy Notice', href: '/privacy' },
  { slug: 'terms', label: 'Terms of Service', href: '/terms' },
  { slug: 'cookie-policy', label: 'Cookies', href: '/cookie-policy' },
  { slug: 'cancellation-policy', label: 'Cancellation', href: '/cancellation-policy' },
  { slug: 'data-deletion', label: 'Data deletion', href: '/data-deletion' },
  { slug: 'dmca', label: 'Copyright & DMCA', href: '/dmca' },
  { slug: 'rights', label: 'Privacy Centre', href: '/privacy/rights' },
];

export default function PolicyLayout({
  title, badge, badgeColor = '#FF5500', lastUpdated, summary, activeSlug, children,
  contactEmail = SUPPORT_EMAIL, dpoEmail = 'official@cursis.in',
}: PolicyLayoutProps) {
  const outline: { id: string; label: string }[] = [];
  const content = Children.toArray(children).map(child => {
    if (!isValidElement<{ children?: ReactNode; id?: string; tabIndex?: number }>(child) || child.type !== 'section') return child;
    const parts = Children.toArray(child.props.children);
    const heading = parts.find(part => isValidElement(part) && part.type === 'h2');
    if (!isValidElement<{ children?: ReactNode }>(heading) || typeof heading.props.children !== 'string') return child;
    const label = heading.props.children.trim().replace(/^\d+\.\s*/, '');
    const id = child.props.id || 'policy-section-' + (outline.length + 1);
    outline.push({ id, label });
    return cloneElement(child, { id, tabIndex: -1 }, parts.map(part =>
      part === heading ? cloneElement(heading, {}, outline.length + '. ' + label) : part
    ));
  });
  return <div className="lp-body policy-body">
    <main id="main-content" className="policy-main" tabIndex={-1}>
      <Link href="/" className="policy-back">
        <span aria-hidden="true">←</span> Back to Cursis
      </Link>
      <header className="policy-header">
        <span className="policy-badge">
          <span aria-hidden="true" style={{ backgroundColor: badgeColor }} />{badge}
        </span>
        <h1>{title}</h1>
        <p className="policy-updated">
          <span>Last updated:</span> {lastUpdated.replace(/^(?:Last Updated:|Updated)\s*/i, '')}
        </p>
      </header>
      <nav className="policy-nav" aria-label="Legal documents">
        {POLICY_NAV_ITEMS.map(item =>
          <Link key={item.slug} href={item.href} aria-current={item.slug === activeSlug ? 'page' : undefined}>
            {item.label}
          </Link>
        )}
      </nav>
      <aside className="policy-summary" aria-labelledby="policy-overview-heading">
        <h2 id="policy-overview-heading">At a glance</h2>
        {summary}
      </aside>
      {outline.length > 0 && <details className="policy-contents">
        <summary>On this page <span>{outline.length} sections</span></summary>
        <nav aria-label="On this page">
          <ol>{outline.map(item =>
            <li key={item.id}><a href={'#' + item.id}>{item.label}</a></li>
          )}</ol>
        </nav>
      </details>}
      <article className="policy-content" aria-label={title}>{content}</article>
      <section className="policy-contact" aria-labelledby="policy-contact-heading">
        <h2 id="policy-contact-heading">Questions about this policy?</h2>
        <p>Privacy and grievance requests are acknowledged within 72 hours, with a resolution target of 30 calendar days.</p>
        <div className="policy-contact-links">
          <a href={'mailto:' + contactEmail}>{contactEmail}</a>
          {dpoEmail !== contactEmail && <a href={'mailto:' + dpoEmail}>Privacy contact: {dpoEmail}</a>}
          {activeSlug !== 'rights' && <Link href="/privacy/rights">
            Manage your privacy choices <span aria-hidden="true">→</span>
          </Link>}
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
