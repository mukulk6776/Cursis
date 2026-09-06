'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

type SettingsTab = 'workspace' | 'team' | 'notifications' | 'meetings' | 'ordis';

export default function SettingsPage() {
  const {
    user,
    employees,
    roles,
    invitations,
    openModal,
    showToast,
    workspaceSettings,
    updateWorkspaceSettings,
    teamSettings,
    updateTeamSettings,
    notificationSettings,
    updateNotificationSettings,
    meetingCalendarSettings,
    updateMeetingCalendarSettings,
    ordisSettings,
    updateOrdisSettings,
    removeEmployee,
    revokeInvitation,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');

  // Local form states for Workspace Settings
  const [wsForm, setWsForm] = useState(workspaceSettings);
  // Local form states for Team Settings
  const [teamForm, setTeamForm] = useState(teamSettings);
  // Local form states for Notification Settings
  const [notifForm, setNotifForm] = useState(notificationSettings);
  // Local form states for Meeting & Calendar Settings
  const [meetForm, setMeetForm] = useState(meetingCalendarSettings);
  // Local form states for Ordis Settings
  const [ordisForm, setOrdisForm] = useState(ordisSettings);

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

  const handleSaveMeetings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMeetingCalendarSettings(meetForm);
  };

  const handleSaveOrdis = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrdisSettings(ordisForm);
  };

  return (
    <div className="page active" id="page-settings" style={{ display: 'block' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-subtitle">
            Configure workspace preferences, manage team governance, notifications, calendar rules, and Ordis AI behavior.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--sp-5)' }}>
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
          className={`tab ${activeTab === 'meetings' ? 'active' : ''}`}
          onClick={() => setActiveTab('meetings')}
        >
          4. Meetings &amp; Calendar
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'ordis' ? 'active' : ''}`}
          onClick={() => setActiveTab('ordis')}
        >
          5. Ordis AI Settings ⚡
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. WORKSPACE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'workspace' && (
        <form onSubmit={handleSaveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
              Workspace Identity &amp; Profile
            </h3>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
              Basic details used across invitations, reports, and topbar identifiers.
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
                <label className="input-label">Primary Timezone</label>
                <select
                  className="input select"
                  value={wsForm.timezone}
                  onChange={(e) => setWsForm({ ...wsForm, timezone: e.target.value })}
                >
                  <option value="UTC-8 (PST)">UTC-8 (PST - Pacific)</option>
                  <option value="UTC-5 (EST)">UTC-5 (EST - Eastern)</option>
                  <option value="UTC+0 (GMT)">UTC+0 (GMT / London)</option>
                  <option value="UTC+1 (CET)">UTC+1 (CET - Central Europe)</option>
                  <option value="UTC+5:30 (IST)">UTC+5:30 (IST - India)</option>
                  <option value="UTC+8 (SGT)">UTC+8 (SGT - Singapore)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Language</label>
                <select
                  className="input select"
                  value={wsForm.language}
                  onChange={(e) => setWsForm({ ...wsForm, language: e.target.value })}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Date Format</label>
                <select
                  className="input select"
                  value={wsForm.dateFormat}
                  onChange={(e) => setWsForm({ ...wsForm, dateFormat: e.target.value })}
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU standard)</option>
                </select>
              </div>
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
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  {['#0f4cff', '#000000', '#00b341', '#ff5710', '#7928ca'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setWsForm({ ...wsForm, accentColor: color })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--r-md)',
                        background: color,
                        border: wsForm.accentColor === color ? '3px solid #000' : '1px solid var(--border-color)',
                        outline: wsForm.accentColor === color ? '2px solid var(--c-brand-lime)' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
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
                      onClick={() => setWsForm({ ...wsForm, density })}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary">
              Save Workspace Settings
            </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>Active Team Members ({employees.length})</h3>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Manage access, roles, and workloads for your team.
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
                          <div className="avatar avatar-sm" style={{ background: emp.color, color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>
                            {emp.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'var(--fw-bold)' }}>{emp.name}</div>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>{emp.role}</td>
                      <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>{emp.department}</td>
                      <td style={{ padding: 'var(--sp-3)' }}>
                        <span className={`badge ${emp.workspaceRole === 'owner' ? 'badge-brand' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                          {emp.workspaceRole}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--sp-3)' }}>
                        <span className={`badge badge-${emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'warning' : 'neutral'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--sp-3)', textAlign: 'right' }}>
                        {emp.workspaceRole !== 'owner' ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--c-error)', fontSize: 'var(--fs-xs)' }}
                            onClick={() => removeEmployee(emp.id)}
                          >
                            Remove
                          </button>
                        ) : (
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Owner</span>
                        )}
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
              Team Governance &amp; Permissions
            </h3>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
              Default roles for newcomers and workspace security controls.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Default Role for New Invites</label>
                <select
                  className="input select"
                  value={teamForm.defaultRole}
                  onChange={(e) => setTeamForm({ ...teamForm, defaultRole: e.target.value as any })}
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

            <div style={{ marginTop: 'var(--sp-5)' }}>
              <button type="submit" className="btn btn-primary">
                Save Team Settings
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
            <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
              Workspace Event Notifications
            </h3>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
              Select which live workspace updates trigger alerts in your topbar drawer.
            </p>

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
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Play a subtle sound when a real-time notification arrives</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.soundEnabled}
                  onChange={(e) => setNotifForm({ ...notifForm, soundEnabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-primary">
              Save Notification Preferences
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. MEETINGS & CALENDAR SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'meetings' && (
        <form onSubmit={handleSaveMeetings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>
              Meeting Scheduling &amp; Video Defaults
            </h3>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
              Set baseline preferences used by Ordis and the booking engine when organizing syncs.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Default Meeting Platform</label>
                <select
                  className="input select"
                  value={meetForm.defaultPlatform}
                  onChange={(e) => setMeetForm({ ...meetForm, defaultPlatform: e.target.value as any })}
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Cursis Native Video">Cursis Native Video</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Default Duration</label>
                <select
                  className="input select"
                  value={meetForm.defaultDuration}
                  onChange={(e) => setMeetForm({ ...meetForm, defaultDuration: Number(e.target.value) })}
                >
                  <option value={15}>15 minutes (Quick Standup)</option>
                  <option value={25}>25 minutes (Speedy 25)</option>
                  <option value={30}>30 minutes (Standard)</option>
                  <option value={45}>45 minutes (Deep Dive)</option>
                  <option value={60}>60 minutes (Workshop / Strategic)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Minimum Scheduling Notice</label>
                <select
                  className="input select"
                  value={meetForm.schedulingLeadTimeMinutes}
                  onChange={(e) => setMeetForm({ ...meetForm, schedulingLeadTimeMinutes: Number(e.target.value) })}
                >
                  <option value={15}>15 minutes notice</option>
                  <option value={60}>1 hour notice</option>
                  <option value={180}>3 hours notice</option>
                  <option value={1440}>24 hours notice</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Working Hours Window</label>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <input
                    type="time"
                    className="input"
                    value={meetForm.workingHoursStart}
                    onChange={(e) => setMeetForm({ ...meetForm, workingHoursStart: e.target.value })}
                  />
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>to</span>
                  <input
                    type="time"
                    className="input"
                    value={meetForm.workingHoursEnd}
                    onChange={(e) => setMeetForm({ ...meetForm, workingHoursEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--c-gray-200)', paddingTop: 'var(--sp-4)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 'var(--fw-bold)' }}>Auto-Generate Agendas</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Ordis automatically drafts bulleted agendas from related open sprint tasks</div>
                </div>
                <input
                  type="checkbox"
                  checked={meetForm.autoAgenda}
                  onChange={(e) => setMeetForm({ ...meetForm, autoAgenda: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 'var(--fw-bold)' }}>AI Meeting Summaries &amp; Action Extraction</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Generate clean executive notes and automatically draft tasks from discussions</div>
                </div>
                <input
                  type="checkbox"
                  checked={meetForm.autoRecordAndSummarize}
                  onChange={(e) => setMeetForm({ ...meetForm, autoRecordAndSummarize: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-primary">
              Save Calendar Settings
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 5. ORDIS AI SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'ordis' && (
        <form onSubmit={handleSaveOrdis} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card" style={{ padding: 'var(--sp-5)', borderLeft: '4px solid var(--c-brand-lime)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
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
                  onChange={(e) => setOrdisForm({ ...ordisForm, proactiveScanner: e.target.checked })}
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
                  onChange={(e) => setOrdisForm({ ...ordisForm, morningBriefing: e.target.checked })}
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
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Allow prompts like "Create task for Mukul" to directly insert tasks into projects</div>
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

          <div>
            <button type="submit" className="btn btn-primary">
              Save Ordis AI Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
