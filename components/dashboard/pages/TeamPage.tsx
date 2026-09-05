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
    openModal,
    openProfilePanel,
    revokeInvitation,
    showToast,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<TeamTab>('directory');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter !== 'all' && emp.departmentId !== deptFilter && emp.department.toLowerCase() !== deptFilter.toLowerCase()) {
      return false;
    }
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

  const pendingInvites = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="page active" id="page-team">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team &amp; People Management</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => openModal('invite-modal')}>
            + Add Team Member
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
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
          <span
            className={`tab ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            Team Directory ({employees.length})
          </span>
          <span
            className={`tab ${activeTab === 'invites' ? 'active' : ''}`}
            onClick={() => setActiveTab('invites')}
          >
            Pending Invites ({pendingInvites.length})
          </span>
          <span
            className={`tab ${activeTab === 'org-chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('org-chart')}
          >
            Organizational Hierarchy
          </span>
          <span
            className={`tab ${activeTab === 'workload' ? 'active' : ''}`}
            onClick={() => setActiveTab('workload')}
          >
            Workload Distribution
          </span>
          <span
            className={`tab ${activeTab === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveTab('onboarding')}
          >
            Onboarding
          </span>
        </div>

        {activeTab === 'directory' && (
          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
            <select
              className="input select"
              style={{ fontSize: 'var(--fs-xs)', padding: 'var(--sp-2)' }}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              className="input"
              style={{ fontSize: 'var(--fs-xs)', padding: 'var(--sp-2)', width: '180px' }}
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 1. Directory Tab */}
      {activeTab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
          {filteredEmployees.map((emp) => {
            const empTasks = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed');
            return (
              <div
                key={emp.id}
                className="card"
                style={{
                  padding: 'var(--sp-4)',
                  cursor: 'pointer',
                  transition: 'all var(--dur-fast) var(--ease-default)',
                }}
                onClick={() => openProfilePanel(emp.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
                  <div className="avatar avatar-lg" style={{ background: emp.color }}>
                    {emp.initials}
                  </div>
                  <span
                    className={`badge badge-${
                      emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'error' : 'neutral'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 2px 0', fontSize: 'var(--fs-md)' }}>{emp.name}</h3>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-brand)', fontWeight: 'bold', marginBottom: 'var(--sp-2)' }}>
                  {emp.role} · {emp.department}
                </div>

                {emp.skills && emp.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--sp-3)' }}>
                    {emp.skills.map((s) => (
                      <span key={s} className="tag" style={{ fontSize: '10px', padding: '1px 5px' }}>{s}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--sp-2)', borderTop: '1px solid var(--c-gray-200)', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  <span>{empTasks.length} active tasks</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Joined {formatDate(emp.joinedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Pending Invites Tab */}
      {activeTab === 'invites' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Email Address</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Role</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Department</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Token</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Expires</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
                    No pending invitations. Click &quot;+ Add Team Member&quot; to invite colleagues to the workspace.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                    <td style={{ padding: 'var(--sp-3)', fontWeight: 'bold' }}>{inv.email}</td>
                    <td style={{ padding: 'var(--sp-3)' }}>{inv.name}</td>
                    <td style={{ padding: 'var(--sp-3)' }}>
                      <span className="badge badge-brand">{inv.workspaceRole}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-3)' }}>{inv.department.replace('dept_', '')}</td>
                    <td style={{ padding: 'var(--sp-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
                      {inv.token}
                    </td>
                    <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: inv.status === 'expired' ? 'var(--c-error)' : 'inherit' }}>
                      {formatDate(inv.expiresAt)} ({inv.status})
                    </td>
                    <td style={{ padding: 'var(--sp-3)' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                          onClick={() => {
                            navigator.clipboard?.writeText(inv.token);
                            showToast('Invitation token copied to clipboard *');
                          }}
                        >
                          Copy
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '10px', padding: '2px 6px', color: 'var(--c-error)' }}
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

      {/* 3. Organizational Hierarchy Tab */}
      {activeTab === 'org-chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
          {departments.map((dept) => {
            const headEmp = employees.find((e) => e.id === dept.head);
            const deptMembers = employees.filter((e) => e.departmentId === dept.id);
            const deptTeams = teams.filter((t) => t.departmentId === dept.id);

            return (
              <div key={dept.id} className="card" style={{ padding: 'var(--sp-4)' }}>
                <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-2)' }}>DEPARTMENT</div>
                <h3 style={{ margin: '0 0 var(--sp-1) 0', fontSize: 'var(--fs-lg)' }}>{dept.name}</h3>
                {headEmp && (
                  <p style={{ margin: '0 0 var(--sp-3) 0', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                    Head: <strong>{headEmp.name}</strong> ({headEmp.role})
                  </p>
                )}

                {deptTeams.length > 0 && (
                  <div style={{ marginBottom: 'var(--sp-3)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '4px' }}>TEAMS</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {deptTeams.map((t) => (
                        <span key={t.id} className="tag" style={{ background: 'var(--c-surface)' }}>{t.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  MEMBERS ({deptMembers.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {deptMembers.map((m) => (
                    <div
                      key={m.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: '4px 6px', background: 'var(--c-surface)', cursor: 'pointer' }}
                      onClick={() => openProfilePanel(m.id)}
                    >
                      <div className="avatar avatar-sm" style={{ background: m.color, fontSize: '10px' }}>{m.initials}</div>
                      <div style={{ flex: 1, fontSize: 'var(--fs-xs)' }}>
                        <strong>{m.name}</strong> · <span style={{ color: 'var(--text-secondary)' }}>{m.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Workload Distribution Tab */}
      {activeTab === 'workload' && (
        <div className="card" style={{ padding: 'var(--sp-4)' }}>
          <h3 style={{ marginBottom: 'var(--sp-4)' }}>Team Task Allocation &amp; Capacity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {employees.map((emp) => {
              const activeCount = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed').length;
              const completedCount = tasks.filter((t) => t.assignee === emp.id && t.status === 'completed').length;
              const loadPercent = Math.min(100, Math.round((activeCount / 8) * 100));
              const isHeavy = activeCount >= 6;

              return (
                <div key={emp.id} style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)', border: 'var(--border-width) solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <div className="avatar avatar-sm" style={{ background: emp.color }}>{emp.initials}</div>
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{emp.name}</span>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>({emp.role})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span className={`badge badge-${isHeavy ? 'error' : 'neutral'}`} style={{ fontSize: '10px' }}>
                        {isHeavy ? 'High Load' : 'Normal'}
                      </span>
                      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'bold' }}>{activeCount} active tasks</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: 'white', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${loadPercent}%`,
                        background: isHeavy ? 'var(--c-warning)' : 'var(--c-brand)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    <span>{completedCount} completed historically</span>
                    <span>Capacity: {activeCount}/8 tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Onboarding Checklist Tab */}
      {activeTab === 'onboarding' && (
        <div className="card" style={{ padding: 'var(--sp-5)' }}>
          <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-2)' }}>AUTOMATION WORKFLOW</div>
          <h2 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-xl)' }}>New Member Onboarding Standard</h2>
          <p style={{ margin: '0 0 var(--sp-4) 0', color: 'var(--text-secondary)' }}>
            Automatically triggered when an invited member accepts their token.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              { title: 'Provision Workspace & Security Profile', desc: 'Require 2FA authentication, assign workspaceRole, generate session token.' },
              { title: 'Assign Department Channel & Core Teams', desc: 'Auto-add to relevant communication channels and project boards.' },
              { title: 'Dispatch Welcome Packet & Compliance Docs', desc: 'Send Employee Onboarding & Security Checklist via Paperwork Studio.' },
              { title: 'Schedule 1:1 Manager Orientation', desc: 'Auto-book 30-minute introductory meeting on Cursis Meet.' },
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-3)',
                  background: 'var(--c-surface)',
                  border: 'var(--border-width) solid var(--border-color)',
                }}
              >
                <div style={{ width: '24px', height: '24px', background: 'var(--c-near-black)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  {idx + 1}
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
