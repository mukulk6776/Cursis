'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`} id="lp-nav">
      <div className="lp-nav-container">
        <Link href="/" className="lp-nav-logo">
          <svg viewBox="0 0 1024 1024" fill="none" width="28" height="28">
            <path
              d="M 545 240 A 282 282 0 1 0 782 566"
              stroke="#000000"
              strokeWidth="142"
              strokeLinecap="round"
              fill="none"
            />
            <rect
              x="625"
              y="196"
              width="156"
              height="156"
              rx="42"
              transform="rotate(-10 703 274)"
              fill="#0f4cff"
            />
          </svg>
          <span className="lp-nav-logo-text">Cursis</span>
        </Link>

        <div className={`lp-nav-links ${mobileOpen ? 'lp-nav-open' : ''}`} id="lp-nav-links">
          <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className="lp-nav-link">
            Features
          </a>
          <a href="#ordis" onClick={(e) => handleAnchorClick(e, '#ordis')} className="lp-nav-link">
            Ordis AI
          </a>
          <a href="#problem" onClick={(e) => handleAnchorClick(e, '#problem')} className="lp-nav-link">
            Why Cursis
          </a>
          <a href="#pricing" onClick={(e) => handleAnchorClick(e, '#pricing')} className="lp-nav-link">
            Pricing
          </a>
          <div className="lp-nav-mobile-actions">
            <Link href="/login" className="btn btn-secondary btn-sm" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
              Get Started Free
            </Link>
          </div>
        </div>

        <div className="lp-nav-actions">
          <Link href="/login" className="btn btn-ghost btn-sm lp-hide-mobile">
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Get Started Free
          </Link>
          <button
            className="lp-nav-mobile-toggle"
            id="lp-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
