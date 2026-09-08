'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate } from '@/lib/dashboard/data';

type TeamTab = 'directory' | 'invites' | 'org-chart' | 'workload' | 'onboarding';
type LicenseFilter = 'all' | 'premium' | 'standard';

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
    acceptInvitation,
    removeEmployee,
    showToast,
    premiumSeatLimit,
    premiumSeatsAllocated,
    assignSeatTier,
    seedEnterpriseDirectory,
    resetEnterpriseDirectory,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<TeamTab>('directory');
  const [deptFilter, setDeptFilter] = useState('all');
  const [licenseFilter, setLicenseFilter] = useState<LicenseFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 24;

  const filteredEmployees = employees.filter((emp) => {
    // License Filter
    if (licenseFilter === 'premium' && emp.planTier !== 'premium') return false;
    if (licenseFilter === 'standard' && emp.planTier === 'premium') return false;

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
  const standardCount = Math.max(0, employees.length - premiumSeatsAllocated);
  const proMembers = employees.filter((e) => e.planTier === 'premium');

  const handleCopyLink = (token: string) => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/invite/${token}` : `https://cursis.io/invite/${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    showToast('Invitation link copied to clipboard ✓');
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
            Manage your workspace roster, roles, permission tiers, department assignments, and granular seat license allocations.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal('invite-modal')}>
            ✉️ Invite via Email
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('member-modal')}>
            + Add Team Member
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ENTERPRISE SEAT ALLOCATION COCKPIT BANNER */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          background: 'linear-gradient(135deg, rgba(15, 76, 255, 0.04) 0%, rgba(124, 58, 237, 0.05) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.18)',
          borderRadius: 'var(--border-radius-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#7c3aed',
                  background: 'rgba(124, 58, 237, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Granular Seat Licensing Cockpit
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Scale-tested for 2,000+ workspace members
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-lg)', fontWeight: 800 }}>
              🚀 Autonomous Pro Seats: {premiumSeatsAllocated} / {premiumSeatLimit} Allocated
            </h3>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ⚡ <strong>{standardCount.toLocaleString()} Standard Core Seats</strong> active with unlimited sprint tracking and collaboration (Complimentary)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#7c3aed',
                borderColor: 'rgba(124, 58, 237, 0.4)',
                background: 'rgba(124, 58, 237, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => openModal('redeem-code-modal')}
            >
              <span>🎁</span> Redeem Code
            </button>

            {employees.length < 100 ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #0f4cff 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                }}
                onClick={() => {
                  seedEnterpriseDirectory(2000);
                  setCurrentPage(1);
                }}
              >
                ⚡ Load 2,000 Enterprise Members
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px' }}
                onClick={() => {
                  resetEnterpriseDirectory();
                  setCurrentPage(1);
                }}
              >
                ↺ Reset Directory
              </button>
            )}
          </div>
        </div>

        {/* 4 Dedicated Pro Seat Slots Visualizer */}
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
            AUTONOMOUS PRO SEAT ALLOCATION SLOTS (MAX {premiumSeatLimit})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-2)' }}>
            {[0, 1, 2, 3].map((slotIdx) => {
              const allocatedEmp = proMembers[slotIdx];
              return (
                <div
                  key={slotIdx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: allocatedEmp ? 'rgba(124, 58, 237, 0.08)' : 'var(--c-surface)',
                    border: allocatedEmp ? '1px solid rgba(124, 58, 237, 0.3)' : '1px dashed var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: allocatedEmp ? (allocatedEmp.color || '#7c3aed') : 'var(--border-color)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {allocatedEmp ? allocatedEmp.initials : `${slotIdx + 1}`}
                    </div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {allocatedEmp ? allocatedEmp.name : `Slot ${slotIdx + 1}: Unallocated`}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {allocatedEmp ? (allocatedEmp.role || 'Autonomous Pro') : 'Available Pro License'}
                      </div>
                    </div>
                  </div>

                  {allocatedEmp && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '10px', padding: '1px 5px', color: 'var(--text-tertiary)' }}
                      title="Revert license to Standard"
                      onClick={() => assignSeatTier(allocatedEmp.id, 'standard')}
                    >
                      Revert
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise Policy & Voucher Notice */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'var(--c-white)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️</span>
            <span>
              <strong>Strict License Quota:</strong> Exactly 4 members hold Autonomous Pro seats with full Ordis multi-agent capability. Remaining {standardCount.toLocaleString()} members operate on the complimentary Standard Core tier.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, padding: '2px 8px' }}
            onClick={() => openModal('redeem-code-modal')}
          >
            Have a voucher code? Claim Pro →
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
            {/* License Tier Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--c-surface)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${licenseFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '11px', padding: '2px 8px', height: '28px' }}
                onClick={() => { setLicenseFilter('all'); setCurrentPage(1); }}
              >
                All ({employees.length.toLocaleString()})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${licenseFilter === 'premium' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '11px', padding: '2px 8px', height: '28px', color: '#7c3aed', fontWeight: 600 }}
                onClick={() => { setLicenseFilter('premium'); setCurrentPage(1); }}
              >
                🚀 Pro ({premiumSeatsAllocated})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${licenseFilter === 'standard' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '11px', padding: '2px 8px', height: '28px' }}
                onClick={() => { setLicenseFilter('standard'); setCurrentPage(1); }}
              >
                ⚡ Standard ({standardCount.toLocaleString()})
              </button>
            </div>

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
              <div style={{ fontSize: '32px' }}>👥</div>
              <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>No team members found</h3>
              <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', maxWidth: '400px' }}>
                {searchQuery || deptFilter !== 'all' || licenseFilter !== 'all'
                  ? 'No members match the active filters. Try clearing search or switching license tabs.'
                  : 'Start building your company structure by provisioning team members or loading the 2,000 enterprise directory.'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                {(searchQuery || deptFilter !== 'all' || licenseFilter !== 'all') && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSearchQuery('');
                      setDeptFilter('all');
                      setLicenseFilter('all');
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
                  const isPro = emp.planTier === 'premium';

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
                        border: isPro ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid var(--border-color)',
                        boxShadow: isPro ? '0 4px 16px rgba(124, 58, 237, 0.08)' : 'none',
                      }}
                    >
                      <div>
                        {/* Top row: Avatar, Name & License Badge */}
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

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            {isPro ? (
                              <span
                                style={{
                                  background: 'linear-gradient(135deg, #7c3aed, #0f4cff)',
                                  color: '#fff',
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  letterSpacing: '0.04em',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  boxShadow: '0 2px 6px rgba(124,58,237,0.3)',
                                }}
                              >
                                🚀 PRO SEAT
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: 'var(--c-surface)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '12px',
                                  border: '1px solid var(--border-color)',
                                }}
                              >
                                ⚡ STANDARD
                              </span>
                            )}
                            <span
                              className={`badge badge-${
                                emp.status === 'online' ? 'success' : emp.status === 'busy' ? 'error' : 'neutral'
                              }`}
                              style={{ fontSize: '9px', padding: '1px 6px' }}
                            >
                              {emp.status}
                            </span>
                          </div>
                        </div>

                        {/* Role & Department */}
                        <div style={{ fontSize: 'var(--fs-xs)', color: isPro ? '#7c3aed' : 'var(--c-brand)', fontWeight: 'bold', marginBottom: 'var(--sp-2)' }}>
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

                      {/* Bottom Metadata & License Switcher */}
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
                          {/* 1-Click License Switcher */}
                          {isPro ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '10px', padding: '2px 7px', color: 'var(--text-tertiary)' }}
                              title="Revert to Standard Core tier"
                              onClick={() => assignSeatTier(emp.id, 'standard')}
                            >
                              Revert
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                color: '#7c3aed',
                                borderColor: 'rgba(124, 58, 237, 0.4)',
                                fontWeight: 700,
                              }}
                              title={premiumSeatsAllocated >= premiumSeatLimit ? 'Seat quota reached (4/4)' : 'Grant Autonomous Pro seat'}
                              onClick={() => assignSeatTier(emp.id, 'premium')}
                            >
                              + Pro Seat
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '10px', padding: '2px 8px' }}
                            onClick={() => openProfilePanel(emp.id)}
                          >
                            Profile
                          </button>
                          {emp.id !== 'u1' && emp.id !== 'u_owner' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '10px', padding: '2px 6px', color: 'var(--c-error)' }}
                              title="Remove member"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to remove ${emp.name} from the workspace?`)) {
                                  removeEmployee(emp.id);
                                }
                              }}
                            >
                              ✕
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
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>License Tier</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Department</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Expires</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
                    No pending invitations. Click &quot;+ Add Team Member&quot; or &quot;✉️ Invite via Email&quot; to send secure workspace links.
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
                    <td style={{ padding: 'var(--sp-3)' }}>
                      {inv.planTier === 'premium' ? (
                        <span className="badge" style={{ background: 'linear-gradient(135deg, #7c3aed, #0f4cff)', color: '#fff', fontSize: '10px' }}>
                          🚀 Pro Seat
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'var(--c-surface)', color: 'var(--text-secondary)', fontSize: '10px' }}>
                          ⚡ Standard
                        </span>
                      )}
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
                          📋 Copy Link
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '10px', padding: '3px 8px' }}
                          title="Simulate token acceptance and convert directly to active team member"
                          onClick={() => acceptInvitation(inv.id)}
                        >
                          ⚡ Accept / Add
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
                      {m.planTier === 'premium' && (
                        <span style={{ fontSize: '9px', color: '#7c3aed', fontWeight: 800 }}>PRO</span>
                      )}
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
                      {emp.planTier === 'premium' && (
                        <span style={{ fontSize: '9px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                          PRO SEAT
                        </span>
                      )}
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
              { title: '3. Seat Entitlement Allocation', desc: 'Allocate Standard Core tier (complimentary) or one of the 4 Autonomous Pro licenses based on admin configuration.' },
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
                  ✓
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
