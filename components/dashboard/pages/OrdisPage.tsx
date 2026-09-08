'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatChatMarkdown } from '@/lib/dashboard/data';
import { OrdisAgent, AuditLogItem } from '@/lib/dashboard/types';
import ChatActionCardView from '@/components/dashboard/chat/ChatActionCardView';

export default function OrdisPage() {
  const {
    chatHistory,
    sendOrdisMessage,
    clearChatHistory,
    user,
    ordisAgents,
    auditLogs,
    tasks,
    employees,
    meetings,
    showToast,
    addAuditEntry,
    openModal,
    ordisPlan,
    toggleOrdisPlan,
    dynamicFeatures,
  } = useDashboard();

  const [activeView, setActiveView] = useState<'commander' | 'dynamic_features' | 'agents' | 'transparency'>('commander');
  const [inputVal, setInputVal] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView === 'commander') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeView]);

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || inputVal).trim();
    if (!textToSend) return;
    sendOrdisMessage(textToSend);
    if (!overrideText) setInputVal('');
  };

  const handleRunAgent = (agent: OrdisAgent) => {
    addAuditEntry(user.name, 'ordis.agent.triggered', agent.name, 'Manual mini-agent execution trigger');
    showToast(`Autonomous Agent "${agent.name}" executed successfully ✓`);
  };

  const dynamicMember = employees.length > 0 ? employees[0].name.split(' ')[0] : 'team';

  const operationalCommands = ordisPlan === 'basic'
    ? [
        {
          title: 'How do I use Tasks & Kanban?',
          desc: 'Step-by-step guidance on task management',
          prompt: 'How do I use the Task Kanban and priority filters in Cursis?',
          icon: '📋',
          badge: 'Basic Guide',
        },
        {
          title: 'How does Creator Pipeline work?',
          desc: '5-stage production house workflow & roles',
          prompt: 'How does the Creator Content Pipeline work and what are the roles?',
          icon: '🎬',
          badge: 'Creators',
        },
        {
          title: 'Summarize Active Sprint',
          desc: 'Executive summary across open deliverables',
          prompt: 'Summarize the current sprint status, open blockers, and deadlines',
          icon: '📊',
          badge: 'Summary',
        },
        {
          title: 'List All 17 Modules',
          desc: 'Complete roster of integrated tools',
          prompt: 'List all 17 Cursis features and core modules',
          icon: '📑',
          badge: 'List',
        },
        {
          title: 'What is the secret of the void?',
          desc: 'Enigmatic question with zero errors',
          prompt: 'What is the secret of the cosmic void, and why does the cursor blink in the dark?',
          icon: '🌌',
          badge: 'Mysterious',
        },
        {
          title: 'List Creator Team Roles',
          desc: 'SE, VE, TD, SM, and VO roles and duties',
          prompt: 'List all Creator production team roles and duties',
          icon: '👥',
          badge: 'Team Roles',
        },
      ]
    : [
        {
          title: 'Make Feature: CSAT Surveys',
          desc: 'Synthesizes live client feedback collector',
          prompt: 'Make a new feature for Client CSAT & NPS Feedback Surveys with 1-click rating',
          icon: '🚀',
          badge: 'Make Feature',
        },
        {
          title: 'Build Feature: Expense Approvals',
          desc: 'Deploys receipt & cost audit tool',
          prompt: 'Build a new feature for Receipt & Expense Approvals with receipt URLs',
          icon: '💰',
          badge: 'Make Feature',
        },
        {
          title: 'Make Feature: Team Bounty Coins',
          desc: 'Installs member reward coin system',
          prompt: 'Build a new feature for Team Bounty Coins for completing urgent tasks',
          icon: '🏆',
          badge: 'Make Feature',
        },
        {
          title: 'Deep Ambient Telemetry Scan',
          desc: 'Omniscient audit across all 13 systems',
          prompt: 'Inspect all 13 systems, run deep ambient scan, audit CRM deals, and check API dispatch',
          icon: '🔍',
          badge: 'Omniscience',
        },
        {
          title: 'Calculate CRM Pipeline Total',
          desc: 'Inspects deals, stages, and forecast revenue',
          prompt: 'Show active CRM pipeline and calculate total deal values',
          icon: '💼',
          badge: 'CRM Pro',
        },
        {
          title: 'Create Auto-Assign Automation',
          desc: 'Installs urgent task routing workflow rule',
          prompt: 'Create automation: Auto-assign urgent tasks to Lead Engineer',
          icon: '⚙️',
          badge: 'Automations',
        },
      ];

  const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;
  const onlineMembers = employees.filter((e) => e.status === 'online').length;

  return (
    <div className="page active" id="page-ordis" style={{ display: 'block' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <h1 className="page-title">Ordis Workspace Copilot</h1>
            <span className="badge badge-brand" style={{ fontSize: '10px' }}>
              OPERATIONAL AI
            </span>
          </div>
          <p className="page-subtitle">
            Cursis gives you a workspace. Ordis helps you operate it. Ask questions or issue natural language commands.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          {/* Plan Toggle Button */}
          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleOrdisPlan}
            style={{
              background: ordisPlan === 'paid' ? 'linear-gradient(135deg, #0f4cff, #8b5cf6)' : '#ffffff',
              color: ordisPlan === 'paid' ? '#ffffff' : '#000000',
              border: '2px solid #000000',
              fontWeight: 900,
              boxShadow: '3px 3px 0 #000000',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {ordisPlan === 'paid' ? '🚀 Pro Plan ($1B Autonomous)' : '⚡ Basic Plan (Free Chatbot)'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{
              fontWeight: 700,
              color: '#7c3aed',
              borderColor: 'rgba(124, 58, 237, 0.4)',
              background: 'rgba(124, 58, 237, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => openModal('redeem-code-modal')}
          >
            <span>🎁</span> Redeem Code
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={clearChatHistory}>
            Clear History
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal('task-modal')}>
            + Manual Task
          </button>
        </div>
      </div>

      {/* Live Workspace Context Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--sp-3)',
          marginBottom: 'var(--sp-4)',
        }}
      >
        <div className="card" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>System Status</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)' }}>Ordis Engine Online</div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Tasks in Flight</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)' }}>{activeTaskCount} Active / {tasks.length} Total</div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Live Team Activity</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)' }}>{onlineMembers} Active Now / {employees.length} Total</div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            📅
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Scheduled Meetings</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)' }}>{meetings.length} Upcoming Syncs</div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--sp-4)' }}>
        <button
          type="button"
          className={`tab ${activeView === 'commander' ? 'active' : ''}`}
          onClick={() => setActiveView('commander')}
        >
          Conversational Commander
        </button>
        <button
          type="button"
          className={`tab ${activeView === 'dynamic_features' ? 'active' : ''}`}
          onClick={() => setActiveView('dynamic_features')}
        >
          Dynamic Features ({dynamicFeatures.length})
        </button>
        <button
          type="button"
          className={`tab ${activeView === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveView('agents')}
        >
          Mini-Agent Automations ({ordisAgents.length})
        </button>
        <button
          type="button"
          className={`tab ${activeView === 'transparency' ? 'active' : ''}`}
          onClick={() => setActiveView('transparency')}
        >
          Audit Transparency Log ({auditLogs.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONVERSATIONAL COMMANDER VIEW */}
      {/* ========================================================================= */}
      {activeView === 'commander' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* 1-Click Operational Command Grid */}
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-wide)', marginBottom: 'var(--sp-2)' }}>
              INSTANT OPERATIONAL COMMANDS (CLICK TO RUN)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-2)' }}>
              {operationalCommands.map((cmd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(cmd.prompt)}
                  className="card"
                  style={{
                    padding: 'var(--sp-3)',
                    textAlign: 'left',
                    background: 'var(--c-white)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '4px',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--c-brand)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span>{cmd.icon}</span>
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>{cmd.title}</span>
                    </div>
                    {cmd.badge && (
                      <span className="badge badge-subtle" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {cmd.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{cmd.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Stream & Action Log */}
          <div
            className="card"
            style={{
              padding: 'var(--sp-4)',
              minHeight: '380px',
              maxHeight: '520px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-3)',
              background: 'var(--c-surface)',
            }}
          >
            {chatHistory.map((msg, i) => {
              const isAi = msg.role === 'ai';

              if (msg.typing) {
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 'var(--sp-3)',
                      padding: 'var(--sp-3)',
                      background: 'var(--c-white)',
                      border: '1px solid var(--border-color)',
                      maxWidth: '85%',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--c-brand-lime)',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--fw-bold)',
                        fontSize: '11px',
                        flexShrink: 0,
                      }}
                    >
                      ⚡
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', alignSelf: 'center' }}>
                      Ordis is executing workspace command...
                    </div>
                  </div>
                );
              }

              const formatted = formatChatMarkdown(msg.text || '');

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 'var(--sp-3)',
                    padding: 'var(--sp-3) var(--sp-4)',
                    background: isAi ? 'var(--c-white)' : 'var(--c-near-black)',
                    color: isAi ? 'var(--text-primary)' : '#ffffff',
                    border: '1px solid var(--border-color)',
                    alignSelf: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: '88%',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      background: isAi ? 'var(--c-brand-lime)' : 'var(--c-brand)',
                      color: isAi ? '#000' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'var(--fw-bold)',
                      fontSize: '11px',
                      flexShrink: 0,
                    }}
                  >
                    {isAi ? '⚡' : user.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 'var(--fw-bold)',
                        fontSize: '10px',
                        marginBottom: '4px',
                        color: isAi ? 'var(--c-brand)' : 'var(--c-brand-lime)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {isAi ? 'ORDIS OPERATIONAL COPILOT' : `${user.name.toUpperCase()} (YOU)`}
                    </div>
                    <div
                      style={{ fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-relaxed)' }}
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />

                    {/* Interactive Action Card */}
                    {msg.actionCard && (
                      <div style={{ marginTop: '8px' }}>
                        <ChatActionCardView card={msg.actionCard} />
                      </div>
                    )}

                    {/* Suggested Follow-up Chips */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {msg.suggestedFollowUps.map((chip, chipIdx) => (
                          <button
                            key={chipIdx}
                            type="button"
                            onClick={() => handleSend(chip)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '9999px',
                              background: 'rgba(15, 76, 255, 0.1)',
                              color: '#0f4cff',
                              border: '1px solid rgba(15, 76, 255, 0.25)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#0f4cff';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(15, 76, 255, 0.1)';
                              e.currentTarget.style.color = '#0f4cff';
                            }}
                          >
                            {chip} ➔
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Natural Language Prompt Input Bar */}
          <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-white)' }}>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder={`Ask Ordis: e.g. '${dynamicMember !== 'team' ? `Create task for ${dynamicMember}` : 'Create task: Implement checkout'}', 'Show upcoming deadlines', 'Schedule sprint sync'...`}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSend()}
                style={{ padding: '0 var(--sp-4)', height: '40px' }}
              >
                Execute Command →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC CUSTOM FEATURES VIEW (Task 4: Make New Feature) */}
      {/* ========================================================================= */}
      {activeView === 'dynamic_features' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* Header Banner */}
          <div className="card" style={{ padding: 'var(--sp-4)', background: '#fafaf8', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-brand" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  AUTONOMOUS DYNAMIC EXTENSIONS
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>
                  Custom Dynamic Features Synthesized by Ordis Pro
                </h3>
                <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                  Unlike rigid SaaS tools, Ordis Pro invents and builds brand new features according to your requirements on the fly.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSend('Make a new feature for Client CSAT Surveys')}
                  style={{ border: '1.5px solid #000', boxShadow: '2px 2px 0 #000', fontWeight: 800 }}
                >
                  + Make CSAT Feature
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSend('Build a new feature for Team Bounty Coins')}
                  style={{ border: '1.5px solid #000', boxShadow: '2px 2px 0 #000', fontWeight: 800 }}
                >
                  + Make Bounty Feature
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Feature Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-4)' }}>
            {dynamicFeatures.map((feat) => (
              <div
                key={feat.id}
                className="card"
                style={{
                  padding: '20px',
                  background: '#ffffff',
                  border: '2px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '36px',
                        height: '36px',
                        border: '1.5px solid #000',
                        background: '#f4f3ed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      {feat.icon}
                    </span>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>
                        {feat.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>{feat.category}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      padding: '2px 6px',
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #15803d',
                      textTransform: 'uppercase',
                    }}
                  >
                    ACTIVE
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#444', lineHeight: 1.5 }}>
                  {feat.description}
                </p>

                {/* Simulated Interactive Input Schema */}
                <div style={{ background: '#f9f9f6', border: '1px solid #ddd', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
                    Dynamic Form Schema ({feat.fields.length} fields)
                  </span>
                  {feat.fields.map((f, fIdx) => (
                    <div key={fIdx}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#333' }}>
                        {f.name}
                      </label>
                      <input
                        type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                        placeholder={f.placeholder}
                        defaultValue=""
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #ccc',
                          background: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  {feat.actions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      type="button"
                      onClick={() => showToast(`Executed: ${act.label} on "${feat.name}" ✓`)}
                      className={`btn btn-${act.style === 'primary' ? 'primary' : 'secondary'} btn-sm`}
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        fontWeight: 900,
                        border: '1.5px solid #000',
                        boxShadow: '2px 2px 0 #000',
                        padding: '8px',
                      }}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Prompt Box to Build Next Feature */}
          <div className="card" style={{ padding: 'var(--sp-4)', background: '#ffffff', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#0f4cff', marginBottom: '8px' }}>
              ⚡ Tell Ordis Pro to Make Any Other Feature:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                style={{ flex: 1, border: '1.5px solid #000', fontSize: '13px' }}
                placeholder="e.g. 'Build a feature for Social Media Multi-Post Scheduler with character limits'..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSend()}
                style={{ border: '2px solid #000', boxShadow: '3px 3px 0 #000', fontWeight: 900 }}
              >
                Synthesize Feature →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED MINI-AGENTS VIEW */}
      {/* ========================================================================= */}
      {activeView === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
          {ordisAgents.map((ag: OrdisAgent) => (
            <div key={ag.id} className="card" style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ fontSize: '20px' }}>{ag.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{ag.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{ag.role}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${ag.status === 'active' ? 'success' : 'neutral'}`} style={{ fontSize: '9px' }}>
                    {ag.status}
                  </span>
                </div>

                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)', lineHeight: 'var(--lh-normal)' }}>
                  {ag.description}
                </p>

                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--c-gray-100)', paddingTop: 'var(--sp-2)' }}>
                  <div><strong>Trigger:</strong> {Array.isArray(ag.triggers) ? ag.triggers.join(', ') : ag.trigger || 'Manual / Event'}</div>
                  <div style={{ marginTop: '2px' }}><strong>Executions:</strong> {ag.executionCount ?? ag.actionsToday ?? 12} times</div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--sp-4)' }}>
                <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleRunAgent(ag)}>
                  Trigger Agent Run Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRANSPARENCY AUDIT LOG VIEW */}
      {/* ========================================================================= */}
      {activeView === 'transparency' && (
        <div className="card" style={{ padding: 'var(--sp-5)' }}>
          <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
            Autonomous Action Transparency Feed
          </h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
            Every command executed by Ordis, state mutations, and user adjustments are logged immutably below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {auditLogs.map((log: AuditLogItem) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--sp-3)',
                  background: 'var(--c-surface)',
                  borderBottom: '1px solid var(--c-gray-200)',
                  fontSize: 'var(--fs-xs)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <span className="badge badge-brand" style={{ fontSize: '9px' }}>
                    {log.actor}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'var(--fw-bold)' }}>{log.action}</div>
                    <div style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {log.target} — {log.details}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
