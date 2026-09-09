'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function ProfilePanel() {
 const {
 profilePanelEmployeeId,
 closeProfilePanel,
 getEmployee,
 getTasksForEmployee,
 projects,
 user,
 signOut,
 assignSeatTier,
 premiumSeatLimit,
 premiumSeatsAllocated,
 openModal,
 } = useDashboard();

 if (!profilePanelEmployeeId) return null;

 const emp = getEmployee(profilePanelEmployeeId);
 if (!emp) return null;

 const empTasks = getTasksForEmployee(emp.id);
 const activeTasks = empTasks.filter((t) => t.status !== 'completed');
 const doneTasks = empTasks.filter((t) => t.status === 'completed');
 const empProjects = projects.filter((p) => p.team.includes(emp.id));
 const isPro = emp.planTier === 'premium';

 return (
 <div className="profile-panel open" id="profile-panel">
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: 'var(--sp-4) var(--sp-5)',
 borderBottom: '1px solid var(--border-light)',
 }}
 >
 <h3 style={{ margin: 0 }}>Profile Details</h3>
 <button className="btn btn-ghost btn-sm" onClick={closeProfilePanel}>
 
 </button>
 </div>

 <div className="profile-panel-body">
 {/* Header Avatar & Info */}
 <div style={{ textAlign: 'center', marginBottom: 'var(--sp-5)' }}>
 <div
 className="avatar avatar-2xl"
 style={{ background: emp.color, margin: '0 auto var(--sp-3)' }}
 >
 {emp.initials}
 </div>
 <h3 style={{ margin: 0 }}>{emp.name}</h3>
 <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>
 {emp.role} · {emp.department}
 </p>

 <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
 {isPro ? (
 <span
 style={{
 background: 'linear-gradient(135deg, #7c3aed, #0f4cff)',
 color: '#fff',
 fontSize: '10px',
 fontWeight: 800,
 padding: '2px 10px',
 borderRadius: '12px',
 border: '1px solid rgba(255,255,255,0.3)',
 }}
 >
 AUTONOMOUS PRO
 </span>
 ) : (
 <span
 style={{
 background: 'var(--c-surface)',
 color: 'var(--text-secondary)',
 fontSize: '10px',
 fontWeight: 700,
 padding: '2px 8px',
 borderRadius: '12px',
 border: '1px solid var(--border-color)',
 }}
 >
 STANDARD CORE
 </span>
 )}
 <span
 className={`badge badge-${
 emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'error' : 'neutral'
 }`}
 >
 ● {emp.status}
 </span>
 </div>

 {/* Seat Tier Toggle Button */}
 <div style={{ marginTop: 'var(--sp-2)' }}>
 {isPro ? (
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}
 onClick={() => assignSeatTier(emp.id, 'standard')}
 >
 Revert to Standard Tier
 </button>
 ) : (
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '11px', color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.4)', fontWeight: 700 }}
 onClick={() => assignSeatTier(emp.id, 'premium')}
 >
 Grant Autonomous Pro Seat ({premiumSeatsAllocated}/{premiumSeatLimit})
 </button>
 )}

 <div style={{ marginTop: '6px' }}>
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, padding: '2px 8px' }}
 onClick={() => openModal('redeem-code-modal')}
 >
 Have a voucher code? Redeem License
 </button>
 </div>
 </div>
 </div>

 {/* Quick Stats Grid */}
 <div
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(3,1fr)',
 gap: 'var(--sp-3)',
 marginBottom: 'var(--sp-5)',
 }}
 >
 <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--sp-3)' }}>
 <div className="stat-card-value" style={{ fontSize: 'var(--fs-xl)' }}>
 {empTasks.length}
 </div>
 <div className="stat-card-label">Tasks</div>
 </div>
 <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--sp-3)' }}>
 <div className="stat-card-value" style={{ fontSize: 'var(--fs-xl)' }}>
 {empProjects.length}
 </div>
 <div className="stat-card-label">Projects</div>
 </div>
 <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--sp-3)' }}>
 <div className="stat-card-value" style={{ fontSize: 'var(--fs-xl)', color: 'var(--c-success)' }}>
 {doneTasks.length}
 </div>
 <div className="stat-card-label">Done</div>
 </div>
 </div>

 {/* Active Tasks List */}
 <h4 style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--fs-md)' }}>Active Tasks</h4>
 {activeTasks.length > 0 ? (
 activeTasks.map((t) => (
 <div
 key={t.id}
 className="task-row"
 style={{
 border: '1px solid var(--border-light)',
 borderRadius: 'var(--border-radius-md)',
 marginBottom: 'var(--sp-2)',
 padding: '8px 12px',
 }}
 >
 <span className={`badge priority-${t.priority}`} style={{ fontSize: '10px' }}>
 {t.priority}
 </span>
 <span className="task-name" style={{ fontSize: 'var(--fs-sm)' }}>
 {t.name}
 </span>
 </div>
 ))
 ) : (
 <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>No active tasks</p>
 )}

 {/* Projects List */}
 <h4 style={{ margin: 'var(--sp-5) 0 var(--sp-3)', fontSize: 'var(--fs-md)' }}>Assigned Projects</h4>
 {empProjects.length > 0 ? (
 empProjects.map((p) => (
 <div
 key={p.id}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 'var(--sp-2)',
 marginBottom: 'var(--sp-2)',
 padding: 'var(--sp-2) var(--sp-3)',
 borderRadius: 'var(--border-radius-md)',
 background: 'var(--c-gray-100)',
 }}
 >
 <span style={{ fontSize: '18px' }}>{p.icon}</span>
 <span style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-sm)' }}>{p.name}</span>
 <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
 {p.progress}%
 </span>
 </div>
 ))
 ) : (
 <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>No projects</p>
 )}

 {/* Account Session Actions (If Current User or Workspace Owner) */}
 {(emp.id === user.id || emp.email === user.email) && (
 <div
 style={{
 marginTop: 'var(--sp-6)',
 paddingTop: 'var(--sp-5)',
 borderTop: '1px solid var(--border-light)',
 }}
 >
 <h4 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-sm)', fontWeight: 800 }}>Account &amp; Session</h4>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-3)' }}>
 Logged in as <strong>{user.email}</strong>
 </p>
 <button
 type="button"
 id="profile-panel-sign-out-btn"
 className="btn btn-secondary"
 style={{
 width: '100%',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '8px',
 color: 'var(--c-error)',
 borderColor: '#fca5a5',
 background: '#fff5f5',
 fontWeight: 700,
 fontSize: 'var(--fs-sm)',
 }}
 onClick={() => {
 closeProfilePanel();
 signOut();
 }}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
 <polyline points="16 17 21 12 16 7" />
 <line x1="21" y1="12" x2="9" y2="12" />
 </svg>
 Sign Out of Cursis
 </button>
 </div>
 )}
 </div>
 </div>
 );
}
