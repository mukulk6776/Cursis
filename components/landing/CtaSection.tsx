import React from 'react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="lp-cta-section" id="cta">
      <div className="lp-reveal">
        <h2 className="lp-cta-title">
          Stop paying for 10 apps.
          <br />
          Start with one free workspace.
        </h2>
      </div>
      <p className="lp-cta-subtitle lp-reveal" style={{ transitionDelay: '100ms' }}>
        Your team deserves a workspace that actually works together. Cursis gives you everything — projects,
        tasks, messages, docs, files, calendar, AI assistant — for free.
      </p>
      <div className="lp-cta-buttons lp-reveal" style={{ transitionDelay: '200ms' }}>
        <Link
          href="/signup"
          className="btn btn-brand btn-lg"
          style={{ borderColor: 'var(--c-near-black)' }}
        >
          Get Started Free
        </Link>
        <a
          href="#features"
          className="btn btn-lg"
          style={{ background: 'transparent', color: 'var(--c-white)', borderColor: 'var(--c-white)' }}
        >
          Explore Features
        </a>
      </div>
      <p className="lp-cta-note lp-reveal" style={{ transitionDelay: '300ms' }}>
        No credit card. No subscription. No trial. Just free.
      </p>
    </section>
  );
}
