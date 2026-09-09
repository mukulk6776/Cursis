'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOutUser } from '@/lib/auth/firebase';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Check if user is currently authenticated
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && (data.user || data.data?.user)) {
          setIsAuthenticated(true);
          const u = data.user || data.data?.user;
          setUserEmail(u.email || null);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const element = document.querySelector(targetId);
    if (element) {
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleSignOut = async () => {
    await signOutUser('/?logout=true');
  };

  return (
    <nav ref={navRef} className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`} id="lp-nav">
      <div className="lp-nav-container">
        <Link href="/" className="lp-nav-logo" onClick={() => setMobileOpen(false)}>
          <svg viewBox="0 0 1024 1024" fill="none" width="32" height="32">
            <path
              d="M 545 240 A 282 282 0 1 0 782 566"
              stroke="#1A1612"
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
              fill="#FF5500"
            />
          </svg>
          <span className="lp-nav-logo-text">Cursis</span>
        </Link>

        {/* Links drawer: on desktop it stays in the horizontal capsule; on mobile it opens as a popup */}
        <div className={`lp-nav-links ${mobileOpen ? 'lp-nav-open' : ''}`} id="lp-nav-links">
          <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className="lp-nav-link">
            Platform
          </a>
          <a href="#ordis" onClick={(e) => handleAnchorClick(e, '#ordis')} className="lp-nav-link">
            Ordis Intelligence
          </a>
          <a href="#team" onClick={(e) => handleAnchorClick(e, '#team')} className="lp-nav-link">
            Teams
          </a>
          <a href="#creators" onClick={(e) => handleAnchorClick(e, '#creators')} className="lp-nav-link">
            Creators
          </a>
          <a href="#modules" onClick={(e) => handleAnchorClick(e, '#modules')} className="lp-nav-link">
            Modules
          </a>
          <a href="#agency" onClick={(e) => handleAnchorClick(e, '#agency')} className="lp-nav-link">
            Enterprise
          </a>

          {/* Mobile drawer actions: strictly hidden on desktop via CSS */}
          <div className="lp-nav-mobile-actions">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                  Open Dashboard →
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--c-error)', fontWeight: 700 }}
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary btn-sm" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                  Deploy Workspace
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Desktop actions: always visible on desktop, hidden on mobile */}
        <div className="lp-nav-actions">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="btn btn-primary btn-sm lp-hide-mobile"
                style={{ fontWeight: 800 }}
                title={userEmail ? `Signed in as ${userEmail}` : 'Open Dashboard'}
              >
                Open Dashboard →
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm lp-hide-mobile"
                style={{ color: 'var(--c-error)', fontWeight: 700 }}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm lp-hide-mobile">
                Sign In
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm lp-hide-mobile">
                Deploy Workspace
              </Link>
            </>
          )}

          {/* Hamburger toggle button: strictly hidden on desktop, visible on mobile */}
          <button
            className="lp-nav-mobile-toggle"
            id="lp-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            type="button"
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
