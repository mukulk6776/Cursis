'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { OrgSettings } from '@/lib/dashboard/types';
import { isFounderEmail } from '@/lib/auth/founder';

type SettingsTab = 'workspace' | 'team' | 'notifications' | 'ordis' | 'security';

export default function SettingsPage() {
 const {
 user,
 employees,
 invitations,
 openModal,
 openProfilePanel,
 workspaceSettings,
 updateWorkspaceSettings,
 teamSettings,
 updateTeamSettings,
 notificationSettings,
 updateNotificationSettings,

 ordisSettings,
 updateOrdisSettings,
 orgSettings,
 updateOrgSettings,
 auditLogs,
 fetchAuditLogs,
 removeEmployee,
 updateEmployee,
 revokeInvitation,
 signOut,
 resetSettingsToDefault,
 sendTestNotification,
 } = useDashboard();

 const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
 const [auditLoading, setAuditLoading] = useState(false);

 // Fetch audit logs when security tab becomes active
 useEffect(() => {
 if (activeTab === 'security') {
 setAuditLoading(true);
 fetchAuditLogs().finally(() => setAuditLoading(false));
 }
 }, [activeTab]);

 // Local form states synced with context
 const [wsForm, setWsForm] = useState(workspaceSettings);
 const [teamForm, setTeamForm] = useState(teamSettings);
 const [notifForm, setNotifForm] = useState(notificationSettings);

 const [ordisForm, setOrdisForm] = useState(ordisSettings);
 const [orgForm, setOrgForm] = useState<OrgSettings>(orgSettings);

 // Synchronize local states when context updates (e.g. hydration or workspace switch)
 useEffect(() => {
 setWsForm(workspaceSettings);
 }, [workspaceSettings]);

 useEffect(() => {
 setTeamForm(teamSettings);
 }, [teamSettings]);

 useEffect(() => {
 setNotifForm(notificationSettings);
 }, [notificationSettings]);



 useEffect(() => {
 setOrdisForm(ordisSettings);
 }, [ordisSettings]);

 useEffect(() => {
 setOrgForm(orgSettings);
 }, [orgSettings]);

 // Form Submit Handlers
 const handleSaveWorkspace = (e: React.FormEvent) => {
 e.preventDefault();
 updateWorkspaceSettings(wsForm);
 };

 const handleSaveTeam = (e: React.FormEvent) => {
 e.preventDefault();
 updateTeamSettings(teamForm);
 };

 const handleSaveNotifications = (e: React.FormEvent) => {
 e.preventDefault();
 updateNotificationSettings(notifForm);
 };



 const handleSaveOrdis = (e: React.FormEvent) => {
 e.preventDefault();
 updateOrdisSettings(ordisForm);
 };

 const handleSaveSecurity = (e: React.FormEvent) => {
 e.preventDefault();
 updateOrgSettings(orgForm);
 };

 return (
 <div className="page active" id="page-settings" style={{ display: 'block', maxWidth: '1100px', margin: '0 auto' }}>
 {/* Page Header */}
 <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
 <div>
 <h1 className="page-title">Workspace Settings</h1>
 <p className="page-subtitle">
 Configure workspace preferences, manage team governance, notifications, calendar rules, security, and Ordis AI behavior.
 </p>
 </div>
 </div>

 {/* Settings Navigation Tabs */}
 <div className="tabs" style={{ marginBottom: 'var(--sp-5)', display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
 <button
 type="button"
 className={`tab ${activeTab === 'workspace' ? 'active' : ''}`}
 onClick={() => setActiveTab('workspace')}
 >
 1. Workspace
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'team' ? 'active' : ''}`}
 onClick={() => setActiveTab('team')}
 >
 2. Team &amp; Permissions ({employees.length})
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
 onClick={() => setActiveTab('notifications')}
 >
 3. Notifications
 </button>

 <button
 type="button"
 className={`tab ${activeTab === 'ordis' ? 'active' : ''}`}
 onClick={() => setActiveTab('ordis')}
 >
 4. Ordis AI Settings
 </button>
 <button
 type="button"
 className={`tab ${activeTab === 'security' ? 'active' : ''}`}
 onClick={() => setActiveTab('security')}
 >
 5. Security &amp; Audit Logs 
 </button>
 </div>

 {/* ========================================================================= */}
 {/* 1. WORKSPACE SETTINGS */}
 {/* ========================================================================= */}
 {activeTab === 'workspace' && (
 <form onSubmit={handleSaveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
 {/* Live Preview Card */}
 <div
 className="card"
 style={{
 padding: 'var(--sp-4)',
 background: 'var(--surface-card)',
 borderLeft: `5px solid ${wsForm.accentColor || '#0f4cff'}`,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 flexWrap: 'wrap',
 gap: 'var(--sp-3)',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
 <div
 style={{
 width: '40px',
 height: '40px',
 borderRadius: 'var(--border-radius-md)',
 background: wsForm.accentColor || '#0f4cff',
 color: '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 900,
 fontSize: '18px',
 boxShadow: 'var(--shadow-sm)',
 }}
 >
 {(wsForm.name || 'C')[0]?.toUpperCase()}
 </div>
 <div>
 <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
 Live Workspace Preview
 </div>
 <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>
 {wsForm.name || 'Untitled Workspace'}
 </div>
 <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
 {wsForm.tagline || 'No tagline configured'}
 </div>
 </div>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
 Density: {wsForm.density || 'comfortable'}
 </span>
 <span className="badge badge-brand" style={{ fontSize: '11px', backgroundColor: wsForm.accentColor, color: '#fff' }}>
 Active Theme
 </span>
 </div>
 </div>

 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Workspace Identity &amp; Profile
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Basic details used across invitations, reports, exports, and topbar identifiers.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Workspace Name</label>
 <input
 className="input"
 value={wsForm.name}
 onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })}
 placeholder="e.g. Acme Corp"
 required
 />
 </div>

 <div className="input-group">
 <label className="input-label">Tagline / Mission</label>
 <input
 className="input"
 value={wsForm.tagline}
 onChange={(e) => setWsForm({ ...wsForm, tagline: e.target.value })}
 placeholder="e.g. Building next-gen software"
 />
 </div>

 <div className="input-group">
 <label className="input-label">Industry</label>
 <input
 className="input"
 value={wsForm.industry}
 onChange={(e) => setWsForm({ ...wsForm, industry: e.target.value })}
 placeholder="e.g. Software & Technology"
 />
 </div>

 <div className="input-group">
 <label className="input-label">Language</label>
 <select
 className="input select"
 value={wsForm.language}
 onChange={(e) => setWsForm({ ...wsForm, language: e.target.value })}
 >
 <option value="English">English</option>
 <option value="Spanish">Spanish (Español)</option>
 <option value="French">French (Français)</option>
 <option value="German">German (Deutsch)</option>
 <option value="Japanese">Japanese (日本語)</option>
 </select>
 </div>
 </div>

 <div style={{ marginTop: 'var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => openModal('workspace-setup-modal')}
 style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
 >
 <span>Open Workspace Setup Wizard</span>
 </button>
 </div>
 </div>

 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Workspace Customization &amp; Theme
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Tailor the interface density and primary branding color.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Brand Accent Color</label>
 <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
 {[
 { color: '#0f4cff', label: 'Somba Blue' },
 { color: '#000000', label: 'Mono Black' },
 { color: '#00b341', label: 'Emerald' },
 { color: '#ff5710', label: 'Neon Orange' },
 { color: '#7928ca', label: 'Deep Purple' },
 { color: '#ccff00', label: 'Lime Accent' },
 ].map(({ color, label }) => (
 <button
 key={color}
 type="button"
 title={label}
 onClick={() => setWsForm({ ...wsForm, accentColor: color })}
 style={{
 width: '32px',
 height: '32px',
 borderRadius: 'var(--border-radius-md)',
 background: color,
 border: wsForm.accentColor === color ? '3px solid #000' : '1px solid var(--border-color)',
 outline: wsForm.accentColor === color ? '2px solid var(--c-accent)' : 'none',
 cursor: 'pointer',
 transition: 'transform 0.1s ease',
 transform: wsForm.accentColor === color ? 'scale(1.1)' : 'scale(1)',
 }}
 />
 ))}
 <input
 type="color"
 value={wsForm.accentColor || '#0f4cff'}
 onChange={(e) => setWsForm({ ...wsForm, accentColor: e.target.value })}
 style={{
 width: '32px',
 height: '32px',
 padding: 0,
 border: '1px solid var(--border-color)',
 borderRadius: 'var(--border-radius-md)',
 cursor: 'pointer',
 background: 'none',
 }}
 title="Custom Color"
 />
 <span style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', marginLeft: 'var(--sp-2)' }}>
 {wsForm.accentColor}
 </span>
 </div>
 </div>

 <div className="input-group">
 <label className="input-label">Layout Density</label>
 <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
 {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
 <button
 key={density}
 type="button"
 className={`btn btn-sm ${wsForm.density === density ? 'btn-primary' : 'btn-secondary'}`}
 onClick={() => setWsForm({ ...wsForm, density, layoutDensity: density })}
 style={{ textTransform: 'capitalize', flex: 1 }}
 >
 {density}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
 <button type="submit" className="btn btn-primary" id="save-workspace-btn">
 Save Workspace Settings
 </button>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => resetSettingsToDefault('workspace')}
 >
 Reset to Defaults
 </button>
 </div>

 {/* Account & Session Management */}
 <div className="card" style={{ padding: 'var(--sp-5)', borderTop: '3px solid var(--c-brand)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Account &amp; Active Session
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Manage your personal identity credentials and session authentication status.
 </p>

 <div
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
 gap: 'var(--sp-4)',
 background: 'var(--c-surface)',
 padding: 'var(--sp-4)',
 borderRadius: 'var(--border-radius-md)',
 marginBottom: 'var(--sp-4)',
 }}
 >
 <div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Current User</div>
 <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px' }}>{user.name}</div>
 <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.email}</div>
 </div>
 <div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Workspace Role</div>
 <div style={{ marginTop: '2px' }}>
 <span className="badge badge-brand" style={{ textTransform: 'capitalize' }}>
 {user.role}
 </span>
 </div>
 </div>
 <div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Session Security</div>
 <div style={{ fontSize: '11px', color: 'var(--c-success)', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
 <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--c-success)', display: 'inline-block' }} />
 Authenticated &amp; Verified
 </div>
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
 Signing out will invalidate your current browser session and redirect to login.
 </div>
 <button
 type="button"
 id="settings-sign-out-btn"
 className="btn btn-secondary btn-sm"
 style={{
 color: 'var(--c-error)',
 borderColor: '#fca5a5',
 background: '#fff5f5',
 fontWeight: 700,
 display: 'flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={signOut}
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
 <polyline points="16 17 21 12 16 7" />
 <line x1="21" y1="12" x2="9" y2="12" />
 </svg>
 Sign Out of Workspace
 </button>
 </div>
 </div>
 </form>
 )}

 {/* ========================================================================= */}
 {/* 2. TEAM & PERMISSIONS SETTINGS */}
 {/* ========================================================================= */}
 {activeTab === 'team' && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
 {/* Member List */}
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
 <div>
 <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>Active Team Members ({employees.length})</h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Manage access, adjust permission roles, or inspect workloads.
 </p>
 </div>
 <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal('invite-modal')}>
 + Invite New Member
 </button>
 </div>

 <div style={{ overflowX: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
 <thead>
 <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)' }}>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>MEMBER</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>ROLE / TITLE</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>DEPARTMENT</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>PERMISSION ROLE</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>STATUS</th>
 <th style={{ textAlign: 'right', padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>ACTIONS</th>
 </tr>
 </thead>
 <tbody>
 {employees.map((emp) => (
 <tr key={emp.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
 <td style={{ padding: 'var(--sp-3)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div
 className="avatar avatar-sm"
 style={{
 background: emp.color || '#0f4cff',
 color: '#fff',
 fontSize: '11px',
 fontWeight: 'bold',
 cursor: 'pointer',
 }}
 onClick={() => openProfilePanel(emp.id)}
 >
 {emp.initials}
 </div>
 <div>
 <div
 style={{ fontWeight: 'var(--fw-bold)', cursor: 'pointer' }}
 onClick={() => openProfilePanel(emp.id)}
 >
 {emp.name}
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{emp.email}</div>
 </div>
 </div>
 </td>
 <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>{emp.role}</td>
<td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>{emp.department}</td>
 <td style={{ padding: 'var(--sp-3)' }}>
 {emp.workspaceRole === 'owner' && isFounderEmail(emp.email) ? (
 <span className="badge badge-brand" style={{ textTransform: 'capitalize' }}>
 Owner
 </span>
 ) : (
 <select
 className="input select"
 style={{ padding: '2px 8px', fontSize: '11px', height: '28px' }}
 value={emp.workspaceRole === 'owner' ? 'member' : emp.workspaceRole}
 onChange={(e) => updateEmployee(emp.id, { workspaceRole: e.target.value })}
 >
 <option value="admin">Admin</option>
 <option value="manager">Manager</option>
 <option value="member">Member</option>
 <option value="viewer">Viewer</option>
 </select>
 )}
 </td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <span className={`badge badge-${emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'warning' : 'neutral'}`}>
 {emp.status}
 </span>
 </td>
 <td style={{ padding: 'var(--sp-3)', textAlign: 'right' }}>
 <div style={{ display: 'inline-flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ fontSize: 'var(--fs-xs)' }}
 onClick={() => openProfilePanel(emp.id)}
 >
 Profile
 </button>
 {emp.workspaceRole !== 'owner' && (
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ color: 'var(--c-error)', fontSize: 'var(--fs-xs)' }}
 onClick={async () => {
 if (window.confirm(`Are you sure you want to remove ${emp.name} from the workspace?`)) {
 await removeEmployee(emp.id);
 }
 }}
 >
 Remove
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Pending Invitations */}
 {invitations.length > 0 && (
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
 Pending Invitations ({invitations.length})
 </h3>
 <div style={{ overflowX: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
 <thead>
 <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)' }}>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--fs-xs)' }}>EMAIL</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--fs-xs)' }}>ASSIGNED ROLE</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--fs-xs)' }}>STATUS</th>
 <th style={{ textAlign: 'right', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--fs-xs)' }}>ACTION</th>
 </tr>
 </thead>
 <tbody>
 {invitations.map((inv) => (
 <tr key={inv.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-medium)' }}>{inv.email}</td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', textTransform: 'capitalize' }}>{inv.workspaceRole}</td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)' }}>
 <span className="badge badge-warning">{inv.status}</span>
 </td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'right' }}>
 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ color: 'var(--c-error)', fontSize: 'var(--fs-xs)' }}
 onClick={() => revokeInvitation(inv.id)}
 >
 Cancel
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Team Governance & Policies Form */}
 <form onSubmit={handleSaveTeam} className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Team Governance &amp; Policies
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Default roles for newcomers and workspace invitation policies.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Default Role for New Invites</label>
 <select
 className="input select"
 value={teamForm.defaultRole}
 onChange={(e) => setTeamForm({ ...teamForm, defaultRole: e.target.value })}
 >
 <option value="member">Member (Standard Workspace User)</option>
 <option value="manager">Manager (Can manage projects &amp; assign)</option>
 <option value="admin">Admin (Full workspace administration)</option>
 <option value="viewer">Viewer (Read-only access)</option>
 </select>
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--c-gray-200)', paddingTop: 'var(--sp-4)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Allow Member Invites</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow existing members to invite new collaborators</div>
 </div>
 <input
 type="checkbox"
 checked={teamForm.allowMemberInvites}
 onChange={(e) => setTeamForm({ ...teamForm, allowMemberInvites: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Allow Guest Users</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow inviting temporary external stakeholders to single projects</div>
 </div>
 <input
 type="checkbox"
 checked={teamForm.allowGuestAccess}
 onChange={(e) => setTeamForm({ ...teamForm, allowGuestAccess: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Manager Invite Approval</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Require admin review before managers can add members to billing</div>
 </div>
 <input
 type="checkbox"
 checked={teamForm.requireAdminApprovalForInvites}
 onChange={(e) => setTeamForm({ ...teamForm, requireAdminApprovalForInvites: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Ordis Auto-Assign Balancing</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow Ordis to suggest task assignees based on capacity and skills</div>
 </div>
 <input
 type="checkbox"
 checked={teamForm.autoAssignTasks}
 onChange={(e) => setTeamForm({ ...teamForm, autoAssignTasks: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>
 </div>

 <div style={{ marginTop: 'var(--sp-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
 <button type="submit" className="btn btn-primary" id="save-team-btn">
 Save Team Settings
 </button>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => resetSettingsToDefault('team')}
 >
 Reset to Defaults
 </button>
 </div>
 </form>
 </div>
 )}

 {/* ========================================================================= */}
 {/* 3. NOTIFICATION SETTINGS */}
 {/* ========================================================================= */}
 {activeTab === 'notifications' && (
 <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
 <div>
 <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Workspace Event Notifications
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Select which live workspace updates trigger alerts in your topbar drawer.
 </p>
 </div>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => sendTestNotification()}
 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
 >
 Send Test Alert
 </button>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Task Assignment &amp; Completion</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Notify when tasks are assigned, moved across board columns, or completed</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.tasksEnabled}
 onChange={(e) => setNotifForm({ ...notifForm, tasksEnabled: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Project Milestones &amp; Roadmaps</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Updates on project health, velocity shifts, and milestone deliveries</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.projectsEnabled}
 onChange={(e) => setNotifForm({ ...notifForm, projectsEnabled: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Meetings &amp; Calendar Invites</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Alerts for upcoming syncs, room links, and agenda postings</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.meetingsEnabled}
 onChange={(e) => setNotifForm({ ...notifForm, meetingsEnabled: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Upcoming Deadline &amp; Overdue Warnings</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Immediate heads-up when high-priority tasks approach their target date</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.deadlinesEnabled}
 onChange={(e) => setNotifForm({ ...notifForm, deadlinesEnabled: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Ordis AI Intelligence Briefs</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Autonomous workload insights, bottleneck detections, and morning digests</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.ordisAlertsEnabled}
 onChange={(e) => setNotifForm({ ...notifForm, ordisAlertsEnabled: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>
 </div>
 </div>

 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Delivery Channels
 </h3>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Email Daily Digest</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Receive a single morning summary email with open tasks and meetings</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.emailDigest}
 onChange={(e) => setNotifForm({ ...notifForm, emailDigest: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Browser Audio Chime</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Play a subtle synthesized chime when a real-time notification arrives</div>
 </div>
 <input
 type="checkbox"
 checked={notifForm.soundEnabled}
 onChange={(e) => setNotifForm({ ...notifForm, soundEnabled: e.target.checked, browserSound: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
 <button type="submit" className="btn btn-primary" id="save-notif-btn">
 Save Notification Preferences
 </button>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => resetSettingsToDefault('notifications')}
 >
 Reset to Defaults
 </button>
 </div>
 </form>
 )}



 {/* ========================================================================= */}
 {/* 5. ORDIS AI SETTINGS */}
 {/* ========================================================================= */}
 {activeTab === 'ordis' && (
 <form onSubmit={handleSaveOrdis} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
 <div className="card" style={{ padding: 'var(--sp-5)', borderLeft: '4px solid var(--c-accent)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
 <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Ordis Operating Mode &amp; Proactive Intelligence
 </h3>
 </div>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Ordis is the intelligent layer that operates your workspace. Configure its degree of autonomy and behavioral style.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Assistance Operating Mode</label>
 <select
 className="input select"
 value={ordisForm.mode}
 onChange={(e) => setOrdisForm({ ...ordisForm, mode: e.target.value as any })}
 >
 <option value="proactive">Proactive Autonomous (Identifies bottlenecks &amp; prepares drafts)</option>
 <option value="collaborative">Collaborative (Asks confirmation before performing actions)</option>
 <option value="manual">Manual On-Demand (Only acts when explicitly prompted)</option>
 </select>
 </div>

 <div className="input-group">
 <label className="input-label">Communication Tone</label>
 <select
 className="input select"
 value={ordisForm.tone}
 onChange={(e) => setOrdisForm({ ...ordisForm, tone: e.target.value as any })}
 >
 <option value="concise">Concise &amp; Direct (Minimalist bullets, maximum speed)</option>
 <option value="executive">Executive Briefing (High-level business impact &amp; metrics)</option>
 <option value="detailed">Detailed Technical (Comprehensive step-by-step breakdowns)</option>
 <option value="friendly">Friendly &amp; Casual (Encouraging team tone)</option>
 </select>
 </div>

 <div className="input-group">
 <label className="input-label">Morning Briefing Time</label>
 <input
 type="time"
 className="input"
 value={ordisForm.briefingTime}
 onChange={(e) => setOrdisForm({ ...ordisForm, briefingTime: e.target.value })}
 />
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--c-gray-200)', paddingTop: 'var(--sp-4)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Proactive Workspace Scanner</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Continuously check for overloaded team members and slipping deadlines</div>
 </div>
 <input
 type="checkbox"
 checked={ordisForm.proactiveScanner}
 onChange={(e) => setOrdisForm({ ...ordisForm, proactiveScanner: e.target.checked, proactiveBottleneckDetection: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Daily Morning Briefing</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Deliver daily top 3 priorities directly to the Overview dashboard tab</div>
 </div>
 <input
 type="checkbox"
 checked={ordisForm.morningBriefing}
 onChange={(e) => setOrdisForm({ ...ordisForm, morningBriefing: e.target.checked, morningBriefingEnabled: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>
 </div>
 </div>

 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Ordis Action Permissions
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Grant Ordis direct execution authority for routine operational actions.
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Allow Creating &amp; Assigning Tasks</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow natural language prompts to directly create and assign tasks in your workspace projects</div>
 </div>
 <input
 type="checkbox"
 checked={ordisForm.allowTaskCreation}
 onChange={(e) => setOrdisForm({ ...ordisForm, allowTaskCreation: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Allow Scheduling Meetings</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow Ordis to book team calendar slots directly via conversation</div>
 </div>
 <input
 type="checkbox"
 checked={ordisForm.allowMeetingScheduling}
 onChange={(e) => setOrdisForm({ ...ordisForm, allowMeetingScheduling: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>

 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>Allow Workload Rebalancing</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow Ordis to re-distribute tasks when a team member is marked Busy</div>
 </div>
 <input
 type="checkbox"
 checked={ordisForm.allowWorkloadRebalancing}
 onChange={(e) => setOrdisForm({ ...ordisForm, allowWorkloadRebalancing: e.target.checked })}
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
 <button type="submit" className="btn btn-primary" id="save-ordis-btn">
 Save Ordis AI Settings
 </button>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => resetSettingsToDefault('ordis')}
 >
 Reset to Defaults
 </button>
 </div>
 </form>
 )}

 {/* ========================================================================= */}
 {/* 6. SECURITY & AUDIT LOGS */}
 {/* ========================================================================= */}
 {activeTab === 'security' && (
 <form onSubmit={handleSaveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Workspace Security Policies
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
 Enforce authentication restrictions and IP policies across all members. Only Gmail and Microsoft accounts are permitted to sign in.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Allowed Sign-In Providers</label>
 <div className="input" style={{ background: 'var(--c-surface)', cursor: 'default', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>Google (Gmail) &amp; Microsoft (Outlook / Hotmail)</span>
 </div>
 <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Only @gmail.com, @googlemail.com, @outlook.com, @hotmail.com, @live.com, and @msn.com domains are accepted.</p>
 </div>

 <div className="input-group">
 <label className="input-label">Minimum Password Length</label>
 <select
 className="input select"
 value={orgForm.securityPolicies?.passwordMinLength || 8}
 onChange={(e) =>
 setOrgForm({
 ...orgForm,
 securityPolicies: {
 ...orgForm.securityPolicies,
 passwordMinLength: Number(e.target.value),
 },
 })
 }
 >
 <option value={8}>8 characters</option>
 <option value={10}>10 characters</option>
 <option value={12}>12 characters (Recommended)</option>
 <option value={16}>16 characters (Enterprise)</option>
 </select>
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--c-gray-200)', paddingTop: 'var(--sp-4)' }}>
 <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>IP Range Restriction</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Restrict workspace access only to trusted corporate VPN and office IP addresses</div>
 </div>
 <input
 type="checkbox"
 checked={orgForm.securityPolicies?.ipWhitelisting ?? false}
 onChange={(e) =>
 setOrgForm({
 ...orgForm,
 securityPolicies: {
 ...orgForm.securityPolicies,
 ipWhitelisting: e.target.checked,
 },
 })
 }
 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
 />
 </label>
 </div>

 <div style={{ marginTop: 'var(--sp-4)' }}>
 <button type="submit" className="btn btn-primary" id="save-security-btn">
 Save Security Policies
 </button>
 </div>
 </div>

 {/* Connected Audit Logs Transparency Table */}
 <div className="card" style={{ padding: 'var(--sp-5)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
 <div>
 <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
 Workspace Audit Transparency Log ({auditLogs.length})
 </h3>
 <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Immutable record of settings modifications, security policies, and administrative operations.
 </p>
 </div>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => {
 setAuditLoading(true);
 fetchAuditLogs().finally(() => setAuditLoading(false));
 }}
 style={{ whiteSpace: 'nowrap' }}
 >
 {auditLoading ? 'Loading…' : 'Refresh'}
 </button>
 </div>

 {auditLogs.length === 0 ? (
 <div style={{ textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)', color: 'var(--text-tertiary)' }}>
 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto var(--sp-2) auto', display: 'block', opacity: 0.5 }}>
 <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
 <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
 </svg>
 <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
 No audit events recorded yet
 </div>
 <div style={{ fontSize: 'var(--fs-xs)' }}>
 Settings changes, team actions, and security events will appear here automatically.
 </div>
 </div>
 ) : (
 <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-xs)' }}>
 <thead>
 <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 1 }}>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'bold' }}>ACTOR</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'bold' }}>EVENT ACTION</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'bold' }}>TARGET</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'bold' }}>DETAILS</th>
 <th style={{ textAlign: 'right', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'bold' }}>TIMESTAMP</th>
 </tr>
 </thead>
 <tbody>
 {auditLogs.slice(0, 50).map((log) => (
 <tr key={log.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'bold' }}>{log.actor}</td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontFamily: 'var(--font-mono)', color: 'var(--c-brand)' }}>
 {log.action}
 </td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)' }}>{log.target}</td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', color: 'var(--text-secondary)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
 <td style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'right', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
 {log.timestamp ? new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </form>
 )}
 </div>
 );
}
