'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatChatMarkdown } from '@/lib/dashboard/data';
import ChatActionCardView from '@/components/dashboard/chat/ChatActionCardView';

function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

export default function OrdisPage() {
  const {
    chatHistory,
    sendOrdisMessage,
    clearChatHistory,
    user,
    showToast,
  } = useDashboard();

  const [inputVal, setInputVal] = useState('');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputVal]);

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || inputVal).trim();
    if (!textToSend) return;
    sendOrdisMessage(textToSend);
    if (!overrideText) setInputVal('');
  };

  const handleSpeak = (text: string, idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.');
      return;
    }
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = stripHtml(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingIdx(idx);
  };

  const handleCopy = (text: string, idx: number) => {
    const clean = stripHtml(text);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(clean);
      setCopiedIdx(idx);
      showToast('Copied to clipboard');
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const hasMessages = chatHistory.length > 0;

  return (
    <div
      id="page-ordis"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        maxHeight: 'calc(100vh - 64px)',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* ── Minimal Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Ordis icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none">
              <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#ffffff" strokeWidth="142" strokeLinecap="round" fill="none" />
              <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#ff5710" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a1a1a',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              Ordis
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChatHistory}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#999',
            background: 'none',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#666';
            e.currentTarget.style.borderColor = '#ccc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#999';
            e.currentTarget.style.borderColor = '#e5e5e5';
          }}
        >
          Clear chat
        </button>
      </div>

      {/* ── Chat Messages Area ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0',
        }}
      >
        {/* Empty State */}
        {!hasMessages && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '40px 20px',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#f7f7f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 1024 1024" fill="none">
                <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#d1d5db" strokeWidth="142" strokeLinecap="round" fill="none" />
                <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#ff5710" />
              </svg>
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1a1a1a',
                letterSpacing: '-0.02em',
              }}
            >
              How can I help you today?
            </div>
            <p
              style={{
                fontSize: '14px',
                color: '#999',
                textAlign: 'center',
                maxWidth: '420px',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Ask me anything, create tasks, schedule meetings, manage your workspace — I&apos;m connected to your entire Cursis workspace.
            </p>
            {/* Quick action suggestions */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '12px',
                justifyContent: 'center',
                maxWidth: '500px',
              }}
            >
              {[
                'Create a task for the team',
                'Schedule a meeting tomorrow',
                'Show active tasks',
                'What\'s the team workload?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: '#666',
                    background: '#f7f7f8',
                    border: '1px solid #e5e5e5',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#efefef';
                    e.currentTarget.style.borderColor = '#d0d0d0';
                    e.currentTarget.style.color = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f7f7f8';
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px' }}>
            {chatHistory.map((msg, i) => {
              const isAi = msg.role === 'ai';

              /* ── Typing indicator ── */
              if (msg.typing) {
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '20px 0',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 1024 1024" fill="none">
                        <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#ffffff" strokeWidth="142" strokeLinecap="round" fill="none" />
                        <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" />
                      </svg>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 0',
                      }}
                    >
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#c4c4c4',
                            animation: `ordis-dot-pulse 1.2s ease-in-out ${dot * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              const formatted = formatChatMarkdown(msg.text || '');

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredMsgIdx(i)}
                  onMouseLeave={() => setHoveredMsgIdx(null)}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: isAi ? '20px 0' : '16px 0',
                    borderBottom: isAi ? '1px solid #f5f5f5' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  {isAi ? (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 1024 1024" fill="none">
                        <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#ffffff" strokeWidth="142" strokeLinecap="round" fill="none" />
                        <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" />
                      </svg>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#666',
                        marginTop: '2px',
                      }}
                    >
                      {user.initials}
                    </div>
                  )}

                  {/* Message Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Sender name */}
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        marginBottom: '6px',
                      }}
                    >
                      {isAi ? 'Ordis' : 'You'}
                    </div>

                    {/* Message text */}
                    <div
                      className="ordis-msg-content"
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: '#374151',
                        wordBreak: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />

                    {/* Interactive Action Card */}
                    {msg.actionCard && (
                      <div style={{ marginTop: '12px' }}>
                        <ChatActionCardView card={msg.actionCard} />
                      </div>
                    )}

                    {/* Action buttons (visible on hover for AI messages) */}
                    {isAi && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          marginTop: '8px',
                          opacity: hoveredMsgIdx === i ? 1 : 0,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text || '', i)}
                          title="Copy"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: copiedIdx === i ? '#10b981' : '#999',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (copiedIdx !== i) e.currentTarget.style.color = '#666';
                            e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            if (copiedIdx !== i) e.currentTarget.style.color = '#999';
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                          {copiedIdx === i ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.text || '', i)}
                          title={speakingIdx === i ? 'Stop' : 'Read aloud'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: speakingIdx === i ? '#3b82f6' : '#999',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (speakingIdx !== i) e.currentTarget.style.color = '#666';
                            e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            if (speakingIdx !== i) e.currentTarget.style.color = '#999';
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 010 7.07" />
                            <path d="M19.07 4.93a10 10 0 010 14.14" />
                          </svg>
                          {speakingIdx === i ? 'Stop' : 'Listen'}
                        </button>
                      </div>
                    )}

                    {/* Suggested Follow-up Chips */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginTop: '14px',
                        }}
                      >
                        {msg.suggestedFollowUps.map((chip, chipIdx) => (
                          <button
                            key={chipIdx}
                            type="button"
                            onClick={() => handleSend(chip)}
                            style={{
                              padding: '7px 14px',
                              fontSize: '13px',
                              fontWeight: 500,
                              borderRadius: '20px',
                              background: '#f7f7f8',
                              color: '#555',
                              border: '1px solid #e5e5e5',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#efefef';
                              e.currentTarget.style.borderColor = '#d0d0d0';
                              e.currentTarget.style.color = '#333';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f7f7f8';
                              e.currentTarget.style.borderColor = '#e5e5e5';
                              e.currentTarget.style.color = '#555';
                            }}
                          >
                            {chip}
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
        )}
      </div>

      {/* ── Input Bar ── */}
      <div
        style={{
          borderTop: '1px solid #f0f0f0',
          padding: '16px 20px 20px',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '10px',
            background: '#f7f7f8',
            borderRadius: '16px',
            padding: '10px 14px 10px 18px',
            border: '1px solid #e5e5e5',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#c0c0c0';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.04)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e5e5';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Message Ordis..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#1a1a1a',
              resize: 'none',
              minHeight: '24px',
              maxHeight: '160px',
              fontFamily: 'inherit',
              padding: '2px 0',
            }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputVal.trim()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: inputVal.trim() ? '#1a1a1a' : '#e5e5e5',
              border: 'none',
              cursor: inputVal.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19V5M12 5L5 12M12 5L19 12"
                stroke={inputVal.trim() ? '#ffffff' : '#999'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#bbb',
            marginTop: '8px',
          }}
        >
          Ordis can make mistakes. Verify important information.
        </div>
      </div>

      {/* ── Keyframe animation for typing dots ── */}
      <style>{`
        @keyframes ordis-dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .ordis-msg-content p { margin: 0 0 8px 0; }
        .ordis-msg-content p:last-child { margin-bottom: 0; }
        .ordis-msg-content ul, .ordis-msg-content ol { margin: 8px 0; padding-left: 20px; }
        .ordis-msg-content li { margin-bottom: 4px; }
        .ordis-msg-content code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          color: #374151;
        }
        .ordis-msg-content pre {
          background: #f3f4f6;
          padding: 12px 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .ordis-msg-content pre code {
          background: none;
          padding: 0;
        }
        .ordis-msg-content strong { font-weight: 600; color: #1a1a1a; }
        .ordis-msg-content a { color: #3b82f6; text-decoration: none; }
        .ordis-msg-content a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
