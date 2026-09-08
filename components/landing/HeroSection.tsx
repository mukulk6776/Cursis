'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'meetings'>('tasks');
  const [orchestratedTasks, setOrchestratedTasks] = useState([
    { id: 1, title: 'Finalize brand design system', priority: 'High', status: 'In Progress', assignee: 'Mukul K.' },
    { id: 2, title: 'Review Q3 client deliverables', priority: 'Urgent', status: 'Pending', assignee: 'Sarah T.' },
    { id: 3, title: 'Prep team sprint retrospective', priority: 'Medium', status: 'Done', assignee: 'Alex R.' },
  ]);
  const [ordisActionApplied, setOrdisActionApplied] = useState(false);

  const handleApplyOrdisAction = () => {
    setOrdisActionApplied(true);
    setOrchestratedTasks((prev) =>
      prev.map((t) => (t.id === 2 ? { ...t, status: 'In Progress', priority: 'High' } : t))
    );
  };

  const handleScrollToOrdis = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.querySelector('#ordis');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="lp-section lp-hero" id="hero">
      <div className="lp-hero-header">
        <div className="lp-badge-clean">
          <span>Enterprise Operations Platform</span>
          <span className="lp-badge-dot" />
          <span className="lp-badge-accent">Ordis Intelligence Engine</span>
        </div>

        <h1 className="lp-hero-title">
          Enterprise Operations.<br />
          <span className="lp-highlight">Unified by Intelligence.</span><br />
          Engineered for Scale.
        </h1>

        <p className="lp-hero-text">
          Cursis consolidates mission-critical initiatives, cross-functional team execution, 
          and operational telemetry into a singular high-performance environment — driven by <strong>Ordis</strong> autonomous workspace intelligence.
        </p>

        <div className="lp-hero-ctas">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Deploy Workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <a href="#ordis" onClick={handleScrollToOrdis} className="btn btn-secondary btn-lg">
            Explore Ordis Intelligence
          </a>
        </div>

        <div className="lp-hero-benefits">
          <span className="lp-benefit-item">✓ SOC-2 Type II Certified</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">✓ 99.99% Guaranteed SLA Uptime</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">✓ End-to-End Enterprise Encryption</span>
        </div>
      </div>

      {/* Interactive Product Preview Frame */}
      <div className="lp-hero-mockup">
        {/* Mockup Window Chrome */}
        <div className="lp-mockup-topbar">
          <div className="lp-mockup-topbar-left">
            <span className="lp-mockup-dot red" />
            <span className="lp-mockup-dot yellow" />
            <span className="lp-mockup-dot green" />
            <span className="lp-mockup-tag">workspace / production</span>
          </div>
          <div className="lp-mockup-url">
            <span>cursis.app/workspace</span>
          </div>
          <div className="lp-mockup-status">
            <span className="lp-status-live-dot" />
            <span>Connected</span>
          </div>
        </div>

        {/* Mockup Inner Body */}
        <div className="lp-mockup-body">
          {/* Mockup Sidebar */}
          <div className="lp-mockup-sidebar">
            <div className="lp-mockup-brand">
              <span className="lp-mockup-brand-badge">C</span>
              <span className="lp-mockup-brand-name">Acme Studio</span>
            </div>

            <div className="lp-mockup-nav">
              <div
                className={`lp-mockup-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span>Tasks &amp; Projects</span>
              </div>
              <div
                className={`lp-mockup-nav-item ${activeTab === 'team' ? 'active' : ''}`}
                onClick={() => setActiveTab('team')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span>Team (6)</span>
              </div>
              <div
                className={`lp-mockup-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
                onClick={() => setActiveTab('meetings')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Meetings &amp; Calendar</span>
              </div>
            </div>

            <div className="lp-mockup-sidebar-ordis-badge">
              <div className="lp-ordis-mini-header">
                <span className="lp-ordis-chip">ORDIS</span>
                <span className="lp-pulse-ring" />
              </div>
              <p className="lp-ordis-mini-text">Scanning workspace for bottlenecks &amp; deadlines</p>
            </div>
          </div>

          {/* Mockup Main View */}
          <div className="lp-mockup-main">
            {activeTab === 'tasks' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">Active Sprint Overview</h3>
                    <span className="lp-mockup-view-subtitle">3 of 8 tasks remaining • 1 deadline tomorrow</span>
                  </div>
                  <span className="badge badge-brand">78% ON TRACK</span>
                </div>

                {/* Task Cards */}
                <div className="lp-mockup-task-list">
                  {orchestratedTasks.map((t) => (
                    <div key={t.id} className="lp-mockup-task-row">
                      <div className="lp-mockup-task-check">
                        <input
                          type="checkbox"
                          checked={t.status === 'Done'}
                          onChange={() => {
                            setOrchestratedTasks((prev) =>
                              prev.map((item) =>
                                item.id === t.id
                                  ? { ...item, status: item.status === 'Done' ? 'In Progress' : 'Done' }
                                  : item
                              )
                            );
                          }}
                        />
                      </div>
                      <div className="lp-mockup-task-details">
                        <span className={`lp-mockup-task-name ${t.status === 'Done' ? 'completed' : ''}`}>
                          {t.title}
                        </span>
                        <div className="lp-mockup-task-meta">
                          <span className="lp-mockup-assignee">{t.assignee}</span>
                          <span className={`badge badge-sm ${t.priority === 'Urgent' ? 'badge-error' : t.priority === 'High' ? 'badge-warning' : 'badge-neutral'}`}>
                            {t.priority}
                          </span>
                          <span className="badge badge-sm badge-neutral">{t.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">Team Bandwidth &amp; Workload</h3>
                    <span className="lp-mockup-view-subtitle">4 online • 2 offline • 0 overloaded</span>
                  </div>
                </div>
                <div className="lp-mockup-team-grid">
                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#0f4cff', color: '#fff' }}>MK</div>
                    <div>
                      <div className="lp-member-name">Mukul Kumar</div>
                      <div className="lp-member-role">Lead Product Engineer • 3 tasks</div>
                    </div>
                    <span className="lp-status-online">Online</span>
                  </div>
                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#ccff00', color: '#000' }}>ST</div>
                    <div>
                      <div className="lp-member-name">Sarah Taylor</div>
                      <div className="lp-member-role">Brand Designer • 2 tasks</div>
                    </div>
                    <span className="lp-status-online">Online</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">Upcoming Schedule</h3>
                    <span className="lp-mockup-view-subtitle">2 meetings scheduled for today</span>
                  </div>
                </div>
                <div className="lp-mockup-meeting-card">
                  <div className="lp-meeting-time">2:00 PM (30m)</div>
                  <div className="lp-meeting-info">
                    <strong>Weekly Design Sync &amp; Retrospective</strong>
                    <span>Attendees: Mukul K., Sarah T., Alex R. • Agenda generated by Ordis</span>
                  </div>
                  <span className="badge badge-brand">Google Meet</span>
                </div>
              </div>
            )}
          </div>

          {/* Mockup Right Panel: Real Ordis AI Action */}
          <div className="lp-mockup-ordis-panel">
            <div className="lp-ordis-panel-header">
              <div className="lp-ordis-icon-box">O</div>
              <div className="lp-ordis-header-text">
                <span className="lp-ordis-title">Ordis Workspace Copilot</span>
                <span className="lp-ordis-subtitle">Live Workspace Action</span>
              </div>
            </div>

            <div className="lp-ordis-action-box">
              <div className="lp-ordis-tag">PROACTIVE NOTICE</div>
              <p className="lp-ordis-msg">
                <strong>"Review Q3 client deliverables"</strong> is marked urgent and has an upcoming deadline tomorrow.
              </p>

              {!ordisActionApplied ? (
                <div className="lp-ordis-action-footer">
                  <span className="lp-ordis-suggestion">Recommended Action:</span>
                  <button className="btn btn-brand btn-sm" onClick={handleApplyOrdisAction}>
                    ⚡ Rebalance &amp; Start Task
                  </button>
                </div>
              ) : (
                <div className="lp-ordis-success-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b341" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Action executed: Task updated &amp; priority aligned.</span>
                </div>
              )}
            </div>

            <div className="lp-ordis-quick-prompts">
              <span className="lp-prompts-label">Try asking Ordis:</span>
              <div
                className="lp-prompt-pill"
                onClick={() => setActiveTab('team')}
                role="button"
                tabIndex={0}
              >
                "What is my team working on?"
              </div>
              <div
                className="lp-prompt-pill"
                onClick={() => setActiveTab('tasks')}
                role="button"
                tabIndex={0}
              >
                "Show all upcoming deadlines"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof & Creator Trust Banner */}
      <div className="lp-social-proof-bar lp-reveal">
        <div className="lp-social-proof-header">
          <div className="lp-social-proof-title">
            <span className="lp-stat-pulse" />
            <span>2,100+ users working with Reverie Hacks, Content Service Media and LAKAI</span>
          </div>
          <div className="lp-social-proof-stats">
            <div className="lp-stat-badge">
              <span className="lp-stat-pulse" />
              <span>2,100+ Active Creators</span>
            </div>
            <div className="lp-stat-badge">
              <span>★ 4.9/5 Rating</span>
            </div>
            <div className="lp-stat-badge">
              <span>⚡ 140k+ Tasks Shipped</span>
            </div>
          </div>
        </div>

        <div className="lp-partners-marquee">
          {/* Partner 1: Reverie Hacks */}
          <div className="lp-partner-card">
            <div className="lp-partner-icon-box" style={{ background: '#0f4cff' }}>RH</div>
            <div className="lp-partner-info">
              <span className="lp-partner-name">Reverie Hacks</span>
              <span className="lp-partner-sub">Creative Tech &amp; Hackathon Collective</span>
            </div>
          </div>

          {/* Partner 2: Content Service Media */}
          <div className="lp-partner-card">
            <div className="lp-partner-icon-box" style={{ background: '#ff5710' }}>CSM</div>
            <div className="lp-partner-info">
              <span className="lp-partner-name">Content Service Media</span>
              <span className="lp-partner-sub">High-Volume Production &amp; Syndication</span>
            </div>
          </div>

          {/* Partner 3: LAKAI */}
          <div className="lp-partner-card">
            <div className="lp-partner-icon-box" style={{ background: '#10b981' }}>LK</div>
            <div className="lp-partner-info">
              <span className="lp-partner-name">LAKAI</span>
              <span className="lp-partner-sub">Creator Brand &amp; Digital Studio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

