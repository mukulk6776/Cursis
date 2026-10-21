'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';


type TabKey = 'agent' | 'sprint' | 'team' | 'pipeline';

export default function HeroSection() {
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>('agent');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Finish the brand colors and fonts', priority: 'High', status: 'In Progress', assignee: 'Mukul K.', sla: 'Today 5:00 PM' },
    { id: 2, title: 'Check that sign-in is secure', priority: 'Urgent', status: 'Pending', assignee: 'Sarah T.', sla: 'Tomorrow' },
    { id: 3, title: 'Review this month’s finished work', priority: 'Medium', status: 'Done', assignee: 'Alex R.', sla: 'Completed' },
  ]);
  const [ordisActionExecuted, setOrdisActionExecuted] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const prompts = [
    {
      label: 'Spot Delays',
      prompt: 'Ordis, what could miss its deadline tomorrow?',
      result: 'One task may be late: "Check that sign-in is secure." Sarah T. is nearly fully booked. Mukul K. has room to help.',
    },
    {
      label: 'Quick Update',
      prompt: 'How is our work going this week?',
      result: '84% of the planned work is done. The team finished 21 of 25 planned tasks this week.',
    },
    {
      label: 'Share the Work',
      prompt: 'Help share the work fairly across the team.',
      result: 'Moved 2 tasks to teammates with time to help. Everyone now has a manageable workload.',
    },
  ];

  const handleExecuteAction = () => {
    setOrdisActionExecuted(true);
    setTasks((prev) =>
      prev.map((t) => (t.id === 2 ? { ...t, status: 'In Progress', assignee: 'Mukul K. (Taking Over)' } : t))
    );
  };

  const handleScrollToOrdis = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.querySelector('#ordis');
    if (el) {
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <section className="lp-section lp-hero" id="hero">
      {/* Hero Header */}
      <div
        className="lp-hero-header"
      >
        <h1 className="lp-hero-title">
          Less chasing.<br />
          <span className="tano-hero-marker">More getting done.</span>
        </h1>

        <p className="lp-hero-text">
          Your team workspace for tasks, projects, chat, and video meetings. Ordis AI spots delayed tasks and helps share the work, so your team can stay on track.
        </p>

        <div className="lp-hero-ctas">
          <Link prefetch={false} href="/signup" className="btn btn-primary btn-lg">
            Make my workspace
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <a href="#ordis" onClick={handleScrollToOrdis} className="btn btn-secondary btn-lg">
            Try the Demo
          </a>
        </div>

        <div className="lp-hero-benefits">
          <span className="lp-benefit-item">One connected workspace</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">No credit card required</span>
          <span className="lp-benefit-sep">•</span>
          <span className="lp-benefit-item">Setup in 2 minutes</span>
        </div>
      </div>

      {/* Interactive Centerpiece Agent Console */}
      <div
        className="lp-hero-mockup"
      >
        {/* Tano Signature Rotated Washi Tape */}
        <div className="tano-washi-tape" style={{ top: -12, right: 38, transform: 'rotate(2.5deg)' }} aria-hidden="true" />

        <p className="marketing-sample">Sample data · All names, tasks and statistics below are demo content.</p>{/* Mockup Window Chrome */}
        <div className="lp-mockup-topbar">
          <div className="lp-mockup-topbar-left">
            <span className="lp-mockup-dot red" />
            <span className="lp-mockup-dot yellow" />
            <span className="lp-mockup-dot green" />
            <span className="lp-mockup-tag">cursis / team workspace</span>
          </div>

          <div className="lp-mockup-url">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>cursis.in/workspace/operations</span>
          </div>

          <div className="lp-mockup-status">
            <span className="lp-status-live-dot" />
            <span>Try the demo • Sample data</span>
          </div>
        </div>

        {/* Mockup Window Navigation Subheader */}
        <div className="lp-mockup-subnav">
          <div className="lp-mockup-tabs">
            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'agent' ? 'active' : ''}`} aria-pressed={activeTab === 'agent'}
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
              className={`lp-mockup-tab ${activeTab === 'sprint' ? 'active' : ''}`} aria-pressed={activeTab === 'sprint'}
              onClick={() => setActiveTab('sprint')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span>Work Progress</span>
            </button>

            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'team' ? 'active' : ''}`} aria-pressed={activeTab === 'team'}
              onClick={() => setActiveTab('team')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Who Is Busy? (4)</span>
            </button>

            <button
              type="button"
              className={`lp-mockup-tab ${activeTab === 'pipeline' ? 'active' : ''}`} aria-pressed={activeTab === 'pipeline'}
              onClick={() => setActiveTab('pipeline')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Project Stages</span>
            </button>
          </div>
        </div>

        {/* Mockup Body Content */}
        <div className="lp-mockup-body">
          {/* Main Workspace Stage */}
          <div className="lp-mockup-main">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                className="lp-tab-content"
                initial={{ opacity: 0, height: reducedMotion ? 'auto' : 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: reducedMotion ? 'auto' : 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
            {/* Tab 1: Autonomous Ordis Copilot */}
            {activeTab === 'agent' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h2 className="lp-mockup-view-title">Active Tasks</h2>
                    <span className="lp-mockup-view-subtitle">3 sample tasks • 84% of planned work done</span>
                  </div>
                  <span className="badge badge-brand">84% PLANNED WORK DONE</span>
                </div>

                {/* Interactive Task Cards */}
                <div className="lp-mockup-task-list">
                  {tasks.map((t) => (
                    <div key={t.id} className="lp-mockup-task-row">
                      <div className="lp-mockup-task-check">
                        <input
                          type="checkbox"
                          id={`task-${t.id}`}
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
                          aria-label={`Mark task "${t.title}" as ${t.status === 'Done' ? 'incomplete' : 'complete'}`}
                        />
                      </div>
                      <div className="lp-mockup-task-details">
                        <label htmlFor={`task-${t.id}`} className={`lp-mockup-task-name ${t.status === 'Done' ? 'completed' : ''}`}>
                          {t.title}
                        </label>
                        <div className="lp-mockup-task-meta">
                          <span className="lp-mockup-assignee">
                            <span className="lp-avatar-dot" />
                            {t.assignee}
                          </span>
                          <span className={`badge badge-sm ${t.priority === 'Urgent' ? 'badge-error' : t.priority === 'High' ? 'badge-warning' : 'badge-neutral'}`}>
                            {t.priority}
                          </span>
                          <span className="lp-sla-tag">Due: {t.sla}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Agent Interactive Prompts */}
                <div className="lp-mockup-prompts-bar">
                  <span className="lp-prompts-title">Try asking Ordis:</span>
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
                            {ordisActionExecuted ? 'Mukul K. Is Taking Over' : 'Give This Task to Mukul'}
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
                    <h2 className="lp-mockup-view-title">Work Progress</h2>
                    <span className="lp-mockup-view-subtitle">This week’s work • Due Friday at 6:00 PM</span>
                  </div>
                  <span className="badge badge-brand">84% OF PLANNED WORK DONE</span>
                </div>

                <div className="lp-sprint-grid">
                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Tasks Finished</span>
                    <span className="lp-metric-value">21 / 25</span>
                    <div className="lp-metric-progress">
                      <div className="lp-metric-bar" style={{ width: '84%' }} />
                    </div>
                    <span className="lp-metric-sub">84% of tasks finished</span>
                  </div>

                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Average Time per Task</span>
                    <span className="lp-metric-value">1.8 Days</span>
                    <span className="lp-metric-trend positive">34% less time than last month</span>
                    <span className="lp-metric-sub">No waiting between steps</span>
                  </div>

                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Tasks Holding Up Work</span>
                    <span className="lp-metric-value">0 Blocked</span>
                    <span className="lp-metric-trend positive">Fully Clear</span>
                    <span className="lp-metric-sub">No tasks are holding up the team</span>
                  </div>
                </div>

                <div className="lp-sprint-chart-mock">
                  <div className="lp-chart-header">
                    <span>Tasks Finished This Week</span>
                    <span className="badge badge-sm badge-neutral">Expected to finish 1.2 days early</span>
                  </div>
                  <div className="lp-chart-bars">
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '35%' }} /><span>Mon</span></div>
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '52%' }} /><span>Tue</span></div>
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '68%' }} /><span>Wed</span></div>
                    <div className="lp-chart-col"><div className="lp-bar-fill" style={{ height: '84%' }} /><span>Thu (Today)</span></div>
                    <div className="lp-chart-col forecast"><div className="lp-bar-fill" style={{ height: '100%' }} /><span>Fri (Expected)</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Team Bandwidth */}
            {activeTab === 'team' && (
              <div className="lp-mockup-view">
                <div className="lp-mockup-view-header">
                  <div>
                    <h2 className="lp-mockup-view-title">Who Has Room to Help?</h2>
                    <span className="lp-mockup-view-subtitle">4 teammates • Work shared evenly</span>
                  </div>
                  <span className="badge badge-brand">WORK SHARED EVENLY</span>
                </div>

                <div className="lp-mockup-team-grid">
                  <div className="lp-mockup-member-card">
                    <div className="lp-avatar-sm" style={{ background: '#1A1612', color: '#ffffff' }}>MK</div>
                    <div className="lp-member-info">
                      <div className="lp-member-name">Mukul Kumar</div>
                      <div className="lp-member-role">Team Lead • 3 tasks</div>
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
                      <div className="lp-member-role">Developer • 2 tasks</div>
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
                      <div className="lp-member-role">Content Manager • 4 files</div>
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
                    <h2 className="lp-mockup-view-title">From Video Idea to Published</h2>
                    <span className="lp-mockup-view-subtitle">See what needs writing, recording, review, or publishing</span>
                  </div>
                  <span className="badge badge-brand">5 PROJECTS UNDERWAY</span>
                </div>

                <div className="lp-pipeline-columns">
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">1. Idea &amp; Script</span>
                    <div className="lp-pipeline-card">
                      <strong>Client Presentation</strong>
                      <span>2 changes to review</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">2. Create</span>
                    <div className="lp-pipeline-card">
                      <strong>Brand Video — Version 4</strong>
                      <span>Saving the final video</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">3. Review &amp; Check</span>
                    <div className="lp-pipeline-card urgent">
                      <strong>Product Demo Video</strong>
                      <span>Waiting for client approval</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">4. Ready to Share</span>
                    <div className="lp-pipeline-card">
                      <strong>Product Launch Reel</strong>
                      <span>Goes live tomorrow at 9 AM</span>
                    </div>
                  </div>
                  <div className="lp-pipeline-col">
                    <span className="lp-pipeline-col-header">5. Finished</span>
                    <div className="lp-pipeline-card done">
                      <strong>New Starter Guide</strong>
                      <span>Shared with the team</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mockup Right Side Panel: Ordis Live Command Center */}
          <div className="lp-mockup-ordis-panel">
            <div className="lp-ordis-panel-header">
              <div className="lp-ordis-icon-box">O</div>
              <div className="lp-ordis-header-text">
                <span className="lp-ordis-title">Ordis Assistant</span>
                <span className="lp-ordis-subtitle">Help keeping work on track</span>
              </div>
            </div>

            <div className="lp-ordis-action-box">
              <div className="lp-ordis-tag">SMART SUGGESTION</div>
              <p className="lp-ordis-msg">
                <strong>"Check that sign-in is secure"</strong> is scheduled for tomorrow. Sarah T. is nearly fully booked.
              </p>

              {!ordisActionExecuted ? (
                <div className="lp-ordis-action-footer">
                  <span className="lp-ordis-suggestion">Try this:</span>
                  <button className="btn btn-brand btn-sm" onClick={handleExecuteAction}>
                    Give to Mukul K. →
                  </button>
                </div>
              ) : (
                <div className="lp-ordis-success-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Mukul K. is taking over. Sarah has more time.</span>
                </div>
              )}
            </div>

            <div className="lp-ordis-stats-widget">
              <span className="lp-widget-title">This Week’s Progress</span>
              <div className="lp-widget-row">
                <span>Tasks Completed</span>
                <strong>21 of 25 this week</strong>
              </div>
              <div className="lp-widget-row">
                <span>Work on Track</span>
                <strong>84% of planned work done</strong>
              </div>
              <div className="lp-widget-row">
                <span>Team Status</span>
                <strong>4 online</strong>
              </div>
            </div>

            <div className="lp-ordis-quick-prompts">
              <span className="lp-prompts-label">Quick Views:</span>
              <button
                type="button"
                className="lp-prompt-pill"
                onClick={() => setActiveTab('team')}
              >
                See Who Is Busy
              </button>
              <button
                type="button"
                className="lp-prompt-pill"
                onClick={() => setActiveTab('sprint')}
              >
                View Work Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
