'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface OrdisDemoScenario {
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

  const scenarios: OrdisDemoScenario[] = [
    // --- BASIC PLAN SCENARIOS ---
    {
      id: 'feature-doubt',
      tier: 'basic',
      label: 'Feature Doubt: "How do I use Tasks?"',
      userPrompt: 'How do I use the Task Kanban and priority filters in Cursis?',
      metaBadge: 'BASIC · FEATURE GUIDE',
      responseHeadline: 'Guide: Operating Tasks & Kanban Board',
      responseBody: '1. Navigate to Tasks from the sidebar or press Cmd+K.\n2. Click "+ Add Task", enter title, set assignee, deadline, and priority (Urgent, High, Medium, Low).\n3. Drag cards between "Todo", "In Progress", and "Done" columns.\n4. Filter by assignee or priority badge to view bottlenecks immediately.\nTip: You can also tell me "Create task: [Title] for [Name] due [Date]" and I will create it for you!',
      actionButtonLabel: 'Open Tasks Guide',
      actionExecutedText: '✓ Tasks guide bookmarked',
    },
    {
      id: 'summarize',
      tier: 'basic',
      label: 'Summary: "Summarize sprint status"',
      userPrompt: 'Summarize the current sprint status, open blockers, and deadlines',
      metaBadge: 'BASIC · EXECUTIVE SUMMARY',
      responseHeadline: 'Sprint Status Executive Summary',
      responseBody: '• Overall Sprint Velocity: 84% on schedule with 24 completed deliverables.\n• Active Focus: 6 tasks currently in progress across Design System and API Integration.\n• Approaching Deadlines: 2 tasks due in the next 24 hours (Brand Guidelines & Checkout QA).\n• Blockers Flagged: 0 critical blockers; all upstream dependencies clear.',
      actionButtonLabel: 'Export Summary',
      actionExecutedText: '✓ Summary exported to clipboard',
    },
    {
      id: 'list-features',
      tier: 'basic',
      label: 'List: "List all Cursis features"',
      userPrompt: 'List all Cursis features and core modules',
      metaBadge: 'BASIC · LIST ENGINE',
      responseHeadline: 'Complete Roster of 17 Integrated Modules',
      responseBody: '1. Dashboard — Unified cockpit & telemetry\n2. Projects — Milestones, timelines, progress tracking\n3. Tasks — Kanban, lists, priorities, assignments\n4. Messages — Channels, threads, real-time team chat\n5. Calendar — Meetings, Google Meet rooms, milestones\n6. Docs — Collaborative rich-text documents\n7. Files — Secure asset storage with context\n8. Team — Directory, roles (SE, VE, TD, SM, VO), permissions\n9. Creators — 5-stage content production house pipeline\n10. Time Log & Invoices — Billable hours, timers, client PDF invoices\n11. Ordis AI — Copilot, summaries, and feature synthesizers',
      actionButtonLabel: 'Copy Module List',
      actionExecutedText: '✓ Copied module list',
    },
    {
      id: 'mysterious-question',
      tier: 'basic',
      label: 'Mysterious: "Secret of the void?"',
      userPrompt: 'What is the secret of the cosmic void, and why does the cursor blink in the dark?',
      metaBadge: 'BASIC · ZERO-ERROR POISE',
      responseHeadline: 'The Enigma of the Blank Canvas',
      responseBody: 'The void is not an absence, but the infinite potential of uncommitted work. The blinking cursor is the heartbeat of creation — a solitary light at the frontier between imagination and reality.\n\nIn Cursis, even the deepest mysteries find structure: ideas transform into scripts, scripts into footage, and footage into published legacy. No error will ever silence our dialogue; ask what you will, and together we will build order from the cosmos.',
      actionButtonLabel: 'Contemplate with Ordis',
      actionExecutedText: '✓ Cosmic insight synthesized (0 errors)',
    },

    // --- PAID VERSION SCENARIOS ---
    {
      id: 'paid-every-feature',
      tier: 'paid',
      label: 'Access: "Every Feature & Telemetry"',
      userPrompt: 'Inspect all 13 systems, run deep ambient scan, audit CRM deals, and check API dispatch',
      metaBadge: 'PRO · FULL SYSTEM ACCESS',
      responseHeadline: 'Full Subsystem Omniscience Active',
      responseBody: '• Ambient Bottleneck Scan: 0 deadlocks across 38 tasks.\n• CRM Pipeline Audit: $145,000 across 4 enterprise deals in proposal stage.\n• Invoicing Telemetry: ₹4,80,000 collected this quarter; 2 invoices pending delivery.\n• API Keys & Webhooks: 2 live production endpoints dispatching webhook events.\n• MongoDB Health: Multi-collection read/write latency under 12ms.',
      actionButtonLabel: '⚡ Run Global Workspace Scan',
      actionExecutedText: '✓ Global workspace telemetry synchronized',
    },
    {
      id: 'paid-make-csat-feature',
      tier: 'paid',
      label: 'Make Feature: "Client CSAT Surveys"',
      userPrompt: 'Make a new feature according to my needs: Client CSAT & NPS Feedback Surveys with 1-click rating',
      metaBadge: 'PRO · DYNAMIC FEATURE BUILDER',
      responseHeadline: '🚀 New Custom Feature Synthesized & Deployed!',
      responseBody: 'Ordis Pro has created a brand new custom feature: "Client CSAT & NPS Collector"\n\n• Schema: Client Email, Star Rating (1-5), NPS Category, Feedback Notes\n• Actions: [Send Survey Invite], [Export CSV], [Trigger Follow-up Task]\n• Persistence: Registered in workspace custom tools & live MongoDB collection.\n• Widget: Live interactive card synthesized below for your team to use!',
      actionButtonLabel: '⚡ Deploy Custom Tool to Workspace',
      actionExecutedText: '✓ Custom Feature "Client CSAT" is live in your workspace!',
    },
    {
      id: 'paid-make-bounty-feature',
      tier: 'paid',
      label: 'Make Feature: "Team Bounty Coins"',
      userPrompt: 'Build a new feature for Team Bounty Coins where members earn reward coins for completing urgent tasks',
      metaBadge: 'PRO · DYNAMIC FEATURE BUILDER',
      responseHeadline: '🚀 Custom Feature Created: "Team Bounty Coins"',
      responseBody: 'Autonomous feature synthesis complete!\n\n• Feature ID: feat_bounty_coins_v1\n• Fields: Member Name, Task Completed, Bounty Coin Reward (🪙), Payout Status\n• Automation Hook: Auto-awards +50 coins whenever an urgent task transitions to Done.\n• Available in workspace: Custom Tools Shelf.',
      actionButtonLabel: '⚡ Activate Bounty System',
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
    <section className="lp-section lp-ordis-container" id="ordis" style={{ background: '#0a0d14', color: '#ffffff' }}>
      {/* Section Header */}
      <div className="lp-section-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'rgba(15, 76, 255, 0.2)',
            color: '#60a5fa',
            padding: '4px 12px',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'inline-block',
            marginBottom: '12px',
          }}
        >
          ORDIS INTELLIGENCE ENGINE
        </div>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', lineHeight: 1.1 }}>
          Basic Chatbot or Autonomous Pro.<br />
          <span style={{ color: '#60a5fa' }}>Ordis Powers Both.</span>
        </h2>
        <p style={{ color: '#9ca3af', maxWidth: '750px', margin: '14px auto 0', fontSize: '16px', lineHeight: 1.6 }}>
          In the <strong>Basic Plan</strong>, Ordis answers any feature doubt, summarizes work, lists anything, and gracefully handles mysterious questions without error. In the <strong>Paid Version</strong>, Ordis has access to every feature and can invent and build brand new features on demand!
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
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            background: activeTier === 'basic' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            color: activeTier === 'basic' ? '#000000' : '#ffffff',
            border: activeTier === 'basic' ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: activeTier === 'basic' ? '3px 3px 0 #0f4cff' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ Basic Plan Chatbot (Free)
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
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            background: activeTier === 'paid' ? '#0f4cff' : 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            border: activeTier === 'paid' ? '2px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: activeTier === 'paid' ? '3px 3px 0 #ffffff' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          🚀 Paid Version (Ordis Pro / $1B Tier)
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
