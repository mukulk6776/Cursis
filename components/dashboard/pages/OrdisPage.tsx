'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatChatMarkdown } from '@/lib/dashboard/data';
import { OrdisAgent, AuditLogItem } from '@/lib/dashboard/types';
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
    geminiApiKey,
    setGeminiApiKey,
    ordisModel,
    setOrdisModel,
    aiEngineStatus,
  } = useDashboard();

  const [activeView, setActiveView] = useState<'commander' | 'dynamic_features' | 'agents' | 'transparency' | 'ai_engine'>('commander');
  const [inputVal, setInputVal] = useState('');
  const [apiKeyDraft, setApiKeyDraft] = useState(geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKeyDraft(geminiApiKey || '');
  }, [geminiApiKey]);

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

  const handleSaveApiKey = () => {
    const clean = apiKeyDraft.trim();
    setGeminiApiKey(clean);
    showToast(clean ? 'Gemini AI API Key saved successfully ✓' : 'Switched to Local Engine mode');
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
      showToast('Copied to clipboard ✓');
      setTimeout(() => setCopiedIdx(null), 2000);
    }
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
          title: 'Hinglish: Sprint Status?',
          desc: 'Bilingual conversational inquiry',
          prompt: 'Batao kal kya kya deliver karna hai aur kaun kaun online hai?',
          icon: '🇮🇳',
          badge: 'Hinglish',
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
          title: 'List Creator Team Roles',
          desc: 'SE, VE, TD, SM, and VO roles and duties',
          prompt: 'List all Creator production team roles and duties',
          icon: '👥',
          badge: 'Team Roles',
        },
      ]
    : [
        {
          title: 'Create High-Priority Task',
          desc: 'Creates task with priority, tags, and date',
          prompt: 'Create high-priority task: Deploy payment webhook integration with Stripe',
          icon: '⚡',
          badge: 'Task Action',
        },
        {
          title: 'Schedule Team Sprint Sync',
          desc: 'Books meeting on calendar with duration',
          prompt: 'Schedule urgent team sprint sync tomorrow at 3:00 PM for 30 mins',
          icon: '📅',
          badge: 'Meeting Sync',
        },
        {
          title: 'Add Enterprise CRM Deal',
          desc: 'Logs deal in pipeline with forecast value',
          prompt: 'Add new CRM deal: Acme Enterprise SaaS for $75,000 in Negotiation',
          icon: '💼',
          badge: 'CRM Deal',
        },
        {
          title: 'Make Feature: CSAT Surveys',
          desc: 'Synthesizes live client feedback collector',
          prompt: 'Make a new feature for Client CSAT & NPS Feedback Surveys with 1-click rating',
          icon: '🚀',
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
          title: 'Create Auto-Assign Automation',
          desc: 'Installs urgent task routing workflow rule',
          prompt: 'Create automation: Auto-assign urgent tasks to Lead Engineer',
          icon: '⚙️',
          badge: 'Automations',
        },
      ];

  const autonomousCapabilities = [
    { tool: 'create_task', name: 'Create Task', icon: '📋', desc: 'Creates new tasks with title, priority (urgent, high, medium, low), assignees, and due dates.', sample: 'Create an urgent task for Alex: Fix auth token refresh bug by tomorrow' },
    { tool: 'update_task_status', name: 'Update Task Status', icon: '✅', desc: 'Transitions tasks across Kanban columns (in_progress, completed, todo, in_review).', sample: 'Mark task "Deploy payment webhook integration" as completed' },
    { tool: 'schedule_meeting', name: 'Schedule Meeting', icon: '📅', desc: 'Adds calendar meetings, syncs, or standups with start time, duration, and attendees.', sample: 'Schedule a 45-minute sprint review meeting with the design team at 4 PM' },
    { tool: 'create_project', name: 'Create Project', icon: '🚀', desc: 'Initializes new projects with category, status, priority, and client name.', sample: 'Create a new client project: "Mobile App Redesign" for client Globex Corp' },
    { tool: 'create_crm_deal', name: 'Add CRM Deal', icon: '💼', desc: 'Logs new sales opportunities with stage, estimated value, and contact company.', sample: 'Add a new CRM deal: "Enterprise Tier Contract" for $95,000 in proposal stage' },
    { tool: 'create_document', name: 'Author Document', icon: '📄', desc: 'Drafts workspace documentation, technical specs, policy sheets, or proposals.', sample: 'Draft a new document titled "API V2 Architecture Specification" under engineering' },
    { tool: 'create_automation', name: 'Install Automation Rule', icon: '⚙️', desc: 'Configures conditional triggers and actions across the workspace.', sample: 'Create automation: when a deal is closed, send a celebration notification' },
    { tool: 'invite_team_member', name: 'Invite Team Member', icon: '👥', desc: 'Dispatches workspace invitations with designated role and department.', sample: 'Invite Sarah Connor (sarah@cursis.io) as Senior Product Designer' },
    { tool: 'navigate_to_page', name: 'Teleport to Page', icon: '🧭', desc: 'Instant navigation to any of the 17 Cursis pages (CRM, Calendar, Tasks, Settings, etc.).', sample: 'Take me to the CRM pipeline page' },
    { tool: 'update_settings', name: 'Update Settings', icon: '🛠️', desc: 'Configures workspace preferences, theme, notification channels, or security.', sample: 'Update workspace settings: enable desktop notifications and set timezone to UTC' },
    { tool: 'create_dynamic_feature', name: 'Synthesize Dynamic Feature', icon: '✨', desc: 'Autonomously builds custom micro-tools and forms on demand with dynamic schemas.', sample: 'Build a new feature for Team Bounty Coins for completing urgent tasks' },
    { tool: 'query_workspace_telemetry', name: 'Workspace Telemetry Audit', icon: '🔍', desc: 'Executes comprehensive system health checks across all workspace datasets.', sample: 'Run deep ambient scan and report all open blockers and revenue totals' },
  ];

  const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;
  const onlineMembers = employees.filter((e) => e.status === 'online').length;
  const modelDisplayName = ordisModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : ordisModel === 'gemini-2.0-flash' ? 'Gemini 2.0 Flash' : 'Gemini 2.5 Flash';

  return (
    <div className="page active" id="page-ordis" style={{ display: 'block' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <h1 className="page-title">Ordis Workspace Copilot</h1>
            <span className="badge badge-brand" style={{ fontSize: '10px' }}>
              OPERATIONAL AI CHATBOT
            </span>
          </div>
          <p className="page-subtitle">
            Cursis gives you a workspace. Ordis operates it. Chat naturally, ask questions, or issue natural language commands to control every feature.
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
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveView('ai_engine')}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>⚙️</span> AI Config
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
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>AI Brain Status</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', color: aiEngineStatus === 'gemini' ? '#10b981' : '#0f4cff' }}>
              {aiEngineStatus === 'gemini' ? `Google ${modelDisplayName}` : 'Local Engine Online'}
            </div>
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
          className={`tab ${activeView === 'ai_engine' ? 'active' : ''}`}
          onClick={() => setActiveView('ai_engine')}
        >
          ⚡ AI Engine & Tools (12 Tools)
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
          {/* AI Status & Engine Header Banner */}
          <div
            className="card"
            style={{
              padding: '12px 18px',
              background: '#090d16',
              border: '2px solid #000',
              boxShadow: '4px 4px 0 #000',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  color: '#fff',
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13.5px' }}>
                    Ordis AI Active Engine: {aiEngineStatus === 'gemini' ? `Google ${modelDisplayName}` : 'Local Engine'}
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      background: aiEngineStatus === 'gemini' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: aiEngineStatus === 'gemini' ? '#34d399' : '#38bdf8',
                      border: `1px solid ${aiEngineStatus === 'gemini' ? '#10b981' : '#38bdf8'}`,
                    }}
                  >
                    ● {aiEngineStatus === 'gemini' ? 'Gemini Cloud Live' : 'Deterministic Local'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  Natural language conversation, Hinglish support, and 12 autonomous workspace tools enabled.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('ai_engine')}
              style={{
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚙️ AI Settings & Tools
            </button>
          </div>

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
                      {aiEngineStatus === 'gemini' ? 'Ordis (Gemini) is executing workspace tools...' : 'Ordis is executing workspace command...'}
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
                    borderRadius: '4px',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'var(--fw-bold)',
                          fontSize: '10px',
                          color: isAi ? 'var(--c-brand)' : 'var(--c-brand-lime)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {isAi ? 'ORDIS OPERATIONAL COPILOT' : `${user.name.toUpperCase()} (YOU)`}
                      </div>

                      {isAi && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.text || '', i)}
                            title={speakingIdx === i ? 'Stop Speaking' : 'Read Aloud (TTS)'}
                            style={{
                              background: speakingIdx === i ? 'rgba(15, 76, 255, 0.15)' : 'none',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 5px',
                            }}
                          >
                            {speakingIdx === i ? '⏹️ Stop' : '🔊 Listen'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.text || '', i)}
                            title="Copy text"
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 5px',
                            }}
                          >
                            {copiedIdx === i ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>
                      )}
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
                placeholder={`Ask Ordis: e.g. 'Create task for ${dynamicMember}: Redesign navbar', 'Schedule sprint sync tomorrow at 3pm', 'Batao kal kaunsa task pending hai'...`}
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
                Send Message →
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
      {/* 4. AI ENGINE & AUTONOMOUS CAPABILITIES (12 Tools) */}
      {/* ========================================================================= */}
      {activeView === 'ai_engine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* AI Settings Header Card */}
          <div className="card" style={{ padding: 'var(--sp-4)', background: '#ffffff', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-brand" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  GOOGLE GEMINI INTELLIGENCE SYSTEM
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>
                  Gemini API & Autonomous Capabilities
                </h3>
                <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                  Ordis is powered by Google Gemini API with native function calling across all 12 core Cursis modules.
                </p>
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1.5px solid #000',
                  background: aiEngineStatus === 'gemini' ? '#dcfce7' : '#fef3c7',
                  color: aiEngineStatus === 'gemini' ? '#15803d' : '#92400e',
                  fontWeight: 900,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>●</span>
                <span>{aiEngineStatus === 'gemini' ? `Connected: ${modelDisplayName}` : 'Local Fallback Engine Active'}</span>
              </div>
            </div>

            {/* API Key & Model Configuration */}
            <div
              style={{
                background: '#f9f9f6',
                border: '1.5px solid #000',
                padding: '16px',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Google Gemini API Key:
                </label>
                <div style={{ display: 'flex', gap: '8px', maxWidth: '650px' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1.5px solid #000',
                      fontSize: '13px',
                      background: '#fff',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((p) => !p)}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '1.5px solid #000', fontWeight: 700 }}
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="btn btn-primary btn-sm"
                    style={{ border: '1.5px solid #000', fontWeight: 900 }}
                  >
                    Save Key
                  </button>
                  {geminiApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiApiKey('');
                        setApiKeyDraft('');
                        showToast('Reset to local engine');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ border: '1.5px solid #000', color: '#dc2626' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                  💡 Get your free API key at{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0f4cff', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Google AI Studio (aistudio.google.com)
                  </a>
                  . If no key is set, Ordis runs seamlessly on the local deterministic engine.
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Model Selection:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'gemini-2.5-flash', title: 'Gemini 2.5 Flash', tag: 'Recommended', desc: 'Sub-second speed, flawless tool invocation & Hinglish support.' },
                    { id: 'gemini-2.5-pro', title: 'Gemini 2.5 Pro', tag: 'Deep Reasoning', desc: 'Complex sprint analysis, multi-stage task dependency planning.' },
                    { id: 'gemini-2.0-flash', title: 'Gemini 2.0 Flash', tag: 'Multimodal', desc: 'Next-gen vision, real-time audio and fast streaming responses.' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setOrdisModel(m.id);
                        showToast(`Switched to ${m.title}`);
                      }}
                      style={{
                        padding: '12px',
                        border: `2px solid ${ordisModel === m.id ? '#0f4cff' : '#000'}`,
                        background: ordisModel === m.id ? 'rgba(15, 76, 255, 0.05)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                        boxShadow: ordisModel === m.id ? '3px 3px 0 #0f4cff' : '2px 2px 0 #000',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 900, fontSize: '13px' }}>{m.title}</span>
                        <span className="badge badge-brand" style={{ fontSize: '9px' }}>{m.tag}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bilingual & Hinglish Highlight Banner */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
              border: '2px solid #000',
              boxShadow: '4px 4px 0 #000',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>🇮🇳</span>
              <h4 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>
                Bilingual & Hinglish Chat Support
              </h4>
            </div>
            <p style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>
              You don&apos;t need to use robotic CLI commands. Ordis understands conversational English and Hinglish seamlessly. Try asking:
              <strong style={{ color: '#9a3412', marginLeft: '6px' }}>&quot;Kal kaunse urgent tasks bache hai?&quot;</strong> or <strong style={{ color: '#9a3412' }}>&quot;Alex ke sath kal dopahar 3 baje sync schedule kardo&quot;</strong>.
            </p>
          </div>

          {/* 12 Core Autonomous Capabilities Grid */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px', color: '#000' }}>
              12 Autonomous Tools Connected to Google Gemini
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {autonomousCapabilities.map((cap) => (
                <div
                  key={cap.tool}
                  className="card"
                  style={{
                    padding: '16px',
                    background: '#fff',
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0 #000',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{cap.icon}</span>
                      <span style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>{cap.name}</span>
                      <code style={{ fontSize: '10px', background: '#eee', padding: '1px 4px', borderRadius: '3px', marginLeft: 'auto' }}>
                        {cap.tool}
                      </code>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#555', lineHeight: 1.4, margin: 0 }}>
                      {cap.desc}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '10.5px', color: '#888', fontStyle: 'italic', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      &quot;{cap.sample}&quot;
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('commander');
                        handleSend(cap.sample);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '10.5px', padding: '4px 10px', border: '1.5px solid #000', flexShrink: 0 }}
                    >
                      Run ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TRANSPARENCY AUDIT LOG VIEW */}
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

