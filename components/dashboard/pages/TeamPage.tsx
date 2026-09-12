'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate } from '@/lib/dashboard/data';

type TeamTab = 'directory' | 'invites' | 'org-chart' | 'workload' | 'onboarding';

export default function TeamPage() {
 const {
 employees,
 departments,
 teams,
 invitations,
 tasks,
 user,
 openModal,
 openProfilePanel,
 revokeInvitation,
 acceptInvitation,
 removeEmployee,
 showToast,
 setCurrentPage: setDashboardPage,
 } = useDashboard();

 const [activeTab, setActiveTab] = useState<TeamTab>('directory');
 const [deptFilter, setDeptFilter] = useState('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [currentPage, setCurrentPage] = useState(1);

 const PAGE_SIZE = 24;

 const filteredEmployees = employees.filter((emp) => {
 // Department Filter
 if (deptFilter !== 'all' && emp.departmentId !== deptFilter && emp.department?.toLowerCase() !== deptFilter.toLowerCase()) {
 return false;
 }

 // Search Query
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 return (
 emp.name.toLowerCase().includes(q) ||
 emp.role.toLowerCase().includes(q) ||
 (emp.email && emp.email.toLowerCase().includes(q))
 );
 }
 return true;
 });

 const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
 const safePage = Math.min(currentPage, totalPages);
 const startIndex = (safePage - 1) * PAGE_SIZE;
 const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + PAGE_SIZE);

 const pendingInvites = invitations.filter((i) => i.status === 'pending');

 const handleCopyLink = (token: string) => {
 const link = typeof window !== 'undefined' ? `${window.location.origin}/invite/${token}` : `https://cursis.io/invite/${token}`;
 if (navigator.clipboard) {
 navigator.clipboard.writeText(link);
 }
 showToast('Invitation link copied to clipboard ');
 };

 const handlePageChange = (newPage: number) => {
 setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
 };

 return (
 <div className="page active" id="page-team">
 {/* Header */}
 <div className="page-header">
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <h1 className="page-title">Team &amp; People Management</h1>
 <span className="badge badge-brand" style={{ fontSize: '10px' }}>
 {employees.length.toLocaleString()} MEMBERS ACTIVE
 </span>
 </div>
 <p className="page-subtitle">
 Manage your workspace roster, roles, permission levels, and department assignments.
 </p>
 </div>
 <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)' }}>
 <button className="btn btn-secondary btn-sm" onClick={() => openModal('invite-modal')}>
 Invite via Email
 </button>
 <button className="btn btn-primary btn-sm" onClick={() => openModal('member-modal')}>
 + Add Team Member
 </button>
 </div>
 </div>

 {/* Navigation Controls & Filters */}
 <div
 className="card"
 style={{
 padding: 'var(--sp-3) var(--sp-4)',
 marginBottom: 'var(--sp-4)',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 flexWrap: 'wrap',
 gap: 'var(--sp-3)',
 }}
 >
 <div className="tabs" style={{ margin: 0 }}>
 <button
 type="button"
 className={`tab ${activeTab === 'directory' ? 'active' : ''}`}
 onClick={() => setActiveTab('directory')}
 >
 Team Directory ({employees.length.toLocaleString()})
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'invites' ? 'active' : ''}`}
 onClick={() => setActiveTab('invites')}
 >
 Pending Invites ({pendingInvites.length})
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'org-chart' ? 'active' : ''}`}
 onClick={() => setActiveTab('org-chart')}
 >
 Hierarchy &amp; Departments
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'workload' ? 'active' : ''}`}
 onClick={() => setActiveTab('workload')}
 >
 Workload Distribution
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'onboarding' ? 'active' : ''}`}
 onClick={() => setActiveTab('onboarding')}
 >
 Onboarding Standard
 </button>
 </div>

 {activeTab === 'directory' && (
 <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
 <select
 className="input select"
 style={{ fontSize: 'var(--fs-xs)', padding: 'var(--sp-2)', height: '32px' }}
 value={deptFilter}
 onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
 >
 <option value="all">All Departments</option>
 {departments.map((d) => (
 <option key={d.id} value={d.name}>
 {d.name}
 </option>
 ))}
 </select>
 <input
 className="input"
 style={{ fontSize: 'var(--fs-xs)', padding: 'var(--sp-2)', width: '200px', height: '32px' }}
 placeholder="Search 2,000 members..."
 value={searchQuery}
 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
 />
 </div>
 )}
 </div>

 {/* ========================================================================= */}
 {/* 1. DIRECTORY TAB */}
 {/* ========================================================================= */}
 {activeTab === 'directory' && (
 <>
 {filteredEmployees.length === 0 ? (
 <div
 className="card"
 style={{
 textAlign: 'center',
 padding: 'var(--sp-8)',
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 gap: 'var(--sp-3)',
 }}
 >
 <div style={{ fontSize: '32px' }}></div>
 <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>No team members found</h3>
 <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', maxWidth: '400px' }}>
 {searchQuery || deptFilter !== 'all'
 ? 'No members match the active filters. Try clearing search or department filters.'
 : 'Start building your company structure by provisioning team members.'}
 </p>
 <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
 {(searchQuery || deptFilter !== 'all') && (
 <button
 className="btn btn-secondary btn-sm"
 onClick={() => {
 setSearchQuery('');
 setDeptFilter('all');
 setCurrentPage(1);
 }}
 >
 Clear Filters
 </button>
 )}
 <button className="btn btn-primary btn-sm" onClick={() => openModal('member-modal')}>
 + Add Member
 </button>
 </div>
 </div>
 ) : (
 <>
 {/* Member Cards Grid */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 'var(--sp-4)' }}>
 {paginatedEmployees.map((emp) => {
 const empTasks = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed');

 return (
 <div
 key={emp.id}
 className="card"
 style={{
 padding: 'var(--sp-4)',
 display: 'flex',
 flexDirection: 'column',
 justifyContent: 'space-between',
 gap: 'var(--sp-3)',
 transition: 'border-color var(--dur-fast) ease, transform var(--dur-fast) ease',
 border: '1px solid var(--border-color)',
 background: 'var(--c-white)',
 }}
 >
 <div>
 {/* Top row: Avatar, Name & Status Badge */}
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
 <div
 style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
 onClick={() => openProfilePanel(emp.id)}
 >
 <div
 className="avatar avatar-lg"
 style={{
 background: emp.color || '#0f4cff',
 color: emp.color === '#ccff00' ? '#000' : '#fff',
 fontWeight: 700,
 }}
 >
 {emp.initials}
 </div>
 <div>
 <h3 style={{ margin: '0 0 2px 0', fontSize: 'var(--fs-md)', fontWeight: 'var(--fw-bold)' }}>
 {emp.name}
 </h3>
 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
 {emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`}
 </div>
 </div>
 </div>

 <span
 className={`badge badge-${
 emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'error' : 'neutral'
 }`}
 style={{ fontSize: '9px', padding: '2px 8px' }}
 >
 {emp.status}
 </span>
 </div>

 {/* Role & Department */}
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-brand)', fontWeight: 'bold', marginBottom: 'var(--sp-2)' }}>
 {emp.role} · {emp.department} · <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{emp.workspaceRole || 'Member'}</span>
 </div>

 {/* Skills Tags */}
 {emp.skills && emp.skills.length > 0 && (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--sp-3)' }}>
 {emp.skills.slice(0, 4).map((s) => (
 <span key={s} className="tag" style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--c-surface)' }}>
 {s}
 </span>
 ))}
 {emp.skills.length > 4 && (
 <span className="tag" style={{ fontSize: '10px', padding: '1px 5px', color: 'var(--text-tertiary)' }}>
 +{emp.skills.length - 4}
 </span>
 )}
 </div>
 )}
 </div>

 {/* Bottom Metadata & Actions */}
 <div
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingTop: 'var(--sp-2)',
 borderTop: '1px solid var(--border-color)',
 fontSize: 'var(--fs-xs)',
 color: 'var(--text-secondary)',
 }}
 >
 <span style={{ fontWeight: 500 }}>{empTasks.length} tasks</span>
 <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '10px', padding: '2px 8px' }}
 onClick={() => openProfilePanel(emp.id)}
 >
 Profile
 </button>
 {(user.workspaceRole === 'owner' || user.role === 'owner') && emp.id !== user.id && emp.id !== 'u1' && emp.id !== 'u_owner' && emp.workspaceRole !== 'owner' && (
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{
 fontSize: '10px',
 padding: '2px 8px',
 color: 'var(--c-error)',
 border: '1px solid rgba(239, 68, 68, 0.25)',
 background: 'rgba(239, 68, 68, 0.04)',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '4px',
 borderRadius: '4px',
 }}
 title={`Remove ${emp.name} from workspace`}
 onClick={async (e) => {
 e.stopPropagation();
 if (window.confirm(`Are you sure you want to remove ${emp.name} from the workspace? They will lose access to all projects and tasks.`)) {
 await removeEmployee(emp.id);
 }
 }}
 >
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M3 6h18" />
 <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
 </svg>
 Remove
 </button>
 )}
 {emp.id === user.id && emp.workspaceRole !== 'owner' && (
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{
 fontSize: '10px',
 padding: '2px 8px',
 color: 'var(--c-warning)',
 border: '1px solid rgba(245, 158, 11, 0.25)',
 background: 'rgba(245, 158, 11, 0.04)',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '4px',
 borderRadius: '4px',
 }}
 title="Leave this workspace"
 onClick={async (e) => {
 e.stopPropagation();
 if (window.confirm('Are you sure you want to leave this workspace? You will lose access immediately.')) {
 await removeEmployee(emp.id);
 }
 }}
 >
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
 <polyline points="16 17 21 12 16 7" />
 <line x1="21" y1="12" x2="9" y2="12" />
 </svg>
 Leave
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* High-Performance Pagination Bar */}
 <div
 className="card"
 style={{
 marginTop: 'var(--sp-4)',
 padding: 'var(--sp-3) var(--sp-4)',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 flexWrap: 'wrap',
 gap: 'var(--sp-3)',
 fontSize: 'var(--fs-xs)',
 color: 'var(--text-secondary)',
 }}
 >
 <div>
 Showing <strong>{startIndex + 1}</strong> to{' '}
 <strong>{Math.min(startIndex + PAGE_SIZE, filteredEmployees.length).toLocaleString()}</strong> of{' '}
 <strong>{filteredEmployees.length.toLocaleString()}</strong> team members
 {filteredEmployees.length !== employees.length && ` (filtered from ${employees.length.toLocaleString()} total)`}
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '11px', padding: '3px 8px' }}
 disabled={safePage <= 1}
 onClick={() => handlePageChange(1)}
 >
 « First
 </button>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '11px', padding: '3px 8px' }}
 disabled={safePage <= 1}
 onClick={() => handlePageChange(safePage - 1)}
 >
 ‹ Prev
 </button>
 <span style={{ padding: '0 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
 Page {safePage} of {totalPages}
 </span>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '11px', padding: '3px 8px' }}
 disabled={safePage >= totalPages}
 onClick={() => handlePageChange(safePage + 1)}
 >
 Next ›
 </button>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '11px', padding: '3px 8px' }}
 disabled={safePage >= totalPages}
 onClick={() => handlePageChange(totalPages)}
 >
 Last »
 </button>
 </div>
 </div>
 </>
 )}
 </>
 )}

 {/* ========================================================================= */}
 {/* 2. PENDING INVITES TAB */}
 {/* ========================================================================= */}
 {activeTab === 'invites' && (
 <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
 <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead>
 <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)' }}>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Email Address</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Recipient Name</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Assigned Role</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Department</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Expires</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Actions</th>
 </tr>
 </thead>
 <tbody>
 {pendingInvites.length === 0 ? (
 <tr>
 <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
 No pending invitations. Click &quot;+ Add Team Member&quot; or &quot; Invite via Email&quot; to send secure workspace links.
 </td>
 </tr>
 ) : (
 pendingInvites.map((inv) => (
 <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
 <td style={{ padding: 'var(--sp-3)', fontWeight: 'bold' }}>{inv.email}</td>
 <td style={{ padding: 'var(--sp-3)' }}>{inv.name}</td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <span className="badge badge-brand" style={{ textTransform: 'capitalize' }}>
 {inv.workspaceRole} ({inv.roleTitle})
 </span>
 </td>
 <td style={{ padding: 'var(--sp-3)' }}>{inv.department.replace('dept_', '')}</td>
 <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>
 {formatDate(inv.expiresAt)}
 </td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <div style={{ display: 'flex', gap: '6px' }}>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 style={{ fontSize: '10px', padding: '3px 8px' }}
 onClick={() => handleCopyLink(inv.token)}
 >
 Copy Link
 </button>
 <button
 type="button"
 className="btn btn-primary btn-sm"
 style={{ fontSize: '10px', padding: '3px 8px' }}
 title="Simulate token acceptance and convert directly to active team member"
 onClick={() => acceptInvitation(inv.id)}
 >
 Accept / Add
 </button>
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '10px', padding: '3px 6px', color: 'var(--c-error)' }}
 onClick={() => revokeInvitation(inv.id)}
 >
 Revoke
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 )}

 {/* ========================================================================= */}
 {/* 3. ORGANIZATIONAL HIERARCHY TAB */}
 {/* ========================================================================= */}
 {activeTab === 'org-chart' && (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
 <div
 className="card"
 style={{
 gridColumn: '1 / -1',
 padding: 'var(--sp-3) var(--sp-4)',
 background: 'var(--c-white)',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 flexWrap: 'wrap',
 gap: 'var(--sp-2)',
 }}
 >
 <div>
 <h4 style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 800 }}>Divisional Organization Matrix</h4>
 <p style={{ margin: '2px 0 0 0', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
 View teams by department. Manage leadership, headcount quotas, and budgets in the dedicated studio.
 </p>
 </div>
 <button
 type="button"
 className="btn btn-primary btn-sm"
 onClick={() => setDashboardPage('departments')}
 style={{ fontWeight: 700 }}
 >
 Open Department Management Studio →
 </button>
 </div>
 {departments.map((dept) => {
 const headEmp = employees.find((e) => e.id === dept.head);
 const deptMembers = employees.filter(
 (e) => e.departmentId === dept.id || e.department?.toLowerCase() === dept.name.toLowerCase()
 );
 const deptTeams = teams.filter((t) => t.departmentId === dept.id);

 return (
 <div key={dept.id} className="card" style={{ padding: 'var(--sp-4)' }}>
 <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-2)' }}>
 DEPARTMENT
 </div>
 <h3 style={{ margin: '0 0 var(--sp-1) 0', fontSize: 'var(--fs-lg)' }}>{dept.name}</h3>
 {headEmp && (
 <p style={{ margin: '0 0 var(--sp-3) 0', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
 Department Lead: <strong>{headEmp.name}</strong> ({headEmp.role})
 </p>
 )}

 {deptTeams.length > 0 && (
 <div style={{ marginBottom: 'var(--sp-3)' }}>
 <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
 TEAMS &amp; SQUADS
 </div>
 <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
 {deptTeams.map((t) => (
 <span key={t.id} className="tag" style={{ background: 'var(--c-surface)' }}>
 {t.name}
 </span>
 ))}
 </div>
 </div>
 )}

 <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
 ACTIVE ROSTER ({deptMembers.length.toLocaleString()})
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
 {deptMembers.slice(0, 10).map((m) => (
 <div
 key={m.id}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 'var(--sp-2)',
 padding: '6px 8px',
 background: 'var(--c-surface)',
 borderRadius: '4px',
 cursor: 'pointer',
 }}
 onClick={() => openProfilePanel(m.id)}
 >
 <div
 className="avatar avatar-sm"
 style={{
 background: m.color || '#0f4cff',
 color: m.color === '#ccff00' ? '#000' : '#fff',
 fontSize: '10px',
 fontWeight: 700,
 }}
 >
 {m.initials}
 </div>
 <div style={{ flex: 1, fontSize: 'var(--fs-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 <strong>{m.name}</strong> · <span style={{ color: 'var(--text-secondary)' }}>{m.role}</span>
 </div>
 </div>
 ))}
 {deptMembers.length > 10 && (
 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '4px' }}>
 +{deptMembers.length - 10} more members in {dept.name}
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* ========================================================================= */}
 {/* 4. WORKLOAD DISTRIBUTION TAB */}
 {/* ========================================================================= */}
 {activeTab === 'workload' && (
 <div className="card" style={{ padding: 'var(--sp-4)' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
 <div>
 <h3 style={{ margin: '0 0 2px 0' }}>Team Task Allocation &amp; Bandwidth</h3>
 <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
 Real-time capacity tracking calibrated to sprint velocity limits (8 concurrent tasks nominal).
 </p>
 </div>
 <button className="btn btn-primary btn-sm" onClick={() => openModal('member-modal')}>
 + Add Member to Balance Load
 </button>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: '600px', overflowY: 'auto' }}>
 {employees.slice(0, 30).map((emp) => {
 const activeCount = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed').length;
 const completedCount = tasks.filter((t) => t.assignee === emp.id && t.status === 'completed').length;
 const loadPercent = Math.min(100, Math.round((activeCount / 8) * 100));
 const isHeavy = activeCount >= 6;

 return (
 <div
 key={emp.id}
 style={{
 padding: 'var(--sp-3)',
 background: 'var(--c-surface)',
 border: '1px solid var(--border-color)',
 borderRadius: '6px',
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div
 className="avatar avatar-sm"
 style={{
 background: emp.color || '#0f4cff',
 color: emp.color === '#ccff00' ? '#000' : '#fff',
 fontWeight: 700,
 }}
 >
 {emp.initials}
 </div>
 <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{emp.name}</span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>({emp.role})</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <span className={`badge badge-${isHeavy ? 'error' : 'neutral'}`} style={{ fontSize: '10px' }}>
 {isHeavy ? 'High Load' : 'Available'}
 </span>
 <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'bold' }}>{activeCount} active tasks</span>
 </div>
 </div>
 <div style={{ width: '100%', height: '10px', background: 'var(--c-white)', border: '1px solid var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
 <div
 style={{
 height: '100%',
 width: `${loadPercent}%`,
 background: isHeavy ? '#ef4444' : 'var(--c-brand)',
 transition: 'width 0.3s ease',
 }}
 />
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
 <span>{completedCount} tasks closed in workspace</span>
 <span>Sprint Bandwidth: {activeCount} / 8 slots ({loadPercent}%)</span>
 </div>
 </div>
 );
 })}
 {employees.length > 30 && (
 <div style={{ textAlign: 'center', padding: 'var(--sp-2)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
 Showing top 30 active workload members ({employees.length.toLocaleString()} total members tracked in workspace)
 </div>
 )}
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* 5. ONBOARDING CHECKLIST TAB */}
 {/* ========================================================================= */}
 {activeTab === 'onboarding' && (
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-2)' }}>
 AUTOMATION WORKFLOW
 </div>
 <h2 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-xl)' }}>New Member Onboarding Standard</h2>
 <p style={{ margin: '0 0 var(--sp-4) 0', color: 'var(--text-secondary)' }}>
 Automatically triggered whenever an invited member accepts their token or an employee is provisioned into the workspace.
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
 {[
 { title: '1. Provision Workspace & Security Profile', desc: 'Generate unique user ID, assign workspaceRole permission level, setup enterprise OAuth/SSO authentication.' },
 { title: '2. Assign Department Channel & Team Squads', desc: 'Auto-add new member to relevant messaging channels and project sprint boards.' },
 { title: '3. Role & Department Allocation', desc: 'Configure department assignment, project access, and workspace administrative permissions.' },
 { title: '4. Dispatch Welcome Packet & Compliance Docs', desc: 'Send Employee Onboarding & Security Guidelines via Cursis Paperwork Studio.' },
 { title: '5. Schedule 1:1 Manager Orientation Sync', desc: 'Auto-book 30-minute introductory meeting on Cursis Meet.' },
 ].map((step, idx) => (
 <div
 key={idx}
 style={{
 display: 'flex',
 alignItems: 'flex-start',
 gap: 'var(--sp-3)',
 padding: 'var(--sp-3)',
 background: 'var(--c-surface)',
 border: '1px solid var(--border-color)',
 borderRadius: '6px',
 }}
 >
 <div
 style={{
 width: '28px',
 height: '28px',
 background: 'var(--c-brand)',
 color: 'white',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 'bold',
 fontSize: '12px',
 borderRadius: '4px',
 flexShrink: 0,
 }}
 >
 
 </div>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{step.title}</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.desc}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
