import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">
            <svg viewBox="0 0 1024 1024" fill="none" width="28" height="28" role="img" aria-label="Cursis Logo">
              <path
                d="M 545 240 A 282 282 0 1 0 782 566"
                stroke="#0A0A0A"
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
            <span className="lp-footer-logo-text">Cursis</span>
          </div>
          <p className="lp-footer-tagline">
            The modern workspace for high-velocity teams.
          </p>
          <div className="lp-footer-social">
            <a href="https://instagram.com/cursis.in" target="_blank" rel="noopener noreferrer" className="lp-footer-social-link" aria-label="Follow us on Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://x.com/cursis_" target="_blank" rel="noopener noreferrer" className="lp-footer-social-link" aria-label="Follow us on X">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="lp-footer-links-group">
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Platform</div>
            <a href="#features" className="lp-footer-link">Features</a>
            <a href="#connected" className="lp-footer-link">Workflow</a>
            <a href="#ordis" className="lp-footer-link">Ordis AI</a>
            <a href="#modules" className="lp-footer-link">Modules</a>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Workspace</div>
            <Link href="/dashboard" className="lp-footer-link">Dashboard</Link>
            <Link href="/login" className="lp-footer-link">Sign In</Link>
            <Link href="/signup" className="lp-footer-link">Get Started</Link>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Legal</div>
            <Link href="/privacy" className="lp-footer-link">Privacy Policy</Link>
            <Link href="/terms" className="lp-footer-link">Terms of Service</Link>
            <Link href="/cookie-policy" className="lp-footer-link">Cookie Policy</Link>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Contact</div>
            <a href="mailto:cursis.in@gmail.com" className="lp-footer-link">cursis.in@gmail.com</a>
            <a href="mailto:cursis.in@gmail.com" className="lp-footer-link">Support</a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <div>
          <span>© 2026 Cursis Inc. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
          <Link href="/privacy" className="lp-footer-link">Privacy</Link>
          <span style={{ color: 'var(--c-gray-400)' }}>•</span>
          <Link href="/terms" className="lp-footer-link">Terms</Link>
          <span style={{ color: 'var(--c-gray-400)' }}>•</span>
          <Link href="/cookie-policy" className="lp-footer-link">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
