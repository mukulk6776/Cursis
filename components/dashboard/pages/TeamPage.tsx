'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate } from '@/lib/dashboard/data';
import { AlertTriangle } from 'lucide-react';

type TeamTab = 'directory' | 'invites' | 'org-chart' | 'workload' | 'onboarding';

export default function TeamPage() {
  const {
    employees,
    departments,
    invitations,
    tasks,
    user,
    openModal,
    openProfilePanel,
    revokeInvitation,
    removeEmployee,
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="page active" id="page-team" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0A0A0A' }}>
              Team
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: employees.length >= 10 ? 'rgba(239, 68, 68, 0.1)' : 'var(--c-surface)',
                color: employees.length >= 10 ? 'var(--c-error)' : 'var(--text-secondary)',
                border: `1px solid ${employees.length >= 10 ? 'var(--c-error)' : 'var(--border-color)'}`,
                textTransform: 'uppercase',
              }}
            >
              {employees.length} / 10 members {employees.length >= 10 ? '• Limit Reached' : ''}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage workspace roster, roles, and department assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn ${employees.length >= 10 ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={() => openModal('invite-modal')}
            style={{ fontWeight: 700 }}
            title={employees.length >= 10 ? 'Team limit reached (max 10 members)' : undefined}
          >
            + Invite Member {employees.length >= 10 ? '(Max 10)' : ''}
          </button>
        </div>
      </div>

      {employees.length >= 10 && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 'var(--sp-4)',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--c-error)',
            color: 'var(--c-error)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--c-error)" />
            <span>
              <strong>Team limit reached (10 / 10 members):</strong> This workspace is at maximum member capacity. Remove a member before inviting someone new.
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: 'var(--c-error)', color: '#fff' }}>
            Max Limit
          </span>
        </div>
      )}

      {/* Navigation Controls & Filters */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: 'var(--c-white)',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'directory' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: activeTab === 'directory' ? 700 : 500 }}
            onClick={() => setActiveTab('directory')}
          >
            Directory ({employees.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'invites' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: activeTab === 'invites' ? 700 : 500 }}
            onClick={() => setActiveTab('invites')}
          >
            Pending Invites ({pendingInvites.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'org-chart' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: activeTab === 'org-chart' ? 700 : 500 }}
            onClick={() => setActiveTab('org-chart')}
          >
            Hierarchy
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'workload' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: activeTab === 'workload' ? 700 : 500 }}
            onClick={() => setActiveTab('workload')}
          >
            Workload
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'onboarding' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: activeTab === 'onboarding' ? 700 : 500 }}
            onClick={() => setActiveTab('onboarding')}
          >
            Onboarding
          </button>
        </div>

        {activeTab === 'directory' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="input select"
              style={{ fontSize: '12px', padding: '0 8px', height: '32px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
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
              style={{ fontSize: '12px', padding: '0 10px', width: '180px', height: '32px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>

      {/* 1. DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <>
          {filteredEmployees.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--c-white)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#0A0A0A' }}>
                No team members found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                {searchQuery || deptFilter !== 'all'
                  ? 'No members match the active filters. Try clearing search or department filters.'
                  : 'Start building your company structure by inviting team members.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {(searchQuery || deptFilter !== 'all') && (
                  <button
                    type="button"
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
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openModal('invite-modal')}
                  style={{ fontWeight: 700 }}
                >
                  + Invite Member
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Member Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '12px' }}>
                {paginatedEmployees.map((emp) => {
                  const empTasks = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed');

                  return (
                    <div
                      key={emp.id}
                      className="card"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'var(--c-white)',
                      }}
                    >
                      <div>
                        {/* Top row: Avatar, Name & Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
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
                                width: '38px',
                                height: '38px',
                                fontSize: '13px',
                              }}
                            >
                              {emp.initials}
                            </div>
                            <div>
                              <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: '#0A0A0A' }}>
                                {emp.name}
                              </h3>
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@cursis.io`}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '9px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--c-surface)',
                              color: emp.status === 'online' ? '#16a34a' : 'var(--text-secondary)',
                            }}
                          >
                            {emp.status}
                          </span>
                        </div>

                        {/* Role & Department Badges */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(15, 76, 255, 0.08)',
                              color: '#0f4cff',
                              border: '1px solid rgba(15, 76, 255, 0.2)',
                            }}
                          >
                            {emp.role}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              background: 'var(--c-surface)',
                              border: '1px solid var(--border-color)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {emp.department}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-tertiary)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {emp.workspaceRole || 'Member'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '10px',
                          borderTop: '1px solid var(--border-color)',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{empTasks.length} active tasks</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                            onClick={() => openProfilePanel(emp.id)}
                          >
                            Profile
                          </button>
                          {(user.workspaceRole === 'owner' || user.role === 'owner') && emp.id !== user.id && emp.id !== 'u1' && emp.id !== 'u_owner' && emp.workspaceRole !== 'owner' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                color: '#dc2626',
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to remove ${emp.name} from the workspace?`)) {
                                  await removeEmployee(emp.id);
                                }
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="card"
                  style={{
                    marginTop: '16px',
                    padding: '10px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'var(--c-white)',
                  }}
                >
                  <div>
                    Showing <strong>{startIndex + 1}</strong> to{' '}
                    <strong>{Math.min(startIndex + PAGE_SIZE, filteredEmployees.length)}</strong> of{' '}
                    <strong>{filteredEmployees.length}</strong> members
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      disabled={safePage <= 1}
                      onClick={() => handlePageChange(safePage - 1)}
                    >
                      ‹ Prev
                    </button>
                    <span style={{ padding: '0 6px', fontWeight: 600, color: '#0A0A0A' }}>
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      disabled={safePage >= totalPages}
                      onClick={() => handlePageChange(safePage + 1)}
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 2. PENDING INVITES TAB */}
      {activeTab === 'invites' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700 }}>Email Address</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700 }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700 }}>Role</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700 }}>Department</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700 }}>Expires</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No pending invitations. Click &quot;+ Invite Member&quot; to add a team member.
                  </td>
                </tr>
              ) : (
                pendingInvites.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: '13px' }}>{inv.email}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px' }}>{inv.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'var(--c-surface)', border: '1px solid var(--border-color)' }}>
                        {inv.workspaceRole} ({inv.roleTitle})
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{(inv.department || 'Operations').replace('dept_', '')}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '11px', padding: '2px 8px', color: '#dc2626' }}
                        onClick={() => revokeInvitation(inv.id)}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. ORGANIZATIONAL HIERARCHY TAB */}
      {activeTab === 'org-chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div
            className="card"
            style={{
              gridColumn: '1 / -1',
              padding: '14px 18px',
              background: 'var(--c-white)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Department Organization Matrix</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                View teams by department or manage structure in the dedicated Departments view.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setDashboardPage('departments')}
              style={{ fontWeight: 700 }}
            >
              Open Departments Studio →
            </button>
          </div>

          {departments.map((dept) => {
            const headEmp = employees.find((e) => e.id === dept.head);
            const deptMembers = employees.filter(
              (e) => e.departmentId === dept.id || e.department?.toLowerCase() === dept.name.toLowerCase()
            );

            return (
              <div key={dept.id} className="card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--c-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '8px',
                  }}
                >
                  Department
                </span>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0A0A0A' }}>{dept.name}</h3>
                {headEmp && (
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Lead: <strong>{headEmp.name}</strong> ({headEmp.role})
                  </p>
                )}

                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  ACTIVE ROSTER ({deptMembers.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
                  {deptMembers.slice(0, 8).map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
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
                          width: '22px',
                          height: '22px',
                        }}
                      >
                        {m.initials}
                      </div>
                      <div style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{m.name}</strong> · <span style={{ color: 'var(--text-secondary)' }}>{m.role}</span>
                      </div>
                    </div>
                  ))}
                  {deptMembers.length > 8 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '4px' }}>
                      +{deptMembers.length - 8} more members
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. WORKLOAD DISTRIBUTION TAB */}
      {activeTab === 'workload' && (
        <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: '#0A0A0A' }}>
                Team Task Allocation &amp; Bandwidth
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Active tasks distributed across team members.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
            {employees.slice(0, 30).map((emp) => {
              const activeCount = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed').length;
              const loadPercent = Math.min(100, Math.round((activeCount / 8) * 100));
              const isHeavy = activeCount >= 6;

              return (
                <div
                  key={emp.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--c-white)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        className="avatar avatar-sm"
                        style={{
                          background: emp.color || '#0f4cff',
                          color: emp.color === '#ccff00' ? '#000' : '#fff',
                          fontWeight: 700,
                          width: '24px',
                          height: '24px',
                          fontSize: '10px',
                        }}
                      >
                        {emp.initials}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{emp.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>({emp.role})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--c-surface)',
                          border: '1px solid var(--border-color)',
                          color: isHeavy ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {isHeavy ? 'High Load' : 'Available'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{activeCount} active tasks</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--c-surface)', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${loadPercent}%`,
                        background: isHeavy ? '#dc2626' : '#0f4cff',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ONBOARDING CHECKLIST TAB */}
      {activeTab === 'onboarding' && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--c-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            Workflow Checklist
          </span>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#0A0A0A' }}>
            New Member Onboarding
          </h2>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Standard setup steps executed when new members join this workspace.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { title: '1. Provision Workspace & Security Profile', desc: 'Generate account credentials and configure workspace permissions.' },
              { title: '2. Assign Department & Squads', desc: 'Assign member to primary department and relevant projects.' },
              { title: '3. Role & Access Allocation', desc: 'Assign Member or Admin permissions according to team role.' },
              { title: '4. Orientation Sync', desc: 'Schedule initial 1:1 onboarding sync.' },
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--c-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    background: '#0f4cff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{step.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
