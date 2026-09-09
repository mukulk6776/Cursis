'use client';

import React from 'react';

// Authentic Tano.ai monochrome editorial brand marks for the infinite marquee
const MARQUEE_BRANDS = [
  {
    name: 'Google',
    node: (
      <svg height="20" viewBox="0 0 68 22" fill="currentColor" aria-label="Google" style={{ display: 'block' }}>
        <path d="M10.8 11.2V8.4h9.8c.1.5.2 1.1.2 1.8 0 2.2-.6 4.9-2.5 6.8-1.9 1.9-4.3 2.9-7.5 2.9C5 19.9.5 15.6.5 10.3S5 .7 10.8.7c3.1 0 5.4 1.2 7.1 2.8l-2 2c-1.2-1.1-2.8-1.9-5.1-1.9-4.2 0-7.5 3.4-7.5 7.7s3.3 7.7 7.5 7.7c2.7 0 4.3-1.1 5.3-2.1.8-.8 1.3-1.9 1.5-3.5h-6.8v-2.6z" />
        <path d="M28.4 13.5c0 3.8-2.9 6.4-6.4 6.4s-6.4-2.6-6.4-6.4c0-3.9 2.9-6.4 6.4-6.4s6.4 2.5 6.4 6.4zm-2.8 0c0-2.5-1.8-4.2-3.6-4.2-1.8 0-3.6 1.7-3.6 4.2 0 2.4 1.8 4.2 3.6 4.2 1.8 0 3.6-1.8 3.6-4.2z" />
        <path d="M42.3 13.5c0 3.8-2.9 6.4-6.4 6.4s-6.4-2.6-6.4-6.4c0-3.9 2.9-6.4 6.4-6.4s6.4 2.5 6.4 6.4zm-2.8 0c0-2.5-1.8-4.2-3.6-4.2-1.8 0-3.6 1.7-3.6 4.2 0 2.4 1.8 4.2 3.6 4.2 1.8 0 3.6-1.8 3.6-4.2z" />
        <path d="M55.4 7.4v11.9c0 4.9-2.9 6.9-6.3 6.9-3.2 0-5.1-2.1-5.8-3.9l2.4-1c.5 1.1 1.7 2.4 3.4 2.4 2.2 0 3.6-1.4 3.6-3.9v-1h-.1c-.7.9-2.1 1.7-3.8 1.7-3.6 0-6.8-3.1-6.8-7.1 0-4 3.2-7.1 6.8-7.1 1.7 0 3.1.8 3.8 1.6h.1V7.4h2.8zm-2.6 6.1c0-2.4-1.6-4.2-3.6-4.2-2 0-3.6 1.8-3.6 4.2 0 2.4 1.6 4.1 3.6 4.1 1.9 0 3.6-1.7 3.6-4.1z" />
        <path d="M59 1.2v18.2h-2.8V1.2H59z" />
        <path d="M68.5 15.6l2.2 1.5c-.7 1.1-2.4 2.8-5.3 2.8-4.5 0-7.8-3.5-7.8-7.4 0-4.4 3.4-7.4 7.5-7.4 4.1 0 6.1 3.1 6.7 4.7l.3.8-9.9 4.1c.8 1.5 2 2.3 3.6 2.3 1.7 0 2.8-.8 3.7-2.4zm-5.4-2.3l6.6-2.7c-.4-.9-1.4-1.6-2.5-1.6-1.4 0-3.3 1.2-4.1 2.8v1.5z" />
      </svg>
    ),
  },
  {
    name: 'Reverie Hacks',
    node: (
      <div className="tano-brand-pill">
        <span className="tano-brand-rh-tag">&lt;RH/&gt;</span>
        <span className="tano-brand-name">REVERIE HACKS</span>
      </div>
    ),
  },
  {
    name: 'Skin+Me',
    node: (
      <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
        Skin<span style={{ color: '#FF5500', fontWeight: 900, margin: '0 1px' }}>+</span>Me
      </span>
    ),
  },
  {
    name: 'Content Service Media',
    node: (
      <div className="tano-brand-pill">
        <span className="tano-brand-csm-tag">CSM</span>
        <span className="tano-brand-name">CONTENT SERVICE MEDIA</span>
      </div>
    ),
  },
  {
    name: 'HelloFresh',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.5 8.2c-.3-.9-1-1.6-1.9-2.1C18.1 5.3 16.5 5 14.8 5c-1.3 0-2.5.2-3.8.6-.6.2-1.3.1-1.8-.3C7.8 4.2 6.2 3.8 4.6 4c-1.5.2-2.8 1-3.6 2.3-.9 1.3-1.1 2.9-.7 4.5.6 2.5 2.1 4.7 4.2 6.2 2.3 1.7 5.1 2.6 8 2.6 2.3 0 4.6-.6 6.6-1.8 1.6-1 2.7-2.6 3.1-4.4.4-1.7.1-3.6-.7-5.2z" />
        </svg>
        <span style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: '14px', textTransform: 'uppercase' }}>
          HelloFresh
        </span>
      </div>
    ),
  },
  {
    name: 'LAKAI Studio',
    node: (
      <div className="tano-brand-pill">
        <span className="tano-brand-lakai-tag">LK</span>
        <span className="tano-brand-name">LAKAI STUDIO</span>
      </div>
    ),
  },
  {
    name: 'Bloom & Wild',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.95, textAlign: 'left' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bloom &amp;</span>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Wild</span>
      </div>
    ),
  },
  {
    name: 'ElevenLabs',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="12" height="15" viewBox="0 0 12 16" fill="currentColor">
          <rect x="0.5" y="1" width="3.5" height="14" rx="1.75" />
          <rect x="7.5" y="1" width="3.5" height="14" rx="1.75" />
        </svg>
        <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '-0.02em' }}>ElevenLabs</span>
      </div>
    ),
  },
  {
    name: 'Fussy',
    node: (
      <span style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '-0.04em', borderRadius: '4px', border: '2px solid currentColor', padding: '1px 6px' }}>
        fussy
      </span>
    ),
  },
];

// 3 Customer Case Study Cards (matching Tano.ai's exact fi customer cards)
const CUSTOMER_CASE_STUDIES = [
  {
    tag: 'Customer · 01',
    stat: '2,100+',
    label: 'active creators scaling on Cursis',
    brandName: 'REVERIE HACKS',
    brandSub: 'Creative Tech & Hackathon Collective',
    logoInitials: 'RH',
    bg: '#FFD66B', // Tano butter yellow
    tapeRotate: -3.5,
    tapeColor: 'rgba(255, 255, 255, 0.92)',
    actionLabel: 'Active Sprint Hub →',
  },
  {
    tag: 'Customer · 02',
    stat: '140k+',
    label: 'autonomous deliverables shipped',
    brandName: 'CONTENT SERVICE MEDIA',
    brandSub: 'High-Volume Production & Syndication',
    logoInitials: 'CSM',
    bg: '#9BE7C4', // Tano retro mint
    tapeRotate: 2.8,
    tapeColor: 'rgba(255, 255, 255, 0.92)',
    actionLabel: 'Production Engine →',
  },
  {
    tag: 'Customer · 03',
    stat: '99.4%',
    label: 'on-time milestone SLA delivery',
    brandName: 'LAKAI STUDIO',
    brandSub: 'Creator Brand & Digital Studio',
    logoInitials: 'LK',
    bg: '#FFB8D1', // Tano pastel pink
    tapeRotate: -2.2,
    tapeColor: 'rgba(255, 255, 255, 0.92)',
    actionLabel: 'Creator Collective →',
  },
];

export default function TrustAttraction() {
  return (
    <section className="tano-trust-section lp-reveal" id="trust-attraction" aria-label="Social Proof & Category Defining Brands">
      {/* =========================================================
          1. TANO.AI EXACT ANIMATED MARQUEE CAPSULE PILL
          ========================================================= */}
      <div className="tano-marquee-capsule" role="region" aria-label="Trusted brands marquee">
        <div className="tano-marquee-label">
          <span>Trusted by category-defining brands</span>
          <span className="tano-marquee-arrow" aria-hidden="true">→</span>
        </div>

        <div className="tano-marquee-viewport">
          <div className="tano-marquee-track">
            {/* Track 1 */}
            {MARQUEE_BRANDS.map((item, idx) => (
              <div key={`brand-1-${idx}`} className="tano-marquee-item" title={item.name}>
                {item.node}
              </div>
            ))}
            {/* Track 2 (Seamless Infinite Loop) */}
            {MARQUEE_BRANDS.map((item, idx) => (
              <div key={`brand-2-${idx}`} className="tano-marquee-item" aria-hidden="true" title={item.name}>
                {item.node}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          2. TANO.AI EXACT 3-COLUMN CUSTOMER PROOF CARDS (fi ARRAY)
          ========================================================= */}
      <div className="tano-case-cards-grid">
        {CUSTOMER_CASE_STUDIES.map((card, idx) => (
          <div
            key={`case-card-${idx}`}
            className="tano-case-card"
            style={{ backgroundColor: card.bg }}
          >
            {/* Tano Signature Rotated Washi Tape Sticker */}
            <div
              className="tano-washi-tape"
              style={{
                backgroundColor: card.tapeColor,
                top: '-12px',
                right: '28px',
                left: 'auto',
                transform: `rotate(${card.tapeRotate}deg)`,
              }}
              aria-hidden="true"
            />

            {/* Top Customer Tag */}
            <div className="tano-card-top-tag">
              <span className="tano-tag-badge">{card.tag}</span>
              <span className="tano-radar-dot" aria-hidden="true" />
            </div>

            {/* Giant Bold Metric */}
            <div className="tano-card-stat">{card.stat}</div>

            {/* Stat Label */}
            <div className="tano-card-label">{card.label}</div>

            {/* Bottom Brand Mark & Action */}
            <div className="tano-card-bottom">
              <div className="tano-brand-block">
                <div className="tano-brand-avatar">{card.logoInitials}</div>
                <div className="tano-brand-meta">
                  <div className="tano-brand-title">{card.brandName}</div>
                  <div className="tano-brand-sub">{card.brandSub}</div>
                </div>
              </div>
              <span className="tano-card-arrow">{card.actionLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
