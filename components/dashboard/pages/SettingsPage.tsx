'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { AuditLogItem, OrdisAgent } from '@/lib/dashboard/types';

export default function SettingsPage() {
  const {
    user,
    orgSettings,
    updateOrgSettings,
    employees,
    roles,
    auditLog,
    ordisAgents,
    departments,
    teams,
    invitations,
    revokeInvitation,
    openModal,
    showToast,
    addAuditEntry,
    activeWorkspace,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'roles' | 'security' | 'agents'>('general');

  // General form
  const [name, setName] = useState(orgSettings.name);
  const [industry, setIndustry] = useState(orgSettings.industry);
  const [timezone, setTimezone] = useState(orgSettings.timezone);
  const [dateFormat, setDateFormat] = useState(orgSettings.dateFormat);
  const [language, setLanguage] = useState(orgSettings.language);

  // Security Policies
  const [twoFactor, setTwoFactor] = useState(orgSettings.securityPolicies.twoFactorRequired);
  const [ipWhitelist, setIpWhitelist] = useState(orgSettings.securityPolicies.ipWhitelisting);
  const [sessionTimeout, setSessionTimeout] = useState(orgSettings.securityPolicies.sessionTimeout);
  const [pwMinLength, setPwMinLength] = useState(orgSettings.securityPolicies.passwordMinLength);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgSettings({ name, industry, timezone, dateFormat, language });
    addAuditEntry(user.id, 'workspace.settings.updated', 'Workspace Name', 'Changed workspace settings');
    showToast('Workspace settings saved *');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgSettings({
      securityPolicies: {
        ...orgSettings.securityPolicies,
        twoFactorRequired: twoFactor,
        ipWhitelisting: ipWhitelist,
        sessionTimeout: Number(sessionTimeout),
        passwordMinLength: Number(pwMinLength),
      },
    });
    addAuditEntry(user.id, 'security.policies_updated', 'Governance', 'Updated 2FA and session timeout policies');
    showToast('Security policies updated *');
  };

  const permKeys = [
    'manage_workspace', 'manage_billing', 'delete_workspace', 'manage_roles',
    'manage_members', 'invite_members', 'remove_members', 'suspend_members',
    'manage_integrations', 'view_audit_logs', 'manage_security', 'create_project',
    'delete_project', 'create_task', 'delete_task', 'manage_automations',
    'manage_documents', 'manage_crm', 'manage_agents', 'view_analytics',
    'export_data', 'manage_channels', 'send_messages'
  ];

  const permLabels: Record<string, string> = {
    manage_workspace: 'Manage Workspace', manage_billing: 'Manage Billing', delete_workspace: 'Delete Workspace',
    manage_roles: 'Manage Roles', manage_members: 'Manage Members', invite_members: 'Invite Members',
    remove_members: 'Remove Members', suspend_members: 'Suspend Members', manage_integrations: 'Manage Integrations',
    view_audit_logs: 'View Audit Logs', manage_security: 'Manage Security', create_project: 'Create Project',
    delete_project: 'Delete Project', create_task: 'Create Task', delete_task: 'Delete Task',
    manage_automations: 'Manage Automations', manage_documents: 'Manage Documents', manage_crm: 'Manage CRM',
    manage_agents: 'Manage Agents', view_analytics: 'View Analytics', export_data: 'Export Data',
    manage_channels: 'Manage Channels', send_messages: 'Send Messages'
  };

  const getDepartment = (id?: string | null) => (id ? departments.find((d) => d.id === id) : null);
  const getEmployee = (id?: string | null) => (id ? employees.find((e) => e.id === id) : null);

  return (
    <div className="page active" id="page-settings" style={{ display: 'block' }}>
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <h1 className="page-title">Workspace Settings &amp; Governance</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--sp-5)' }}>
        <span
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
          style={{ cursor: 'pointer' }}
        >
          General
        </span>
        <span
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
          style={{ cursor: 'pointer' }}
        >
          Members ({employees.length})
        </span>
        <span
          className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
          style={{ cursor: 'pointer' }}
        >
          Roles &amp; Permissions
        </span>
        <span
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
          style={{ cursor: 'pointer' }}
        >
          Security &amp; Audit
        </span>
        <span
          className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
          style={{ cursor: 'pointer' }}
        >
          ORDIS Agents ({ordisAgents.length})
        </span>
      </div>

      {/* 1. GENERAL TAB */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* Workspace Information */}
          <form onSubmit={handleSaveGeneral} className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-4)' }}>Workspace Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Workspace Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Industry</label>
                <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Timezone</label>
                <select className="input select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option>UTC-8 (PST)</option>
                  <option>UTC-5 (EST)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+1 (CET)</option>
                  <option>UTC+5:30 (IST)</option>
                  <option>UTC+8 (SGT)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Date Format</label>
                <select className="input select" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option>YYYY-MM-DD</option>
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Language</label>
                <select className="input select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Workspace Plan &amp; Type</label>
                <div className="input" style={{ background: 'var(--c-surface)', cursor: 'default', fontWeight: 'var(--fw-bold)' }}>
                  {activeWorkspace?.type === 'public' ? 'Public Free Workspace' : 'Custom Agency Client Workspace'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>

          {/* Departments */}
          <div className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-4)' }}>Departments</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--sp-3)' }}>
              {departments.map((d) => {
                const head = getEmployee(d.head);
                const count = employees.filter((e) => e.department === d.name).length;
                return (
                  <div key={d.id} className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{d.name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        {count} members
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Head: {head ? head.name : 'Unassigned'}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--sp-3)' }}
              onClick={() => showToast('Department creation modal open *')}
            >
              + Add Department
            </button>
          </div>

          {/* Teams */}
          <div className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-4)' }}>Teams</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
              {teams.map((t) => {
                const lead = getEmployee(t.lead);
                const dept = getDepartment(t.departmentId);
                return (
                  <div key={t.id} className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{t.name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        {t.members.length} members
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {dept ? dept.name : ''} / Lead: {lead ? lead.name : 'Unassigned'}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--sp-2)' }}>
                      {t.members.slice(0, 4).map((mid) => {
                        const m = getEmployee(mid);
                        return m ? (
                          <div
                            key={mid}
                            className="avatar avatar-xs"
                            style={{ background: m.color, fontSize: '9px', width: '24px', height: '24px' }}
                            title={m.name}
                          >
                            {m.initials}
                          </div>
                        ) : null;
                      })}
                      {t.members.length > 4 && (
                        <div
                          className="avatar avatar-xs"
                          style={{ background: 'var(--c-gray-300)', fontSize: '9px', width: '24px', height: '24px' }}
                        >
                          +{t.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--sp-3)' }}
              onClick={() => showToast('Team creation modal open *')}
            >
              + Create Team
            </button>
          </div>
        </div>
      )}

      {/* 2. MEMBERS TAB */}
      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <div>
              <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' }}>{employees.length} Members</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)', marginLeft: 'var(--sp-2)' }}>
                {invitations.filter((i) => i.status === 'pending').length} pending invitations
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => openModal('invite-modal')}>
              + Invite Member
            </button>
          </div>

          {/* Member Table */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 'var(--sp-5)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>MEMBER</th>
                  <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>ROLE</th>
                  <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>DEPARTMENT</th>
                  <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>WORKSPACE ROLE</th>
                  <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>STATUS</th>
                  <th style={{ textAlign: 'right', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                        <div className="avatar avatar-sm" style={{ background: e.color, fontSize: '10px' }}>
                          {e.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'var(--fw-bold)' }}>{e.name}</div>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                            {e.email || `${e.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-xs)' }}>{e.role}</td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-xs)' }}>{e.department}</td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      <span
                        className={`badge ${
                          e.workspaceRole === 'owner'
                            ? 'badge-brand'
                            : e.workspaceRole === 'admin'
                            ? 'badge-brand'
                            : 'badge-neutral'
                        }`}
                        style={{ fontSize: '10px', textTransform: 'capitalize' }}
                      >
                        {e.workspaceRole}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      <span
                        className={`badge badge-${
                          e.status === 'online' ? 'success' : e.status === 'busy' ? 'warning' : 'neutral'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'right' }}>
                      {e.workspaceRole !== 'owner' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 'var(--fs-xs)' }}
                            onClick={() => showToast(`Profile panel for ${e.name} *`)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 'var(--fs-xs)' }}
                            onClick={() => showToast(`Role changed for ${e.name} *`)}
                          >
                            Change Role
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Workspace Owner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending Invitations */}
          <h3 style={{ marginBottom: 'var(--sp-3)' }}>Pending Invitations</h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            {invitations.length === 0 ? (
              <div style={{ padding: 'var(--sp-5)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
                No pending invitations
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>EMAIL</th>
                    <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>ROLE</th>
                    <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>DEPARTMENT</th>
                    <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>STATUS</th>
                    <th style={{ textAlign: 'left', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>SENT</th>
                    <th style={{ textAlign: 'right', padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => {
                    const dept = getDepartment(inv.department);
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                        <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: 'var(--fw-medium)' }}>{inv.email}</td>
                        <td style={{ padding: 'var(--sp-3) var(--sp-4)', textTransform: 'capitalize' }}>{inv.role || inv.workspaceRole || inv.roleTitle}</td>
                        <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>{dept ? dept.name : '--'}</td>
                        <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                          <span
                            className={`badge badge-${
                              inv.status === 'pending' ? 'warning' : inv.status === 'accepted' ? 'success' : 'neutral'
                            }`}
                            style={{ fontSize: '10px' }}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                          {new Date(inv.sentAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'right' }}>
                          {inv.status === 'pending' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: 'var(--fs-xs)' }}
                                onClick={() => showToast(`Invitation resent to ${inv.email} *`)}
                              >
                                Resend
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-error)' }}
                                onClick={() => {
                                  revokeInvitation(inv.id);
                                  showToast('Invitation cancelled *');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. ROLES & PERMISSIONS TAB */}
      {activeTab === 'roles' && (
        <div>
          <div className="card" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-2)' }}>Role Descriptions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--sp-3)' }}>
              {roles.map((r) => (
                <div key={r.id} className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
                  <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', marginBottom: '4px' }}>{r.name}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', lineHeight: 'var(--lh-normal)' }}>
                    {r.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ overflow: 'auto' }}>
            <h3 style={{ padding: 'var(--sp-4) var(--sp-4) var(--sp-2)' }}>Granular Permission Matrix</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-xs)' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-width) solid var(--border-color)', background: 'var(--c-surface)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 'var(--sp-2) var(--sp-3)',
                      fontWeight: 'var(--fw-bold)',
                      minWidth: '180px',
                      position: 'sticky',
                      left: 0,
                      background: 'var(--c-surface)',
                    }}
                  >
                    PERMISSION
                  </th>
                  {roles.map((r) => (
                    <th key={r.id} style={{ textAlign: 'center', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', minWidth: '80px' }}>
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permKeys.map((pk) => (
                  <tr key={pk} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                    <td
                      style={{
                        padding: 'var(--sp-2) var(--sp-3)',
                        fontWeight: 'var(--fw-medium)',
                        position: 'sticky',
                        left: 0,
                        background: 'var(--c-white)',
                      }}
                    >
                      {permLabels[pk] || pk}
                    </td>
                    {roles.map((r) => {
                      const has = r.id === 'owner' || r.id === 'admin' || (r.id === 'manager' && !pk.includes('workspace') && !pk.includes('billing'));
                      return (
                        <td key={r.id} style={{ textAlign: 'center', padding: 'var(--sp-2) var(--sp-3)' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '20px',
                              height: '20px',
                              background: has ? 'var(--c-near-black)' : 'var(--c-gray-200)',
                              color: has ? 'var(--c-white)' : 'var(--c-gray-400)',
                              fontSize: '11px',
                              fontWeight: 'var(--fw-bold)',
                              lineHeight: '20px',
                              textAlign: 'center',
                            }}
                          >
                            {has ? '✓' : '--'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SECURITY & AUDIT TAB */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-5)' }}>
          <form onSubmit={handleSaveSecurity} className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ marginBottom: 'var(--sp-4)' }}>Security Governance Policies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span>Two-Factor Authentication Required</span>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                <span>IP Whitelisting Enabled</span>
                <input
                  type="checkbox"
                  checked={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
              </label>
              <div className="input-group">
                <label className="input-label">Session Inactivity Timeout (minutes)</label>
                <input
                  className="input"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Minimum Password Length</label>
                <input
                  className="input"
                  type="number"
                  value={pwMinLength}
                  onChange={(e) => setPwMinLength(Number(e.target.value))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--sp-4)' }}>
              Save Policies
            </button>
          </form>

          {/* Audit Trail */}
          <div className="card" style={{ padding: 'var(--sp-5)', maxHeight: '480px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 'var(--sp-3)' }}>Security Audit Trail</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {auditLog.slice(0, 15).map((log: AuditLogItem) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-2)',
                    borderBottom: '1px solid var(--c-gray-100)',
                    fontSize: 'var(--fs-xs)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--fw-bold)' }}>{log.action}</div>
                    <div style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {log.target} — {log.details}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ORDIS AGENTS TAB */}
      {activeTab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
          {ordisAgents.map((ag: OrdisAgent) => (
            <div key={ag.id} className="card" style={{ padding: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '20px' }}>{ag.icon}</span>
                  <span style={{ fontWeight: 'var(--fw-bold)' }}>{ag.name}</span>
                </div>
                <span className={`badge badge-${ag.status === 'active' ? 'success' : 'neutral'}`} style={{ fontSize: '9px' }}>
                  {ag.status}
                </span>
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)' }}>
                {ag.description}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: 'var(--fs-xs)' }}
                onClick={() => showToast(`Configured triggers for ${ag.name} *`)}
              >
                Configure Triggers
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
