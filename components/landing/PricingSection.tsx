import React from 'react';
import Link from 'next/link';

export default function PricingSection() {
  const points = [
    'Unlimited team members & collaborators',
    'Unlimited projects, tasks & Kanban boards',
    'Full Ordis AI Workspace Operations included',
    'Unified calendar & meeting scheduler',
    'Real-time overview & productivity analytics',
    'No credit card required to start',
    'No artificial feature locks or trial expirations',
  ];

  return (
    <section className="lp-section" id="pricing">
      <div className="lp-section-header">
        <div className="lp-section-label">Transparent Pricing</div>
        <h2 className="lp-section-title">Free means 100% free. Forever.</h2>
        <p className="lp-section-subtitle">
          No tier upgrades, no surprise paywalls, and no credit card required. Cursis provides a complete,
          unrestricted workspace with Ordis AI included for every team.
        </p>
      </div>

      <div className="lp-pricing-card">
        <div className="lp-pricing-card-header">
          <div>
            <span className="badge badge-brand">ALL-INCLUSIVE WORKSPACE</span>
            <h3 className="lp-pricing-tier-title">Cursis Complete</h3>
            <p className="lp-pricing-tier-desc">Everything your team needs to work with speed and intelligence.</p>
          </div>
          <div className="lp-pricing-amount-box">
            <span className="lp-pricing-dollar">$</span>
            <span className="lp-pricing-zero">0</span>
            <span className="lp-pricing-period">/ forever</span>
          </div>
        </div>

        <div className="lp-pricing-divider" />

        <div className="lp-pricing-points-grid">
          {points.map((p) => (
            <div key={p} className="lp-pricing-point">
              <span className="lp-pricing-check">✓</span>
              <span>{p}</span>
            </div>
          ))}
        </div>

        <div className="lp-pricing-cta-row">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Create Your Free Workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <span className="lp-pricing-note">Takes less than 30 seconds to set up.</span>
        </div>
      </div>
    </section>
  );
}

