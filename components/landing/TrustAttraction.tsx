'use client';

import React from 'react';

// Authentic editorial brand marks for the infinite marquee (Exclusive to Reverie Hacks, Content Service Media, Lakai)
const MARQUEE_BRANDS = [
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
    name: 'Content Service Media',
    node: (
      <div className="tano-brand-pill">
        <span className="tano-brand-csm-tag">CSM</span>
        <span className="tano-brand-name">CONTENT SERVICE MEDIA</span>
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
];

// Seamless repeating sequence so the marquee track fills wide screens without gaps
const MARQUEE_TRACK_ITEMS = [...MARQUEE_BRANDS, ...MARQUEE_BRANDS, ...MARQUEE_BRANDS];

interface CustomerCaseStudy {
  tag: string;
  stat?: string;
  label?: string;
  brandName: string;
  brandSub: string;
  logoInitials: string;
  bg: string;
  tapeRotate: number;
  tapeColor: string;
  actionLabel: string;
}

// 3 Customer Case Study Cards
const CUSTOMER_CASE_STUDIES: CustomerCaseStudy[] = [
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
            {MARQUEE_TRACK_ITEMS.map((item, idx) => (
              <div key={`brand-1-${idx}`} className="tano-marquee-item" title={item.name}>
                {item.node}
              </div>
            ))}
            {/* Track 2 (Seamless Infinite Loop) */}
            {MARQUEE_TRACK_ITEMS.map((item, idx) => (
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
            {card.stat ? <div className="tano-card-stat">{card.stat}</div> : null}

            {/* Stat Label */}
            {card.label ? <div className="tano-card-label">{card.label}</div> : null}

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
