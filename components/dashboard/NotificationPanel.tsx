'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function NotificationPanel() {
 const {
 notificationsOpen,
 closeNotifications,
 notifications,
 markNotificationsRead,
 setCurrentPage,
 } = useDashboard();

 if (!notificationsOpen) return null;

 return (
 <div className="notif-panel open" id="notif-panel">
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
 <button className="btn btn-ghost btn-sm" onClick={closeNotifications}>
 
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
 );
}
