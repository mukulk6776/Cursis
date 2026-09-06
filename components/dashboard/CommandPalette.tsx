'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { DashboardPageType } from '@/lib/dashboard/types';

interface CommandAction {
  id: string;
  group: 'Quick Actions' | 'Navigate';
  icon: string;
  text: string;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette() {
  const {
    commandPaletteOpen,
    closeCommandPalette,
    openModal,
    setCurrentPage,
  } = useDashboard();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const actions: CommandAction[] = [
    // Quick Actions
    {
      id: 'new-task',
      group: 'Quick Actions',
      icon: 'T',
      text: 'Create New Task',
      shortcut: '/task',
      action: () => openModal('task-modal'),
    },
    {
      id: 'new-project',
      group: 'Quick Actions',
      icon: 'P',
      text: 'Create New Project',
      shortcut: '/project',
      action: () => openModal('project-modal'),
    },
    {
      id: 'new-doc',
      group: 'Quick Actions',
      icon: 'D',
      text: 'Upload Document & Run OCR',
      shortcut: '/doc',
      action: () => openModal('document-modal'),
    },
    {
      id: 'agency-req',
      group: 'Quick Actions',
      icon: 'AI',
      text: 'Request Cursis Custom AI Solution',
      shortcut: '/agency',
      action: () => openModal('agency-modal'),
    },
    {
      id: 'new-meeting',
      group: 'Quick Actions',
      icon: 'M',
      text: 'Schedule Meeting',
      shortcut: '/meeting',
      action: () => openModal('meeting-modal'),
    },
    {
      id: 'new-member',
      group: 'Quick Actions',
      icon: 'U',
      text: 'Add Team Member',
      action: () => openModal('invite-modal'),
    },

    // Navigation
    {
      id: 'go-home',
      group: 'Navigate',
      icon: 'H',
      text: 'Go to Overview',
      action: () => setCurrentPage('home'),
    },
    {
      id: 'go-ordis',
      group: 'Navigate',
      icon: 'AI',
      text: 'Ask Ordis Operational Copilot ⚡',
      action: () => setCurrentPage('ordis'),
    },
    {
      id: 'go-tasks',
      group: 'Navigate',
      icon: 'T',
      text: 'Go to Tasks',
      action: () => setCurrentPage('tasks'),
    },
    {
      id: 'go-projects',
      group: 'Navigate',
      icon: 'P',
      text: 'Go to Projects',
      action: () => setCurrentPage('projects'),
    },
    {
      id: 'go-team',
      group: 'Navigate',
      icon: 'U',
      text: 'Go to Team Directory',
      action: () => setCurrentPage('team'),
    },
    {
      id: 'go-calendar',
      group: 'Navigate',
      icon: 'C',
      text: 'Go to Calendar',
      action: () => setCurrentPage('calendar'),
    },
    {
      id: 'go-meetings',
      group: 'Navigate',
      icon: 'M',
      text: 'Go to Meetings',
      action: () => setCurrentPage('meetings'),
    },
    {
      id: 'go-analytics',
      group: 'Navigate',
      icon: 'A',
      text: 'Go to Analytics & Velocity',
      action: () => setCurrentPage('analytics'),
    },
    {
      id: 'go-settings',
      group: 'Navigate',
      icon: 'S',
      text: 'Go to Settings',
      action: () => setCurrentPage('settings'),
    },
  ];

  const filtered = actions.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.text.toLowerCase().includes(q) ||
      (a.shortcut && a.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filtered.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        closeCommandPalette();
      }
    }
  };

  const executeAction = (action: CommandAction) => {
    action.action();
    closeCommandPalette();
  };

  // Group filtered results
  const quickActions = filtered.filter((a) => a.group === 'Quick Actions');
  const navActions = filtered.filter((a) => a.group === 'Navigate');

  return (
    <div
      className="command-palette-overlay active"
      id="command-palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCommandPalette();
      }}
    >
      <div className="command-palette" onKeyDown={handleKeyDown}>
        <div className="command-palette-input-wrapper">
          <span className="command-palette-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            className="command-palette-input"
            id="command-palette-input"
            placeholder="Search tasks, docs, projects, people, or agency solutions..."
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', fontWeight: 'var(--fw-bold)' }}>
            ESC
          </span>
        </div>

        <div className="command-palette-results">
          {filtered.length === 0 ? (
            <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
              No commands matching &quot;{query}&quot;
            </div>
          ) : (
            <>
              {quickActions.length > 0 && (
                <>
                  <div className="command-group-label">Quick Actions</div>
                  {quickActions.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSel = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        className={`command-item ${isSel ? 'selected' : ''}`}
                        onClick={() => executeAction(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className="command-item-icon">{item.icon}</div>
                        <span className="command-item-text">{item.text}</span>
                        {item.shortcut && (
                          <span className="command-item-shortcut">{item.shortcut}</span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {navActions.length > 0 && (
                <>
                  <div className="command-group-label" style={{ marginTop: quickActions.length > 0 ? 'var(--sp-2)' : 0 }}>
                    Navigate
                  </div>
                  {navActions.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSel = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        className={`command-item ${isSel ? 'selected' : ''}`}
                        onClick={() => executeAction(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className="command-item-icon">{item.icon}</div>
                        <span className="command-item-text">{item.text}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        <div className="command-palette-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
