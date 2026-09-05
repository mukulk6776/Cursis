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
          setScrolled(window.scrollY > 60);
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
      <Link href="/" className="lp-nav-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">
          <path
            d="M 545 240 A 282 282 0 1 0 782 566"
            stroke="#18181b"
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
            fill="#ff5710"
          />
        </svg>
        <span>Cursis</span>
      </Link>

      <div className={`lp-nav-links ${mobileOpen ? 'lp-nav-open' : ''}`} id="lp-nav-links">
        <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')}>
          Features
        </a>
        <a href="#ordis" onClick={(e) => handleAnchorClick(e, '#ordis')}>
          Ordis AI
        </a>
        <a href="#team" onClick={(e) => handleAnchorClick(e, '#team')}>
          Teams
        </a>
        <a href="#creators" onClick={(e) => handleAnchorClick(e, '#creators')}>
          Creators
        </a>
        <a href="#modules" onClick={(e) => handleAnchorClick(e, '#modules')}>
          Modules
        </a>
        <a href="#agency" onClick={(e) => handleAnchorClick(e, '#agency')}>
          Agency
        </a>
      </div>

      <div className="lp-nav-actions">
        <Link href="/login" className="btn btn-ghost btn-sm">
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
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
