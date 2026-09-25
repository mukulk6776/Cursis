'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { animeStaggerIn } from '@/lib/animations';

type TabKey = 'agent' | 'sprint' | 'team' | 'pipeline';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('agent');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Finalize design system tokens', priority: 'High', status: 'In Progress', assignee: 'Mukul K.', sla: 'Today 5:00 PM' },
    { id: 2, title: 'Security review for OAuth session guard', priority: 'Urgent', status: 'Pending', assignee: 'Sarah T.', sla: 'Tomorrow' },
    { id: 3, title: 'Review Q3 sprint deliverables', priority: 'Medium', status: 'Done', assignee: 'Alex R.', sla: 'Completed' },
  ]);
  const [ordisActionExecuted, setOrdisActionExecuted] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const prompts = [
    {
      label: 'Check Blockers',
      prompt: 'Ordis, what are the key delivery risks for tomorrow?',
      result: '1 blocker found: "Security review for OAuth session guard" assigned to Sarah T. (at 88% capacity). Recommended: Reassign to Mukul K.',
    },
    {
      label: 'Sprint Summary',
      prompt: 'Summarize sprint progress and current status.',
      result: 'Sprint progress: 84% on track. 24 tasks completed this week. All milestone deadlines healthy.',
    },
    {
      label: 'Balance Workload',
      prompt: 'Balance team workload across active squads.',
      result: 'Rebalanced 2 tasks. Team load normalized to 68%. No members overloaded.',
    },
  ];

  const handleExecuteAction = () => {
    setOrdisActionExecuted(true);
    setTasks((prev) =>
      prev.map((t) => (t.id === 2 ? { ...t, status: 'In Progress', assignee: 'Mukul K. (Rebalanced)' } : t))
    );
  };

  // Anime.js stagger for task rows in the mockup after mount
  const mockupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      animeStaggerIn('.lp-mockup-task-row');
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollToOrdis = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.querySelector('#ordis');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Stagger variants for hero text lines
  const container = {
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };
  const line = {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeInOut' as const } },
  };

  return (
    <section className="lp-section lp-hero" id="hero">
      {/* Hero Header */}
      <motion.div
        className="lp-hero-header"
        variants={container}
        initial="initial"
        animate="animate"
      >
        <motion.div className="tano-hero-badge" variants={line}>
          <span className="tano-hero-badge-pill">NEW</span>
          <span className="tano-hero-badge-text">Ordis AI 4.0 is live</span>
          <span className="tano-hero-badge-arrow">→</span>
        </motion.div>

        <motion.h1 className="lp-hero-title" variants={line}>
          The AI workspace<br />
          <span className="tano-hero-marker">for modern teams.</span>
        </motion.h1>

        <motion.p className="lp-hero-text" variants={line}>
          Plan sprints, manage tasks, and keep everyone aligned in real time. Powered by built-in intelligence.
        </motion.p>

        <motion.div className="lp-hero-ctas" variants={line}>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <a href="#ordis" onClick={handleScrollToOrdis} className="btn btn-secondary btn-lg">
            See How It Works
          </a>
        </motion.div>

        <motion.div className="lp-hero-benefits" variants={line}>
          <span className="lp-benefit-item">Free for small teams</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">No credit card required</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">Setup in 2 minutes</span>
        </motion.div>
      </motion.div>

      {/* Interactive Centerpiece Agent Console */}
      <motion.div
        className="lp-hero-mockup"
        ref={mockupRef}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
      >
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
              <span>Ordis AI Assistant</span>
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
              <span>Sprint Velocity</span>
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
              <span>Team Workload (4)</span>
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
              <span>Project Pipeline</span>
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
                    <h3 className="lp-mockup-view-title">Active Tasks</h3>
                    <span className="lp-mockup-view-subtitle">3 tasks in progress • Sprint 84% on track</span>
                  </div>
                  <span className="badge badge-brand">84% ON TRACK</span>
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
                      <span className="lp-prompt-sender">You:</span>
                      <span>"{prompts[activePromptIndex].prompt}"</span>
                    </div>
                    <div className="lp-prompt-reply">
                      <span className="lp-prompt-ordis-tag">Ordis:</span>
                      <p>{prompts[activePromptIndex].result}</p>
                      {activePromptIndex === 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={handleExecuteAction}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '6px' }}
                          >
                            {ordisActionExecuted ? 'Task Reassigned to Mukul K.' : 'Reassign Task to Mukul'}
                          </button>
                        </div>
                      )}
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
                    <h3 className="lp-mockup-view-title">Sprint Velocity</h3>
                    <span className="lp-mockup-view-subtitle">Current Sprint • Target End: Friday 6:00 PM</span>
                  </div>
                  <span className="badge badge-brand">ON TRACK (99% ON TIME)</span>
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
                <span className="lp-ordis-title">Ordis Assistant</span>
                <span className="lp-ordis-subtitle">Real-time task intelligence</span>
              </div>
            </div>

            <div className="lp-ordis-action-box">
              <div className="lp-ordis-tag">SMART SUGGESTION</div>
              <p className="lp-ordis-msg">
                <strong>"OAuth security review"</strong> is scheduled for tomorrow. Sarah T. is at 88% capacity.
              </p>

              {!ordisActionExecuted ? (
                <div className="lp-ordis-action-footer">
                  <span className="lp-ordis-suggestion">Suggested Action:</span>
                  <button className="btn btn-brand btn-sm" onClick={handleExecuteAction}>
                    Reassign to Mukul K. →
                  </button>
                </div>
              ) : (
                <div className="lp-ordis-success-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Reassigned to Mukul K. Workload balanced.</span>
                </div>
              )}
            </div>

            <div className="lp-ordis-stats-widget">
              <span className="lp-widget-title">Sprint Overview</span>
              <div className="lp-widget-row">
                <span>Tasks Completed</span>
                <strong>24 this week</strong>
              </div>
              <div className="lp-widget-row">
                <span>Sprint Health</span>
                <strong>94% on track</strong>
              </div>
              <div className="lp-widget-row">
                <span>Team Status</span>
                <strong>4 online</strong>
              </div>
            </div>

            <div className="lp-ordis-quick-prompts">
              <span className="lp-prompts-label">Quick Views:</span>
              <div
                className="lp-prompt-pill"
                onClick={() => setActiveTab('team')}
                role="button"
                tabIndex={0}
              >
                View Team Workload
              </div>
              <div
                className="lp-prompt-pill"
                onClick={() => setActiveTab('sprint')}
                role="button"
                tabIndex={0}
              >
                View Sprint Velocity
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
