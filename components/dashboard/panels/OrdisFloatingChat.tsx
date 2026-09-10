'use client';

import React, { useState, useRef, useEffect } from 'react';
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
 geminiApiKey,
 setGeminiApiKey,
 ordisModel,
 setOrdisModel,
 aiEngineStatus,
 showToast,
 } = useDashboard();

 const [inputVal, setInputVal] = useState('');
 const [isExpanded, setIsExpanded] = useState(false);
 const [isListening, setIsListening] = useState(false);
 const [settingsOpen, setSettingsOpen] = useState(false);
 const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || '');
 const [showApiKey, setShowApiKey] = useState(false);
 const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
 const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

 const messagesEndRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const speechRecognitionRef = useRef<any>(null);

 // Sync draft API key if context updates
 useEffect(() => {
 setApiKeyInput(geminiApiKey || '');
 }, [geminiApiKey]);

 // Auto scroll to bottom when chat history changes or opens
 useEffect(() => {
 if (ordisFloatingOpen) {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 inputRef.current?.focus();
 }
 }, [chatHistory, ordisFloatingOpen]);

 // Web Speech API Integration
 useEffect(() => {
 if (typeof window === 'undefined') return;

 const SpeechRecognition =
 (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

 if (voiceMode) {
 if (SpeechRecognition) {
 try {
 const recognition = new SpeechRecognition();
 recognition.continuous = false;
 recognition.interimResults = true;
 recognition.lang = 'en-US';

 recognition.onstart = () => {
 setIsListening(true);
 };

 recognition.onresult = (event: any) => {
 const transcript = Array.from(event.results)
 .map((res: any) => res[0].transcript)
 .join('');
 setInputVal(transcript);
 };

 recognition.onerror = (err: any) => {
 console.warn('Speech recognition warning:', err);
 setIsListening(false);
 };

 recognition.onend = () => {
 setIsListening(false);
 };

 recognition.start();
 speechRecognitionRef.current = recognition;
 } catch (e) {
 console.warn('SpeechRecognition initialization failed:', e);
 setIsListening(true);
 }
 } else {
 // Fallback simulation if browser doesn't support Web Speech
 setIsListening(true);
 const timer = setTimeout(() => {
 setIsListening(false);
 }, 4000);
 return () => clearTimeout(timer);
 }
 } else {
 if (speechRecognitionRef.current) {
 try {
 speechRecognitionRef.current.stop();
 } catch {}
 speechRecognitionRef.current = null;
 }
 setIsListening(false);
 }

 return () => {
 if (speechRecognitionRef.current) {
 try {
 speechRecognitionRef.current.stop();
 } catch {}
 }
 };
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

 const handleSaveApiKey = () => {
 const clean = apiKeyInput.trim();
 setGeminiApiKey(clean);
 showToast(clean ? 'Gemini AI API Key saved successfully ' : 'Switched to Local Engine mode');
 setSettingsOpen(false);
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
 const cleanText = stripHtml(text);
 const utterance = new SpeechSynthesisUtterance(cleanText);
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

  const quickPrompts = ordisPlan === 'basic'
    ? [
        { label: '📊 Status Report', prompt: 'Give me a workspace status report with active deliverables and team status' },
        { label: '⚡ Sprint Status', prompt: 'What is our current sprint status and open blockers?' },
        { label: '👥 Team Workload', prompt: 'What is my team working on and who is online?' },
        { label: 'Hinglish Briefing', prompt: 'Batao kal kya kya deliver karna hai aur kaun kaun online hai?' },
        { label: 'Creator Pipeline', prompt: 'How does the Creator Content Pipeline work and what are the roles?' },
        { label: 'Agile Guidance', prompt: 'How should I prioritize tasks to maximize sprint velocity?' },
      ]
    : [
        { label: '🚀 Add Member & Task', prompt: 'Add a team member and give him xyz task' },
        { label: '⚡ Create Task', prompt: 'Create high-priority task: Deploy payment webhook integration' },
        { label: '📅 Schedule Sync', prompt: 'Schedule urgent team sprint sync tomorrow at 3:00 PM for 30 mins' },
        { label: '💼 Add CRM Deal', prompt: 'Add new CRM deal: Acme Enterprise SaaS for $75,000 in Negotiation' },
        { label: '🛠️ Make CSAT Feature', prompt: 'Make a new feature for Client CSAT & NPS Feedback Surveys with 1-click rating' },
        { label: '🔄 Auto-Assign Rule', prompt: 'Create automation: Auto-assign urgent tasks to Lead Engineer' },
      ];

 const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;
 const onlineMemberCount = employees.filter((e) => e.status === 'online').length;
 const modelDisplayName = ordisModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : ordisModel === 'gemini-2.0-flash' ? 'Gemini 2.0 Flash' : 'Gemini 2.5 Flash';

 return (
 <>
 {ordisFloatingOpen && (
 <div
 style={{
 position: 'fixed',
 bottom: isExpanded ? '16px' : '24px',
 right: isExpanded ? '16px' : '24px',
 width: isExpanded ? 'calc(100vw - 32px)' : '440px',
 maxWidth: isExpanded ? '920px' : '94vw',
 height: isExpanded ? 'calc(100vh - 32px)' : '620px',
 maxHeight: '94vh',
 zIndex: 9999,
 display: 'flex',
 flexDirection: 'column',
 background: 'rgba(9, 13, 22, 0.97)',
 border: '1px solid rgba(255, 255, 255, 0.15)',
 borderRadius: '20px',
 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 45px rgba(15, 76, 255, 0.3)',
 backdropFilter: 'blur(28px)',
 overflow: 'hidden',
 transition: 'width 0.2s ease, height 0.2s ease',
 }}
 >
 {/* Header */}
 <div
 style={{
 padding: '12px 16px',
 background: 'rgba(15, 23, 42, 0.9)',
 borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: '10px',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#0A0A0A',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 85, 0, 0.35)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" strokeWidth="2.2" />
              <path
                d="M12 6.5L13.6 10.4L17.5 12L13.6 13.6L12 17.5L10.4 13.6L6.5 12L10.4 10.4L12 6.5Z"
                fill="#FF5500"
              />
            </svg>
          </div>
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>Ordis AI</span>
 {/* Engine Model Badge */}
 <span
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '4px',
 fontSize: '10px',
 padding: '2px 7px',
 borderRadius: '9999px',
 background: aiEngineStatus === 'gemini' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
 border: `1px solid ${aiEngineStatus === 'gemini' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`,
 color: aiEngineStatus === 'gemini' ? '#34d399' : '#38bdf8',
 fontWeight: 700,
 }}
 >
 <span
 style={{
 width: '5px',
 height: '5px',
 borderRadius: '50%',
 background: aiEngineStatus === 'gemini' ? '#10b981' : '#38bdf8',
 boxShadow: `0 0 6px ${aiEngineStatus === 'gemini' ? '#10b981' : '#38bdf8'}`,
 }}
 />
 {aiEngineStatus === 'gemini' ? modelDisplayName : 'Local Engine'}
 </span>
 </div>
 <div style={{ fontSize: '11px', color: '#9ca3af' }}>
 {activeWorkspace.name} • {ordisPlan === 'paid' ? 'Pro Autonomous Actions' : 'Free Text Reports (ChatGPT Style)'}
 </div>
 </div>
 </div>

 {/* Header Controls */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
 {/* AI Engine Settings Gear */}
 <button
 type="button"
 onClick={() => setSettingsOpen((prev) => !prev)}
 title="AI Settings (API Key & Model)"
 style={{
 padding: '6px 8px',
 borderRadius: '7px',
 background: settingsOpen ? 'rgba(15, 76, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
 border: `1px solid ${settingsOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}`,
 color: settingsOpen ? '#38bdf8' : '#9ca3af',
 cursor: 'pointer',
 fontSize: '12px',
 display: 'flex',
 alignItems: 'center',
 gap: '4px',
 fontWeight: 600,
 }}
 >
 <span style={{ fontSize: '10px' }}>AI</span>
 </button>

          {/* Plan Status Badge */}
          <span
            title={ordisPlan === 'paid' ? 'Pro Plan: Autonomous Mode Active' : 'Basic Plan: Standard Assistant'}
            style={{
              padding: '4px 8px',
              borderRadius: '9999px',
              background: ordisPlan === 'paid' ? '#0A0A0A' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${ordisPlan === 'paid' ? '#FF5500' : 'rgba(255, 255, 255, 0.2)'}`,
              color: ordisPlan === 'paid' ? '#FF5500' : '#ffffff',
              fontSize: '9.5px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.03em',
            }}
          >
            <span>{ordisPlan === 'paid' ? 'PRO' : 'BASIC'}</span>
          </span>

 {/* Voice Mode Toggle */}
 <button
 type="button"
 onClick={toggleVoiceMode}
 title={voiceMode ? 'Voice Mode Active' : 'Enable Voice Mode'}
 style={{
 padding: '6px',
 borderRadius: '6px',
 background: voiceMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
 border: `1px solid ${voiceMode ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
 color: voiceMode ? '#f87171' : '#9ca3af',
 cursor: 'pointer',
 fontSize: '12px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 >
 
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
 {isExpanded ? '' : ''}
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
 
 </button>
 </div>
 </div>

 {/* AI Settings Drawer (Dropdown) */}
 {settingsOpen && (
 <div
 style={{
 padding: '14px 18px',
 background: 'rgba(15, 23, 42, 0.95)',
 borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
 display: 'flex',
 flexDirection: 'column',
 gap: '10px',
 animation: 'fadeIn 0.15s ease',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
 Google Gemini Chatbot Configuration
 </span>
 <span style={{ fontSize: '11px', color: '#9ca3af' }}>
 {geminiApiKey ? 'Custom Key Set ' : 'Using Default/Offline Engine'}
 </span>
 </div>

 {/* API Key Input */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '11px', fontWeight: 600, color: '#d1d5db' }}>
 Gemini API Key:
 </label>
 <div style={{ display: 'flex', gap: '6px' }}>
 <input
 type={showApiKey ? 'text' : 'password'}
 placeholder="AIzaSy... (Leave empty for default/offline engine)"
 value={apiKeyInput}
 onChange={(e) => setApiKeyInput(e.target.value)}
 style={{
 flex: 1,
 padding: '7px 10px',
 fontSize: '11.5px',
 background: 'rgba(0, 0, 0, 0.6)',
 border: '1px solid rgba(255, 255, 255, 0.2)',
 borderRadius: '6px',
 color: '#fff',
 outline: 'none',
 }}
 />
 <button
 type="button"
 onClick={() => setShowApiKey((prev) => !prev)}
 title={showApiKey ? 'Hide Key' : 'Show Key'}
 style={{
 padding: '6px 10px',
 background: 'rgba(255, 255, 255, 0.08)',
 border: '1px solid rgba(255, 255, 255, 0.15)',
 borderRadius: '6px',
 color: '#d1d5db',
 cursor: 'pointer',
 fontSize: '11px',
 }}
 >
 {showApiKey ? '' : ''}
 </button>
 <button
 type="button"
 onClick={handleSaveApiKey}
 style={{
 padding: '6px 12px',
 background: '#0f4cff',
 border: 'none',
 borderRadius: '6px',
 color: '#fff',
 fontWeight: 700,
 cursor: 'pointer',
 fontSize: '11px',
 }}
 >
 Save
 </button>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
 <span style={{ fontSize: '10px', color: '#9ca3af' }}>
 Don't have a key? Get one free at{' '}
 <a
 href="https://aistudio.google.com/apikey"
 target="_blank"
 rel="noopener noreferrer"
 style={{ color: '#38bdf8', textDecoration: 'underline' }}
 >
 aistudio.google.com
 </a>
 </span>
 {geminiApiKey && (
 <button
 type="button"
 onClick={() => {
 setGeminiApiKey('');
 setApiKeyInput('');
 showToast('Reset to default offline engine');
 }}
 style={{
 background: 'none',
 border: 'none',
 color: '#f87171',
 fontSize: '10px',
 cursor: 'pointer',
 textDecoration: 'underline',
 }}
 >
 Clear Key
 </button>
 )}
 </div>
 </div>

 {/* Model Picker */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <label style={{ fontSize: '11px', fontWeight: 600, color: '#d1d5db', whiteSpace: 'nowrap' }}>
 Gemini Model:
 </label>
 <select
 value={ordisModel}
 onChange={(e) => setOrdisModel(e.target.value)}
 style={{
 flex: 1,
 padding: '6px 10px',
 fontSize: '11.5px',
 background: 'rgba(0, 0, 0, 0.6)',
 border: '1px solid rgba(255, 255, 255, 0.2)',
 borderRadius: '6px',
 color: '#fff',
 outline: 'none',
 }}
 >
 <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest & Recommended for Tools)</option>
 <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning & Complex Planning)</option>
 <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen Multimodal)</option>
 </select>
 </div>
 </div>
 )}

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
 <span> Tasks: <strong style={{ color: '#fff' }}>{activeTaskCount}</strong></span>
 <span> Team: <strong style={{ color: '#fff' }}>{onlineMemberCount} online</strong></span>
 <span> Syncs: <strong style={{ color: '#fff' }}>{meetings.length}</strong></span>
 <span>Mode: <strong style={{ color: '#38bdf8' }}>{aiEngineStatus === 'gemini' ? 'Gemini 2.5 AI' : 'Local Engine'}</strong></span>
 </div>

 {/* Voice Mode Banner (if active) */}
 {voiceMode && (
 <div
 style={{
 padding: '10px 16px',
 background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 76, 255, 0.15) 100%)',
 borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
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
 <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 600 }}>
 {isListening ? 'Listening to voice prompt... speak now' : 'Voice mode ready'}
 </span>
 </div>
 <button
 type="button"
 onClick={() => handleSend('Show upcoming deadlines and team bandwidth')}
 style={{
 padding: '4px 10px',
 fontSize: '10px',
 fontWeight: 700,
 background: '#ef4444',
 color: '#fff',
 border: 'none',
 borderRadius: '4px',
 cursor: 'pointer',
 }}
 >
 Simulate Voice Query
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
 border: '1px solid rgba(56, 189, 248, 0.3)',
 boxShadow: '0 0 15px rgba(15, 76, 255, 0.2)',
 }}
 >
 <span style={{ fontSize: '12px', color: '#93c5fd', fontStyle: 'italic' }}>
 {aiEngineStatus === 'gemini' ? 'Ordis (Gemini) is thinking & operating workspace...' : 'Ordis is operating workspace...'}
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
 border: `1px solid ${isAi ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 76, 255, 0.5)'}`,
 color: '#f9fafb',
 fontSize: '12.5px',
 lineHeight: '1.55',
 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
 }}
 >
 {isAi && (
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 marginBottom: '8px',
 paddingBottom: '5px',
 borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Ordis Copilot</span>
 <span style={{ fontSize: '9.5px', color: '#9ca3af', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
 {aiEngineStatus === 'gemini' ? 'Gemini 2.5' : 'Local'}
 </span>
 </div>
 
 {/* Audio & Copy Controls */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <button
 type="button"
 onClick={() => handleSpeak(msg.text || '', idx)}
 title={speakingIdx === idx ? 'Stop Speaking' : 'Read Aloud (TTS)'}
 style={{
 background: speakingIdx === idx ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
 border: 'none',
 color: speakingIdx === idx ? '#38bdf8' : '#9ca3af',
 cursor: 'pointer',
 fontSize: '12px',
 padding: '2px 4px',
 borderRadius: '4px',
 }}
 >
 {speakingIdx === idx ? '⏹' : ''}
 </button>
 <button
 type="button"
 onClick={() => handleCopy(msg.text || '', idx)}
 title="Copy text"
 style={{
 background: 'transparent',
 border: 'none',
 color: copiedIdx === idx ? '#34d399' : '#9ca3af',
 cursor: 'pointer',
 fontSize: '11px',
 padding: '2px 4px',
 }}
 >
 {copiedIdx === idx ? '' : ''}
 </button>
 {msg.time && (
 <span style={{ fontSize: '10px', color: '#6b7280' }}>{msg.time}</span>
 )}
 </div>
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
 fontWeight: 600,
 borderRadius: '9999px',
 background: 'rgba(15, 76, 255, 0.14)',
 color: '#93c5fd',
 border: '1px solid rgba(15, 76, 255, 0.35)',
 cursor: 'pointer',
 transition: 'all 0.15s ease',
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.background = 'rgba(15, 76, 255, 0.3)';
 e.currentTarget.style.borderColor = '#38bdf8';
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.background = 'rgba(15, 76, 255, 0.14)';
 e.currentTarget.style.borderColor = 'rgba(15, 76, 255, 0.35)';
 }}
 >
 {chip} 
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
 fontWeight: 600,
 borderRadius: '6px',
 background: 'rgba(255, 255, 255, 0.06)',
 color: '#e5e7eb',
 border: '1px solid rgba(255, 255, 255, 0.1)',
 cursor: 'pointer',
 flexShrink: 0,
 transition: 'background 0.15s ease',
 }}
 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
 onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
 >
 {q.label}
 </button>
 ))}
 </div>

 {/* Input Box Footer */}
 <div
 style={{
 padding: '12px 14px',
 background: 'rgba(15, 23, 42, 0.95)',
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
 placeholder={ordisPlan === "paid" ? "Ask Ordis: e.g. Add a team member and give him xyz task..." : "Ask Ordis: e.g. Give me a workspace report, what is our status?..."}
 style={{
 flex: 1,
 padding: '10px 14px',
 fontSize: '12.5px',
 background: 'rgba(0, 0, 0, 0.55)',
 border: '1px solid rgba(255, 255, 255, 0.16)',
 borderRadius: '8px',
 color: '#ffffff',
 outline: 'none',
 }}
 onFocus={(e) => (e.currentTarget.style.borderColor = '#0f4cff')}
 onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)')}
 />

 {/* Mic button */}
 <button
 type="button"
 onClick={toggleVoiceMode}
 title={voiceMode ? 'Voice Mode Active' : 'Start Voice Input'}
 style={{
 padding: '9px 11px',
 background: voiceMode ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
 border: '1px solid rgba(255, 255, 255, 0.12)',
 borderRadius: '8px',
 color: '#fff',
 cursor: 'pointer',
 fontSize: '13px',
 }}
 >
 
 </button>

 {/* Send button */}
 <button
 type="button"
 onClick={() => handleSend()}
 disabled={!inputVal.trim()}
 style={{
 padding: '9px 16px',
 background: inputVal.trim() ? '#0f4cff' : 'rgba(255, 255, 255, 0.1)',
 border: 'none',
 borderRadius: '8px',
 color: '#ffffff',
 fontWeight: 700,
 fontSize: '12.5px',
 cursor: inputVal.trim() ? 'pointer' : 'default',
 transition: 'background 0.15s ease',
 }}
 >
 
 </button>
 </div>
 </div>
 )}
 </>
 );
}
