'use client';

import React from 'react';

// High-fidelity brand & studio marks matching Tano AI reference aesthetic
const BRANDS = [
  {
    name: 'Google',
    node: (
      <svg height="21" viewBox="0 0 68 22" fill="currentColor" aria-label="Google" style={{ display: 'block' }}>
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
    name: 'Skin+Me',
    node: (
      <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
        Skin<span style={{ color: '#0f4cff', fontWeight: 900, margin: '0 1px' }}>+</span>Me
      </span>
    ),
  },
  {
    name: 'HelloFresh',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.5 8.2c-.3-.9-1-1.6-1.9-2.1C18.1 5.3 16.5 5 14.8 5c-1.3 0-2.5.2-3.8.6-.6.2-1.3.1-1.8-.3C7.8 4.2 6.2 3.8 4.6 4c-1.5.2-2.8 1-3.6 2.3-.9 1.3-1.1 2.9-.7 4.5.6 2.5 2.1 4.7 4.2 6.2 2.3 1.7 5.1 2.6 8 2.6 2.3 0 4.6-.6 6.6-1.8 1.6-1 2.7-2.6 3.1-4.4.4-1.7.1-3.6-.7-5.2z"/>
        </svg>
        <span style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: '15px', textTransform: 'uppercase' }}>
          HelloFresh
        </span>
      </div>
    ),
  },
  {
    name: 'I·M·8',
    node: (
      <span style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '0.24em' }}>
        I · M · 8
      </span>
    ),
  },
  {
    name: 'Peachies',
    node: (
      <span style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '0.04em', textTransform: 'uppercase', fontStyle: 'italic' }}>
        PEACHiES
      </span>
    ),
  },
  {
    name: 'Bloom & Wild',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.95, textAlign: 'left' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bloom &</span>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Wild</span>
      </div>
    ),
  },
  {
    name: 'Reverie Hacks',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: 22, height: 22, background: '#0f4cff', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #000' }}>RH</div>
        <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Reverie Hacks</span>
      </div>
    ),
  },
  {
    name: 'Fussy',
    node: (
      <span style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '-0.04em', borderRadius: '5px', border: '2px solid currentColor', padding: '1px 8px' }}>
        fussy
      </span>
    ),
  },
  {
    name: 'Content Service Media',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: 22, height: 22, background: '#ff5710', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #000' }}>CSM</div>
        <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Content Service Media</span>
      </div>
    ),
  },
  {
    name: 'ElevenLabs',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <rect x="0.5" y="1" width="3.5" height="14" rx="1.75" />
          <rect x="7.5" y="1" width="3.5" height="14" rx="1.75" />
        </svg>
        <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em' }}>ElevenLabs</span>
      </div>
    ),
  },
  {
    name: 'LAKAI',
    node: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: 22, height: 22, background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #000' }}>LK</div>
        <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>LAKAI Studio</span>
      </div>
    ),
  },
];

export default function TrustAttraction() {
  return (
    <div className="lp-trust-attraction-wrapper lp-reveal">
      {/* =========================================================
          1. TANO AI-STYLE ANIMATED TRUSTED BRANDS MARQUEE CAPSULE
          ========================================================= */}
      <div className="lp-tano-marquee-capsule" role="region" aria-label="Trusted brands marquee">
        <div className="lp-tano-marquee-label">
          <span>Trusted by category-defining brands</span>
          <span className="lp-tano-marquee-arrow" aria-hidden="true">→</span>
        </div>

        <div className="lp-tano-marquee-viewport">
          <div className="lp-tano-marquee-track">
            {/* Primary Track */}
            {BRANDS.map((item, idx) => (
              <div key={`brand-track-1-${idx}`} className="lp-brand-marquee-item" title={item.name}>
                {item.node}
              </div>
            ))}
            {/* Duplicated Track for 100% seamless, non-stop loop */}
            {BRANDS.map((item, idx) => (
              <div key={`brand-track-2-${idx}`} className="lp-brand-marquee-item" aria-hidden="true" title={item.name}>
                {item.node}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          2. ELEVATED CREATOR HUB & ENTERPRISE PROOF CARD (IMAGE 2)
          ========================================================= */}
      <div className="lp-social-proof-bar">
        <div className="lp-social-proof-header">
          <div className="lp-social-proof-title">
            <span className="lp-stat-pulse-radar" aria-hidden="true" />
            <span>2,100+ creators &amp; teams scaling execution with Reverie Hacks, CSM and LAKAI</span>
          </div>
          <div className="lp-social-proof-stats">
            <div className="lp-stat-badge lp-badge-creators">
              <span className="lp-stat-pulse" />
              <span>2,100+ Active Creators</span>
            </div>
            <div className="lp-stat-badge lp-badge-rating">
              <span className="lp-badge-star">★</span>
              <span>4.9/5 Rating</span>
            </div>
            <div className="lp-stat-badge lp-badge-tasks">
              <span className="lp-badge-spark">⚡</span>
              <span>140k+ Tasks Shipped</span>
            </div>
          </div>
        </div>

        {/* Dynamic Flagship Partner Showcase Cards */}
        <div className="lp-partners-grid-enhanced">
          {/* Partner 1: Reverie Hacks */}
          <div className="lp-partner-card-enhanced lp-card-rh">
            <div className="lp-partner-top">
              <div className="lp-partner-icon-box" style={{ background: '#0f4cff' }}>RH</div>
              <div className="lp-partner-badge-pill" style={{ color: '#0f4cff', borderColor: '#0f4cff' }}>
                ACTIVE SPRINT HUB
              </div>
            </div>
            <div className="lp-partner-info">
              <span className="lp-partner-name">Reverie Hacks</span>
              <span className="lp-partner-sub">Creative Tech &amp; Hackathon Collective</span>
            </div>
            <div className="lp-partner-metric-bar">
              <span className="lp-metric-number">42+</span>
              <span className="lp-metric-label">Concurrent Sprints Shipped</span>
              <span className="lp-metric-tag" style={{ background: '#0f4cff' }}>99.4% SLA</span>
            </div>
          </div>

          {/* Partner 2: Content Service Media */}
          <div className="lp-partner-card-enhanced lp-card-csm">
            <div className="lp-partner-top">
              <div className="lp-partner-icon-box" style={{ background: '#ff5710' }}>CSM</div>
              <div className="lp-partner-badge-pill" style={{ color: '#ff5710', borderColor: '#ff5710' }}>
                PRODUCTION ENGINE
              </div>
            </div>
            <div className="lp-partner-info">
              <span className="lp-partner-name">Content Service Media</span>
              <span className="lp-partner-sub">High-Volume Production &amp; Syndication</span>
            </div>
            <div className="lp-partner-metric-bar">
              <span className="lp-metric-number">140k+</span>
              <span className="lp-metric-label">Client Deliverables Synced</span>
              <span className="lp-metric-tag" style={{ background: '#ff5710' }}>Autonomous</span>
            </div>
          </div>

          {/* Partner 3: LAKAI */}
          <div className="lp-partner-card-enhanced lp-card-lakai">
            <div className="lp-partner-top">
              <div className="lp-partner-icon-box" style={{ background: '#10b981' }}>LK</div>
              <div className="lp-partner-badge-pill" style={{ color: '#0b8f64', borderColor: '#10b981' }}>
                DIGITAL STUDIO
              </div>
            </div>
            <div className="lp-partner-info">
              <span className="lp-partner-name">LAKAI</span>
              <span className="lp-partner-sub">Creator Brand &amp; Digital Studio</span>
            </div>
            <div className="lp-partner-metric-bar">
              <span className="lp-metric-number">680k+</span>
              <span className="lp-metric-label">Audience Impressions Tracked</span>
              <span className="lp-metric-tag" style={{ background: '#10b981' }}>Real-Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
