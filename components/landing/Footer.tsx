import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">
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
                fill="#ff5710"
              />
            </svg>
            <span>Cursis</span>
          </div>
          <p className="lp-footer-tagline">
            Your free AI-powered workspace. Built by creators, for creators. Powered by Ordis.
          </p>
        </div>

        <div>
          <div className="lp-footer-col-title">Product</div>
          <a href="#features" className="lp-footer-link">
            Features
          </a>
          <a href="#ordis" className="lp-footer-link">
            Ordis AI
          </a>
          <a href="#modules" className="lp-footer-link">
            Modules
          </a>
          <a href="#free" className="lp-footer-link">
            Pricing
          </a>
          <a href="#how-it-works" className="lp-footer-link">
            How It Works
          </a>
        </div>

        <div>
          <div className="lp-footer-col-title">Use Cases</div>
          <a href="#team" className="lp-footer-link">
            Teams
          </a>
          <a href="#creators" className="lp-footer-link">
            Creators
          </a>
          <Link href="/signup" className="lp-footer-link">
            Startups
          </Link>
          <a href="#agency" className="lp-footer-link">
            Agencies
          </a>
          <Link href="/signup" className="lp-footer-link">
            Freelancers
          </Link>
        </div>

        <div>
          <div className="lp-footer-col-title">Company</div>
          <a href="#agency" className="lp-footer-link">
            Agency Services
          </a>
          <Link href="/dashboard" className="lp-footer-link">
            Dashboard
          </Link>
          <a href="mailto:contact@cursis.io" className="lp-footer-link">
            Contact Us
          </a>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <span>© 2026 Cursis. All rights reserved.</span>
        <span>Built with purpose.</span>
      </div>
    </footer>
  );
}
