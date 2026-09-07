'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatChatMarkdown } from '@/lib/dashboard/data';
import ChatActionCardView from '@/components/dashboard/chat/ChatActionCardView';

export default function OrdisFloatingChat() {
  const {
    ordisFloatingOpen,
    setOrdisFloatingOpen,
    toggleOrdisFloating,
    voiceMode,
    toggleVoiceMode,
    chatHistory,
    sendOrdisMessage,
    clearChatHistory,
    tasks,
    employees,
    meetings,
    activeWorkspace,
    ordisPlan,
    toggleOrdisPlan,
    dynamicFeatures,
  } = useDashboard();

  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when chat history changes or opens
  useEffect(() => {
    if (ordisFloatingOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [chatHistory, ordisFloatingOpen]);

  // Handle voice mode simulation
  useEffect(() => {
    let timer: any;
    if (voiceMode) {
      setIsListening(true);
      timer = setTimeout(() => {
        setIsListening(false);
      }, 4000);
    } else {
      setIsListening(false);
    }
    return () => clearTimeout(timer);
  }, [voiceMode]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;
    sendOrdisMessage(text);
    if (!textToSend) setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = ordisPlan === 'basic'
    ? [
        { label: '💡 How to Use Tasks', prompt: 'How do I use the Task Kanban and priority filters in Cursis?' },
        { label: '🎬 Creator Pipeline', prompt: 'How does the Creator Content Pipeline work and what are the roles?' },
        { label: '📊 Summarize Sprint', prompt: 'Summarize the current sprint status, open blockers, and deadlines' },
        { label: '📑 List All Features', prompt: 'List all 17 Cursis features and core modules' },
        { label: '🌌 Mysterious Question', prompt: 'What is the secret of the cosmic void, and why does the cursor blink in the dark?' },
        { label: '👥 List Team Roles', prompt: 'List all Creator production team roles and duties' },
      ]
    : [
        { label: '🚀 Make CSAT Feature', prompt: 'Make a new feature for Client CSAT & NPS Feedback Surveys with 1-click rating' },
        { label: '💰 Make Expense Feature', prompt: 'Build a new feature for Receipt & Expense Approvals with receipt URLs' },
        { label: '🏆 Make Bounty Feature', prompt: 'Build a new feature for Team Bounty Coins for completing urgent tasks' },
        { label: '🔍 Deep Ambient Scan', prompt: 'Inspect all 13 systems, run deep ambient scan, audit CRM deals, and check API dispatch' },
        { label: '💼 Audit CRM Deals', prompt: 'Show active CRM pipeline and calculate total deal values' },
        { label: '⚡ Urgent Routing', prompt: 'Create automation: Auto-assign urgent tasks to Lead Engineer' },
      ];

  const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;
  const onlineMemberCount = employees.filter((e) => e.status === 'online').length;

  return (
    <>
      {/* Floating Trigger Button (when closed) */}
      {!ordisFloatingOpen && (
        <button
          type="button"
          onClick={toggleOrdisFloating}
          aria-label="Open Ordis AI Workspace Copilot"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
            border: '1px solid rgba(15, 76, 255, 0.45)',
            borderRadius: '9999px',
            color: '#ffffff',
            boxShadow: '0 10px 30px -5px rgba(15, 76, 255, 0.4), 0 0 20px rgba(15, 76, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(16px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.8)';
            e.currentTarget.style.boxShadow = '0 14px 35px -5px rgba(15, 76, 255, 0.6), 0 0 25px rgba(56, 189, 248, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.borderColor = 'rgba(15, 76, 255, 0.45)';
            e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(15, 76, 255, 0.4), 0 0 20px rgba(15, 76, 255, 0.2)';
          }}
        >
          {/* Animated Glowing Orb Badge */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f4cff 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              ⚡
            </div>
            {/* Pulsing online ring */}
            <span
              style={{
                position: 'absolute',
                top: '-1px',
                right: '-1px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                border: '1.5px solid #090d16',
                boxShadow: '0 0 8px #10b981',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>Ordis Copilot</span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(15, 76, 255, 0.25)',
                  color: '#93c5fd',
                  border: '1px solid rgba(15, 76, 255, 0.35)',
                }}
              >
                Ctrl+J
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Control any workspace feature</span>
          </div>
        </button>
      )}

      {/* Floating Chat Window (when open) */}
      {ordisFloatingOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: isExpanded ? '16px' : '24px',
            right: isExpanded ? '16px' : '24px',
            width: isExpanded ? 'calc(100vw - 32px)' : '420px',
            maxWidth: isExpanded ? '900px' : '92vw',
            height: isExpanded ? 'calc(100vh - 32px)' : '600px',
            maxHeight: '92vh',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(9, 13, 22, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(15, 76, 255, 0.25)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            transition: 'width 0.2s ease, height 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(15, 23, 42, 0.8)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0f4cff 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(15, 76, 255, 0.4)',
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Ordis Copilot</span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: '#10b981',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    Live
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {activeWorkspace.name} • Connected
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Plan Switcher Badge */}
              <button
                type="button"
                onClick={toggleOrdisPlan}
                title="Click to toggle between Basic Chatbot and Pro Autonomous ($1B Tier)"
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: ordisPlan === 'paid' ? 'linear-gradient(135deg, #0f4cff, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${ordisPlan === 'paid' ? '#60a5fa' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  boxShadow: ordisPlan === 'paid' ? '0 0 12px rgba(15, 76, 255, 0.5)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{ordisPlan === 'paid' ? '🚀 PRO ($1B)' : '⚡ BASIC'}</span>
              </button>

              {/* Voice Mode Toggle */}
              <button
                type="button"
                onClick={toggleVoiceMode}
                title={voiceMode ? 'Voice Mode Active' : 'Enable Voice Mode'}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: voiceMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${voiceMode ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: voiceMode ? '#f87171' : '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🎙️
              </button>

              {/* Expand / Minimize Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? 'Restore Size' : 'Expand Fullscreen'}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isExpanded ? '❐' : '⛶'}
              </button>

              {/* Clear History */}
              <button
                type="button"
                onClick={clearChatHistory}
                title="Clear Chat History"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🧹
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setOrdisFloatingOpen(false)}
                title="Close (Ctrl+J)"
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Workspace Realtime Snapshot Bar */}
          <div
            style={{
              padding: '6px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#9ca3af',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <span>📋 Tasks: <strong style={{ color: '#fff' }}>{activeTaskCount}</strong></span>
            <span>👥 Team: <strong style={{ color: '#fff' }}>{onlineMemberCount} online</strong></span>
            <span>📅 Syncs: <strong style={{ color: '#fff' }}>{meetings.length}</strong></span>
            <span>🔒 Plan: <strong style={{ color: '#38bdf8' }}>Enterprise Pro</strong></span>
          </div>

          {/* Voice Mode Banner (if active) */}
          {voiceMode && (
            <div
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 76, 255, 0.15) 100%)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '3px', height: '14px', background: '#ef4444', borderRadius: '2px', animation: 'pulse 1s infinite alternate' }} />
                  <span style={{ width: '3px', height: '20px', background: '#ef4444', borderRadius: '2px', animation: 'pulse 0.7s infinite alternate' }} />
                  <span style={{ width: '3px', height: '10px', background: '#ef4444', borderRadius: '2px', animation: 'pulse 1.2s infinite alternate' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 500 }}>
                  {isListening ? 'Listening for voice prompt...' : 'Voice mode active'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSend('Show upcoming deadlines and team bandwidth')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Simulate Voice Input
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {chatHistory.map((msg, idx) => {
              const isAi = msg.role === 'ai';

              if (msg.typing) {
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      width: 'fit-content',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#38bdf8' }}>⚡</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                      Ordis is operating workspace...
                    </span>
                  </div>
                );
              }

              const formattedText = formatChatMarkdown(msg.text || '');

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: '90%',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: isAi ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                      background: isAi
                        ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%)'
                        : 'linear-gradient(135deg, #0f4cff 0%, #2563eb 100%)',
                      border: `1px solid ${isAi ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 76, 255, 0.4)'}`,
                      color: '#f9fafb',
                      fontSize: '12.5px',
                      lineHeight: '1.55',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {isAi && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          paddingBottom: '4px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '11px' }}>⚡</span>
                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#38bdf8' }}>Ordis Copilot</span>
                        </div>
                        {msg.time && (
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>{msg.time}</span>
                        )}
                      </div>
                    )}

                    <div
                      dangerouslySetInnerHTML={{ __html: formattedText }}
                      style={{ wordBreak: 'break-word' }}
                    />

                    {/* Interactive Action Card if returned */}
                    {msg.actionCard && <ChatActionCardView card={msg.actionCard} />}
                  </div>

                  {/* Clickable Suggested Follow-Up Chips */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px',
                      }}
                    >
                      {msg.suggestedFollowUps.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          type="button"
                          onClick={() => handleSend(chip)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            borderRadius: '9999px',
                            background: 'rgba(15, 76, 255, 0.12)',
                            color: '#93c5fd',
                            border: '1px solid rgba(15, 76, 255, 0.28)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 76, 255, 0.25)';
                            e.currentTarget.style.borderColor = '#38bdf8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 76, 255, 0.12)';
                            e.currentTarget.style.borderColor = 'rgba(15, 76, 255, 0.28)';
                          }}
                        >
                          {chip} ➔
                        </button>
                      ))}
                    </div>
                  )}

                  {!isAi && msg.time && (
                    <span style={{ fontSize: '10px', color: '#6b7280', alignSelf: 'flex-end', marginTop: '3px' }}>
                      {msg.time}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Command Chips Bar */}
          <div
            style={{
              padding: '6px 14px',
              background: 'rgba(0, 0, 0, 0.45)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {quickPrompts.map((q, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => handleSend(q.prompt)}
                style={{
                  padding: '4px 10px',
                  fontSize: '10.5px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#d1d5db',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Box Footer */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Ordis anything (e.g., 'Create task', 'Schedule sync')..."
              style={{
                flex: 1,
                padding: '9px 12px',
                fontSize: '12.5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                color: '#ffffff',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0f4cff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)')}
            />

            {/* Mic button */}
            <button
              type="button"
              onClick={toggleVoiceMode}
              title="Toggle Voice"
              style={{
                padding: '8px 10px',
                background: voiceMode ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🎙️
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputVal.trim()}
              style={{
                padding: '8px 14px',
                background: inputVal.trim() ? '#0f4cff' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: inputVal.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s ease',
              }}
            >
              ➔
            </button>
          </div>
        </div>
      )}
    </>
  );
}
