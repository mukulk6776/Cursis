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
 dynamicFeatures,
 ordisModel,
 aiEngineStatus,
 } = useDashboard();

 const [activeView, setActiveView] = useState<'commander' | 'dynamic_features' | 'agents' | 'transparency'>('commander');
 const [inputVal, setInputVal] = useState('');
 const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
 const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
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
 showToast(`Autonomous Agent "${agent.name}" executed successfully `);
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
 showToast('Copied to clipboard ');
 setTimeout(() => setCopiedIdx(null), 2000);
 }
 };

 const dynamicMember = employees.length > 0 ? employees[0].name.split(' ')[0] : 'team';
 const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;
 const onlineMembers = employees.filter((e) => e.status === 'online').length;
 const modelDisplayName = ordisModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : ordisModel === 'gemini-2.0-flash' ? 'Gemini 2.0 Flash' : 'Gemini 2.5 Flash';

 return (
 <div className="page active" id="page-ordis" style={{ display: 'block' }}>
 {/* Page Header */}
 <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
 <div
 style={{
 width: '38px',
 height: '38px',
 background: '#0A0A0A',
 borderRadius: '8px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 border: '2px solid #000000',
 boxShadow: '2.5px 2.5px 0 0 #FF5500',
 flexShrink: 0,
 }}
 >
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
 <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" strokeWidth="2.2" />
 <path
 d="M12 6.5L13.6 10.4L17.5 12L13.6 13.6L12 17.5L10.4 13.6L6.5 12L10.4 10.4L12 6.5Z"
 fill="#FF5500"
 />
 </svg>
 </div>
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <h1 className="page-title" style={{ margin: 0 }}>Ordis Workspace Copilot</h1>
 <span className="badge badge-brand" style={{ fontSize: '10px' }}>
 OPERATIONAL AI CHATBOT
 </span>
 </div>
 <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
 Cursis gives you a workspace. Ordis operates it. Chat naturally, ask questions, or issue natural language commands to control every feature.
 </p>
 </div>
 </div>

 <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        {/* Autonomous Copilot Status Badge */}
        <span
          style={{
            padding: '6px 14px',
            borderRadius: '4px',
            background: '#0A0A0A',
            color: '#FF5500',
            border: '2px solid #000000',
            fontWeight: 900,
            boxShadow: '2.5px 2.5px 0 #000000',
            fontSize: '11px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#FF5500',
            }}
          />
          Autonomous Copilot Active
        </span>
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
 
 </div>
 <div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Tasks in Flight</div>
 <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)' }}>{activeTaskCount} Active / {tasks.length} Total</div>
 </div>
 </div>

 <div className="card" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
 <div style={{ width: '36px', height: '36px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
 
 </div>
 <div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Live Team Activity</div>
 <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)' }}>{onlineMembers} Active Now / {employees.length} Total</div>
 </div>
 </div>

 <div className="card" style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
 <div style={{ width: '36px', height: '36px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
 
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
 background: '#0A0A0A',
 borderRadius: '6px',
 border: '1px solid #000000',
 boxShadow: '1.5px 1.5px 0 0 #FF5500',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 flexShrink: 0,
 }}
 >
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
 <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" strokeWidth="2.2" />
 <path
 d="M12 6.5L13.6 10.4L17.5 12L13.6 13.6L12 17.5L10.4 13.6L6.5 12L10.4 10.4L12 6.5Z"
 fill="#FF5500"
 />
 </svg>
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
 background: isAi ? '#0A0A0A' : 'var(--c-brand)',
 borderRadius: '6px',
 border: isAi ? '1px solid #000000' : 'none',
 boxShadow: isAi ? '1.5px 1.5px 0 0 #FF5500' : 'none',
 color: '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 'var(--fw-bold)',
 fontSize: '11px',
 flexShrink: 0,
 }}
 >
 {isAi ? (
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
 <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" strokeWidth="2.2" />
 <path
 d="M12 6.5L13.6 10.4L17.5 12L13.6 13.6L12 17.5L10.4 13.6L6.5 12L10.4 10.4L12 6.5Z"
 fill="#FF5500"
 />
 </svg>
 ) : (
 user.initials
 )}
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
 {speakingIdx === i ? '⏹ Stop' : ' Listen'}
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
 {copiedIdx === i ? ' Copied' : ' Copy'}
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
 onClick={() => showToast(`Executed: ${act.label} on "${feat.name}" `)}
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
 Tell Ordis Pro to Make Any Other Feature:
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

