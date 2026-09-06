import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" width="28" height="28">
              <path
                d="M 545 240 A 282 282 0 1 0 782 566"
                stroke="#ffffff"
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
            <span className="lp-footer-logo-text">Cursis</span>
          </div>
          <p className="lp-footer-tagline">
            The clean, intelligent workspace for modern teams and creators. Powered by Ordis.
          </p>
        </div>

        <div className="lp-footer-links-group">
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Product</div>
            <a href="#features" className="lp-footer-link">Core Features</a>
            <a href="#ordis" className="lp-footer-link">Ordis AI Operations</a>
            <a href="#problem" className="lp-footer-link">Why Cursis</a>
            <a href="#pricing" className="lp-footer-link">100% Free Pricing</a>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Workspace</div>
            <Link href="/dashboard" className="lp-footer-link">Dashboard</Link>
            <Link href="/login" className="lp-footer-link">Sign In</Link>
            <Link href="/signup" className="lp-footer-link">Get Started Free</Link>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Connect</div>
            <a href="mailto:support@cursis.app" className="lp-footer-link">Contact Support</a>
            <span className="lp-footer-link" style={{ color: 'var(--c-gray-500)', cursor: 'default' }}>Version 2.0 (Stable)</span>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <span>© 2026 Cursis. All rights reserved.</span>
        <span>Built with intention &amp; craft.</span>
      </div>
    </footer>
  );
}

