import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { DashboardPageType } from '@/lib/dashboard/types';

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
    employees,
  } = useDashboard();

  const handleNav = (page: DashboardPageType) => {
    setCurrentPage(page);
    setMobileSidebarOpen(false);
  };

  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status !== 'completed').length;

  const btnResetStyle: React.CSSProperties = {
    width: '100%',
    background: 'none',
    border: '1px solid transparent',
    textAlign: 'left',
    font: 'inherit',
    cursor: 'pointer',
  };

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}
      id="sidebar"
      aria-label="Sidebar navigation"
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div
          className="sidebar-logo"
          role="button"
          tabIndex={0}
          aria-label="Cursis Home"
          onClick={() => handleNav('home')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNav('home');
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <svg className="sidebar-logo-icon" viewBox="0 0 1024 1024" fill="none" width="28" height="28" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <defs>
              <clipPath id="rounded-logo-sidebar">
                <rect x="0" y="0" width="1024" height="1024" rx="180" ry="180" />
              </clipPath>
            </defs>
            <g clipPath="url(#rounded-logo-sidebar)">
              <rect x="0" y="0" width="1024" height="1024" fill="white" />
              <path
                d="M 545 240 A 282 282 0 1 0 782 566"
                stroke="#000000"
                strokeWidth="142"
                strokeLinecap="round"
                fill="none"
              />
              <rect
                x="625"
                y="196"
                width="156"
                height="156"
                rx="42"
                transform="rotate(-10 703 274)"
                fill="#FF5500"
              />
            </g>
          </svg>
          <span className="sidebar-logo-text">Cursis</span>
        </div>

        <button
          className="sidebar-collapse-btn"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          type="button"
        >
          {sidebarCollapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Core Navigation Items */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        {/* Home / Overview */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => handleNav('home')}
          aria-current={currentPage === 'home' ? 'page' : undefined}
          title="Overview"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="sidebar-item-text">Overview</span>
        </button>

        {/* ORDIS AI (Centerpiece) */}
        <button
          type="button"
          className={`sidebar-item ordis-item ${currentPage === 'ordis' ? 'active' : ''}`}
          onClick={() => handleNav('ordis')}
          aria-current={currentPage === 'ordis' ? 'page' : undefined}
          title="Ordis Workspace Copilot"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <span
              style={{
                width: '22px',
                height: '22px',
                background: '#0A0A0A',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1.5px 1.5px 0 0 #FF5500',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 1024 1024" fill="none">
                <defs>
                  <clipPath id="rounded-logo-ordis">
                    <rect x="0" y="0" width="1024" height="1024" rx="180" ry="180" />
                  </clipPath>
                </defs>
                <g clipPath="url(#rounded-logo-ordis)">
                  <rect x="0" y="0" width="1024" height="1024" fill="#0A0A0A" />
                  <path
                    d="M 545 240 A 282 282 0 1 0 782 566"
                    stroke="#FFFFFF"
                    strokeWidth="142"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <rect
                    x="625"
                    y="196"
                    width="156"
                    height="156"
                    rx="42"
                    transform="rotate(-10 703 274)"
                    fill="#FF5500"
                  />
                </g>
              </svg>
            </span>
          </span>
          <span className="sidebar-item-text" style={{ fontWeight: 900 }}>
            ORDIS AI
          </span>
          {!sidebarCollapsed && (
            <span
              className="badge"
              style={{
                fontSize: '9px',
                fontWeight: 900,
                background: '#FF5500',
                color: '#FFFFFF',
                border: '1px solid #0A0A0A',
                boxShadow: '1px 1px 0 #0A0A0A',
                letterSpacing: '0.04em',
                padding: '2px 6px',
                borderRadius: '9999px',
              }}
            >
              AI
            </span>
          )}
        </button>

        <div className="sidebar-divider" />
        {!sidebarCollapsed && <div className="sidebar-section-title">Core Workspace</div>}

        {/* Tasks */}
        <button type="button" className={`sidebar-item ${currentPage === 'messages' ? 'active' : ''}`} onClick={() => handleNav('messages')} aria-current={currentPage === 'messages' ? 'page' : undefined} title="Channels & Action Dock" style={btnResetStyle}>
          <span className="sidebar-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 19 0Z" /></svg></span>
          <span className="sidebar-item-text">Channels</span>
        </button>
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'tasks' ? 'active' : ''}`}
          onClick={() => handleNav('tasks')}
          aria-current={currentPage === 'tasks' ? 'page' : undefined}
          title="Tasks"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <span className="sidebar-item-text">Tasks</span>
          {activeTasksCount > 0 && <span className="sidebar-item-badge">{activeTasksCount}</span>}
        </button>

        {/* Projects */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'projects' ? 'active' : ''}`}
          onClick={() => handleNav('projects')}
          aria-current={currentPage === 'projects' ? 'page' : undefined}
          title="Projects"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          <span className="sidebar-item-text">Projects</span>
        </button>

        {/* Team */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'team' ? 'active' : ''}`}
          onClick={() => handleNav('team')}
          aria-current={currentPage === 'team' ? 'page' : undefined}
          title="Team Management"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="sidebar-item-text">Team ({employees.length})</span>
        </button>

        {/* Calendar */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'calendar' ? 'active' : ''}`}
          onClick={() => handleNav('calendar')}
          aria-current={currentPage === 'calendar' ? 'page' : undefined}
          title="Calendar"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className="sidebar-item-text">Calendar</span>
        </button>

        {/* Meetings */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'meetings' ? 'active' : ''}`}
          onClick={() => handleNav('meetings')}
          aria-current={currentPage === 'meetings' ? 'page' : undefined}
          title="Meetings"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          <span className="sidebar-item-text">Meetings</span>
          {upcomingMeetingsCount > 0 && <span className="sidebar-item-badge">{upcomingMeetingsCount}</span>}
        </button>

        <div className="sidebar-divider" />
        {!sidebarCollapsed && <div className="sidebar-section-title">Operations</div>}

        {/* Departments Management */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'departments' ? 'active' : ''}`}
          onClick={() => handleNav('departments')}
          aria-current={currentPage === 'departments' ? 'page' : undefined}
          title="Department Management"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <span className="sidebar-item-text">Departments</span>
        </button>

        {/* Documents Management */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'documents' ? 'active' : ''}`}
          onClick={() => handleNav('documents')}
          aria-current={currentPage === 'documents' ? 'page' : undefined}
          title="Document Management"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          <span className="sidebar-item-text">Documents</span>
        </button>

        {/* Analytics */}
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'analytics' ? 'active' : ''}`}
          onClick={() => handleNav('analytics')}
          aria-current={currentPage === 'analytics' ? 'page' : undefined}
          title="Analytics"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span className="sidebar-item-text">Analytics</span>
        </button>
      </nav>

      {/* Sidebar Footer: Settings */}
      <div className="sidebar-footer">
        <button
          type="button"
          className={`sidebar-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => handleNav('settings')}
          aria-current={currentPage === 'settings' ? 'page' : undefined}
          title="Settings"
          style={btnResetStyle}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="sidebar-item-text">Settings</span>
        </button>
      </div>
    </aside>
  );
}
