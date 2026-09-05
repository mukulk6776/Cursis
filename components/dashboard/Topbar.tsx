'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function Topbar() {
  const {
    openCommandPalette,
    toggleNotifications,
    notifications,
    openProfilePanel,
    user,
    workspaces,
    activeWorkspace,
    switchWorkspace,
    openModal,
    setMobileSidebarOpen,
  } = useDashboard();

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      {/* Mobile Hamburger */}
      <button
        className="sidebar-collapse-btn md:hidden"
        style={{ display: 'flex', marginRight: 'var(--sp-2)' }}
        onClick={() => setMobileSidebarOpen((prev) => !prev)}
        title="Toggle Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Search Button */}
      <div className="topbar-search">
        <button
          className="topbar-search-btn"
          id="topbar-search-btn"
          onClick={openCommandPalette}
        >
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <span className="search-text">Search Tasks, Docs, Projects, Team...</span>
          <span className="search-shortcut">⌘ K</span>
        </button>
      </div>

      {/* Topbar Actions */}
      <div className="topbar-actions">
        {/* Notifications */}
        <button
          className="topbar-action-btn"
          onClick={toggleNotifications}
          title="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && <span className="notif-dot" />}
        </button>

        {/* Agency Services Button */}
        <button
          className="topbar-action-btn"
          title="Agency Services"
          onClick={() => openModal('agency-modal')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* Multi-Workspace Switcher Dropdown */}
        <div
          className="topbar-workspace"
          ref={dropdownRef}
          title="Switch between Public and Custom Client Workspaces"
          onClick={(e) => {
            e.stopPropagation();
            setWorkspaceDropdownOpen((prev) => !prev);
          }}
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none">
            <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#18181b" strokeWidth="142" strokeLinecap="round" fill="none" />
            <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#ff5710" />
          </svg>
          <span className="topbar-workspace-name">{activeWorkspace.shortName}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>

          {/* Dropdown Menu */}
          {workspaceDropdownOpen && (
            <div
              className="workspace-dropdown-menu open"
              id="workspace-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="workspace-dropdown-header">
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-wide)' }}>
                  SWITCH WORKSPACE
                </div>
              </div>
              <div className="workspace-dropdown-list">
                {workspaces.map((w) => {
                  const isActive = w.id === activeWorkspace.id;
                  return (
                    <div
                      key={w.id}
                      className={`workspace-dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        switchWorkspace(w.id);
                        setWorkspaceDropdownOpen(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{w.shortName}</span>
                          <span className={`badge ${w.isCustomClient ? 'badge-brand' : 'badge-neutral'}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                            {w.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {w.tagline}
                        </div>
                      </div>
                      {isActive && (
                        <span style={{ color: 'var(--c-brand)', fontWeight: 'var(--fw-bold)', marginLeft: 'var(--sp-2)' }}>
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="workspace-dropdown-footer">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', fontSize: 'var(--fs-xs)' }}
                  onClick={() => {
                    setWorkspaceDropdownOpen(false);
                    openModal('agency-modal');
                  }}
                >
                  + Request Custom Client Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger */}
        <div
          className="topbar-user"
          onClick={() => openProfilePanel(user.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="topbar-avatar" style={{ background: user.color }}>{user.initials}</div>
        </div>
      </div>
    </header>
  );
}
