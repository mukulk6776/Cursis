'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Copy, History, LoaderCircle, MessageSquare, Pencil, Plus, Search, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatChatMarkdown } from '@/lib/dashboard/data';
import ChatActionCardView from '@/components/dashboard/chat/ChatActionCardView';

function OrdisMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" fill="none" aria-hidden="true">
      <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="currentColor" strokeWidth="142" strokeLinecap="round" />
      <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#ff5710" />
    </svg>
  );
}

function messagePlainText(text: string) {
  const element = document.createElement('div');
  element.innerHTML = formatChatMarkdown(text);
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function conversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function OrdisPage() {
  const { chatConversations, activeChatId, newOrdisChat, selectOrdisChat, renameOrdisChat, deleteOrdisChat, chatHistoryReady, chatHistoryStatus } = useDashboard();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const historyToggleRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredChats = [...chatConversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .filter((chat) => !search.trim() || `${chat.title} ${chat.messages.map((message) => message.text || '').join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  const activeChat = chatConversations.find((chat) => chat.id === activeChatId);
  const saveStatus = {
    loading: 'Loading your chats…',
    saving: 'Saving…',
    saved: 'Chats saved',
    local: 'Saved on this browser only',
    error: 'Could not save your latest changes',
  }[chatHistoryStatus];

  const closeHistory = () => {
    setHistoryOpen(false);
    historyToggleRef.current?.focus();
  };

  const startChat = () => {
    newOrdisChat();
    setDraftVersion((value) => value + 1);
    setHistoryOpen(false);
    setRenamingId(null);
    setDeletingId(null);
  };

  const saveRename = (id: string) => {
    if (!renameValue.trim()) return;
    renameOrdisChat(id, renameValue.trim());
    setRenamingId(null);
  };

  useEffect(() => {
    if (historyOpen) searchRef.current?.focus();
  }, [historyOpen]);

  return (
    <div id="page-ordis" className="ordis-page">
      {historyOpen && <button type="button" className="ordis-history-overlay" aria-label="Close chat history" onClick={closeHistory} />}
      <aside id="ordis-history" className={`ordis-history ${historyOpen ? 'is-open' : ''}`} aria-label="Ordis chat history" onKeyDown={(event) => {
        if (event.key === 'Escape') closeHistory();
      }}>
        <div className="ordis-history-heading">
          <span><MessageSquare size={16} aria-hidden="true" /> Your chats</span>
          <button type="button" className="ordis-icon-button ordis-mobile-only" onClick={closeHistory} aria-label="Close chat history"><X size={17} /></button>
        </div>
        <button type="button" className="ordis-new-chat" disabled={!chatHistoryReady} onClick={startChat}><Plus size={16} aria-hidden="true" /> New chat</button>
        <label className="ordis-history-search">
          <Search size={15} aria-hidden="true" />
          <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" aria-label="Search chat history" />
          {search && <button type="button" className="ordis-icon-button" aria-label="Clear chat search" onClick={() => setSearch('')}><X size={13} /></button>}
        </label>
        <nav className="ordis-chat-list" aria-label="Saved conversations">
          {!chatHistoryReady ? <p className="ordis-history-empty">Loading your conversations…</p> : filteredChats.length === 0 ? (
            <p className="ordis-history-empty">{search.trim() ? 'No matching chats. Try another word.' : 'A fresh start. Your conversations will appear here.'}</p>
          ) : filteredChats.map((chat) => (
            <div key={chat.id} className={`ordis-chat-entry ${activeChatId === chat.id ? 'is-active' : ''}`}>
              {renamingId === chat.id ? (
                <form className="ordis-rename-form" onSubmit={(event) => { event.preventDefault(); saveRename(chat.id); }}>
                  <input autoFocus aria-label="Conversation title" maxLength={100} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => {
                    if (event.key === 'Escape') { event.stopPropagation(); setRenamingId(null); }
                  }} />
                  <div className="ordis-inline-actions">
                    <button type="submit" disabled={!renameValue.trim()}>Save</button>
                    <button type="button" onClick={() => setRenamingId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <button type="button" className="ordis-chat-select" aria-current={activeChatId === chat.id ? 'page' : undefined} onClick={() => { selectOrdisChat(chat.id); setHistoryOpen(false); setRenamingId(null); setDeletingId(null); }} title={chat.title}>
                    <span className="ordis-chat-title">{chat.title}</span>
                    <time dateTime={chat.updatedAt}>Updated {conversationDate(chat.updatedAt)}</time>
                  </button>
                  <div className="ordis-chat-tools">
                    <button type="button" className="ordis-icon-button" aria-label={`Rename ${chat.title}`} title="Rename chat" onClick={() => { setRenameValue(chat.title); setRenamingId(chat.id); setDeletingId(null); }}><Pencil size={13} /></button>
                    <button type="button" className="ordis-icon-button" aria-label={`Delete ${chat.title}`} title="Delete chat" onClick={() => { setDeletingId(chat.id); setRenamingId(null); }}><Trash2 size={13} /></button>
                  </div>
                </>
              )}
              {deletingId === chat.id && (
                <div className="ordis-delete-confirm" role="group" aria-label={`Confirm deleting ${chat.title}`}>
                  <p>Delete this conversation?</p>
                  <div className="ordis-inline-actions">
                    <button type="button" className="ordis-delete-button" onClick={() => { deleteOrdisChat(chat.id); setDeletingId(null); }}>Delete</button>
                    <button type="button" onClick={() => setDeletingId(null)}>Keep chat</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className={`ordis-save-status ${chatHistoryStatus === 'error' ? 'has-error' : ''}`} role="status">
          {chatHistoryStatus === 'saving' || chatHistoryStatus === 'loading' ? <LoaderCircle size={13} className="ordis-spin" aria-hidden="true" /> : chatHistoryStatus === 'saved' ? <Check size={13} aria-hidden="true" /> : null}
          <span>{saveStatus}</span>
        </div>
      </aside>

      <main className="ordis-main" aria-label="Ordis conversation">
        <header className="ordis-header">
          <div className="ordis-header-title">
            <button ref={historyToggleRef} type="button" className="ordis-icon-button ordis-mobile-only" aria-label="Open chat history" aria-expanded={historyOpen} aria-controls="ordis-history" onClick={() => setHistoryOpen(true)}><History size={19} /></button>
            <div className="ordis-avatar"><OrdisMark /></div>
            <div className="ordis-header-label"><strong>Ordis</strong><span title={activeChat?.title}>{activeChat?.title || 'A little clarity for your day'}</span></div>
          </div>
          <button type="button" className="ordis-header-new" disabled={!chatHistoryReady} onClick={startChat}><Plus size={15} aria-hidden="true" /> New chat</button>
        </header>
        <ConversationPanel key={`${activeChatId || 'new'}:${draftVersion}`} />
      </main>

      <style>{`
        .ordis-page { position: relative; display: flex; height: calc(100dvh - 64px); max-height: calc(100dvh - 64px); min-height: 0; overflow: hidden; background: #fff; color: #222; }
        .ordis-page button, .ordis-page input, .ordis-page textarea { font: inherit; }
        .ordis-page button { cursor: pointer; }
        .ordis-page button:disabled { cursor: default; opacity: .5; }
        .ordis-page button:focus-visible, .ordis-page input:focus-visible, .ordis-page textarea:focus-visible { outline: 2px solid #e76327; outline-offset: 3px; }
        .ordis-history { width: 250px; flex: 0 0 250px; display: flex; flex-direction: column; padding: 20px 12px 12px; border-right: 1px solid #eae8e4; background: #f8f8f6; min-height: 0; }
        .ordis-history-heading { display: flex; justify-content: space-between; align-items: center; padding: 0 8px 18px; }
        .ordis-history-heading > span { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
        .ordis-new-chat { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 39px; border: 1px solid #dedcd8; border-radius: 9px; background: #fff; font-size: 13px !important; font-weight: 550 !important; color: #292929; }
        .ordis-new-chat:hover:not(:disabled), .ordis-header-new:hover:not(:disabled) { background: #f0efec; }
        .ordis-history-search { margin: 16px 2px 14px; display: flex; align-items: center; gap: 7px; color: #777; }
        .ordis-history-search input { width: 100%; min-width: 0; padding: 6px 0; background: transparent; border: none; color: #333; font-size: 12px; }
        .ordis-history-search input::placeholder { color: #747474; }
        .ordis-chat-list { flex: 1; min-height: 0; overflow-y: auto; padding: 3px 0; }
        .ordis-history-empty { color: #727272; font-size: 12px; line-height: 1.7; padding: 16px 10px; margin: 0; }
        .ordis-chat-entry { display: flex; flex-wrap: wrap; align-items: center; border-radius: 9px; margin-bottom: 3px; }
        .ordis-chat-entry:hover { background: #efeeeb; }
        .ordis-chat-entry.is-active { background: #eae8e3; }
        .ordis-chat-select { flex: 1; min-width: 0; border: none; text-align: left; background: transparent; color: #333; padding: 11px 8px; }
        .ordis-chat-title { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; font-weight: 550; }
        .ordis-chat-select time { display: block; margin-top: 4px; font-size: 10px; color: #777; }
        .ordis-chat-tools { display: flex; padding-right: 4px; gap: 1px; }
        .ordis-icon-button { display: inline-flex; justify-content: center; align-items: center; border: none; border-radius: 6px; background: transparent; color: #666; padding: 6px; flex-shrink: 0; }
        .ordis-icon-button:hover { background: #e0ded9; color: #202020; }
        .ordis-rename-form { width: 100%; padding: 8px; }
        .ordis-rename-form input { width: 100%; padding: 7px; border: 1px solid #cfcac1; border-radius: 5px; background: #fff; color: #222; font-size: 12px; }
        .ordis-inline-actions { display: flex; gap: 6px; margin-top: 7px; }
        .ordis-inline-actions button { border: 1px solid #d8d5ce; background: #fff; color: #444; border-radius: 5px; padding: 4px 8px; font-size: 11px; }
        .ordis-delete-confirm { width: 100%; padding: 0 8px 10px; }
        .ordis-delete-confirm p { font-size: 12px; margin: 3px 0; color: #555; }
        .ordis-inline-actions .ordis-delete-button { background: #fff2ef; border-color: #e4b4a8; color: #a62e1d; }
        .ordis-save-status { display: flex; align-items: center; gap: 6px; padding: 13px 7px 3px; border-top: 1px solid #e9e7e2; font-size: 10px; line-height: 1.5; color: #6a6a65; margin-top: 10px; }
        .ordis-save-status.has-error { color: #a53823; }
        .ordis-main { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }
        .ordis-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 15px 24px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
        .ordis-header-title { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .ordis-avatar { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; background: #222; color: #fff; flex-shrink: 0; }
        .ordis-header-label { min-width: 0; }
        .ordis-header-label strong { display: block; font-size: 14px; font-weight: 600; line-height: 1.3; }
        .ordis-header-label > span { display: block; max-width: 380px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #787878; font-size: 11px; margin-top: 3px; }
        .ordis-header-new { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fff; color: #575757; padding: 7px 10px; font-size: 12px !important; flex-shrink: 0; }
        .ordis-messages { flex: 1; min-height: 0; overflow-y: auto; }
        .ordis-welcome { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
        .ordis-welcome-mark { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border: 1px solid #eeece8; border-radius: 18px; background: #faf9f6; color: #292929; margin-bottom: 21px; }
        .ordis-welcome h1 { font-size: clamp(23px, 3vw, 29px); font-weight: 550; line-height: 1.3; letter-spacing: -.035em; margin: 0 0 12px; color: #252525; }
        .ordis-welcome > p { max-width: 395px; margin: 0; color: #717171; font-size: 14px; line-height: 1.7; }
        .ordis-starters { width: 100%; max-width: 470px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 27px; }
        .ordis-starter { border: 1px solid #e9e7e2; border-radius: 12px; padding: 13px 15px; background: #fff; text-align: left; color: #444; }
        .ordis-starter:hover:not(:disabled) { background: #faf9f6; border-color: #d8d3ca; }
        .ordis-starter strong { display: block; font-size: 12px; font-weight: 550; margin-bottom: 4px; }
        .ordis-starter span { display: block; color: #777; font-size: 11px; }
        .ordis-message-list { max-width: 800px; margin: 0 auto; padding: 20px 28px 32px; }
        .ordis-message { display: flex; align-items: flex-start; gap: 12px; padding: 20px 0; }
        .ordis-message + .ordis-message { border-top: 1px solid #f5f5f5; }
        .ordis-message-avatar { width: 28px; height: 28px; margin-top: 1px; border-radius: 50%; }
        .ordis-user-avatar { background: #ebeae6; color: #63635e; font-size: 10px; font-weight: 600; }
        .ordis-message-body { flex: 1; min-width: 0; }
        .ordis-message-author { font-size: 12px; font-weight: 600; margin-bottom: 7px; color: #252525; }
        .ordis-msg-content { font-size: 14px; line-height: 1.8; color: #374151; overflow-wrap: anywhere; }
        .ordis-msg-content p { margin: 0 0 10px; }
        .ordis-msg-content p:last-child { margin-bottom: 0; }
        .ordis-msg-content ul, .ordis-msg-content ol { margin: 10px 0; padding-left: 22px; }
        .ordis-msg-content li { margin-bottom: 5px; }
        .ordis-msg-content code { background: #f3f4f6; padding: 2px 5px; border-radius: 4px; font-size: 13px; color: #374151; }
        .ordis-msg-content pre { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
        .ordis-msg-content pre code { background: none; padding: 0; }
        .ordis-msg-content strong { font-weight: 600; color: #1a1a1a; }
        .ordis-msg-content a { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; }
        .ordis-message-actions { display: flex; gap: 2px; margin-top: 10px; }
        .ordis-message-actions button { display: flex; align-items: center; gap: 5px; padding: 5px 8px; font-size: 11px; border: none; border-radius: 6px; background: transparent; color: #727272; }
        .ordis-message-actions button:hover { background: #f3f3f1; color: #303030; }
        .ordis-message-actions button.is-active { color: #a8441d; }
        .ordis-follow-ups { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; }
        .ordis-follow-ups button { font-size: 12px; border: 1px solid #e5e5e3; border-radius: 18px; background: #f8f8f6; padding: 7px 12px; color: #555; text-align: left; }
        .ordis-follow-ups button:hover:not(:disabled) { background: #eeede9; }
        .ordis-thinking { display: flex; align-items: center; gap: 7px; color: #777; padding: 5px 0; font-size: 12px; }
        .ordis-composer-area { padding: 14px 24px 15px; background: #fff; flex-shrink: 0; }
        .ordis-composer { max-width: 748px; margin: 0 auto; display: flex; align-items: flex-end; gap: 10px; background: #f8f8f6; border: 1px solid #e4e3df; border-radius: 16px; padding: 12px 12px 12px 17px; box-shadow: 0 2px 6px #00000003; }
        .ordis-composer:focus-within { border-color: #bcb8af; box-shadow: 0 0 0 2px #00000004; }
        .ordis-composer textarea { width: 100%; min-width: 0; flex: 1; resize: none; min-height: 25px; max-height: 160px; border: none; outline: none; background: transparent; color: #252525; line-height: 1.6; font-size: 14px; padding: 2px 0; }
        .ordis-composer textarea::placeholder { color: #7b7b77; }
        .ordis-composer .ordis-send { flex-shrink: 0; width: 33px; height: 33px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 10px; background: #242424; color: #fff; }
        .ordis-composer .ordis-send:disabled { background: #e3e2de; color: #84847f; opacity: 1; }
        .ordis-composer-note { text-align: center; font-size: 10px; color: #767671; margin: 9px 0 0; line-height: 1.5; }
        .ordis-mobile-only, .ordis-history-overlay { display: none; }
        .ordis-spin { animation: ordis-spin 1.5s linear infinite; flex-shrink: 0; }
        @keyframes ordis-spin { to { transform: rotate(360deg); } }
        @media (max-width: 1050px) { .ordis-history { width: 220px; flex-basis: 220px; } }
        @media (max-width: 800px) {
          .ordis-mobile-only { display: inline-flex; }
          .ordis-history { display: none; position: absolute; top: 0; bottom: 0; left: 0; z-index: 3; width: min(285px, calc(100% - 42px)); box-shadow: 8px 0 32px #00000016; }
          .ordis-history.is-open { display: flex; }
          .ordis-history-overlay { display: block; position: absolute; inset: 0; z-index: 2; border: none; background: #00000030; }
          .ordis-header { padding: 13px 15px; }
          .ordis-header-title { gap: 8px; }
          .ordis-message-list { padding: 12px 18px 25px; }
          .ordis-composer-area { padding: 12px 14px; }
          .ordis-header-label > span { max-width: 190px; }
        }
        @media (max-width: 420px) {
          .ordis-header > .ordis-header-new { font-size: 11px !important; padding: 7px; }
          .ordis-header-label > span { max-width: 120px; }
          .ordis-starters { grid-template-columns: 1fr; }
          .ordis-welcome { padding: 30px 20px; }
        }
        @media (prefers-reduced-motion: reduce) { .ordis-spin { animation: none; } }
      `}</style>
    </div>
  );
}

function ConversationPanel() {
  const { chatHistory, sendOrdisMessage, user, showToast, chatHistoryReady } = useDashboard();
  const [inputVal, setInputVal] = useState('');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const busy = chatHistory.some((message) => message.typing);
  const canSend = chatHistoryReady && !busy;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'end' });
  }, [chatHistory]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
  }, [inputVal]);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    if (speechRef.current) {
      speechRef.current.onend = null;
      speechRef.current.onerror = null;
      window.speechSynthesis?.cancel();
    }
  }, []);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText || inputVal).trim();
    if (!text || !canSend) return;
    sendOrdisMessage(text);
    setInputVal('');
  };

  const handleSpeak = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) { showToast('Read aloud is not supported in this browser.'); return; }
    if (speechRef.current) { speechRef.current.onend = null; speechRef.current.onerror = null; }
    window.speechSynthesis.cancel();
    if (speakingIdx === index) { setSpeakingIdx(null); return; }
    const utterance = new SpeechSynthesisUtterance(messagePlainText(text));
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeakingIdx(index);
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(messagePlainText(text));
      if (copyTimer.current) clearTimeout(copyTimer.current);
      setCopiedIdx(index);
      copyTimer.current = setTimeout(() => setCopiedIdx(null), 2000);
    } catch { showToast('Could not copy. You can select and copy the message instead.'); }
  };

  return (
    <>
      <div className="ordis-messages" aria-busy={busy}>
        {chatHistory.length === 0 ? (
          <div className="ordis-welcome">
            <div className="ordis-welcome-mark"><OrdisMark size={29} /></div>
            <h1>{chatHistoryReady ? 'What’s on your mind?' : 'Getting your chats ready…'}</h1>
            <p>Make a plan, get unstuck, or just talk it through. I’m here to help you move things forward.</p>
            <div className="ordis-starters">
              {[
                { title: 'Find my focus', detail: 'See what needs attention', prompt: 'Help me decide what to focus on today based on my tasks.' },
                { title: 'Turn an idea into action', detail: 'Make a simple plan together', prompt: 'I have an idea. Help me turn it into a practical plan.' },
                { title: 'Check in on the team', detail: 'Understand the workload', prompt: 'How is the team workload looking? Give me the highlights.' },
                { title: 'Talk something through', detail: 'A fresh perspective helps', prompt: 'I could use a sounding board. Can we talk something through?' },
              ].map((suggestion) => (
                <button key={suggestion.title} type="button" className="ordis-starter" disabled={!canSend} onClick={() => handleSend(suggestion.prompt)}><strong>{suggestion.title}</strong><span>{suggestion.detail}</span></button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ordis-message-list">
            {chatHistory.map((message, index) => {
              const isAi = message.role === 'ai';
              return (
                <article key={message.id || index} className="ordis-message" aria-label={isAi ? 'Ordis message' : 'Your message'}>
                  <div className={`ordis-avatar ordis-message-avatar ${isAi ? '' : 'ordis-user-avatar'}`}>{isAi ? <OrdisMark size={14} /> : user.initials}</div>
                  <div className="ordis-message-body">
                    <div className="ordis-message-author">{isAi ? 'Ordis' : 'You'}</div>
                    {message.typing ? <div className="ordis-thinking" role="status"><LoaderCircle size={14} className="ordis-spin" aria-hidden="true" /> Thinking it through…</div> : (
                      <>
                        <div className="ordis-msg-content" dangerouslySetInnerHTML={{ __html: formatChatMarkdown(message.text || '') }} />
                        {message.actionCard && <div style={{ marginTop: 12 }}><ChatActionCardView card={message.actionCard} /></div>}
                        {isAi && (
                          <div className="ordis-message-actions">
                            <button type="button" onClick={() => void handleCopy(message.text || '', index)} aria-label={copiedIdx === index ? 'Response copied' : 'Copy response'} className={copiedIdx === index ? 'is-active' : ''}>{copiedIdx === index ? <Check size={13} /> : <Copy size={13} />}{copiedIdx === index ? 'Copied' : 'Copy'}</button>
                            <button type="button" onClick={() => handleSpeak(message.text || '', index)} aria-label={speakingIdx === index ? 'Stop reading response' : 'Read response aloud'} aria-pressed={speakingIdx === index} className={speakingIdx === index ? 'is-active' : ''}>{speakingIdx === index ? <VolumeX size={14} /> : <Volume2 size={14} />}{speakingIdx === index ? 'Stop' : 'Listen'}</button>
                          </div>
                        )}
                        {!!message.suggestedFollowUps?.length && (
                          <div className="ordis-follow-ups" aria-label="Suggested replies">
                            {message.suggestedFollowUps.map((chip, chipIndex) => <button key={chipIndex} type="button" disabled={!canSend} onClick={() => handleSend(chip)}>{chip}</button>)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>
      <div className="ordis-composer-area">
        <form className="ordis-composer" onSubmit={(event) => { event.preventDefault(); handleSend(); }}>
          <textarea ref={inputRef} rows={1} aria-label="Message Ordis" disabled={!canSend} placeholder={!chatHistoryReady ? 'Loading your chats…' : busy ? 'Ordis is responding…' : 'Message Ordis…'} value={inputVal} onChange={(event) => setInputVal(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); handleSend(); }
          }} />
          <button type="submit" className="ordis-send" disabled={!canSend || !inputVal.trim()} aria-label="Send message" title="Send message">{busy ? <LoaderCircle size={16} className="ordis-spin" /> : <ArrowUp size={18} />}</button>
        </form>
        <p className="ordis-composer-note">Ordis can make mistakes. Check important details.</p>
      </div>
    </>
  );
}
