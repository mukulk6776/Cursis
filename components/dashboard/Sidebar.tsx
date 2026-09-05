'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { DashboardPageType } from '@/lib/dashboard/types';
import { signOutUser } from '@/lib/auth/firebase';

export default function Sidebar() {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    tasks,
    meetings,
    documents,
    openProfilePanel,
    user,
    activeWorkspace,
  } = useDashboard();

  const handleNav = (page: DashboardPageType) => {
    setCurrentPage(page);
    setMobileSidebarOpen(false);
  };


  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status !== 'completed').length;

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`} id="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => handleNav('home')} style={{ cursor: 'pointer' }}>
          <svg className="sidebar-logo-icon" viewBox="0 0 1024 1024" fill="none">
            <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#18181b" strokeWidth="142" strokeLinecap="round" fill="none" />
            <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#ff5710" />
          </svg>
          <span className="sidebar-logo-text">Cursis</span>
        </div>

        <button
          className="sidebar-collapse-btn"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setSidebarCollapsed((prev) => !prev)}
        >
          {sidebarCollapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {/* Home */}
          <div className={`sidebar-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => handleNav('home')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="sidebar-item-text">Home</span>
          </div>

          {/* Tasks */}
          <div className={`sidebar-item ${currentPage === 'tasks' ? 'active' : ''}`} onClick={() => handleNav('tasks')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="sidebar-item-text">Tasks</span>
            {activeTasksCount > 0 && <span className="sidebar-item-badge">{activeTasksCount}</span>}
          </div>

          {/* Projects */}
          <div className={`sidebar-item ${currentPage === 'projects' ? 'active' : ''}`} onClick={() => handleNav('projects')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span className="sidebar-item-text">Projects</span>
          </div>

          {/* Documents */}
          <div className={`sidebar-item ${currentPage === 'documents' ? 'active' : ''}`} onClick={() => handleNav('documents')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span className="sidebar-item-text">Documents</span>
            {documents.length > 0 && <span className="sidebar-item-badge">{documents.length}</span>}
          </div>

          {/* Team */}
          <div className={`sidebar-item ${currentPage === 'team' ? 'active' : ''}`} onClick={() => handleNav('team')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="sidebar-item-text">Team</span>
          </div>

          {/* Calendar */}
          <div className={`sidebar-item ${currentPage === 'calendar' ? 'active' : ''}`} onClick={() => handleNav('calendar')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="sidebar-item-text">Calendar</span>
          </div>

          {/* Meetings */}
          <div className={`sidebar-item ${currentPage === 'meetings' ? 'active' : ''}`} onClick={() => handleNav('meetings')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </span>
            <span className="sidebar-item-text">Meetings</span>
            {upcomingMeetingsCount > 0 && <span className="sidebar-item-badge">{upcomingMeetingsCount}</span>}
          </div>

          {/* Analytics */}
          <div className={`sidebar-item ${currentPage === 'analytics' ? 'active' : ''}`} onClick={() => handleNav('analytics')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span className="sidebar-item-text">Analytics</span>
          </div>

          {/* Workspace */}
          <div className={`sidebar-item ${currentPage === 'workspace' ? 'active' : ''}`} onClick={() => handleNav('workspace')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <span className="sidebar-item-text">Workspace</span>
          </div>

          {/* Automations */}
          <div className={`sidebar-item ${currentPage === 'automations' ? 'active' : ''}`} onClick={() => handleNav('automations')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className="sidebar-item-text">Automations</span>
          </div>

          {/* Integrations */}
          <div className={`sidebar-item ${currentPage === 'integrations' ? 'active' : ''}`} onClick={() => handleNav('integrations')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                <path d="M18 8l4 4-4 4" />
                <path d="M8 12h14" />
              </svg>
            </span>
            <span className="sidebar-item-text">Integrations</span>
          </div>

          {/* ORDIS */}
          <div className={`sidebar-item ${currentPage === 'ordis' ? 'active' : ''}`} onClick={() => handleNav('ordis')}>
            <span className="sidebar-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
            <span className="sidebar-item-text">ORDIS</span>
          </div>
        </div>

        <div className="sidebar-divider" />

      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className={`sidebar-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => handleNav('settings')}>
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="sidebar-item-text">Settings</span>
        </div>

        <div
          className="sidebar-user"
          onClick={() => openProfilePanel(user.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-3)',
            padding: 'var(--sp-2) var(--sp-3)',
            border: 'var(--border-width) solid var(--border-color)',
            background: 'var(--c-white)',
            cursor: 'pointer',
            marginTop: 'var(--sp-2)',
            userSelect: 'none',
          }}
        >
          <div
            className="sidebar-user-avatar"
            style={{
              width: '32px',
              height: '32px',
              background: user.color || 'var(--c-near-black)',
              color: 'var(--c-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--fs-xs)',
              fontWeight: 'var(--fw-black)',
              flexShrink: 0,
              border: '1px solid var(--c-near-black)',
            }}
          >
            {user.initials}
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div
                className="sidebar-user-name"
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 'var(--fw-bold)',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {user.name}
              </div>
              <div
                className="sidebar-user-role"
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '2px',
                }}
              >
                {user.role}
              </div>
            </div>
          )}
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="sidebar-user-status"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--c-success)',
                  border: '1px solid var(--c-white)',
                  flexShrink: 0,
                }}
                title="Online"
              />
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                style={{
                  padding: '4px',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                }}
                title="Sign Out of Cursis"
                onClick={(e) => {
                  e.stopPropagation();
                  signOutUser();
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
