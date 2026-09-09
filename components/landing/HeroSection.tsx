'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type TabKey = 'agent' | 'sprint' | 'team' | 'pipeline';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('agent');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Finalize brand design system tokens', priority: 'High', status: 'In Progress', assignee: 'Mukul K.', sla: 'Today 5:00 PM' },
    { id: 2, title: 'Security review for OAuth session guard', priority: 'Urgent', status: 'Pending', assignee: 'Sarah T.', sla: 'Tomorrow' },
    { id: 3, title: 'Synthesize Q3 enterprise deliverables', priority: 'Medium', status: 'Done', assignee: 'Alex R.', sla: 'Completed' },
  ]);
  const [ordisActionExecuted, setOrdisActionExecuted] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const prompts = [
    {
      label: 'Scan Workload Bottlenecks',
      prompt: 'Ordis, scan all engineering work streams and highlight delivery risks for tomorrow.',
      result: 'Identified 1 high-priority blocker: "Security review for OAuth session guard" assigned to Sarah T. (currently at 88% capacity). Recommended: Rebalance deliverable to Mukul K.',
    },
    {
      label: 'Synthesize Executive Standup',
      prompt: 'Generate autonomous standup briefing for the executive committee.',
      result: 'Sprint Velocity: 84% on target. 24 deliverables closed. Zero upstream deadlocks. All SLA requirements satisfied across active enterprise tenants.',
    },
    {
      label: 'Balance Engineering Load',
      prompt: 'Optimize team bandwidth and equalize sprint story points across product squads.',
      result: 'Rebalanced 3 deliverables. Team capacity normalized to 72% average load. Burnout risk downgraded to zero.',
    },
  ];

  const handleExecuteAction = () => {
    setOrdisActionExecuted(true);
    setTasks((prev) =>
      prev.map((t) => (t.id === 2 ? { ...t, status: 'In Progress', assignee: 'Mukul K. (Rebalanced)' } : t))
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
      {/* Hero Header */}
      <div className="lp-hero-header">
        <div className="tano-hero-badge">
          <span className="tano-hero-badge-pill">NEW</span>
          <span className="tano-hero-badge-text">Ordis Autonomous Intelligence</span>
          <span className="tano-hero-badge-arrow">→</span>
        </div>

        <h1 className="lp-hero-title">
          Enterprise Operations.<br />
          <span className="tano-hero-marker">Unified by Intelligence.</span><br />
          Engineered for Scale.
        </h1>

        <p className="lp-hero-text">
          Cursis consolidates mission-critical initiatives, cross-functional execution, 
          and team telemetry into a singular high-performance environment — orchestrated by <strong>Ordis</strong> autonomous workspace intelligence.
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
            Explore Ordis Engine
          </a>
        </div>

        <div className="lp-hero-benefits">
          <span className="lp-benefit-item">SOC-2 Type II Certified</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">99.99% Guaranteed SLA Uptime</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">Deterministic Zero-Bypass Security</span>
        </div>
      </div>

      {/* Interactive Centerpiece Agent Console */}
      <div className="lp-hero-mockup">
        {/* Tano Signature Rotated Washi Tape */}
        <div className="tano-washi-tape" style={{ top: -12, right: 38, transform: 'rotate(2.5deg)' }} aria-hidden="true" />

        {/* Mockup Window Chrome */}
        <div className="lp-mockup-topbar">
          <div className="lp-mockup-topbar-left">
            <span className="lp-mockup-dot red" />
            <span className="lp-mockup-dot yellow" />
            <span className="lp-mockup-dot green" />
            <span className="lp-mockup-tag">cursis / production workspace</span>
          </div>

          <div className="lp-mockup-url">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>cursis.app/workspace/operations</span>
          </div>

          <div className="lp-mockup-status">
            <span className="lp-status-live-dot" />
            <span>Active Telemetry • 12ms</span>
          </div>
        </div>

        {/* Mockup Window Navigation Subheader */}
        <div className="lp-mockup-subnav">
          <div className="lp-mockup-tabs">
            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'agent' ? 'active' : ''}`}
              onClick={() => setActiveTab('agent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>Autonomous Ordis Copilot</span>
              <span className="lp-tab-pulse-badge">LIVE</span>
            </button>

            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'sprint' ? 'active' : ''}`}
              onClick={() => setActiveTab('sprint')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span>Sprint Telemetry &amp; SLA</span>
            </button>

            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Team Bandwidth (4)</span>
            </button>

            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>5-Stage Deliverables Pipeline</span>
            </button>
          </div>
        </div>

        {/* Mockup Body Content */}
        <div className="lp-mockup-body">
          {/* Main Workspace Stage */}
          <div className="lp-mockup-main">
            {/* Tab 1: Autonomous Ordis Copilot */}
            {activeTab === 'agent' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">Active Initiative Orchestration</h3>
                    <span className="lp-mockup-view-subtitle">3 critical deliverables • Ordis continuous telemetry active</span>
                  </div>
                  <span className="badge badge-brand">84% SPRINT ADHERENCE</span>
                </div>

                {/* Interactive Task Cards */}
                <div className="lp-mockup-task-list">
                  {tasks.map((t) => (
                    <div key={t.id} className="lp-mockup-task-row">
                      <div className="lp-mockup-task-check">
                        <input
                          type="checkbox"
                          checked={t.status === 'Done'}
                          onChange={() => {
                            setTasks((prev) =>
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
                          <span className="lp-mockup-assignee">
                            <span className="lp-avatar-dot" />
                            {t.assignee}
                          </span>
                          <span className={`badge badge-sm ${t.priority === 'Urgent' ? 'badge-error' : t.priority === 'High' ? 'badge-warning' : 'badge-neutral'}`}>
                            {t.priority}
                          </span>
                          <span className="lp-sla-tag">SLA: {t.sla}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Agent Interactive Prompts */}
                <div className="lp-mockup-prompts-bar">
                  <span className="lp-prompts-title">Simulate Natural Language Commands:</span>
                  <div className="lp-prompts-chips">
                    {prompts.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`lp-prompt-chip ${activePromptIndex === idx ? 'active' : ''}`}
                        onClick={() => setActivePromptIndex(idx)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="lp-prompt-active-card">
                    <div className="lp-prompt-query">
                      <span className="lp-prompt-sender">Operator:</span>
                      <span>"{prompts[activePromptIndex].prompt}"</span>
                    </div>
                    <div className="lp-prompt-reply">
                      <span className="lp-prompt-ordis-tag">Ordis Intelligence:</span>
                      <p>{prompts[activePromptIndex].result}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Sprint Telemetry */}
            {activeTab === 'sprint' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">Sprint Telemetry &amp; Velocity Matrix</h3>
                    <span className="lp-mockup-view-subtitle">Sprint 42 • Target End: Friday 6:00 PM</span>
                  </div>
                  <span className="badge badge-brand">HEALTHY (99.4% SLA)</span>
                </div>

                <div className="lp-sprint-grid">
                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Completed Story Points</span>
                    <span className="lp-metric-value">148 / 176</span>
                    <div className="lp-metric-progress">
                      <div className="lp-metric-bar" style={{ width: '84%' }} />
                    </div>
                    <span className="lp-metric-sub">84% completion rate</span>
                  </div>

                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Cycle Time Average</span>
                    <span className="lp-metric-value">1.8 Days</span>
                    <span className="lp-metric-trend positive">-34% vs prior month</span>
                    <span className="lp-metric-sub">Zero staging latency</span>
                  </div>

                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Critical Path Risks</span>
                    <span className="lp-metric-value">0 Blocked</span>
                    <span className="lp-metric-trend positive">Fully Clear</span>
                    <span className="lp-metric-sub">Automated contract checks pass</span>
                  </div>
                </div>

                <div className="lp-sprint-chart-mock">
                  <div className="lp-chart-header">
                    <span>Sprint Burnup Trajectory</span>
                    <span className="badge badge-sm badge-neutral">Forecast: Ahead by 1.2 Days</span>
                  </div>
                  <div className="lp-chart-bars">
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '35%' }} /><span>Mon</span></div>
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '52%' }} /><span>Tue</span></div>
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '68%' }} /><span>Wed</span></div>
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '84%' }} /><span>Thu (Today)</span></div>
                    <div className="lp-chart-col forecast"><div className="lp-bar-fill" style={{ height: '100%' }} /><span>Fri (Est)</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Team Bandwidth */}
            {activeTab === 'team' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">Team Workload &amp; Live Availability</h3>
                    <span className="lp-mockup-view-subtitle">4 team members active • Capacity balanced</span>
                  </div>
                  <span className="badge badge-brand">OPTIMAL LOAD</span>
                </div>

                <div className="lp-mockup-team-grid">
                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#1A1612', color: '#ffffff' }}>MK</div>
                    <div className="lp-member-info">
                      <div className="lp-member-name">Mukul Kumar</div>
                      <div className="lp-member-role">Lead Operations Engineer • 3 tasks</div>
                      <div className="lp-member-capacity">
                        <div className="lp-capacity-fill" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <span className="lp-status-online">Online</span>
                  </div>

                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#2965ff', color: '#ffffff' }}>ST</div>
                    <div className="lp-member-info">
                      <div className="lp-member-name">Sarah Taylor</div>
                      <div className="lp-member-role">Systems Architect • 2 tasks</div>
                      <div className="lp-member-capacity">
                        <div className="lp-capacity-fill" style={{ width: '50%' }} />
                      </div>
                    </div>
                    <span className="lp-status-online">Online</span>
                  </div>

                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#10b981', color: '#ffffff' }}>AR</div>
                    <div className="lp-member-info">
                      <div className="lp-member-name">Alex Rivera</div>
                      <div className="lp-member-role">Security Lead • 1 task</div>
                      <div className="lp-member-capacity">
                        <div className="lp-capacity-fill" style={{ width: '35%' }} />
                      </div>
                    </div>
                    <span className="lp-status-online">Online</span>
                  </div>

                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#8b5cf6', color: '#ffffff' }}>EL</div>
                    <div className="lp-member-info">
                      <div className="lp-member-name">Elena Lin</div>
                      <div className="lp-member-role">Creator Pipeline Mgr • 4 assets</div>
                      <div className="lp-member-capacity">
                        <div className="lp-capacity-fill" style={{ width: '70%' }} />
                      </div>
                    </div>
                    <span className="lp-status-online">Online</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Pipeline */}
            {activeTab === 'pipeline' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h3 className="lp-mockup-view-title">5-Stage Media &amp; Creator Pipeline</h3>
                    <span className="lp-mockup-view-subtitle">End-to-end production tracking from script to distribution</span>
                  </div>
                  <span className="badge badge-brand">5 ACTIVE RELEASES</span>
                </div>

                <div className="lp-pipeline-columns">
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">1. Ideation &amp; Script</span>
                    <div className="lp-pipeline-card">
                      <strong>Enterprise Keynote Deck</strong>
                      <span>2 revisions pending</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">2. Production</span>
                    <div className="lp-pipeline-card">
                      <strong>Brand Film Cut v4</strong>
                      <span>Rendering 4K masters</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">3. Review &amp; QA</span>
                    <div className="lp-pipeline-card urgent">
                      <strong>SOC-2 Compliance Video</strong>
                      <span>Stakeholder approval needed</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">4. Scheduled</span>
                    <div className="lp-pipeline-card">
                      <strong>Product Launch Reel</strong>
                      <span>Release: Tomorrow 9 AM</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">5. Delivered</span>
                    <div className="lp-pipeline-card done">
                      <strong>Onboarding Playbook</strong>
                      <span>Live in Enterprise Hub</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mockup Right Side Panel: Ordis Live Command Center */}
          <div className="lp-mockup-ordis-panel">
            <div className="lp-ordis-panel-header">
              <div className="lp-ordis-icon-box">O</div>
              <div className="lp-ordis-header-text">
                <span className="lp-ordis-title">Ordis Workspace Copilot</span>
                <span className="lp-ordis-subtitle">Live Autonomous Action Engine</span>
              </div>
            </div>

            <div className="lp-ordis-action-box">
              <div className="lp-ordis-tag">PROACTIVE NOTICE</div>
              <p className="lp-ordis-msg">
                <strong>"Security review for OAuth session guard"</strong> is flagged for tomorrow's milestone. Sarah T. has 2 competing commitments.
              </p>

              {!ordisActionExecuted ? (
                <div className="lp-ordis-action-footer">
                  <span className="lp-ordis-suggestion">Recommended Action:</span>
                  <button className="btn btn-brand btn-sm" onClick={handleExecuteAction}>
                    Rebalance to Mukul K. →
                  </button>
                </div>
              ) : (
                <div className="lp-ordis-success-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Action executed: Workload rebalanced and SLA preserved.</span>
                </div>
              )}
            </div>

            <div className="lp-ordis-stats-widget">
              <span className="lp-widget-title">Ordis Continuous Telemetry</span>
              <div className="lp-widget-row">
                <span>Autonomous Checks</span>
                <strong>4,820 / hr</strong>
              </div>
              <div className="lp-widget-row">
                <span>Deadlock Preventions</span>
                <strong>14 this sprint</strong>
              </div>
              <div className="lp-widget-row">
                <span>System Latency</span>
                <strong>12ms globally</strong>
              </div>
            </div>

            <div className="lp-ordis-quick-prompts">
              <span className="lp-prompts-label">Quick Switchers:</span>
              <div
                className="lp-prompt-pill"
                onClick={() => setActiveTab('team')}
                role="button"
                tabIndex={0}
              >
                Inspect Live Team Bandwidth
              </div>
              <div
                className="lp-prompt-pill"
                onClick={() => setActiveTab('sprint')}
                role="button"
                tabIndex={0}
              >
                View Sprint Velocity Dial
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
