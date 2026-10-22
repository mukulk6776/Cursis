import Link from 'next/link';
import { FREE_WORKSPACE_TEXT } from '@/lib/site';

export default function HeroSection() {
  return (
    <section className="lp-section lp-hero" id="hero">
      <div className="lp-hero-header">
        <h1 className="lp-hero-title">
          Less chasing.<br />
          <span className="tano-hero-marker">More getting done.</span>
        </h1>

        <p className="lp-hero-text">
          Your team workspace for tasks, projects, chat, and video meetings. Ordis AI spots delayed tasks and helps share the work, so your team can stay on track.
        </p>

        <div className="lp-hero-ctas">
          <Link prefetch={false} href="/signup" className="btn btn-primary btn-lg">
            Make my workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <a href="#ordis" className="btn btn-secondary btn-lg">
            Try the Demo
          </a>
        </div>
        <p className="lp-cta-note">{FREE_WORKSPACE_TEXT}</p>
      </div>
    </section>
  );
}
