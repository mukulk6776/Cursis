'use client';

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { Department, Employee } from '@/lib/dashboard/types';

const COLOR_PALETTE = [
  '#0f4cff', // Brand Blue
  '#ccff00', // Lime
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export default function DepartmentsPage() {
  const {
    departments,
    employees,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    assignEmployeeDepartment,
    user,
    showToast,
  } = useDashboard();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'members_desc' | 'budget_desc'>('name_asc');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [reassigningDept, setReassigningDept] = useState<Department | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLead, setCreateLead] = useState('');
  const [createBudget, setCreateBudget] = useState('$200,000 / yr');
  const [createColor, setCreateColor] = useState('#0f4cff');
  const [createTags, setCreateTags] = useState('');
  const [createError, setCreateError] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLead, setEditLead] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editColor, setEditColor] = useState('#0f4cff');
  const [editTags, setEditTags] = useState('');

  // Reassign Modal State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');

  // Role-Based Access Control (RBAC)
  const role = user.workspaceRole || 'member';
  const canManage = ['owner', 'admin'].includes(role);

  // Form Submissions
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!canManage) {
      showToast('Permission Denied: Only Workspace Owners and Admins can create departments.');
      return;
    }

    const trimmedName = createName.trim();
    if (!trimmedName) {
      setCreateError('Department name is required.');
      return;
    }

    if (departments.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) {
      setCreateError(`A department named "${trimmedName}" already exists.`);
      return;
    }

    const parsedTags = createTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addDepartment({
      name: trimmedName,
      description: createDescription.trim(),
      lead: createLead || user.name,
      budget: createBudget.trim(),
      color: createColor,
      tags: parsedTags.length > 0 ? parsedTags : ['Core Operations'],
    });

    setShowCreateModal(false);
    setCreateName('');
    setCreateDescription('');
    setCreateLead('');
    setCreateBudget('$200,000 / yr');
    setCreateTags('');
    setCreateError('');
  };

  const openEditModal = (dept: Department) => {
    if (!canManage) {
      showToast('Permission Denied: Only Workspace Owners and Admins can edit departments.');
      return;
    }
    setEditingDept(dept);
    setEditName(dept.name);
    setEditDescription(dept.description || '');
    setEditLead(dept.lead || dept.head || '');
    setEditBudget(dept.budget ? String(dept.budget) : '$200,000 / yr');
    setEditColor(dept.color || '#0f4cff');
    setEditTags(dept.tags?.join(', ') || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    updateDepartment(editingDept.id, {
      name: editName.trim() || editingDept.name,
      description: editDescription.trim(),
      lead: editLead.trim() || editingDept.lead,
      budget: editBudget.trim(),
      color: editColor,
      tags: parsedTags,
    });

    setEditingDept(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDept) return;
    if (!canManage) {
      showToast('Permission Denied: Only Workspace Owners and Admins can delete departments.');
      return;
    }

    const assignedCount = employees.filter(
      (e) => e.departmentId === deletingDept.id || e.department === deletingDept.name
    ).length;

    if (assignedCount > 0) {
      showToast(`Cannot delete "${deletingDept.name}" while ${assignedCount} member(s) are assigned. Reassign them first.`);
      return;
    }

    deleteDepartment(deletingDept.id);
    setDeletingDept(null);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !targetDeptId) {
      showToast('Please select both a team member and a target department.');
      return;
    }

    const targetDept = departments.find((d) => d.id === targetDeptId);
    if (!targetDept) return;

    assignEmployeeDepartment(selectedEmployeeId, targetDept.id, targetDept.name);
    setReassigningDept(null);
    setSelectedEmployeeId('');
    setTargetDeptId('');
  };

  // Filtered and Sorted Departments with live member counts
  const processedDepartments = useMemo(() => {
    return departments
      .map((dept) => {
        const assignedMembers = employees.filter(
          (e) => e.departmentId === dept.id || e.department.toLowerCase() === dept.name.toLowerCase()
        );
        return {
          ...dept,
          liveMembers: assignedMembers,
          calculatedCount: assignedMembers.length,
        };
      })
      .filter((dept) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          dept.name.toLowerCase().includes(q) ||
          (dept.description && dept.description.toLowerCase().includes(q)) ||
          (dept.lead && dept.lead.toLowerCase().includes(q)) ||
          (dept.tags && dept.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'members_desc') return b.calculatedCount - a.calculatedCount;
        return 0;
      });
  }, [departments, employees, searchQuery, sortBy]);

  // Overall Telemetry
  const totalAssignedMembers = employees.length;
  const totalBudgetEstimate = departments.reduce((acc, d) => {
    const raw = String(d.budget || '0').replace(/[^0-9]/g, '');
    return acc + (parseInt(raw, 10) || 0);
  }, 0);

  return (
    <div className="page active" id="page-departments" style={{ display: 'block', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header with Title and RBAC Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
          gap: 'var(--sp-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', letterSpacing: 'var(--ls-tight)', margin: 0 }}>
              Department Management
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: canManage ? '#0f4cff' : 'var(--c-surface)',
                color: canManage ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {canManage ? `Admin Mode · ${role}` : `Read-Only Mode · ${role}`}
            </span>
          </div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Structure company divisions, assign strategic leads, manage headcount allocations, and reassign team resources.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {canManage ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReassigningDept(departments[0] || null)}
                style={{ fontWeight: 700 }}
              >
                ⇄ Reassign Members
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreateModal(true)}
                style={{ fontWeight: 700, boxShadow: '2px 2px 0 0 var(--border-color)' }}
              >
                + Create Department
              </button>
            </>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', padding: '6px 12px', borderRadius: '6px' }}>
              🔒 Department administration requires Workspace Owner or Admin permissions
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--sp-3)',
          marginBottom: 'var(--sp-4)',
        }}
      >
        <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'var(--c-white)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Total Divisions
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 900, marginTop: '2px', color: '#0f4cff' }}>
            {departments.length}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Active organizational units
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'var(--c-white)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Allocated Personnel
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 900, marginTop: '2px' }}>
            {totalAssignedMembers} Members
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            100% headcount accounted
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'var(--c-white)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Operational Leads
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 900, marginTop: '2px', color: '#8b5cf6' }}>
            {new Set(departments.map((d) => d.lead).filter(Boolean)).size} Leads
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Divisional leaders appointed
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'var(--c-white)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Budget Allocation
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 900, marginTop: '2px', color: '#10b981' }}>
            ${(totalBudgetEstimate / 1000).toFixed(0)}k / yr
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Across all active units
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Sort */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          background: 'var(--c-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
          <input
            type="text"
            className="input"
            style={{ width: '100%', padding: '6px 10px', fontSize: '12px', height: '34px' }}
            placeholder="Search departments by name, lead, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="input select"
            style={{ width: '180px', height: '34px', fontSize: '11px', padding: '4px 8px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name_asc">Sort: Department Name (A-Z)</option>
            <option value="members_desc">Sort: Highest Headcount</option>
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      {processedDepartments.length === 0 ? (
        <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center', background: 'var(--c-white)' }}>
          <div style={{ fontSize: '36px', marginBottom: 'var(--sp-2)' }}>🏢</div>
          <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 800, margin: '0 0 4px 0' }}>No departments match query</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: '0 auto var(--sp-4)' }}>
            No departments found matching &quot;{searchQuery}&quot;. Try modifying your search filter.
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--sp-4)',
          }}
        >
          {processedDepartments.map((dept) => (
            <div
              key={dept.id}
              className="card"
              style={{
                padding: 'var(--sp-4)',
                background: 'var(--c-white)',
                borderTop: `4px solid ${dept.color || '#0f4cff'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--fs-md)', fontWeight: 800 }}>
                      {dept.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      Lead: <strong>{dept.lead || dept.head || 'Unassigned'}</strong>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'var(--c-surface)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {dept.calculatedCount} {dept.calculatedCount === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 var(--sp-3) 0' }}>
                  {dept.description || 'Core organizational business division.'}
                </p>

                {/* Tags & Budget */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                  {dept.budget && (
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      Budget: {dept.budget}
                    </span>
                  )}
                  {dept.tags && dept.tags.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '10px', background: 'var(--c-surface)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-tertiary)', border: '1px solid var(--border-light)' }}>
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Assigned Members Roster Snapshot */}
                <div style={{ background: 'var(--c-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: 'var(--sp-2) var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Assigned Personnel ({dept.calculatedCount})
                  </div>
                  {dept.liveMembers.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      No members assigned to this department yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                      {dept.liveMembers.map((emp) => (
                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                background: emp.color || '#0f4cff',
                                color: emp.color === '#ccff00' ? '#000' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 800,
                              }}
                            >
                              {emp.initials}
                            </div>
                            <span style={{ fontWeight: 600 }}>{emp.name}</span>
                          </div>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{emp.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 'var(--sp-3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => {
                    setReassigningDept(dept);
                    setTargetDeptId(dept.id);
                  }}
                  disabled={!canManage}
                  title={canManage ? 'Assign team members to this department' : 'Requires admin permission'}
                >
                  ⇄ Manage Members
                </button>

                {canManage && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => openEditModal(dept)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px', color: '#dc2626' }}
                      onClick={() => setDeletingDept(dept)}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CREATE DEPARTMENT MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Create New Department</span>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Add a divisional team unit to your workspace architecture
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '6px', fontSize: '12px', marginBottom: 'var(--sp-3)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    ⚠️ {createError}
                  </div>
                )}

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Department Name *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Artificial Intelligence Research"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Department Lead / Head
                    </label>
                    <select
                      className="input select"
                      value={createLead}
                      onChange={(e) => setCreateLead(e.target.value)}
                    >
                      <option value="">Select a team member...</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.name}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Annual Operating Budget
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={createBudget}
                      onChange={(e) => setCreateBudget(e.target.value)}
                      placeholder="e.g. $250,000 / yr"
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Description &amp; Operational Charter
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Brief description of the department's mandate and primary deliverables..."
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Department Color Indicator
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {COLOR_PALETTE.map((color) => (
                      <div
                        key={color}
                        onClick={() => setCreateColor(color)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: color,
                          cursor: 'pointer',
                          border: createColor === color ? '2px solid #000' : '1px solid var(--border-color)',
                          boxShadow: createColor === color ? '1px 1px 0 0 #000' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={createTags}
                    onChange={(e) => setCreateTags(e.target.value)}
                    placeholder="e.g. Engineering, Autonomous, Core"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT DEPARTMENT MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {editingDept && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingDept(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Edit Department Parameters</span>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Update leadership, budget, and charter for {editingDept.name}
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditingDept(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Department Name *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Department Lead / Head
                    </label>
                    <select
                      className="input select"
                      value={editLead}
                      onChange={(e) => setEditLead(e.target.value)}
                    >
                      <option value="">Select a team member...</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.name}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Annual Budget
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Charter &amp; Responsibilities
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Department Color Indicator
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {COLOR_PALETTE.map((color) => (
                      <div
                        key={color}
                        onClick={() => setEditColor(color)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: color,
                          cursor: 'pointer',
                          border: editColor === color ? '2px solid #000' : '1px solid var(--border-color)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Tags
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDept(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ASSIGN / REASSIGN MEMBERS MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {reassigningDept && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReassigningDept(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Reassign Member Department</span>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Move team personnel between divisions
                </div>
              </div>
              <button className="modal-close" onClick={() => setReassigningDept(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignSubmit}>
              <div className="modal-body">
                <div className="input-group" style={{ marginBottom: 'var(--sp-4)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Select Team Member to Reassign *
                  </label>
                  <select
                    className="input select"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                  >
                    <option value="">Select an employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — Current Dept: {emp.department} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Target Department *
                  </label>
                  <select
                    className="input select"
                    value={targetDeptId}
                    onChange={(e) => setTargetDeptId(e.target.value)}
                    required
                  >
                    <option value="">Select target department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Lead: {d.lead || 'Unassigned'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReassigningDept(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {deletingDept && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingDept(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ padding: 'var(--sp-5)' }}>
              <div style={{ fontSize: '36px', marginBottom: 'var(--sp-2)' }}>🗑️</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--fs-md)', fontWeight: 800 }}>
                Delete Department?
              </h3>
              <p style={{ margin: '0 0 var(--sp-4) 0', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>&quot;{deletingDept.name}&quot;</strong>?
              </p>

              {employees.filter((e) => e.departmentId === deletingDept.id || e.department === deletingDept.name).length > 0 && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '6px', fontSize: '11px', marginBottom: 'var(--sp-4)', textAlign: 'left', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  ⚠️ Cannot delete: <strong>{employees.filter((e) => e.departmentId === deletingDept.id || e.department === deletingDept.name).length} member(s)</strong> are currently assigned to this department. Please reassign them first using the &quot;⇄ Manage Members&quot; button.
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeletingDept(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  onClick={handleDeleteConfirm}
                  disabled={employees.filter((e) => e.departmentId === deletingDept.id || e.department === deletingDept.name).length > 0}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
