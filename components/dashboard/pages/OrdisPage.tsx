'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { OrdisAgent, AuditLogItem } from '@/lib/dashboard/types';

export default function OrdisPage() {
  const {
    chatHistory,
    sendOrdisMessage,
    clearChatHistory,
    user,
    ordisAgents,
    auditLogs,
    tasks,
    projects,
    employees,
    meetings,
    showToast,
    addAuditEntry,
    openModal,
  } = useDashboard();

  const [activeView, setActiveView] = useState<'commander' | 'agents' | 'transparency'>('commander');
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
    addAuditEntry('Alex Morgan', 'ordis.agent.triggered', agent.name, 'Manual mini-agent execution trigger');
    showToast(`Autonomous Agent "${agent.name}" executed successfully ✓`);
  };

  const operationalCommands = [
    {
      title: 'Create Task for Mukul',
      desc: 'Assigns sprint deliverable directly to Mukul',
      prompt: 'Create task for Mukul: Implement responsive checkout UI with high priority',
      icon: '⚡',
    },
    {
      title: 'What is my team working on?',
      desc: 'Live workload & bandwidth scan',
      prompt: 'What is my team working on right now?',
      icon: '👥',
    },
    {
      title: 'Show upcoming deadlines',
      desc: 'Scans for overdue & approaching milestones',
      prompt: 'Show upcoming deadlines for active tasks',
      icon: '📅',
    },
    {
      title: 'Schedule a team sync',
      desc: 'Generates Google Meet room & invites',
      prompt: 'Schedule meeting: Weekly Sprint & Product Architecture Sync',
      icon: '🎥',
    },
    {
      title: 'Organize today\'s work',
      desc: 'Prioritized daily agenda for Alex',
      prompt: 'Organize today\'s work and prioritize my open tasks',
      icon: '🎯',
    },
    {
      title: 'Summarize project progress',
      desc: 'Completion velocity across initiatives',
      prompt: 'Summarize project progress and milestone completion',
      icon: '📊',
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

        <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span>{cmd.icon}</span>
                    <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>{cmd.title}</span>
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

              const formatted = (msg.text || '')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br />');

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
                placeholder="Ask Ordis: e.g. 'Create task for Mukul', 'Show upcoming deadlines', 'Schedule sprint sync'..."
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
      {/* 2. DEDICATED MINI-AGENTS VIEW */}
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
