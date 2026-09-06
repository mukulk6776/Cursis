import React from 'react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="lp-cta-section" id="cta">
      <div className="lp-cta-inner">
        <h2 className="lp-cta-title">
          Ready for a workspace that actually works for you?
        </h2>
        <p className="lp-cta-subtitle">
          Join modern teams operating with clarity and speed. Free forever, with Ordis AI included.
        </p>

        <div className="lp-cta-buttons">
          <Link href="/signup" className="btn btn-brand btn-lg">
            Start Free Workspace
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
          No credit card required • Instant access • Unlimited projects
        </p>
      </div>
    </section>
  );
}

