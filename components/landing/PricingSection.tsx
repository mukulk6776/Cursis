import React from 'react';
import Link from 'next/link';

export default function PricingSection() {
  const points = [
    'All 17 modules included',
    'Unlimited team members',
    'Unlimited projects and tasks',
    'Ordis AI fully included',
    'No credit card required',
    'No trial period — it\'s just free',
    'No ads, no data selling',
  ];

  return (
    <section className="lp-section" id="free">
      <div className="lp-section-label lp-reveal">Pricing</div>
      <h2 className="lp-section-title lp-reveal">Free means free. No tricks.</h2>
      <p className="lp-section-subtitle lp-reveal">
        No tiers. No plans. No "upgrade to unlock." The entire workspace — including Ordis — is free. Cursis
        makes money from its agency services, not from charging you.
      </p>

      <div className="lp-free-visual lp-stagger">
        {points.map((p) => (
          <div key={p} className="lp-free-check">
            <span className="lp-free-check-icon">+</span>
            {p}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }} className="lp-reveal">
        <Link href="/signup" className="btn btn-brand btn-lg">
          Start Your Free Workspace
        </Link>
      </div>
    </section>
  );
}
