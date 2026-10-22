import React from 'react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="lp-cta-section" id="cta">
      <div className="lp-cta-inner">
        <h2 className="lp-cta-title">
          Ready for fewer missed deadlines?
        </h2>
        <p className="lp-cta-subtitle">
          Bring your tasks, conversations and projects into one workspace.
        </p>

        <div className="lp-cta-buttons">
          <Link prefetch={false} href="/signup" className="btn btn-primary btn-lg">
            Make my free workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link prefetch={false} href="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        <p className="lp-cta-note">
          Work together in one place · Set up in minutes
        </p>
      </div>
    </section>
  );
}
