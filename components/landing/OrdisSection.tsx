'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface OrdisOperationalScenario {
  id: string;
  tier: 'basic' | 'paid';
  label: string;
  userPrompt: string;
  responseHeadline: string;
  responseBody: string;
  actionButtonLabel?: string;
  actionExecutedText?: string;
  metaBadge: string;
}

export default function OrdisSection() {
  const [activeTier, setActiveTier] = useState<'basic' | 'paid'>('basic');
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});

  const scenarios: OrdisOperationalScenario[] = [
    // --- BASIC PLAN SCENARIOS ---
    {
      id: 'feature-doubt',
      tier: 'basic',
      label: 'Platform Guidance: "Operating Tasks & Kanban"',
      userPrompt: 'How do I operate the Task Kanban, automated routing, and priority filters in Cursis?',
      metaBadge: 'STANDARD · WORKFLOW GUIDE',
      responseHeadline: 'Operating Framework: Tasks & Kanban Hierarchy',
      responseBody: '1. Access Tasks from the primary navigation or press Cmd+K.\n2. Initialize "+ Add Task", configure assignee, milestone delivery SLA, and priority level (Urgent, High, Medium, Low).\n3. Reorder deliverables across Todo, In Progress, and Done pipelines.\n4. Filter by assignee or priority badge to isolate cross-functional bottlenecks.\nProactive Automation: Say "Create task: [Title] for [Name] due [Date]" to execute via natural language.',
      actionButtonLabel: 'Open Tasks Framework',
      actionExecutedText: '✓ Tasks guide bookmarked',
    },
    {
      id: 'summarize',
      tier: 'basic',
      label: 'Executive Briefing: "Sprint Velocity & Status"',
      userPrompt: 'Synthesize current sprint velocity, open dependency blockers, and approaching deliverables',
      metaBadge: 'STANDARD · EXECUTIVE BRIEFING',
      responseHeadline: 'Sprint Velocity Executive Synthesis',
      responseBody: '• Velocity Benchmark: 84% on schedule with 24 verified deliverables.\n• Active Initiatives: 6 high-priority tasks in progress across Design Systems and API Gateways.\n• Delivery Windows: 2 deliverables due within 24 hours (Brand Architecture & Checkout QA).\n• Blockers: 0 deadlocks identified; all upstream service contracts satisfied.',
      actionButtonLabel: 'Export Executive Briefing',
      actionExecutedText: '✓ Briefing exported to clipboard',
    },
    {
      id: 'list-features',
      tier: 'basic',
      label: 'Architecture Roster: "Integrated Subsystems"',
      userPrompt: 'Provide comprehensive architecture roster of all 17 unified Cursis modules',
      metaBadge: 'STANDARD · SUBSYSTEM AUDIT',
      responseHeadline: 'Complete Roster of 17 Unified Modules',
      responseBody: '1. Dashboard — Unified telemetry cockpit & throughput metrics\n2. Projects — Milestones, critical-path roadmaps, deliverable tracking\n3. Tasks — Kanban, nested subtasks, urgency matrices\n4. Messages — Channels, threaded discussions, real-time collaboration\n5. Calendar — Schedules, video sync rooms, delivery milestones\n6. Docs — Collaborative rich-text specifications & RFCs\n7. Files — Secure contextual asset repository\n8. Team — RBAC directory, role permissions, capacity allocation\n9. Creators — 5-stage production & media asset pipeline\n10. Invoicing & Time — Billable telemetry, automated enterprise invoicing\n11. Ordis AI — Autonomous operations & dynamic feature synthesis',
      actionButtonLabel: 'Copy Architecture Roster',
      actionExecutedText: '✓ Subsystem roster copied',
    },
    {
      id: 'strategic-roadmap',
      tier: 'basic',
      label: 'Strategic Roadmap: "Enterprise Migration"',
      userPrompt: 'Synthesize an autonomous execution roadmap for migrating multi-vendor stacks to Cursis',
      metaBadge: 'STANDARD · STRATEGIC SYNTHESIS',
      responseHeadline: 'Autonomous Enterprise Migration Framework',
      responseBody: '1. Phase 1 — Subsystem Ingestion: Import active tasks, milestone timelines, and team roles via Cursis APIs.\n2. Phase 2 — Real-Time Telemetry: Ordis monitors dependency graphs and flags capacity bottlenecks.\n3. Phase 3 — Autonomous Action: Automated meeting agendas, milestone briefings, and client deliverables synthesized deterministically.\n\nResult: 100% data fidelity with zero operational downtime.',
      actionButtonLabel: 'Synthesize Migration Blueprint',
      actionExecutedText: '✓ Enterprise migration blueprint generated',
    },

    // --- PAID VERSION SCENARIOS ---
    {
      id: 'paid-every-feature',
      tier: 'paid',
      label: 'Telemetry: "Subsystem Telemetry Audit"',
      userPrompt: 'Audit all enterprise subsystems, run deep ambient scan, evaluate CRM deals, and check API dispatch',
      metaBadge: 'PRO · FULL SUBSYSTEM AUDIT',
      responseHeadline: 'Full Subsystem Omniscience Active',
      responseBody: '• Workload Deadlock Scan: 0 deadlocks detected across 38 enterprise tasks.\n• CRM Pipeline Velocity: $145,000 across 4 enterprise contracts in negotiation stage.\n• Financial Telemetry: $58,000 settled this billing cycle; 2 invoices awaiting reconciliation.\n• Webhook Dispatch: 2 active production endpoints streaming events with 99.99% success rate.\n• Database Throughput: Multi-collection read/write latency under 12ms globally.',
      actionButtonLabel: '⚡ Run Subsystem Telemetry Audit',
      actionExecutedText: '✓ Global workspace telemetry synchronized',
    },
    {
      id: 'paid-make-csat-feature',
      tier: 'paid',
      label: 'Synthesis: "Client CSAT & NPS Collector"',
      userPrompt: 'Synthesize custom feature: Client CSAT & NPS Feedback Collector with 1-click rating',
      metaBadge: 'PRO · DYNAMIC FEATURE SYNTHESIS',
      responseHeadline: '🚀 Custom Feature Synthesized & Deployed',
      responseBody: 'Ordis Autonomous Engine has compiled and deployed: "Client CSAT & NPS Collector"\n\n• Schema: Client Organization, Star Rating (1-5), NPS Category, Feedback Payload\n• Automated Actions: [Send Survey Invite], [Export CSV], [Trigger Follow-up Task]\n• Persistence: Registered in workspace custom tools & live database collection.\n• Widget: Live interactive card synthesized below for your team to use!',
      actionButtonLabel: '⚡ Deploy Custom Tool to Workspace',
      actionExecutedText: '✓ Custom Feature "Client CSAT" is live in your workspace!',
    },
    {
      id: 'paid-make-bounty-feature',
      tier: 'paid',
      label: 'Synthesis: "Incentive & Bounty Engine"',
      userPrompt: 'Build custom feature for Team Bounty Coins rewarding engineers for completing urgent tasks',
      metaBadge: 'PRO · DYNAMIC FEATURE SYNTHESIS',
      responseHeadline: '🚀 Custom Feature Created: "Team Bounty Engine"',
      responseBody: 'Autonomous feature compilation complete!\n\n• Feature ID: feat_bounty_engine_v1\n• Fields: Contributor Name, Deliverable Closed, Bounty Credits (🪙), Payout Status\n• Automation Trigger: Awards +50 credits whenever an urgent task transitions to Done.\n• Deployment: Live in Workspace Custom Tools Shelf.',
      actionButtonLabel: '⚡ Activate Bounty Engine',
      actionExecutedText: '✓ Bounty system activated across all projects!',
    },
  ];

  const filteredScenarios = scenarios.filter((s) => s.tier === activeTier);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('feature-doubt');

  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId && s.tier === activeTier) ||
    filteredScenarios[0];

  const handleActionClick = (id: string) => {
    setExecutedActions((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="lp-section" id="ordis" style={{ background: '#0a0d14', color: '#ffffff', padding: '90px 24px' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '4px 12px',
            borderRadius: '4px',
            display: 'inline-block',
            marginBottom: '12px',
          }}
        >
          ORDIS INTELLIGENCE ENGINE
        </div>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', lineHeight: 1.1 }}>
          From Conversational Intelligence<br />
          <span style={{ color: '#60a5fa' }}>To Autonomous Orchestration.</span>
        </h2>
        <p style={{ color: '#9ca3af', maxWidth: '750px', margin: '14px auto 0', fontSize: '16px', lineHeight: 1.6 }}>
          In <strong>Standard Tier</strong>, Ordis operates as an omnipresent intelligence partner — answering operational queries, generating sprint summaries, and mapping workflows. In <strong>Autonomous Pro</strong>, Ordis achieves full system telemetry, automatically detecting delivery bottlenecks and synthesizing custom software widgets on the fly.
        </p>
      </div>

      {/* Tier Mode Selector Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '30px' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTier('basic');
            setActiveScenarioId('feature-doubt');
          }}
          style={{
            padding: '10px 22px',
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            background: activeTier === 'basic' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            color: activeTier === 'basic' ? '#000000' : '#ffffff',
            border: activeTier === 'basic' ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: activeTier === 'basic' ? '0 4px 12px rgba(15, 76, 255, 0.3)' : 'none',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ Standard Intelligence (Included)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTier('paid');
            setActiveScenarioId('paid-every-feature');
          }}
          style={{
            padding: '10px 22px',
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            background: activeTier === 'paid' ? '#0f4cff' : 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            border: activeTier === 'paid' ? '2px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: activeTier === 'paid' ? '0 4px 12px rgba(96, 165, 250, 0.4)' : 'none',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          🚀 Autonomous Pro (Full Orchestration)
        </button>
      </div>

      {/* Interactive Ordis Terminal / Console */}
      <div
        style={{
          maxWidth: '920px',
          margin: '0 auto',
          background: '#111827',
          border: '2px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 4px 4px 0 #0f4cff',
          overflow: 'hidden',
        }}
      >
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: '#090d16',
            borderBottom: '1.5px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '26px',
                height: '26px',
                background: '#0f4cff',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              O
            </span>
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeTier === 'basic' ? 'Ordis Basic Conversational Copilot' : 'Ordis Pro Autonomous Feature Synthesizer'}
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 900,
              padding: '3px 8px',
              background: activeTier === 'basic' ? 'rgba(255,255,255,0.1)' : '#0f4cff',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
            }}
          >
            {activeScenario.metaBadge}
          </span>
        </div>

        {/* Prompt Selector Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', flexShrink: 0 }}>
            {activeTier === 'basic' ? 'Try Basic Prompts:' : 'Try Pro Prompts:'}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filteredScenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveScenarioId(sc.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeScenario.id === sc.id ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                  color: activeScenario.id === sc.id ? '#000000' : '#d1d5db',
                  border: activeScenario.id === sc.id ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.15)',
                  whiteSpace: 'nowrap',
                }}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Screen */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* User message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%', alignSelf: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>You</span>
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              "{activeScenario.userPrompt}"
            </div>
          </div>

          {/* Ordis message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '95%', alignSelf: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#60a5fa', borderRadius: '50%', display: 'inline-block' }} />
              {activeTier === 'basic' ? 'Ordis Chatbot' : 'Ordis Pro Feature Builder'}
            </span>
            <div
              style={{
                padding: '16px 18px',
                background: '#0d131f',
                border: '1.5px solid rgba(96, 165, 250, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                color: '#e5e7eb',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', marginBottom: '8px' }}>
                {activeScenario.responseHeadline}
              </h4>
              <div style={{ whiteSpace: 'pre-line', color: '#cbd5e1' }}>
                {activeScenario.responseBody}
              </div>

              {activeScenario.actionButtonLabel && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {!executedActions[activeScenario.id] ? (
                    <button
                      type="button"
                      onClick={() => handleActionClick(activeScenario.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#0f4cff',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        border: '1px solid #ffffff',
                        boxShadow: '2px 2px 0 #ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      {activeScenario.actionButtonLabel}
                    </button>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ {activeScenario.actionExecutedText}
                    </span>
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
