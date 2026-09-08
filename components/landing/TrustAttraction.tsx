'use client';

import React from 'react';

// Authentic Partner & Creator Network Brand Marks featuring Reverie Hacks, LAKAI, and Content Service Media
// with Tano AI-inspired typography, iconography, and infinite smooth marquee animation
const CREATOR_PARTNER_BRANDS = [
  {
    name: 'Reverie Hacks',
    node: (
      <div className="lp-marquee-brand-item lp-brand-rh">
        <div className="lp-marquee-icon-tile" style={{ backgroundColor: '#0f4cff' }}>
          RH
        </div>
        <span className="lp-marquee-brand-title">REVERIE HACKS</span>
      </div>
    ),
  },
  {
    name: 'LAKAI',
    node: (
      <div className="lp-marquee-brand-item lp-brand-lakai">
        <div className="lp-marquee-icon-tile" style={{ backgroundColor: '#10b981' }}>
          LK
        </div>
        <span className="lp-marquee-brand-title lp-text-lakai">LAKAI</span>
      </div>
    ),
  },
  {
    name: 'Content Service Media',
    node: (
      <div className="lp-marquee-brand-item lp-brand-csm">
        <div className="lp-marquee-icon-tile" style={{ backgroundColor: '#ff5710' }}>
          CSM
        </div>
        <span className="lp-marquee-brand-title">CONTENT SERVICE MEDIA</span>
      </div>
    ),
  },
  {
    name: 'Reverie Labs',
    node: (
      <div className="lp-marquee-brand-item lp-brand-rh">
        <span className="lp-marquee-pill-badge" style={{ borderColor: '#0f4cff', color: '#0f4cff' }}>
          &lt;RH/&gt;
        </span>
        <span className="lp-marquee-brand-title">REVERIE LABS</span>
      </div>
    ),
  },
  {
    name: 'LAKAI Studio',
    node: (
      <div className="lp-marquee-brand-item lp-brand-lakai">
        <span className="lp-marquee-star-badge" style={{ color: '#10b981' }}>
          ✦
        </span>
        <span className="lp-marquee-brand-title lp-text-lakai">LAKAI STUDIO</span>
      </div>
    ),
  },
  {
    name: 'CSM Syndicate',
    node: (
      <div className="lp-marquee-brand-item lp-brand-csm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff5710" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
          <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
          <circle cx="12" cy="12" r="2" fill="#ff5710" />
        </svg>
        <span className="lp-marquee-brand-title">CSM SYNDICATE</span>
      </div>
    ),
  },
  {
    name: 'Reverie Tech Hub',
    node: (
      <div className="lp-marquee-brand-item lp-brand-rh">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0f4cff">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="lp-marquee-brand-title">REVERIE TECH</span>
      </div>
    ),
  },
  {
    name: 'LAKAI Collective',
    node: (
      <div className="lp-marquee-brand-item lp-brand-lakai">
        <span className="lp-marquee-pill-badge" style={{ borderColor: '#10b981', color: '#10b981' }}>
          LK·STUDIO
        </span>
        <span className="lp-marquee-brand-title lp-text-lakai">LAKAI COLLECTIVE</span>
      </div>
    ),
  },
  {
    name: 'Content Service Network',
    node: (
      <div className="lp-marquee-brand-item lp-brand-csm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5710" strokeWidth="2.5">
          <rect x="2" y="2" width="8" height="8" rx="2" />
          <rect x="14" y="2" width="8" height="8" rx="2" />
          <rect x="8" y="14" width="8" height="8" rx="2" />
        </svg>
        <span className="lp-marquee-brand-title">CONTENT SERVICE NETWORK</span>
      </div>
    ),
  },
];

export default function TrustAttraction() {
  return (
    <div className="lp-trust-attraction-wrapper lp-reveal" id="trust-attraction">
      {/* =========================================================
          1. CREATOR & ENTERPRISE PROOF HUB (MATCHING REFERENCE IMAGE 1)
          ========================================================= */}
      <div className="lp-social-proof-bar" role="region" aria-label="Enterprise & Creator Proof">
        {/* Top Header Row with Pulsing Radar Dot */}
        <div className="lp-social-proof-header-block">
          <div className="lp-social-proof-title">
            <span className="lp-stat-pulse-radar" aria-hidden="true" />
            <span>2,100+ USERS WORKING WITH REVERIE HACKS, CONTENT SERVICE MEDIA AND LAKAI</span>
          </div>

          {/* Neo-Brutalist Metric Badges Row */}
          <div className="lp-social-proof-badges-row">
            <div className="lp-stat-badge lp-badge-creators" title="2,100+ Active Creators on Cursis">
              <span className="lp-stat-pulse" />
              <span>2,100+ Active Creators</span>
            </div>
            <div className="lp-stat-badge lp-badge-rating" title="Rated 4.9 out of 5 stars">
              <span className="lp-badge-star">★</span>
              <span>4.9/5 Rating</span>
            </div>
            <div className="lp-stat-badge lp-badge-tasks" title="140k+ Tasks Shipped through Cursis Engine">
              <span className="lp-badge-spark">⚡</span>
              <span>140k+ Tasks Shipped</span>
            </div>
          </div>
        </div>

        {/* Faint Divider matching Reference Image 1 */}
        <div className="lp-social-proof-divider" aria-hidden="true" />

        {/* 3 Flagship Partner Cards (Clean Horizontal 3-Column Grid) */}
        <div className="lp-partners-grid-clean">
          {/* Card 1: Reverie Hacks */}
          <div className="lp-partner-card-clean lp-card-rh" role="article" tabIndex={0} aria-label="Reverie Hacks">
            <div className="lp-partner-icon-tile" style={{ backgroundColor: '#0f4cff' }}>
              RH
            </div>
            <div className="lp-partner-content">
              <span className="lp-partner-headline">REVERIE HACKS</span>
              <span className="lp-partner-subline">Creative Tech &amp; Hackathon Collective</span>
            </div>
          </div>

          {/* Card 2: Content Service Media */}
          <div className="lp-partner-card-clean lp-card-csm" role="article" tabIndex={0} aria-label="Content Service Media">
            <div className="lp-partner-icon-tile" style={{ backgroundColor: '#ff5710' }}>
              CSM
            </div>
            <div className="lp-partner-content">
              <span className="lp-partner-headline">CONTENT SERVICE MEDIA</span>
              <span className="lp-partner-subline">High-Volume Production &amp; Syndication</span>
            </div>
          </div>

          {/* Card 3: LAKAI */}
          <div className="lp-partner-card-clean lp-card-lakai" role="article" tabIndex={0} aria-label="LAKAI">
            <div className="lp-partner-icon-tile" style={{ backgroundColor: '#10b981' }}>
              LK
            </div>
            <div className="lp-partner-content">
              <span className="lp-partner-headline">LAKAI</span>
              <span className="lp-partner-subline">Creator Brand &amp; Digital Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. TANO AI-STYLE ANIMATED TRUSTED BRANDS MARQUEE CAPSULE (IMAGE 2)
          Featuring Reverie Hacks, LAKAI, and Content Service Media
          ========================================================= */}
      <div className="lp-tano-marquee-capsule" role="region" aria-label="Trusted creator collectives marquee">
        <div className="lp-tano-marquee-label">
          <span>TRUSTED CREATOR COLLECTIVES</span>
          <span className="lp-tano-marquee-arrow" aria-hidden="true">→</span>
        </div>

        <div className="lp-tano-marquee-viewport">
          <div className="lp-tano-marquee-track">
            {/* Primary Track */}
            {CREATOR_PARTNER_BRANDS.map((item, idx) => (
              <div key={`brand-track-1-${idx}`} className="lp-brand-marquee-item" title={item.name}>
                {item.node}
              </div>
            ))}
            {/* Duplicated Track for 100% seamless, continuous infinite loop */}
            {CREATOR_PARTNER_BRANDS.map((item, idx) => (
              <div key={`brand-track-2-${idx}`} className="lp-brand-marquee-item" aria-hidden="true" title={item.name}>
                {item.node}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
