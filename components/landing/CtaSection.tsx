import React from 'react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="lp-cta-section" id="cta">
      <div className="lp-cta-inner">
        <h2 className="lp-cta-title">
          Ready to unify enterprise operations at scale?
        </h2>
        <p className="lp-cta-subtitle">
          Deploy your high-performance workspace in seconds. Compliant with enterprise security standards, SOC-2 certified, with built-in Ordis autonomous intelligence.
        </p>

        <div className="lp-cta-buttons">
          <Link href="/signup" className="btn btn-brand btn-lg">
            Deploy Workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg">
            Sign In to Existing Workspace
          </Link>
        </div>

        <p className="lp-cta-note">
          Enterprise-grade encryption • Instant deployment • 99.99% Uptime SLA
        </p>
      </div>
    </section>
  );
}
