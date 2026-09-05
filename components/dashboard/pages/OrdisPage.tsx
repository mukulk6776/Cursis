'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { OrdisAgent, AuditLogItem } from '@/lib/dashboard/types';

export default function OrdisPage() {
  const {
    chatHistory,
    sendOrdisMessage,
    user,
    ordisAgents,
    auditLog,
    tasks,
    documents,
    projects,
    showToast,
    addAuditEntry,
  } = useDashboard();

  const [activeView, setActiveView] = useState<'chat' | 'agents' | 'transparency'>('chat');
  const [inputVal, setInputVal] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeView]);

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || inputVal).trim();
    if (!textToSend) return;
    sendOrdisMessage(textToSend);
    if (!overrideText) setInputVal('');
  };

  const handleRunAgent = (agent: any) => {
    addAuditEntry('ordis', 'agent.manual_run', agent.name, 'Triggered autonomous agent run');
    showToast(`Mini-Agent "${agent.name}" executed successfully *`);
  };

  const suggestions = [
    'What is overdue across projects?',
    'Summarize team workload and burnout risk',
    'Run paperwork automation for new client',
    'Create high priority task for Sarah: Design mobile checkout',
    'What custom solutions does Cursis Agency build?',
  ];

  return (
    <div className="page active" id="page-ordis" style={{ display: 'block' }}>
      <div className="ordis-page">
        {/* Header & Nav Tabs */}
        <div className="ordis-header" style={{ paddingBottom: 'var(--sp-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                background: 'var(--c-near-black)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--fw-black)',
                fontSize: '12px',
              }}
            >
              AI
            </div>
            <h2 style={{ margin: 0 }}>ORDIS INTELLIGENCE</h2>
          </div>


          <div className="tabs" style={{ marginTop: 'var(--sp-3)', justifyContent: 'center' }}>
            <span
              className={`tab ${activeView === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveView('chat')}
              style={{ cursor: 'pointer' }}
            >
              Conversational Commander
            </span>
            <span
              className={`tab ${activeView === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveView('agents')}
              style={{ cursor: 'pointer' }}
            >
              Dedicated Mini-Agents ({ordisAgents.length})
            </span>
            <span
              className={`tab ${activeView === 'transparency' ? 'active' : ''}`}
              onClick={() => setActiveView('transparency')}
              style={{ cursor: 'pointer' }}
            >
              AI Action Transparency Log
            </span>
          </div>
        </div>

        {/* TAB 1: CONVERSATIONAL COMMANDER */}
        {activeView === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Suggestion Chips */}
            <div className="ordis-suggestions" style={{ marginBottom: 'var(--sp-3)' }}>
              {suggestions.map((s, i) => (
                <button key={i} className="ordis-suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>

            {/* Chat Stream */}
            <div
              className="ordis-chat"
              id="ordis-chat"
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: 'var(--sp-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-3)',
              }}
            >
              {chatHistory.map((m, i) => {
                const isAi = m.role === 'ai';

                if (m.typing) {
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 'var(--sp-3)',
                        padding: 'var(--sp-3)',
                        background: 'var(--c-surface)',
                        border: 'var(--border-width) solid var(--border-color)',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          background: 'var(--c-brand)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--fw-black)',
                          fontSize: '10px',
                        }}
                      >
                        AI
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        ORDIS is querying workspace memory and formulating response...
                      </div>
                    </div>
                  );
                }

                const formatted = (m.text || '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br />');

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 'var(--sp-3)',
                      padding: 'var(--sp-4)',
                      background: isAi ? 'var(--c-white)' : 'var(--c-surface)',
                      border: 'var(--border-width) solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        background: isAi ? 'var(--c-near-black)' : 'var(--c-brand)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--fw-black)',
                        fontSize: '10px',
                        flexShrink: 0,
                      }}
                    >
                      {isAi ? 'AI' : user.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 'var(--fw-bold)',
                          fontSize: 'var(--fs-xs)',
                          marginBottom: '4px',
                          color: isAi ? 'var(--c-brand)' : 'var(--text-primary)',
                        }}
                      >
                        {isAi ? 'ORDIS AUTONOMOUS AGENT' : `${user.name.toUpperCase()} (YOU)`}
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

            {/* Input Bar */}
            <div className="ordis-input-bar">
              <div className="ai-command-bar" style={{ maxWidth: '100%' }}>
                <textarea
                  className="ai-command-input"
                  rows={1}
                  placeholder="Instruct ORDIS to execute actions, assign tasks, extract contracts, or synthesize reports..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="ai-command-actions">
                  <div className="ai-command-tools">
                    <button
                      className="ai-tool-btn"
                      onClick={() => setInputVal((prev) => `${prev}Check contracts `)}
                    >
                      Docs
                    </button>
                    <button
                      className="ai-tool-btn"
                      onClick={() => setInputVal((prev) => `${prev}Summarize messages `)}
                    >
                      Messages
                    </button>
                    <button
                      className="ai-tool-btn"
                      onClick={() => setInputVal((prev) => `${prev}Review overdue tasks `)}
                    >
                      Tasks
                    </button>
                  </div>
                  <button className="ai-send-btn" onClick={() => handleSend()}>
                    Execute →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED MINI-AGENTS */}
        {activeView === 'agents' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--sp-4)',
              overflowY: 'auto',
              padding: 'var(--sp-2) 0',
            }}
          >
            {ordisAgents.map((agent: OrdisAgent) => (
              <div
                key={agent.id}
                className="card"
                style={{
                  padding: 'var(--sp-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--sp-3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: '20px' }}>{agent.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-md)' }}>{agent.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{agent.role}</div>
                      </div>
                    </div>
                    <span
                      className={`badge badge-${agent.status === 'active' ? 'success' : 'neutral'}`}
                      style={{ fontSize: '10px' }}
                    >
                      {agent.status}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 'var(--sp-3)', lineHeight: 'var(--lh-normal)' }}>
                    {agent.description}
                  </p>

                  <div style={{ marginTop: 'var(--sp-3)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    <div>
                      <strong>Triggers on:</strong> {Array.isArray(agent.triggers) ? agent.triggers.join(', ') : (agent.trigger || 'Event')}
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      <strong>Executions:</strong> {agent.executionCount ?? agent.actionsToday ?? 0} automated runs
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--c-gray-200)', paddingTop: 'var(--sp-3)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleRunAgent(agent)}>
                    Run Agent Now
                  </button>
                  <span className="badge badge-brand" style={{ fontSize: '9px' }}>
                    ORDIS Mini-Agent
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: TRANSPARENCY LOG */}
        {activeView === 'transparency' && (
          <div className="card" style={{ padding: 'var(--sp-4)', overflowY: 'auto', flex: 1 }}>
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <h3 style={{ margin: 0 }}>Autonomous Action Transparency Feed</h3>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Every action ORDIS executes across projects, tasks, contracts, and notifications is immutably logged below.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {auditLog.map((entry: AuditLogItem) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-2) var(--sp-3)',
                    borderBottom: '1px solid var(--c-gray-100)',
                    fontSize: 'var(--fs-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span className="badge badge-brand" style={{ fontSize: '9px' }}>
                      {entry.actor === 'ordis' ? 'AI AUTONOMOUS' : 'USER'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 'var(--fw-bold)' }}>{entry.action}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {entry.target} — {entry.details}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
