import React, { useState, useRef, useEffect } from 'react';
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
    documents,
    openProfilePanel,
    user,
    activeWorkspace,
    signOut,
  } = useDashboard();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (sidebarCollapsed) {
      setUserMenuOpen(false);
    }
  }, [sidebarCollapsed]);

  const handleNav = (page: DashboardPageType) => {
    setCurrentPage(page);
    setMobileSidebarOpen(false);
  };

  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status !== 'completed').length;

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}
      id="sidebar"
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => handleNav('home')} style={{ cursor: 'pointer' }}>
          <svg className="sidebar-logo-icon" viewBox="0 0 1024 1024" fill="none" width="28" height="28">
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
          </svg>
          <span className="sidebar-logo-text">Cursis</span>
        </div>

        <button
          className="sidebar-collapse-btn"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setSidebarCollapsed((prev) => !prev)}
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
      <nav className="sidebar-nav">
        {/* Home / Overview */}
        <div
          className={`sidebar-item ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => handleNav('home')}
          title="Overview"
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="sidebar-item-text">Overview</span>
        </div>

        {/* ORDIS AI (Centerpiece) */}
        <div
          className={`sidebar-item ordis-item ${currentPage === 'ordis' ? 'active' : ''}`}
          onClick={() => handleNav('ordis')}
          title="Ordis Workspace Copilot"
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
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" strokeWidth="2.2" />
                <path
                  d="M12 6.5L13.6 10.4L17.5 12L13.6 13.6L12 17.5L10.4 13.6L6.5 12L10.4 10.4L12 6.5Z"
                  fill="#FF5500"
                />
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
        </div>

        <div className="sidebar-divider" />
        {!sidebarCollapsed && <div className="sidebar-section-title">Core Workspace</div>}

        {/* Tasks */}
        <div
          className={`sidebar-item ${currentPage === 'tasks' ? 'active' : ''}`}
          onClick={() => handleNav('tasks')}
          title="Tasks"
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <span className="sidebar-item-text">Tasks</span>
          {activeTasksCount > 0 && <span className="sidebar-item-badge">{activeTasksCount}</span>}
        </div>

        {/* Projects */}
        <div
          className={`sidebar-item ${currentPage === 'projects' ? 'active' : ''}`}
          onClick={() => handleNav('projects')}
          title="Projects"
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
        </div>

        {/* Team */}
        <div
          className={`sidebar-item ${currentPage === 'team' ? 'active' : ''}`}
          onClick={() => handleNav('team')}
          title="Team Management"
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
        </div>

        {/* Calendar */}
        <div
          className={`sidebar-item ${currentPage === 'calendar' ? 'active' : ''}`}
          onClick={() => handleNav('calendar')}
          title="Calendar"
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
        </div>

        {/* Meetings */}
        <div
          className={`sidebar-item ${currentPage === 'meetings' ? 'active' : ''}`}
          onClick={() => handleNav('meetings')}
          title="Meetings"
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          <span className="sidebar-item-text">Meetings</span>
          {upcomingMeetingsCount > 0 && <span className="sidebar-item-badge">{upcomingMeetingsCount}</span>}
        </div>


        <div className="sidebar-divider" />
        {!sidebarCollapsed && <div className="sidebar-section-title">Operations</div>}

        {/* Documents */}
        <div
          className={`sidebar-item ${currentPage === 'documents' ? 'active' : ''}`}
          onClick={() => handleNav('documents')}
          title="Paperwork Studio & Documents"
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <span className="sidebar-item-text">Documents</span>
          {documents?.length > 0 && <span className="sidebar-item-badge">{documents.length}</span>}
        </div>

        {/* Analytics */}
        <div
          className={`sidebar-item ${currentPage === 'analytics' ? 'active' : ''}`}
          onClick={() => handleNav('analytics')}
          title="Analytics"
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span className="sidebar-item-text">Analytics</span>
        </div>
      </nav>

      {/* Sidebar Footer: Settings, User Profile & Sign Out */}
      <div className="sidebar-footer" ref={userMenuRef} style={{ position: 'relative' }}>
        <div
          className={`sidebar-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => handleNav('settings')}
          title="Settings"
          style={{ marginBottom: '4px' }}
        >
          <span className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="sidebar-item-text">Settings</span>
        </div>

        {/* User Card Trigger */}
        <div
          className="sidebar-user"
          id="sidebar-user-trigger"
          onClick={() => {
            if (sidebarCollapsed) {
              setSidebarCollapsed(false);
              setUserMenuOpen(true);
            } else {
              setUserMenuOpen((prev) => !prev);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: sidebarCollapsed ? '0' : '8px',
            padding: sidebarCollapsed ? '6px' : '8px 10px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            border: '1px solid var(--border-color)',
            background: 'var(--c-white)',
            cursor: 'pointer',
            boxShadow: '1px 1px 0 0 var(--border-color)',
            position: 'relative',
          }}
          title={sidebarCollapsed ? 'Expand sidebar & open profile' : `${user.name} (${user.email}) - Click for options`}
        >
          <div
            className="sidebar-user-avatar"
            style={{
              width: '28px',
              height: '28px',
              background: user.color || '#0f4cff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 900,
              flexShrink: 0,
              border: '1px solid #000000',
            }}
          >
            {user.initials}
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ fontSize: '11px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div className="sidebar-user-role" style={{ fontSize: '9px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email || activeWorkspace.name}
              </div>
            </div>
          )}
          {!sidebarCollapsed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-tertiary)' }}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          )}
        </div>

        {/* User Popover / Dropdown Menu */}
        {userMenuOpen && (
          <div
            id="sidebar-user-menu"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '8px',
              right: '8px',
              marginBottom: '8px',
              background: 'var(--c-white)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
              borderRadius: '6px',
              padding: '6px',
              zIndex: 100,
              boxSizing: 'border-box',
              animation: 'userMenuFadeIn 0.15s ease-out',
            }}
          >
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--c-gray-200)', marginBottom: '4px' }}>
              <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--c-near-black)' }}>{user.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-brand" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', gap: '8px', padding: '6px 10px' }}
              onClick={() => {
                setUserMenuOpen(false);
                openProfilePanel(user.id);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              View Profile
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', fontSize: '11px', gap: '8px', padding: '6px 10px' }}
              onClick={() => {
                setUserMenuOpen(false);
                handleNav('settings');
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Workspace Settings
            </button>

            <div style={{ height: '1px', background: 'var(--c-gray-200)', margin: '4px 0' }} />

            <button
              type="button"
              id="sidebar-sign-out-btn"
              className="btn btn-ghost btn-sm"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                fontSize: '11px',
                gap: '8px',
                padding: '6px 10px',
                color: 'var(--c-error)',
                fontWeight: 700,
              }}
              onClick={() => {
                setUserMenuOpen(false);
                signOut();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
