'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
    // --- CONVERSATIONAL GUIDANCE SCENARIOS ---
    {
      id: 'feature-doubt',
      mode: 'conversational',
      label: 'Platform Guidance: "Operating Tasks & Kanban"',
      userPrompt: 'How do I operate the Task Kanban, automated routing, and priority filters in Cursis?',
      metaBadge: 'STANDARD · WORKFLOW GUIDE',
      responseHeadline: 'Operating Framework: Tasks & Kanban Hierarchy',
      responseBody: '1. Access Tasks from the primary navigation or press Cmd+K.\n2. Initialize "+ Add Task", configure assignee, milestone delivery SLA, and priority level (Urgent, High, Medium, Low).\n3. Reorder deliverables across Todo, In Progress, and Done pipelines.\n4. Filter by assignee or priority badge to isolate cross-functional bottlenecks.\nProactive Automation: Say "Create task: [Title] for [Name] due [Date]" to execute via natural language.',
      actionButtonLabel: 'Open Tasks Framework',
      actionExecutedText: 'Tasks guide bookmarked and synchronized',
    },
    {
      id: 'summarize',
      mode: 'conversational',
      label: 'Executive Briefing: "Sprint Velocity & Status"',
      userPrompt: 'Synthesize current sprint velocity, open dependency blockers, and approaching deliverables',
      metaBadge: 'STANDARD · EXECUTIVE BRIEFING',
      responseHeadline: 'Sprint Velocity Executive Synthesis',
      responseBody: '• Velocity Benchmark: 84% on schedule with 24 verified deliverables.\n• Active Initiatives: 6 high-priority tasks in progress across Design Systems and API Gateways.\n• Delivery Windows: 2 deliverables due within 24 hours (Brand Architecture & Checkout QA).\n• Blockers: 0 deadlocks identified; all upstream service contracts satisfied.',
      actionButtonLabel: 'Export Executive Briefing',
      actionExecutedText: 'Briefing exported to clipboard',
    },
    {
      id: 'list-features',
      mode: 'conversational',
      label: 'Architecture Roster: "Integrated Subsystems"',
      userPrompt: 'Provide comprehensive architecture roster of all unified Cursis modules',
      metaBadge: 'STANDARD · SUBSYSTEM AUDIT',
      responseHeadline: 'Complete Roster of Unified Modules',
      responseBody: '1. Dashboard — Unified telemetry cockpit & throughput metrics\n2. Projects — Milestones, critical-path roadmaps, deliverable tracking\n3. Tasks — Kanban, nested subtasks, urgency matrices\n4. Messages — Channels, threaded discussions, real-time collaboration\n5. Calendar — Schedules, video sync rooms, delivery milestones\n6. Docs — Collaborative rich-text specifications & RFCs\n7. Files — Secure contextual asset repository\n8. Team — RBAC directory, role permissions, capacity allocation\n9. Creators — 5-stage production & media asset pipeline\n10. Invoicing & Time — Billable telemetry, automated enterprise invoicing\n11. Ordis AI — Autonomous operations & dynamic feature synthesis',
      actionButtonLabel: 'Copy Architecture Roster',
      actionExecutedText: 'Subsystem roster copied to clipboard',
    },
    {
      id: 'strategic-roadmap',
      mode: 'conversational',
      label: 'Strategic Roadmap: "Enterprise Migration"',
      userPrompt: 'Synthesize an autonomous execution roadmap for migrating multi-vendor stacks to Cursis',
      metaBadge: 'STANDARD · STRATEGIC SYNTHESIS',
      responseHeadline: 'Autonomous Enterprise Migration Framework',
      responseBody: '1. Phase 1 — Subsystem Ingestion: Import active tasks, milestone timelines, and team roles via Cursis APIs.\n2. Phase 2 — Real-Time Telemetry: Ordis monitors dependency graphs and flags capacity bottlenecks.\n3. Phase 3 — Autonomous Action: Automated meeting agendas, milestone briefings, and client deliverables synthesized deterministically.\n\nResult: 100% data fidelity with zero operational downtime.',
      actionButtonLabel: 'Synthesize Migration Blueprint',
      actionExecutedText: 'Enterprise migration blueprint generated',
    },

    // --- AUTONOMOUS EXECUTION SCENARIOS ---
    {
      id: 'paid-every-feature',
      mode: 'autonomous',
      label: 'Telemetry: "Subsystem Telemetry Audit"',
      userPrompt: 'Audit all enterprise subsystems, run deep ambient scan, evaluate CRM deals, and check API dispatch',
      metaBadge: 'AUTONOMOUS · FULL SUBSYSTEM AUDIT',
      responseHeadline: 'Full Subsystem Omniscience Active',
      responseBody: '• Workload Deadlock Scan: 0 deadlocks detected across 38 enterprise tasks.\n• CRM Pipeline Velocity: $145,000 across 4 enterprise contracts in negotiation stage.\n• Financial Telemetry: $58,000 settled this billing cycle; 2 invoices awaiting reconciliation.\n• Webhook Dispatch: 2 active production endpoints streaming events with 99.99% success rate.\n• Database Throughput: Multi-collection read/write latency under 12ms globally.',
      actionButtonLabel: 'Run Subsystem Telemetry Audit',
      actionExecutedText: 'Global workspace telemetry synchronized',
    },
    {
      id: 'paid-make-csat-feature',
      mode: 'autonomous',
      label: 'Synthesis: "Client CSAT & NPS Collector"',
      userPrompt: 'Synthesize custom feature: Client CSAT & NPS Feedback Collector with 1-click rating',
      metaBadge: 'AUTONOMOUS · DYNAMIC FEATURE SYNTHESIS',
      responseHeadline: 'Custom Feature Synthesized & Deployed',
      responseBody: 'Ordis Autonomous Engine has compiled and deployed: "Client CSAT & NPS Collector"\n\n• Schema: Client Organization, Star Rating (1-5), NPS Category, Feedback Payload\n• Automated Actions: [Send Survey Invite], [Export CSV], [Trigger Follow-up Task]\n• Persistence: Registered in workspace custom tools & live database collection.\n• Widget: Live interactive card synthesized below for your team to use!',
      actionButtonLabel: 'Deploy Custom Tool to Workspace',
      actionExecutedText: 'Custom Feature "Client CSAT" is live in your workspace!',
    },
    {
      id: 'paid-make-bounty-feature',
      mode: 'autonomous',
      label: 'Synthesis: "Incentive & Bounty Engine"',
      userPrompt: 'Build custom feature for Team Bounty Coins rewarding engineers for completing urgent tasks',
      metaBadge: 'AUTONOMOUS · DYNAMIC FEATURE SYNTHESIS',
      responseHeadline: 'Custom Feature Created: "Team Bounty Engine"',
      responseBody: 'Autonomous feature compilation complete!\n\n• Feature ID: feat_bounty_engine_v1\n• Fields: Contributor Name, Deliverable Closed, Bounty Credits, Payout Status\n• Automation Trigger: Awards +50 credits whenever an urgent task transitions to Done.\n• Deployment: Live in Workspace Custom Tools Shelf.',
      actionButtonLabel: 'Activate Bounty Engine',
      actionExecutedText: 'Bounty system activated across all projects!',
    },
  ];

  const filteredScenarios = scenarios.filter((s) => s.mode === activeMode);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('feature-doubt');

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
        <div className="lp-section-label">ORDIS INTELLIGENCE ENGINE</div>
        <h2 className="lp-section-title">
          From Conversational Intelligence<br />
          <span className="lp-highlight">To Autonomous Orchestration.</span>
        </h2>
        <p className="lp-section-subtitle">
          Ordis operates as an omnipresent intelligence and autonomous execution partner across your entire workspace — answering operational queries, generating sprint summaries, automatically detecting delivery bottlenecks, and synthesizing custom software widgets on the fly.
        </p>
      </div>

      {/* Mode Selector Switcher (Pill Style) */}
      <div className="lp-ordis-tier-switcher">
        <button
          type="button"
          className={`lp-tier-btn ${activeMode === 'conversational' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('conversational');
            setActiveScenarioId('feature-doubt');
          }}
        >
          <span className="lp-tier-dot" />
          Conversational Intelligence
        </button>

        <button
          type="button"
          className={`lp-tier-btn ${activeMode === 'autonomous' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('autonomous');
            setActiveScenarioId('paid-every-feature');
          }}
        >
          <span className="lp-tier-dot pro" />
          Autonomous Orchestration
        </button>
      </div>

      {/* Interactive Ordis Terminal / Console */}
      <div className="lp-ordis-console-card">
        {/* Topbar */}
        <div className="lp-ordis-console-topbar">
          <div className="lp-console-left">
            <span className="lp-console-logo">O</span>
            <span className="lp-console-title">
              {activeMode === 'conversational' ? 'Ordis Conversational Intelligence Copilot' : 'Ordis Autonomous Orchestration Engine'}
            </span>
          </div>

          <div className="lp-console-right">
            <span className="lp-status-live-dot" />
            <span className="lp-console-badge">{activeScenario.metaBadge}</span>
          </div>
        </div>

        {/* Prompt Selector Pills */}
        <div className="lp-ordis-console-prompts-bar">
          <span className="lp-prompts-caption">Select Operational Scenario:</span>
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
              <span className="lp-sender-label">OPERATOR QUERY</span>
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
                {activeMode === 'conversational' ? 'ORDIS COPILOT RESPONSE' : 'ORDIS AUTONOMOUS SYNTHESIS'}
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
