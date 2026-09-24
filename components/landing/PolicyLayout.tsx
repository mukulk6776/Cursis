import React from 'react';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

interface PolicyLayoutProps {
  title: string;
  badge: string;
  badgeColor?: string;
  lastUpdated: string;
  summary: React.ReactNode;
  activeSlug: 'privacy' | 'terms' | 'cookie-policy' | 'refund-policy' | 'data-deletion';
  children: React.ReactNode;
  contactEmail?: string;
  dpoEmail?: string;
}

const POLICY_NAV_ITEMS = [
  { slug: 'privacy', label: 'Privacy Policy', href: '/privacy' },
  { slug: 'terms', label: 'Terms of Service', href: '/terms' },
  { slug: 'cookie-policy', label: 'Cookie Policy', href: '/cookie-policy' },
  { slug: 'refund-policy', label: 'Refund Policy', href: '/refund-policy' },
  { slug: 'data-deletion', label: 'Data Deletion', href: '/data-deletion' },
];

export default function PolicyLayout({
  title,
  badge,
  badgeColor = '#FF5500',
  lastUpdated,
  summary,
  activeSlug,
  children,
  contactEmail = 'legal@cursis.in',
  dpoEmail = 'dpo@cursis.in',
}: PolicyLayoutProps) {
  return (
    <div className="lp-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF6EE' }}>
      <LandingNav />

      <main style={{ flex: '1 0 auto', maxWidth: '960px', width: '100%', margin: '0 auto', padding: '120px 24px 80px', color: '#0A0A0A' }}>
        {/* Policy Tab Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '16px',
            marginBottom: '32px',
            borderBottom: '1.5px solid rgba(10, 10, 10, 0.1)',
          }}
        >
          {POLICY_NAV_ITEMS.map((item) => {
            const isActive = item.slug === activeSlug;
            return (
              <Link
                key={item.slug}
                href={item.href}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  color: isActive ? '#FFFFFF' : '#404040',
                  backgroundColor: isActive ? '#0A0A0A' : '#FFFFFF',
                  border: isActive ? '1.5px solid #0A0A0A' : '1.5px solid #E5E0D8',
                  boxShadow: isActive ? '2px 2px 0 0 #FF5500' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Hero Header */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: `1.5px solid ${badgeColor}`,
              borderRadius: '9999px',
              padding: '6px 14px',
              marginBottom: '16px',
              boxShadow: `2px 2px 0 0 ${badgeColor}`,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: badgeColor }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {badge}
            </span>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#0A0A0A' }}>
            {title}
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#525252', margin: 0 }}>
            {lastUpdated}
          </p>
        </div>

        {/* Summary Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #0A0A0A',
            borderRadius: '14px',
            padding: '24px 28px',
            marginBottom: '40px',
            boxShadow: '4px 4px 0 0 #0A0A0A',
            lineHeight: 1.7,
            fontSize: '15px',
            color: '#171717',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FF5500', marginBottom: '8px' }}>
            Policy Overview &amp; Scope
          </div>
          {summary}
        </div>

        {/* Main Content Body */}
        <div
          className="policy-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            fontSize: '15px',
            lineHeight: 1.75,
            color: '#262626',
          }}
        >
          {children}

          {/* Contact & Governance Footer Card */}
          <div
            style={{
              marginTop: '24px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #0A0A0A',
              borderRadius: '14px',
              padding: '28px',
              boxShadow: '4px 4px 0 0 #0A0A0A',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#0A0A0A' }}>
              Questions or Verification Requests
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#525252', lineHeight: 1.6 }}>
              Our data governance and security compliance team reviews requests with SLA commitment within 24 to 48 business hours.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: '#F5F5F0', border: '1px solid #E5E0D8' }}>
                <span style={{ fontWeight: 700, color: '#525252' }}>Legal Desk: </span>
                <a href={`mailto:${contactEmail}`} style={{ color: '#0F4CFF', fontWeight: 700, textDecoration: 'none' }}>
                  {contactEmail}
                </a>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: '#F5F5F0', border: '1px solid #E5E0D8' }}>
                <span style={{ fontWeight: 700, color: '#525252' }}>Data Protection Officer: </span>
                <a href={`mailto:${dpoEmail}`} style={{ color: '#0F4CFF', fontWeight: 700, textDecoration: 'none' }}>
                  {dpoEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
