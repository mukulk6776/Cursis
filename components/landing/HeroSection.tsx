import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="lp-section lp-hero" id="hero">
      <div className="lp-hero-header">
        <h1 className="lp-hero-title">
          Less chasing.<br />
          <span className="tano-hero-marker">More getting done.</span>
        </h1>

        <p className="lp-hero-text">
          Other tools store your tasks. Cursis chases them for you.
        </p>

        <div className="lp-hero-ctas">
          <Link prefetch={false} href="/signup" data-marketing="hero_button_click" className="btn btn-primary btn-lg">
            Make my workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link prefetch={false} href="/signup#signup-age-gate" className="btn btn-secondary btn-lg" aria-label="Continue with Google — confirm your age and privacy consent on signup">
            <span aria-hidden="true">G</span> Continue with Google
          </Link>
        </div>
        <p className="lp-cta-note">Free for teams up to 10 · No credit card · Set up in 2 minutes</p>
      </div>
    </section>
  );
}
