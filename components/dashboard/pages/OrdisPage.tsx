'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Copy,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Sparkles,
  SquarePen,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatChatMarkdown } from '@/lib/dashboard/data';
import ChatActionCardView from '@/components/dashboard/chat/ChatActionCardView';

function OrdisMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" fill="none" aria-hidden="true">
      <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="currentColor" strokeWidth="142" strokeLinecap="round" />
      <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" />
    </svg>
  );
}

function messagePlainText(text: string) {
  if (typeof document === 'undefined') return text.replace(/<[^>]*>?/gm, '').trim();
  const element = document.createElement('div');
  element.innerHTML = formatChatMarkdown(text);
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function conversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function OrdisPage() {
  const {
    chatConversations,
    activeChatId,
    newOrdisChat,
    selectOrdisChat,
    renameOrdisChat,
    deleteOrdisChat,
    chatHistoryReady,
    chatHistoryStatus,
    user,
  } = useDashboard();

  // Desktop sidebar collapse state & mobile drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);

  // Restore saved sidebar state from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cursis_ordis_sidebar_collapsed');
      if (saved === 'true') setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('cursis_ordis_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  const startNewChat = () => {
    newOrdisChat();
    setDraftVersion((value) => value + 1);
    setMobileDrawerOpen(false);
    setRenamingId(null);
    setDeletingId(null);
  };

  const saveRename = (id: string) => {
    if (!renameValue.trim()) return;
    renameOrdisChat(id, renameValue.trim());
    setRenamingId(null);
  };

  const filteredChats = [...chatConversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .filter(
      (chat) =>
        !search.trim() ||
        `${chat.title} ${chat.messages.map((m) => m.text || '').join(' ')}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
    );

  const saveStatus = {
    loading: 'Loading chats…',
    saving: 'Saving…',
    saved: 'All changes saved',
    local: 'Saved locally',
    error: 'Could not sync chats',
  }[chatHistoryStatus];

  return (
    <div id="page-ordis" className="ordis-page">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <button
          type="button"
          className="ordis-mobile-backdrop"
          aria-label="Close conversation history"
          onClick={closeMobileDrawer}
        />
      )}

      {/* Left Sidebar (ChatGPT Minimal Style) */}
      <aside
        id="ordis-history"
        className={`ordis-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${
          mobileDrawerOpen ? 'mobile-open' : ''
        }`}
        aria-label="Ordis conversation history"
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeMobileDrawer();
        }}
      >
        {/* Sidebar Header */}
        <div className="ordis-sidebar-top">
          <div className="ordis-sidebar-brand">
            <div className="ordis-sidebar-logo">
              <OrdisMark size={16} />
            </div>
            <span className="ordis-sidebar-title">Ordis</span>
          </div>

          <div className="ordis-sidebar-top-actions">
            <button
              type="button"
              className="ordis-icon-btn"
              title="Close sidebar"
              aria-label="Close sidebar"
              onClick={toggleSidebar}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        </div>

        {/* New Chat Primary Action */}
        <div className="ordis-sidebar-new-section">
          <button
            type="button"
            className="ordis-new-chat-btn"
            disabled={!chatHistoryReady}
            onClick={startNewChat}
          >
            <span className="ordis-new-chat-left">
              <Plus size={16} aria-hidden="true" />
              <span>New chat</span>
            </span>
            <SquarePen size={14} className="ordis-new-chat-icon" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="ordis-search-box">
          <Search size={14} className="ordis-search-icon" aria-hidden="true" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
          />
          {search && (
            <button
              type="button"
              className="ordis-search-clear"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Conversation List */}
        <div className="ordis-chat-list-wrapper">
          <span className="ordis-chat-list-heading">Recent</span>
          <nav className="ordis-chat-list" aria-label="Saved conversations">
            {!chatHistoryReady ? (
              <p className="ordis-history-empty">Loading conversations…</p>
            ) : filteredChats.length === 0 ? (
              <p className="ordis-history-empty">
                {search.trim() ? 'No matching chats found.' : 'No conversations yet. Start a new chat below.'}
              </p>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`ordis-chat-item ${activeChatId === chat.id ? 'is-active' : ''}`}
                >
                  {renamingId === chat.id ? (
                    <form
                      className="ordis-rename-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveRename(chat.id);
                      }}
                    >
                      <input
                        autoFocus
                        aria-label="Conversation title"
                        maxLength={100}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.stopPropagation();
                            setRenamingId(null);
                          }
                        }}
                      />
                      <div className="ordis-inline-actions">
                        <button type="submit" disabled={!renameValue.trim()}>
                          Save
                        </button>
                        <button type="button" onClick={() => setRenamingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="ordis-chat-select"
                        aria-current={activeChatId === chat.id ? 'page' : undefined}
                        onClick={() => {
                          selectOrdisChat(chat.id);
                          closeMobileDrawer();
                          setRenamingId(null);
                          setDeletingId(null);
                        }}
                        title={chat.title}
                      >
                        <span className="ordis-chat-title">{chat.title}</span>
                        <time dateTime={chat.updatedAt}>{conversationDate(chat.updatedAt)}</time>
                      </button>

                      <div className="ordis-chat-hover-tools">
                        <button
                          type="button"
                          className="ordis-tool-btn"
                          aria-label={`Rename ${chat.title}`}
                          title="Rename"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameValue(chat.title);
                            setRenamingId(chat.id);
                            setDeletingId(null);
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="ordis-tool-btn"
                          aria-label={`Delete ${chat.title}`}
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(chat.id);
                            setRenamingId(null);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}

                  {deletingId === chat.id && (
                    <div
                      className="ordis-delete-popover"
                      role="group"
                      aria-label={`Confirm deleting ${chat.title}`}
                    >
                      <p>Delete this chat?</p>
                      <div className="ordis-inline-actions">
                        <button
                          type="button"
                          className="ordis-delete-confirm-btn"
                          onClick={() => {
                            deleteOrdisChat(chat.id);
                            setDeletingId(null);
                          }}
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => setDeletingId(null)}>
                          Keep
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </nav>
        </div>

        {/* Sidebar Footer / User Status */}
        <div className="ordis-sidebar-footer">
          <div className="ordis-user-profile-pill">
            <div className="ordis-user-avatar">{user.initials || 'U'}</div>
            <div className="ordis-user-info">
              <span className="ordis-user-name">{user.name || 'Workspace User'}</span>
              <span className="ordis-user-status-text">
                {chatHistoryStatus === 'saving' || chatHistoryStatus === 'loading' ? (
                  <LoaderCircle size={11} className="ordis-spin" aria-hidden="true" />
                ) : chatHistoryStatus === 'saved' ? (
                  <Check size={11} aria-hidden="true" style={{ color: '#10b981' }} />
                ) : null}
                <span>{saveStatus}</span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="ordis-main" aria-label="Ordis conversation workspace">
        {/* Minimal ChatGPT Header */}
        <header className="ordis-header">
          <div className="ordis-header-left">
            <button
              type="button"
              className="ordis-header-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Model Badge (ChatGPT style) */}
            <div className="ordis-model-pill" title="Ordis Pro Intelligence Engine">
              <Sparkles size={14} className="ordis-model-spark" aria-hidden="true" />
              <span className="ordis-model-name">Ordis 4.0</span>
            </div>
          </div>

          <div className="ordis-header-right">
            <button
              type="button"
              className="ordis-header-btn"
              disabled={!chatHistoryReady}
              onClick={startNewChat}
              title="New chat"
              aria-label="New chat"
            >
              <SquarePen size={18} />
            </button>
          </div>
        </header>

        {/* Chat Message Stream & Composer */}
        <ConversationPanel key={`${activeChatId || 'new'}:${draftVersion}`} />
      </main>

      {/* Scoped ChatGPT Clean Styles */}
      <style>{`
        .ordis-page {
          position: relative;
          display: flex !important;
          flex-direction: row !important;
          width: 100%;
          height: 100%;
          max-height: 100%;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: #ffffff;
          color: #0d0d0d;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .ordis-page button,
        .ordis-page input,
        .ordis-page textarea {
          font: inherit;
        }

        .ordis-page button {
          cursor: pointer;
        }

        .ordis-page button:disabled {
          cursor: default;
          opacity: 0.45;
        }

        .ordis-page button:focus-visible,
        .ordis-page input:focus-visible,
        .ordis-page textarea:focus-visible {
          outline: 2px solid #FF5500;
          outline-offset: 1px;
        }

        /* ---- Left Sidebar (ChatGPT style) ---- */
        .ordis-sidebar {
          width: 260px;
          flex: 0 0 260px;
          display: flex;
          flex-direction: column;
          background: #F9F9F9;
          border-right: 1px solid #ECECEC;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
          z-index: 50;
        }

        .ordis-sidebar.is-collapsed {
          width: 0 !important;
          flex: 0 0 0 !important;
          border-right: none !important;
          opacity: 0;
          pointer-events: none;
        }

        .ordis-sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 8px;
          flex-shrink: 0;
        }

        .ordis-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .ordis-sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          background: #0A0A0A;
          color: #ffffff;
          border-radius: 8px;
        }

        .ordis-sidebar-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #0A0A0A;
        }

        .ordis-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: #555;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .ordis-icon-btn:hover {
          background: #EAEAEA;
          color: #0A0A0A;
        }

        .ordis-sidebar-new-section {
          padding: 6px 12px 10px;
          flex-shrink: 0;
        }

        .ordis-new-chat-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          background: #ffffff;
          border: 1px solid #E5E5E5;
          border-radius: 10px;
          color: #0d0d0d;
          font-size: 13.5px;
          font-weight: 600;
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ordis-new-chat-btn:hover:not(:disabled) {
          background: #F3F4F6;
          border-color: #D1D5DB;
        }

        .ordis-new-chat-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ordis-new-chat-icon {
          color: #71717A;
        }

        .ordis-search-box {
          margin: 0 12px 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #ffffff;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .ordis-search-icon {
          color: #9CA3AF;
          flex-shrink: 0;
        }

        .ordis-search-box input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 12.5px;
          color: #0d0d0d;
        }

        .ordis-search-box input::placeholder {
          color: #9CA3AF;
        }

        .ordis-search-clear {
          border: none;
          background: transparent;
          padding: 2px;
          color: #71717A;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ordis-chat-list-wrapper {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 4px 6px;
          overflow: hidden;
        }

        .ordis-chat-list-heading {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #9CA3AF;
          padding: 6px 10px 4px;
        }

        .ordis-chat-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 2px 0 8px;
        }

        .ordis-history-empty {
          color: #71717A;
          font-size: 12.5px;
          text-align: center;
          padding: 24px 14px;
          line-height: 1.5;
        }

        .ordis-chat-item {
          display: flex;
          align-items: center;
          border-radius: 8px;
          margin-bottom: 2px;
          position: relative;
          transition: background 0.12s ease;
        }

        .ordis-chat-item:hover {
          background: #EFEFEF;
        }

        .ordis-chat-item.is-active {
          background: #ECECEC;
        }

        .ordis-chat-select {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          text-align: left;
          padding: 9px 10px;
          color: #111827;
        }

        .ordis-chat-title {
          display: block;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.35;
        }

        .ordis-chat-select time {
          display: block;
          font-size: 10.5px;
          color: #71717A;
          margin-top: 2px;
        }

        .ordis-chat-hover-tools {
          display: none;
          align-items: center;
          gap: 2px;
          padding-right: 6px;
        }

        .ordis-chat-item:hover .ordis-chat-hover-tools,
        .ordis-chat-item.is-active .ordis-chat-hover-tools {
          display: flex;
        }

        .ordis-tool-btn {
          border: none;
          background: transparent;
          padding: 5px;
          border-radius: 5px;
          color: #71717A;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s ease;
        }

        .ordis-tool-btn:hover {
          background: #DCDCDC;
          color: #0A0A0A;
        }

        .ordis-rename-form {
          width: 100%;
          padding: 6px 8px;
        }

        .ordis-rename-form input {
          width: 100%;
          padding: 5px 8px;
          border: 1.5px solid #0A0A0A;
          border-radius: 6px;
          font-size: 12.5px;
          background: #ffffff;
        }

        .ordis-inline-actions {
          display: flex;
          gap: 6px;
          margin-top: 6px;
        }

        .ordis-inline-actions button {
          border: 1px solid #D1D5DB;
          background: #ffffff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 500;
        }

        .ordis-delete-popover {
          width: 100%;
          padding: 6px 10px 10px;
          background: #FEE2E2;
          border-radius: 8px;
        }

        .ordis-delete-popover p {
          font-size: 12px;
          font-weight: 600;
          color: #991B1B;
          margin: 2px 0 6px;
        }

        .ordis-delete-confirm-btn {
          background: #DC2626 !important;
          color: #ffffff !important;
          border-color: #DC2626 !important;
          font-weight: 600 !important;
        }

        .ordis-sidebar-footer {
          padding: 10px 12px;
          border-top: 1px solid #ECECEC;
          background: #F9F9F9;
          flex-shrink: 0;
        }

        .ordis-user-profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ordis-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0A0A0A;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .ordis-user-info {
          min-width: 0;
          flex: 1;
        }

        .ordis-user-name {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ordis-user-status-text {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          color: #6B7280;
          margin-top: 1px;
        }

        /* ---- Main Chat Canvas (ChatGPT style) ---- */
        .ordis-main {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          min-height: 0;
          height: 100%;
          background: #ffffff;
          overflow: hidden;
          position: relative;
        }

        /* Slim ChatGPT Topbar */
        .ordis-header {
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid #F0F0F0;
          background: #ffffff;
          flex-shrink: 0;
          z-index: 10;
        }

        .ordis-header-left,
        .ordis-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ordis-header-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: #4B5563;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .ordis-header-btn:hover {
          background: #F3F4F6;
          color: #0A0A0A;
        }

        .ordis-model-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: default;
          font-size: 15px;
          font-weight: 600;
          color: #0D0D0D;
          letter-spacing: -0.01em;
        }

        .ordis-model-spark {
          color: #FF5500;
        }

        /* ---- Message Stream ---- */
        .ordis-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
        }

        /* ChatGPT Empty State */
        .ordis-welcome {
          margin: auto;
          width: 100%;
          max-width: 720px;
          padding: 40px 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .ordis-welcome-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0A0A0A;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 4px;
        }

        .ordis-welcome h1 {
          font-size: clamp(24px, 4vw, 30px);
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #0D0D0D;
          margin: 14px 0 28px;
        }

        .ordis-starters {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
        }

        .ordis-starter {
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 14px 16px;
          background: #ffffff;
          text-align: left;
          color: #111827;
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }

        .ordis-starter:hover:not(:disabled) {
          background: #F9FAFB;
          border-color: #D1D5DB;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }

        .ordis-starter strong {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 3px;
        }

        .ordis-starter span {
          display: block;
          font-size: 12px;
          color: #6B7280;
          line-height: 1.4;
        }

        /* Active Chat Message Stream */
        .ordis-message-list {
          max-width: 768px;
          margin: 0 auto;
          width: 100%;
          padding: 24px 20px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ordis-message {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .ordis-message.user-message {
          align-items: flex-end;
        }

        .ordis-user-bubble {
          max-width: 78%;
          background: #F4F4F4;
          color: #0D0D0D;
          border-radius: 22px;
          padding: 12px 18px;
          font-size: 15px;
          line-height: 1.5;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .ordis-ai-message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .ordis-ai-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ordis-ai-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0A0A0A;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ordis-ai-name {
          font-size: 13px;
          font-weight: 700;
          color: #0A0A0A;
        }

        .ordis-ai-body {
          font-size: 15px;
          line-height: 1.7;
          color: #1F2937;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .ordis-ai-body p {
          margin: 0 0 12px;
        }

        .ordis-ai-body p:last-child {
          margin-bottom: 0;
        }

        .ordis-ai-body ul,
        .ordis-ai-body ol {
          margin: 8px 0 12px;
          padding-left: 24px;
        }

        .ordis-ai-body li {
          margin-bottom: 4px;
        }

        .ordis-ai-body strong {
          color: #0A0A0A;
          font-weight: 700;
        }

        .ordis-ai-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
        }

        .ordis-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          color: #6B7280;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          transition: all 0.12s ease;
        }

        .ordis-action-btn:hover {
          background: #F3F4F6;
          color: #111827;
        }

        .ordis-action-btn.is-active {
          color: #FF5500;
        }

        .ordis-follow-ups {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }

        .ordis-follow-ups button {
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          background: #F9FAFB;
          padding: 5px 12px;
          color: #374151;
          transition: all 0.12s ease;
        }

        .ordis-follow-ups button:hover:not(:disabled) {
          background: #ffffff;
          border-color: #0A0A0A;
          color: #0A0A0A;
        }

        .ordis-thinking {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6B7280;
          font-size: 14px;
          padding: 8px 0;
        }

        /* ---- ChatGPT Signature Bottom Composer ---- */
        .ordis-composer-area {
          position: relative;
          width: 100%;
          padding: 10px 20px max(14px, env(safe-area-inset-bottom));
          background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 30%, #ffffff 100%);
          flex-shrink: 0;
        }

        .ordis-composer-wrapper {
          max-width: 768px;
          margin: 0 auto;
          width: 100%;
        }

        .ordis-composer {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: #F4F4F4;
          border: 1px solid #E5E5E5;
          border-radius: 26px;
          padding: 8px 12px 8px 18px;
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ordis-composer:focus-within {
          background: #ffffff;
          border-color: #D1D5DB;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
        }

        .ordis-composer textarea {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #0D0D0D;
          font-size: 15px;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 180px;
          padding: 4px 0;
        }

        .ordis-composer textarea::placeholder {
          color: #8E8E93;
        }

        .ordis-send-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #000000;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.12s ease, opacity 0.15s ease, background 0.15s ease;
        }

        .ordis-send-btn:not(:disabled):hover {
          transform: scale(1.06);
        }

        .ordis-send-btn:disabled {
          background: #E5E5E5;
          color: #9CA3AF;
          opacity: 1;
        }

        .ordis-disclaimer {
          text-align: center;
          font-size: 11px;
          color: #9CA3AF;
          margin: 7px 0 0;
          line-height: 1.4;
        }

        .ordis-mobile-backdrop {
          display: none;
        }

        .ordis-spin {
          animation: ordis-spin 1.2s linear infinite;
          flex-shrink: 0;
        }

        @keyframes ordis-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ---- Responsive Phone & Tablet Breakpoints ---- */
        @media (max-width: 860px) {
          .ordis-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: 280px;
            max-width: 84vw;
            height: 100dvh;
            z-index: 1200;
            transform: translateX(-100%);
            box-shadow: none;
          }

          .ordis-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.18);
          }

          .ordis-mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 1190;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            border: none;
          }

          .ordis-header {
            padding: 0 12px;
          }

          .ordis-message-list {
            padding: 16px 14px 24px;
          }

          .ordis-composer-area {
            padding: 8px 12px max(12px, env(safe-area-inset-bottom));
          }
        }

        @media (max-width: 520px) {
          .ordis-starters {
            grid-template-columns: 1fr;
          }

          .ordis-welcome h1 {
            font-size: 22px;
            margin: 12px 0 20px;
          }

          .ordis-user-bubble {
            max-width: 88%;
          }

          .ordis-composer {
            padding: 7px 10px 7px 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ordis-sidebar {
            transition: none;
          }
          .ordis-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function ConversationPanel() {
  const { chatHistory, sendOrdisMessage, showToast, chatHistoryReady } = useDashboard();
  const [inputVal, setInputVal] = useState('');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const busy = chatHistory.some((m) => m.typing);
  const canSend = chatHistoryReady && !busy;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'end',
    });
  }, [chatHistory]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
  }, [inputVal]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (speechRef.current) {
        speechRef.current.onend = null;
        speechRef.current.onerror = null;
        window.speechSynthesis?.cancel();
      }
    },
    []
  );

  const handleSend = (overrideText?: string) => {
    const text = (overrideText || inputVal).trim();
    if (!text || !canSend) return;
    sendOrdisMessage(text);
    setInputVal('');
  };

  const handleSpeak = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      showToast('Read aloud is not supported in this browser.');
      return;
    }
    if (speechRef.current) {
      speechRef.current.onend = null;
      speechRef.current.onerror = null;
    }
    window.speechSynthesis.cancel();
    if (speakingIdx === index) {
      setSpeakingIdx(null);
      return;
    }
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
    } catch {
      showToast('Could not copy. You can select and copy the text instead.');
    }
  };

  return (
    <>
      <div className="ordis-messages" aria-busy={busy}>
        {chatHistory.length === 0 ? (
          <div className="ordis-welcome">
            <div className="ordis-welcome-mark">
              <OrdisMark size={24} />
            </div>
            <h1>{chatHistoryReady ? 'What can I help with today?' : 'Getting your workspace ready…'}</h1>

            <div className="ordis-starters">
              {[
                {
                  title: 'Find my focus',
                  detail: 'See what needs attention today',
                  prompt: 'Help me decide what to focus on today based on my open deliverables.',
                },
                {
                  title: 'Turn an idea into action',
                  detail: 'Make a practical execution plan together',
                  prompt: 'I have a new initiative. Help me break it down into milestones and tasks.',
                },
                {
                  title: 'Check in on the team',
                  detail: 'Understand workload & bandwidth highlights',
                  prompt: 'How is the team workload looking? Give me the active highlights and capacity.',
                },
                {
                  title: 'Synthesize executive briefing',
                  detail: 'Sprint velocity & dependency blocker audit',
                  prompt: 'Synthesize current sprint velocity, open blockers, and upcoming deadlines.',
                },
              ].map((s) => (
                <button
                  key={s.title}
                  type="button"
                  className="ordis-starter"
                  disabled={!canSend}
                  onClick={() => handleSend(s.prompt)}
                >
                  <strong>{s.title}</strong>
                  <span>{s.detail}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ordis-message-list">
            {chatHistory.map((message, index) => {
              const isAi = message.role === 'ai';
              return (
                <article
                  key={message.id || index}
                  className={`ordis-message ${isAi ? 'ai-message' : 'user-message'}`}
                  aria-label={isAi ? 'Ordis message' : 'Your message'}
                >
                  {isAi ? (
                    <div className="ordis-ai-message">
                      <div className="ordis-ai-header">
                        <div className="ordis-ai-avatar">
                          <OrdisMark size={12} />
                        </div>
                        <span className="ordis-ai-name">Ordis</span>
                      </div>

                      {message.typing ? (
                        <div className="ordis-thinking" role="status">
                          <LoaderCircle size={15} className="ordis-spin" aria-hidden="true" />
                          <span>Thinking…</span>
                        </div>
                      ) : (
                        <>
                          <div
                            className="ordis-ai-body"
                            dangerouslySetInnerHTML={{
                              __html: formatChatMarkdown(message.text || ''),
                            }}
                          />

                          {message.actionCard && (
                            <div style={{ marginTop: 12 }}>
                              <ChatActionCardView card={message.actionCard} />
                            </div>
                          )}

                          <div className="ordis-ai-actions">
                            <button
                              type="button"
                              className={`ordis-action-btn ${copiedIdx === index ? 'is-active' : ''}`}
                              onClick={() => void handleCopy(message.text || '', index)}
                              aria-label={copiedIdx === index ? 'Response copied' : 'Copy response'}
                            >
                              {copiedIdx === index ? <Check size={13} /> : <Copy size={13} />}
                              <span>{copiedIdx === index ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              className={`ordis-action-btn ${speakingIdx === index ? 'is-active' : ''}`}
                              onClick={() => handleSpeak(message.text || '', index)}
                              aria-label={speakingIdx === index ? 'Stop reading' : 'Read aloud'}
                              aria-pressed={speakingIdx === index}
                            >
                              {speakingIdx === index ? <VolumeX size={13} /> : <Volume2 size={13} />}
                              <span>{speakingIdx === index ? 'Stop' : 'Read'}</span>
                            </button>
                          </div>

                          {!!message.suggestedFollowUps?.length && (
                            <div className="ordis-follow-ups" aria-label="Suggested follow-ups">
                              {message.suggestedFollowUps.map((chip, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  disabled={!canSend}
                                  onClick={() => handleSend(chip)}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="ordis-user-bubble">{message.text}</div>
                  )}
                </article>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Floating ChatGPT Composer */}
      <div className="ordis-composer-area">
        <div className="ordis-composer-wrapper">
          <form
            className="ordis-composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              aria-label="Message Ordis"
              disabled={!canSend}
              placeholder={
                !chatHistoryReady
                  ? 'Loading your chats…'
                  : busy
                  ? 'Ordis is responding…'
                  : 'Message Ordis…'
              }
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="submit"
              className="ordis-send-btn"
              disabled={!canSend || !inputVal.trim()}
              aria-label="Send message"
              title="Send message"
            >
              {busy ? (
                <LoaderCircle size={16} className="ordis-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </form>
          <p className="ordis-disclaimer">Ordis can make mistakes. Check important info.</p>
        </div>
      </div>
    </>
  );
}
