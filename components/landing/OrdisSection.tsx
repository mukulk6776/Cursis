'use client';

import React, { useState } from 'react';

interface OrdisOperationalScenario {
  id: string;
  mode: 'conversational' | 'autonomous';
  label: string;
  userPrompt: string;
  responseHeadline: string;
  responseBody: string;
  actionButtonLabel?: string;
  actionExecutedText?: string;
  metaBadge: string;
}

export default function OrdisSection() {
  const [activeMode, setActiveMode] = useState<'conversational' | 'autonomous'>('conversational');
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});

  const scenarios: OrdisOperationalScenario[] = [
    // --- QUICK ANSWERS SCENARIOS ---
    {
      id: 'sprint-summary',
      mode: 'conversational',
      label: 'Sprint Summary',
      userPrompt: 'What are our key priorities and blockers for today?',
      metaBadge: 'SPRINT UPDATE',
      responseHeadline: 'Today\'s Sprint Overview',
      responseBody: '• 3 tasks due today: Design Tokens, Auth Guard, and Mobile Nav.\n• 1 blocker: Design review needed for the checkout flow.\n• Sprint is 88% complete and on track for Friday delivery.',
      actionButtonLabel: 'Copy Sprint Summary',
      actionExecutedText: 'Sprint summary copied to clipboard',
    },
    {
      id: 'workload-check',
      mode: 'conversational',
      label: 'Team Workload',
      userPrompt: 'Is anyone on the team overloaded right now?',
      metaBadge: 'CAPACITY INSIGHT',
      responseHeadline: 'Team Capacity Check',
      responseBody: '• Sarah T. is at 88% capacity with 4 active deliverables.\n• Mukul K. and Alex R. have open bandwidth.\n• Recommendation: Reassign the OAuth security review to Mukul to balance the load.',
      actionButtonLabel: 'View Team Capacity',
      actionExecutedText: 'Switched to team workload view',
    },
    {
      id: 'project-status',
      mode: 'conversational',
      label: 'Project Status',
      userPrompt: 'Give me a quick update on the Mobile App Redesign',
      metaBadge: 'PROJECT STATUS',
      responseHeadline: 'Mobile App Redesign Status',
      responseBody: '• Current Sprint: 4 of 6 milestones completed.\n• Open Tasks: 4 in progress, 1 in review, 18 completed.\n• Next Deliverable: Staging build scheduled for tomorrow at 2:00 PM.',
      actionButtonLabel: 'Open Project Roadmap',
      actionExecutedText: 'Roadmap view opened',
    },

    // --- ACTION WORKFLOWS SCENARIOS ---
    {
      id: 'create-task',
      mode: 'autonomous',
      label: 'Create Task',
      userPrompt: 'Create a high-priority task: "Update auth token guard" for Mukul due Friday',
      metaBadge: 'TASK CREATION',
      responseHeadline: 'Task Created & Assigned',
      responseBody: 'Task created successfully:\n• Title: Update auth token guard\n• Assignee: Mukul Kumar\n• Due Date: Friday, 5:00 PM\n• Priority: High\n• Status: Added to Sprint Backlog',
      actionButtonLabel: 'View in Kanban',
      actionExecutedText: 'Task highlighted in Kanban board',
    },
    {
      id: 'rebalance-work',
      mode: 'autonomous',
      label: 'Rebalance Workload',
      userPrompt: 'Rebalance urgent deliverables from Sarah to Mukul',
      metaBadge: 'WORKLOAD REBALANCE',
      responseHeadline: 'Workload Rebalanced',
      responseBody: '• Moved: "Security review for OAuth session guard" → Mukul K.\n• Sarah\'s capacity adjusted: 88% → 65% (Optimal)\n• Sprint delivery trajectory preserved without delay.',
      actionButtonLabel: 'Confirm Rebalance',
      actionExecutedText: 'Workload rebalanced across team',
    },
    {
      id: 'export-standup',
      mode: 'autonomous',
      label: 'Daily Standup',
      userPrompt: 'Draft the daily standup notes from today\'s completed tasks',
      metaBadge: 'STANDUP NOTES',
      responseHeadline: 'Daily Standup Draft',
      responseBody: 'Daily Standup Summary:\n• Done Yesterday: Design system tokens finalized (Mukul K.), Client sync action items indexed.\n• Working Today: OAuth review, Mobile checkout QA.\n• Blockers: None identified.',
      actionButtonLabel: 'Send to Team Channel',
      actionExecutedText: 'Standup shared to #general',
    },
  ];

  const filteredScenarios = scenarios.filter((s) => s.mode === activeMode);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sprint-summary');

  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId && s.mode === activeMode) ||
    filteredScenarios[0];

  const handleActionClick = (id: string) => {
    setExecutedActions((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="lp-section lp-ordis-section" id="ordis">
      {/* Section Header */}
      <div className="lp-section-header">
        <div className="lp-section-label">Ordis AI</div>
        <h2 className="lp-section-title">
          Meet your AI operations partner.
        </h2>
        <p className="lp-section-subtitle">
          Ask questions about tasks, summarize sprints, or balance workload with simple conversation.
        </p>
      </div>

      {/* Mode Selector Switcher (Pill Style) */}
      <div className="lp-ordis-tier-switcher">
        <button
          type="button"
          className={`lp-tier-btn ${activeMode === 'conversational' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('conversational');
            setActiveScenarioId('sprint-summary');
          }}
        >
          <span className="lp-tier-dot" />
          Quick Answers
        </button>

        <button
          type="button"
          className={`lp-tier-btn ${activeMode === 'autonomous' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('autonomous');
            setActiveScenarioId('create-task');
          }}
        >
          <span className="lp-tier-dot pro" />
          Task Actions
        </button>
      </div>

      {/* Interactive Ordis Terminal / Console */}
      <div className="lp-ordis-console-card">
        {/* Topbar */}
        <div className="lp-ordis-console-topbar">
          <div className="lp-console-left">
            <span className="lp-console-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: '#0A0A0A', borderRadius: '6px', padding: 0 }}>
              <svg width="14" height="14" viewBox="0 0 1024 1024" fill="none">
                <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#ffffff" strokeWidth="142" strokeLinecap="round" fill="none" />
                <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" />
              </svg>
            </span>
            <span className="lp-console-title">
              Ordis AI Assistant
            </span>
          </div>

          <div className="lp-console-right">
            <span className="lp-status-live-dot" />
            <span className="lp-console-badge">{activeScenario.metaBadge}</span>
          </div>
        </div>

        {/* Prompt Selector Pills */}
        <div className="lp-ordis-console-prompts-bar">
          <span className="lp-prompts-caption">Select Example:</span>
          <div className="lp-prompts-pills">
            {filteredScenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className={`lp-scenario-pill ${activeScenario.id === sc.id ? 'active' : ''}`}
                onClick={() => setActiveScenarioId(sc.id)}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Console Screen Content */}
        <div className="lp-ordis-console-body">
          {/* User Message */}
          <div className="lp-console-bubble user">
            <div className="lp-bubble-sender">
              <span className="lp-sender-label">YOU</span>
            </div>
            <div className="lp-bubble-content">
              "{activeScenario.userPrompt}"
            </div>
          </div>

          {/* Ordis Response */}
          <div className="lp-console-bubble ordis">
            <div className="lp-bubble-sender">
              <span className="lp-ordis-live-dot" />
              <span className="lp-sender-label ordis">
                ORDIS
              </span>
            </div>

            <div className="lp-bubble-content ordis-box">
              <h4 className="lp-ordis-headline">{activeScenario.responseHeadline}</h4>
              <div className="lp-ordis-body-text">{activeScenario.responseBody}</div>

              {activeScenario.actionButtonLabel && (
                <div className="lp-ordis-action-area">
                  {!executedActions[activeScenario.id] ? (
                    <button
                      type="button"
                      className="btn btn-brand btn-sm"
                      onClick={() => handleActionClick(activeScenario.id)}
                    >
                      {activeScenario.actionButtonLabel}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  ) : (
                    <div className="lp-ordis-verified-box">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{activeScenario.actionExecutedText}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
