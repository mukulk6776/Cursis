'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
    <motion.nav
      ref={navRef as React.RefObject<HTMLElement>}
      className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}
      id="lp-nav"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="lp-nav-container">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Link href="/" className="lp-nav-logo" onClick={() => setMobileOpen(false)}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
              <svg viewBox="0 0 1024 1024" fill="none" width="32" height="32" role="img" aria-label="Cursis — Autonomous AI Workplace Logo" style={{ borderRadius: '9px' }}>
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
            </div>
            <span className="lp-nav-logo-text">Cursis</span>
          </Link>
        </motion.div>

        {/* Links drawer */}
        <div className={`lp-nav-links ${mobileOpen ? 'lp-nav-open' : ''}`} id="lp-nav-links">
          {['#features', '#ordis', '#team', '#creators', '#modules', '#agency'].map((href, i) => (
            <motion.a
              key={href}
              href={href}
              onClick={(e) => handleAnchorClick(e, href)}
              className="lp-nav-link"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {['Platform', 'Ordis Intelligence', 'Teams', 'Creators', 'Modules', 'Enterprise'][i]}
            </motion.a>
          ))}

          {/* Mobile drawer actions */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                className="lp-nav-mobile-actions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22 }}
              >
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                      Open Dashboard →
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--c-error)', fontWeight: 700 }}
                      onClick={() => { setMobileOpen(false); handleSignOut(); }}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop actions */}
        <motion.div
          className="lp-nav-actions"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
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

          <button
            className="lp-nav-mobile-toggle"
            id="lp-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            type="button"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.svg
                  key="close"
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="open"
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </div>
    </motion.nav>
  );
}
