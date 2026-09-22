import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" width="28" height="28" role="img" aria-label="Cursis Logo">
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
                fill="#FF5500"
              />
            </svg>
            <span className="lp-footer-logo-text">Cursis</span>
          </div>
          <p className="lp-footer-tagline">
            The unified enterprise operations platform for high-velocity teams. Engineered with deterministic security and Ordis intelligence.
          </p>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>
              SOC-2 Type II
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>
              ISO 27001
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>
              HIPAA & GDPR Ready
            </span>
          </div>
        </div>

        <div className="lp-footer-links-group">
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Platform</div>
            <a href="#features" className="lp-footer-link">Core Architecture</a>
            <a href="#ordis" className="lp-footer-link">Ordis Intelligence</a>
            <a href="#problem" className="lp-footer-link">Stack Comparison</a>
            <Link href="/resources" className="lp-footer-link">Resources &amp; Guides</Link>
            <Link href="/compare" className="lp-footer-link">Cursis vs Competitors</Link>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Workspace</div>
            <Link href="/dashboard" className="lp-footer-link">Enterprise Cockpit</Link>
            <Link href="/login" className="lp-footer-link">Workspace Sign In</Link>
            <Link href="/signup" className="lp-footer-link">Deploy Workspace</Link>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Legal &amp; Compliance</div>
            <Link href="/privacy" className="lp-footer-link">Privacy Policy</Link>
            <Link href="/terms" className="lp-footer-link">Terms of Service</Link>
            <Link href="/refund-policy" className="lp-footer-link">Refund Policy</Link>
            <Link href="/cookie-policy" className="lp-footer-link">Cookie Policy</Link>
            <Link href="/data-deletion" className="lp-footer-link">Data Deletion</Link>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Contact & Support</div>
            <a href="mailto:hello@cursis.app" className="lp-footer-link">hello@cursis.app</a>
            <a href="mailto:support@cursis.app" className="lp-footer-link">Support Team</a>
            <a href="mailto:privacy@cursis.app" className="lp-footer-link">Data Protection</a>
            <a href="mailto:security@cursis.app" className="lp-footer-link">Security Team</a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>© 2026 Cursis Inc. All rights reserved.</span>
          <div style={{ fontSize: '11px', color: 'var(--c-gray-500)' }}>
            <strong>Cursis Inc.</strong> • Registered Business Entity<br />
            Address: Bengaluru, Karnataka, India<br />
            CIN: [Company Registration Number] • GST: [GST Number]<br />
            Email: <a href="mailto:legal@cursis.app" style={{ color: 'var(--c-gray-400)', textDecoration: 'underline' }}>legal@cursis.app</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
          <Link href="/privacy" className="lp-footer-link" style={{ textDecoration: 'underline' }}>Privacy</Link>
          <span style={{ color: 'var(--c-gray-500)' }}>•</span>
          <Link href="/terms" className="lp-footer-link" style={{ textDecoration: 'underline' }}>Terms</Link>
          <span style={{ color: 'var(--c-gray-500)' }}>•</span>
          <Link href="/cookie-policy" className="lp-footer-link" style={{ textDecoration: 'underline' }}>Cookies</Link>
          <span style={{ color: 'var(--c-gray-500)' }}>•</span>
          <Link href="/refund-policy" className="lp-footer-link" style={{ textDecoration: 'underline' }}>Refunds</Link>
          <span style={{ color: 'var(--c-gray-500)' }}>•</span>
          <Link href="/data-deletion" className="lp-footer-link" style={{ textDecoration: 'underline' }}>Data Rights</Link>
        </div>
      </div>
    </footer>
  );
}
