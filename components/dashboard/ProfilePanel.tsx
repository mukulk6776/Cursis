'use client';

import React, { useEffect } from 'react';
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
 removeEmployee,
 openModal,
 } = useDashboard();

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 closeProfilePanel();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [closeProfilePanel]);

 if (!profilePanelEmployeeId) return null;

 const emp = getEmployee(profilePanelEmployeeId);
 if (!emp) return null;

 const empTasks = getTasksForEmployee(emp.id);
 const activeTasks = empTasks.filter((t) => t.status !== 'completed');
 const doneTasks = empTasks.filter((t) => t.status === 'completed');
 const empProjects = projects.filter((p) => p.team.includes(emp.id));

 return (
 <>
 <div
 className="profile-backdrop"
 onClick={closeProfilePanel}
 aria-label="Close profile panel"
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0, 0, 0, 0.4)',
 backdropFilter: 'blur(2px)',
 zIndex: 998,
 }}
 />
 <div className="profile-panel open" id="profile-panel" style={{ zIndex: 999 }}>
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
 <button
 className="btn btn-ghost btn-sm"
 onClick={closeProfilePanel}
 title="Close profile panel"
 aria-label="Close profile panel"
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 width: '32px',
 height: '32px',
 borderRadius: '8px',
 border: '1px solid var(--border-color)',
 background: 'var(--c-surface)',
 color: 'var(--text-primary)',
 cursor: 'pointer',
 padding: 0,
 transition: 'all 0.15s ease',
 }}
 >
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <line x1="18" y1="6" x2="6" y2="18" />
 <line x1="6" y1="6" x2="18" y2="18" />
 </svg>
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
 <span
 style={{
 background: 'var(--c-surface)',
 color: 'var(--text-secondary)',
 fontSize: '10px',
 fontWeight: 700,
 padding: '2px 8px',
 borderRadius: '12px',
 border: '1px solid var(--border-color)',
 textTransform: 'uppercase',
 }}
 >
 {emp.workspaceRole || 'Member'}
 </span>
 <span
 className={`badge badge-${
 emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'error' : 'neutral'
 }`}
 >
 ● {emp.status}
 </span>
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

 {/* Member Management Actions (for Admins / other members) */}
 {emp.id !== user.id && emp.id !== 'u1' && emp.id !== 'u_owner' && emp.workspaceRole !== 'owner' && (
 <div
 style={{
 marginTop: 'var(--sp-6)',
 paddingTop: 'var(--sp-5)',
 borderTop: '1px solid var(--border-light)',
 }}
 >
 <h4 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-sm)', fontWeight: 800 }}>Workspace Membership</h4>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-3)' }}>
 Remove this member from the organization workspace and revoke their active seats.
 </p>
 <button
 type="button"
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
 onClick={async () => {
 if (window.confirm(`Are you sure you want to remove ${emp.name} from the workspace?`)) {
 await removeEmployee(emp.id);
 closeProfilePanel();
 }
 }}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M3 6h18" />
 <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
 </svg>
 Remove {emp.name} from Workspace
 </button>
 </div>
 )}
      </div>
    </div>
    </>
  );
}
