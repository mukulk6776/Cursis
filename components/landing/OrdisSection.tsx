'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface OrdisDemoScenario {
  id: string;
  label: string;
  userPrompt: string;
  responseHeadline: string;
  responseBody: string;
  actionButtonLabel?: string;
  actionExecutedText?: string;
  metaBadge: string;
}

export default function OrdisSection() {
  const scenarios: OrdisDemoScenario[] = [
    {
      id: 'team-status',
      label: 'What is my team working on?',
      userPrompt: 'What is my team working on right now?',
      metaBadge: 'LIVE TEAM SCAN',
      responseHeadline: 'Team Activity Breakdown (4 Online)',
      responseBody: '• Mukul K. is focused on "Landing Page Redesign" (78% complete)\n• Sarah T. is finishing "Brand Asset Guidelines" (Due tomorrow)\n• Alex R. is preparing "Sprint Retrospective" (Completed 3 subtasks)\n• Team bandwidth is healthy with 0 critical bottlenecks detected.',
      actionButtonLabel: 'View Detailed Team Board',
      actionExecutedText: 'Opening Team Board...',
    },
    {
      id: 'create-task',
      label: 'Create a task for Mukul',
      userPrompt: 'Create a high-priority task for Mukul: Implement dark mode tokens due Friday',
      metaBadge: 'WORKSPACE MUTATION',
      responseHeadline: 'Task Drafted & Assigned',
      responseBody: 'Task "Implement dark mode tokens" created with High priority. Assigned to Mukul Kumar in "Design System" project with deadline set for Friday, 5:00 PM.',
      actionButtonLabel: '⚡ Confirm & Add to Sprint',
      actionExecutedText: '✓ Task added to Mukul\'s active queue',
    },
    {
      id: 'deadlines',
      label: 'Show upcoming deadlines',
      userPrompt: 'Show all upcoming deadlines for this week',
      metaBadge: 'TIMELINE AUDIT',
      responseHeadline: '3 Deadlines Approaching in Next 48 Hours',
      responseBody: '1. Brand Asset Guidelines — Sarah T. (Tomorrow, 2:00 PM) • On Track\n2. Q3 Client Deliverables — Alex R. (Tomorrow, 5:00 PM) • Urgent Attention\n3. Mobile Checkout QA — Mukul K. (Friday, 12:00 PM) • Blocked on API',
      actionButtonLabel: 'Send Friendly Reminders',
      actionExecutedText: '✓ Reminders scheduled',
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule a team sync',
      userPrompt: 'Schedule a 30-minute sprint review meeting with Mukul and Sarah for tomorrow at 2 PM',
      metaBadge: 'CALENDAR ENGINE',
      responseHeadline: 'Meeting Ready to Schedule',
      responseBody: 'Event: "Sprint Review Sync" (30 min)\nTime: Tomorrow at 2:00 PM\nParticipants: Mukul Kumar, Sarah Taylor\nAgenda: Auto-populated from 4 completed sprint tasks.',
      actionButtonLabel: '⚡ Book Google Meet',
      actionExecutedText: '✓ Meeting invite sent & calendar synced',
    },
    {
      id: 'project-summary',
      label: 'Summarize project progress',
      userPrompt: 'Summarize overall progress on the Website Redesign initiative',
      metaBadge: 'EXECUTIVE SUMMARY',
      responseHeadline: 'Website Redesign — 82% Velocity',
      responseBody: '• 14 of 17 milestones completed on schedule\n• Front-end performance score: 98/100\n• 1 non-blocking bug open in QA\n• Projected completion: 2 days ahead of target release.',
      actionButtonLabel: 'Export Progress Brief',
      actionExecutedText: '✓ Brief downloaded',
    },
  ];

  const [activeScenarioId, setActiveScenarioId] = useState<string>('team-status');
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleActionClick = (scenarioId: string) => {
    setExecutedActions((prev) => ({ ...prev, [scenarioId]: true }));
  };

  const whatOrdisDoes = [
    'Watches your workspace for stalled tasks and approaching deadlines',
    'Executes actions upon your direct command (creates tasks, schedules meetings)',
    'Drafts context-rich messages and updates from real project data',
    'Prepares automated meeting agendas based on open blockers',
    'Surfaces team workload balance so nobody burns out',
  ];

  const whatOrdisDoesNot = [
    'Never makes unauthorized destructive changes without approval',
    'Never invents or hallucinates fake project numbers',
    'Never sends spammy robotic emails to your clients',
    'Never shares or sells workspace data to third parties',
    'Does not replace your team — it helps them operate faster',
  ];

  return (
    <section className="lp-section lp-ordis-container" id="ordis">
      {/* Section Header */}
      <div className="lp-section-header">
        <div className="lp-badge-ordis">ORDIS INTELLIGENCE</div>
        <h2 className="lp-section-title">
          Cursis gives you a workspace.<br />
          Ordis helps you operate it.
        </h2>
        <p className="lp-section-subtitle">
          Ordis is not a chatbot in a sidebar. It is the intelligent center of Cursis that actively
          connects your team, projects, tasks, and schedules to keep work moving.
        </p>
      </div>

      {/* Interactive Ordis Terminal / Console */}
      <div className="lp-ordis-interactive-box">
        <div className="lp-ordis-box-topbar">
          <div className="lp-ordis-box-topbar-left">
            <span className="lp-ordis-avatar-chip">O</span>
            <span className="lp-ordis-box-title">Ordis Workspace Operations</span>
          </div>
          <span className="badge badge-brand">{activeScenario.metaBadge}</span>
        </div>

        {/* Prompt Selector Pills */}
        <div className="lp-ordis-prompt-selector">
          <span className="lp-prompt-selector-label">Ask Ordis:</span>
          <div className="lp-prompt-chips-wrapper">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                className={`lp-prompt-chip ${activeScenarioId === sc.id ? 'active' : ''}`}
                onClick={() => setActiveScenarioId(sc.id)}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Console Workspace Display */}
        <div className="lp-ordis-display-panel">
          {/* User Input Bubble */}
          <div className="lp-ordis-chat-bubble user">
            <div className="lp-bubble-sender">You</div>
            <div className="lp-bubble-text">"{activeScenario.userPrompt}"</div>
          </div>

          {/* Ordis AI Response Bubble */}
          <div className="lp-ordis-chat-bubble ai">
            <div className="lp-bubble-sender">
              <span className="lp-mini-ordis-icon">O</span>
              <span>Ordis Workspace Assistant</span>
            </div>
            <div className="lp-bubble-content">
              <h4 className="lp-bubble-headline">{activeScenario.responseHeadline}</h4>
              <div className="lp-bubble-body">
                {activeScenario.responseBody.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                ))}
              </div>

              {activeScenario.actionButtonLabel && (
                <div className="lp-bubble-action-row">
                  {!executedActions[activeScenario.id] ? (
                    <button
                      className="btn btn-brand btn-sm"
                      onClick={() => handleActionClick(activeScenario.id)}
                    >
                      {activeScenario.actionButtonLabel}
                    </button>
                  ) : (
                    <span className="lp-executed-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b341" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {activeScenario.actionExecutedText}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Ordis Capabilities */}
      <div className="lp-ordis-pillars-grid">
        <div className="lp-pillar-card">
          <div className="lp-pillar-icon">⚡</div>
          <h3 className="lp-pillar-title">Operates Your Workspace</h3>
          <p className="lp-pillar-desc">
            Ask Ordis to create tasks, assign work, set deadlines, and schedule meetings in plain English. No complex forms.
          </p>
        </div>

        <div className="lp-pillar-card">
          <div className="lp-pillar-icon">🔍</div>
          <h3 className="lp-pillar-title">Detects Bottlenecks Proactively</h3>
          <p className="lp-pillar-desc">
            Ordis notices when tasks stall for days before a deadline hits and provides 1-click remedies to keep momentum.
          </p>
        </div>

        <div className="lp-pillar-card">
          <div className="lp-pillar-icon">📅</div>
          <h3 className="lp-pillar-title">Prepares Meetings &amp; Agendas</h3>
          <p className="lp-pillar-desc">
            Before any calendar sync, Ordis gathers active blockers, recent progress, and auto-generates actionable agendas.
          </p>
        </div>

        <div className="lp-pillar-card">
          <div className="lp-pillar-icon">📊</div>
          <h3 className="lp-pillar-title">Protects Team Bandwidth</h3>
          <p className="lp-pillar-desc">
            Ordis monitors workload distribution across your team and suggests task rebalancing before burnout happens.
          </p>
        </div>
      </div>

      {/* Philosophy Table (Clean & Transparent) */}
      <div className="lp-philosophy-card">
        <div className="lp-philosophy-header">
          <h3 className="lp-philosophy-title">The Ordis Philosophy</h3>
          <p className="lp-philosophy-subtitle">
            Ordis is built to empower human teams — not replace them.
          </p>
        </div>

        <div className="lp-philosophy-grid">
          <div className="lp-philosophy-col positive">
            <h4 className="lp-col-title green">What Ordis Does</h4>
            <ul className="lp-philosophy-list">
              {whatOrdisDoes.map((item, idx) => (
                <li key={idx}>
                  <span className="lp-check-green">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-philosophy-col negative">
            <h4 className="lp-col-title red">What Ordis Does NOT Do</h4>
            <ul className="lp-philosophy-list">
              {whatOrdisDoesNot.map((item, idx) => (
                <li key={idx}>
                  <span className="lp-cross-red">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="lp-ordis-cta-wrapper">
        <Link href="/signup" className="btn btn-primary btn-lg">
          Experience Ordis for Free
        </Link>
      </div>
    </section>
  );
}

