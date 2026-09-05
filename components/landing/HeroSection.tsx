'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [visibleNotifs, setVisibleNotifs] = useState<number[]>([0]);

  // Demo cycling effect from landing.js
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightIndex((prev) => {
        const next = (prev + 1) % 6;
        if (next === 0) {
          setVisibleNotifs([0]);
        } else if (next === 3) {
          setVisibleNotifs([0, 1]);
        } else if (next === 4) {
          setVisibleNotifs([0, 1, 2]);
        }
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const handleScrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.querySelector('#features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="lp-section lp-hero" id="hero">
      <div className="lp-reveal lp-visible">
        <h1 className="lp-hero-title">
          One workspace.
          <br />
          <span className="lp-highlight">Everything connected.</span>
          <br />
          Free forever.
        </h1>
      </div>

      <p className="lp-hero-text lp-reveal lp-visible" style={{ transitionDelay: '100ms' }}>
        Cursis gives your team a complete workspace — projects, tasks, messages, docs, files, and
        an AI assistant called Ordis that watches everything and keeps work moving.
      </p>

      <div className="lp-hero-ctas lp-reveal lp-visible" style={{ transitionDelay: '200ms' }}>
        <Link href="/signup" className="btn btn-brand btn-lg">
          Start Free Workspace
        </Link>
        <a href="#features" onClick={handleScrollToFeatures} className="btn btn-secondary btn-lg">
          See How It Works
        </a>
      </div>

      <p className="lp-hero-note lp-reveal lp-visible" style={{ transitionDelay: '300ms' }}>
        No credit card. No trial. No subscription. Free.
      </p>

      {/* Dashboard Mockup Frame */}
      <div className="lp-hero-mockup lp-reveal-scale lp-visible" style={{ transitionDelay: '400ms' }}>
        {/* Browser Chrome Bar */}
        <div className="lp-mockup-topbar">
          <div className="lp-mockup-topbar-left">
            <div className="lp-mockup-topbar-dot red" />
            <div className="lp-mockup-topbar-dot yellow" />
            <div className="lp-mockup-topbar-dot green" />
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-tertiary)',
            }}
          >
            cursis.app/workspace
          </div>
          <div />
        </div>

        {/* Mockup Body */}
        <div className="lp-mockup-body">
          {/* Sidebar */}
          <div className="lp-mockup-sidebar">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
                padding: '4px 8px',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" width="20" height="20">
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
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>Cursis</span>
            </div>
            <div className="lp-mockup-sidebar-item active">Dashboard</div>
            <div className="lp-mockup-sidebar-item">Projects</div>
            <div className="lp-mockup-sidebar-item">Tasks</div>
            <div className="lp-mockup-sidebar-item">Messages</div>
            <div className="lp-mockup-sidebar-item">Team</div>
            <div className="lp-mockup-sidebar-item">Files</div>
            <div className="lp-mockup-sidebar-item">Calendar</div>
            <div className="lp-mockup-sidebar-item">Notes</div>
            <div className="lp-mockup-sidebar-item">Ordis AI</div>
          </div>

          {/* Main Workspace Area */}
          <div className="lp-mockup-main">
            {/* Stat Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div className={`lp-mockup-card ${highlightIndex === 0 ? 'lp-card-highlight' : ''}`} style={{ padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  Active Tasks
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900 }}>24</div>
              </div>
              <div className={`lp-mockup-card ${highlightIndex === 1 ? 'lp-card-highlight' : ''}`} style={{ padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  Projects
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900 }}>8</div>
              </div>
              <div className={`lp-mockup-card ${highlightIndex === 2 ? 'lp-card-highlight' : ''}`} style={{ padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  Team
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900 }}>12</div>
              </div>
            </div>

            {/* Tasks List */}
            <div className={`lp-mockup-card ${highlightIndex === 3 ? 'lp-card-highlight' : ''}`}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Today's Tasks
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--c-bg)', border: '1px solid var(--c-near-black)', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid var(--c-brand)', display: 'inline-flex', flexShrink: 0 }} />
                  Design homepage layout
                  <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'var(--c-warning)', color: '#fff', border: '1px solid var(--c-near-black)', fontWeight: 800, textTransform: 'uppercase' }}>
                    High
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--c-bg)', border: '1px solid var(--c-near-black)', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid var(--c-brand)', display: 'inline-flex', flexShrink: 0 }} />
                  Review team pull requests
                  <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'var(--c-accent)', color: 'var(--c-near-black)', border: '1px solid var(--c-near-black)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Medium
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--c-bg)', border: '1px solid var(--c-near-black)', fontSize: '11px', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '14px', background: 'var(--c-brand)', border: '2px solid var(--c-near-black)', display: 'inline-flex', flexShrink: 0 }} />
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>Prepare client proposal</span>
                  <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'var(--c-success)', color: '#fff', border: '1px solid var(--c-near-black)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Done
                  </span>
                </div>
              </div>
            </div>

            {/* Project Progress */}
            <div className={`lp-mockup-card ${highlightIndex === 4 ? 'lp-card-highlight' : ''}`}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Project: Website Redesign
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="progress" style={{ height: '10px', flex: 1 }}>
                  <div className="progress-fill blue" style={{ width: '72%' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 900 }}>72%</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Ordis AI */}
          <div className="lp-mockup-panel">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--c-near-black)',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--c-accent)',
                  border: '1px solid var(--c-near-black)',
                  fontSize: '10px',
                  fontWeight: 900,
                }}
              >
                O
              </span>
              <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Ordis AI</span>
              <span
                className="lp-pulse"
                style={{
                  marginLeft: 'auto',
                  width: '6px',
                  height: '6px',
                  background: 'var(--c-success)',
                  border: '1px solid var(--c-near-black)',
                }}
              />
            </div>

            {/* Notification 1 */}
            <div
              className="lp-ordis-notif"
              style={{
                opacity: visibleNotifs.includes(0) ? 1 : 0,
                transform: visibleNotifs.includes(0) ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                marginBottom: '6px',
                padding: '8px',
                borderRadius: 0,
              }}
            >
              <div className="lp-ordis-notif-icon" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                O
              </div>
              <div className="lp-ordis-notif-text" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>3 tasks</strong> due today.{' '}
                "Design homepage" is <strong style={{ color: 'var(--c-warning)' }}>high priority</strong>.
              </div>
            </div>

            {/* Notification 2 */}
            <div
              className="lp-ordis-notif"
              style={{
                opacity: visibleNotifs.includes(1) ? 1 : 0,
                transform: visibleNotifs.includes(1) ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
                marginBottom: '6px',
                padding: '8px',
                borderRadius: 0,
              }}
            >
              <div className="lp-ordis-notif-icon" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                O
              </div>
              <div className="lp-ordis-notif-text" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                Sarah hasn't updated "<strong style={{ color: 'var(--text-primary)' }}>Brand Assets</strong>" in 5 days.{' '}
                <span style={{ color: 'var(--c-brand)' }}>Nudge?</span>
              </div>
            </div>

            {/* Notification 3 */}
            <div
              className="lp-ordis-notif"
              style={{
                opacity: visibleNotifs.includes(2) ? 1 : 0,
                transform: visibleNotifs.includes(2) ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                marginBottom: '6px',
                padding: '8px',
                borderRadius: 0,
              }}
            >
              <div className="lp-ordis-notif-icon" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                O
              </div>
              <div className="lp-ordis-notif-text" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                Meeting with <strong style={{ color: 'var(--text-primary)' }}>Dev Team</strong> in 30 min.{' '}
                <span style={{ color: 'var(--c-brand)' }}>Agenda ready.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
