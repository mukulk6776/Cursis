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
    setCurrentPage,
    signOut,
  } = useDashboard();

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
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

        {/* User Profile Trigger & Dropdown */}
        <div
          className="topbar-user"
          ref={userDropdownRef}
          onClick={(e) => {
            e.stopPropagation();
            setUserDropdownOpen((prev) => !prev);
          }}
          style={{ cursor: 'pointer', position: 'relative' }}
          title={`${user.name} - Account Options`}
        >
          <div className="topbar-avatar" style={{ background: user.color }}>{user.initials}</div>

          {userDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--c-white)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                borderRadius: '6px',
                padding: '6px',
                zIndex: 100,
                minWidth: '220px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--c-gray-200)', marginBottom: '4px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--c-near-black)' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '12px', gap: '8px', padding: '6px 10px' }}
                onClick={() => {
                  setUserDropdownOpen(false);
                  openProfilePanel(user.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile Drawer
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '12px', gap: '8px', padding: '6px 10px' }}
                onClick={() => {
                  setUserDropdownOpen(false);
                  setCurrentPage('settings');
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
                id="topbar-sign-out-btn"
                className="btn btn-ghost btn-sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontSize: '12px',
                  gap: '8px',
                  padding: '6px 10px',
                  color: 'var(--c-error)',
                  fontWeight: 700,
                }}
                onClick={() => {
                  setUserDropdownOpen(false);
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
      </div>
    </header>
  );
}
