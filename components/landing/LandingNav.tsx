'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/site';


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
    // Preserve modified clicks (Ctrl, Cmd, Shift, Alt, middle-click)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (!e.currentTarget.getAttribute('href')?.includes('#')) { setMobileOpen(false); return; }
    const cleanSelector = targetId.startsWith('/') ? targetId.slice(1) : targetId;
    const element = document.querySelector(cleanSelector);
    if (element) {
      e.preventDefault();
      setMobileOpen(false);
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    } else {
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    const { signOutUser } = await import('@/lib/auth/firebase');
    await signOutUser('/?logout=true');
  };

  return (
    <nav
      ref={navRef as React.RefObject<HTMLElement>}
      className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}
      id="lp-nav"
    >
      <div className="lp-nav-container">
        <div
        >
          <Link prefetch={false} href="/" className="lp-nav-logo" onClick={() => setMobileOpen(false)}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
              <svg viewBox="0 0 1024 1024" fill="none" width="32" height="32" role="img" aria-label="Cursis logo" style={{ borderRadius: '9px' }}>
                <defs>
                  <clipPath id="rounded-logo-nav">
                    <rect x="0" y="0" width="1024" height="1024" rx="180" ry="180" />
                  </clipPath>
                </defs>
                <g clipPath="url(#rounded-logo-nav)">
                  <rect x="0" y="0" width="1024" height="1024" fill="white" />
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
                </g>
              </svg>
            </div>
            <span className="lp-nav-logo-text">{BRAND_NAME}</span>
          </Link>
        </div>

        {/* Links drawer */}
        <div className={`lp-nav-links ${mobileOpen ? 'lp-nav-open' : ''}`} id="lp-nav-links">
          {[
            { href: '/#features', selector: '#features', label: 'Features' },
            { href: '/pricing', selector: '#main-content', label: 'Pricing' },
            { href: '/faq', selector: '#main-content', label: 'FAQ' },
            { href: '/contact', selector: '#main-content', label: 'Contact' },
            { href: '/blog', selector: '#main-content', label: 'Blog' },
            { href: '/compare', selector: '#main-content', label: 'Compare' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.selector)}
              className="lp-nav-link"
            >
              {item.label}
            </a>
          ))}

          {/* Mobile drawer actions */}

            {mobileOpen && (
              <div
                className="lp-nav-mobile-actions"
              >
                {isAuthenticated ? (
                  <>
                    <Link prefetch={false} href="/dashboard" className="lp-nav-cta-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                      Open Workspace →
                    </Link>
                    <button
                      type="button"
                      className="lp-nav-btn-signout"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link prefetch={false} href="/login" className="btn btn-secondary btn-sm" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                    <Link prefetch={false} href="/signup" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            )}

        </div>

        {/* Desktop actions */}
        <div
          className="lp-nav-actions"
        >
          {isAuthenticated ? (
            <>
              <Link prefetch={false}
                href="/dashboard"
                className="lp-nav-cta-primary lp-hide-mobile"
                title={userEmail ? `Signed in as ${userEmail}` : 'Open Workspace'}
              >
                Open Workspace →
              </Link>
              <button
                type="button"
                className="lp-nav-btn-signout lp-hide-mobile"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link prefetch={false} href="/login" className="lp-nav-cta-secondary lp-hide-mobile">
                Sign In
              </Link>
              <Link prefetch={false} href="/signup" className="lp-nav-cta-primary lp-hide-mobile">
                Get Started
              </Link>
            </>
          )}

          <button
            className="lp-nav-mobile-toggle"
            id="lp-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation" aria-expanded={mobileOpen} aria-controls="lp-nav-links"
            type="button"
          >

              {mobileOpen ? (
                <svg
                  key="close"
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  key="open"
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
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
