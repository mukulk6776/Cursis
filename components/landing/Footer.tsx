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
            <a href="https://discord.gg/AnwFKSsA5e" target="_blank" rel="noopener noreferrer" className="lp-footer-social-link" aria-label="Join us on Discord">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
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
            <div className="lp-footer-col-title">Company</div>
            <Link href="/about" className="lp-footer-link">About Us</Link>
            <Link href="/social" className="lp-footer-link">Social Media</Link>
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
