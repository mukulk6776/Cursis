'use client';

import React, { useEffect, useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function NotificationPanel() {
  const {
    notificationsOpen,
    closeNotifications,
    notifications,
    markNotificationsRead,
    setCurrentPage,
    acceptInvitation,
    declineInvitation,
  } = useDashboard();

  const [actingInvId, setActingInvId] = useState<string | null>(null);

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

  const handleAccept = async (e: React.MouseEvent, invId: string) => {
    e.stopPropagation();
    setActingInvId(invId);
    try {
      await acceptInvitation(invId);
    } finally {
      setActingInvId(null);
    }
  };

  const handleDecline = async (e: React.MouseEvent, invId: string) => {
    e.stopPropagation();
    setActingInvId(invId);
    try {
      await declineInvitation(invId);
    } finally {
      setActingInvId(null);
    }
  };

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
          {notifications.length === 0 ? (
            <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const isInvite = n.type === 'workspace_invite' || Boolean(n.referenceId && n.referenceId.startsWith('inv_'));
              const inviteStatus = n.invitationData?.status;
              const isPending = isInvite && (!inviteStatus || inviteStatus === 'pending');
              const isActing = actingInvId === n.referenceId;

              return (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? '' : 'unread'}`}
                  onClick={() => {
                    if (isInvite) return;
                    if (n.type === 'task') setCurrentPage('tasks');
                    else if (n.type === 'meeting') setCurrentPage('meetings');
                    else if (n.type === 'project') setCurrentPage('projects');
                    else if (n.type === 'team') setCurrentPage('team');
                    else if (n.type === 'ai') setCurrentPage('ordis');
                    closeNotifications();
                  }}
                  style={{
                    cursor: isInvite ? 'default' : 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    className="notif-item-icon"
                    style={{
                      background: isInvite ? 'rgba(15, 76, 255, 0.1)' : 'var(--c-gray-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--c-brand)',
                    }}
                  >
                    {isInvite ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    ) : n.type === 'team' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    ) : n.type === 'task' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    ) : n.type === 'meeting' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    )}
                  </div>

                  <div className="notif-item-content" style={{ flex: 1 }}>
                    <div
                      className="notif-item-text"
                      dangerouslySetInnerHTML={{ __html: n.text }}
                    />
                    <div className="notif-item-time" style={{ marginTop: '2px' }}>{n.time}</div>

                    {/* Action buttons for workspace invites */}
                    {isInvite && n.referenceId && (
                      <div style={{ marginTop: '8px' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '11px', padding: '4px 12px', height: '28px' }}
                              disabled={isActing}
                              onClick={(e) => handleAccept(e, n.referenceId!)}
                            >
                              {isActing ? 'Joining...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '11px', padding: '4px 10px', height: '28px', color: 'var(--c-error)' }}
                              disabled={isActing}
                              onClick={(e) => handleDecline(e, n.referenceId!)}
                            >
                              Decline
                            </button>
                          </div>
                        ) : inviteStatus === 'accepted' ? (
                          <span className="badge badge-brand" style={{ fontSize: '10px' }}>
                            ✓ Joined Workspace
                          </span>
                        ) : inviteStatus === 'declined' ? (
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            Declined
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            Revoked
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
