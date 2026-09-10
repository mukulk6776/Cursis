'use client';

import React, { useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function NotificationPanel() {
  const {
    notificationsOpen,
    closeNotifications,
    notifications,
    markNotificationsRead,
    setCurrentPage,
  } = useDashboard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeNotifications();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeNotifications]);

  if (!notificationsOpen) return null;

  return (
    <>
      <div
        className="notif-backdrop"
        onClick={closeNotifications}
        aria-label="Close notifications"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
        }}
      />
      <div className="notif-panel open" id="notif-panel" style={{ zIndex: 999 }}>
 <div className="notif-panel-header">
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <h3 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>Notifications</h3>
 <span className="badge badge-brand">
 {notifications.filter((n) => !n.read).length} new
 </span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <button
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '11px', color: 'var(--c-brand)' }}
 onClick={markNotificationsRead}
 >
 Mark all read
 </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={closeNotifications}
            title="Close notifications"
            aria-label="Close notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--c-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
 </div>
 </div>

 <div className="notif-panel-body">
 {notifications.map((n) => (
 <div
 key={n.id}
 className={`notif-item ${n.read ? '' : 'unread'}`}
 onClick={() => {
 if (n.type === 'task') setCurrentPage('tasks');
 else if (n.type === 'meeting') setCurrentPage('meetings');
 else if (n.type === 'project') setCurrentPage('projects');
 else if (n.type === 'team') setCurrentPage('team');
 else if (n.type === 'ai') setCurrentPage('ordis');
 closeNotifications();
 }}
 >
 <div className="notif-item-icon" style={{ background: 'var(--c-gray-100)' }}>
 {n.icon}
 </div>
 <div className="notif-item-content">
 <div
 className="notif-item-text"
 dangerouslySetInnerHTML={{ __html: n.text }}
 />
 <div className="notif-item-time">{n.time}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
    </>
  );
}
