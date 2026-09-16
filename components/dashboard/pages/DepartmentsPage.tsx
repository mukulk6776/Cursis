'use client';

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { Department } from '@/lib/dashboard/types';

export default function DepartmentsPage() {
  const {
    departments,
    employees,
    tasks,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    user,
    activeWorkspace,
  } = useDashboard();

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Add form
  const [addName, setAddName] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');

  // Safe delete state
  const [taskHandlingAction, setTaskHandlingAction] = useState<'reassign' | 'unassign'>('unassign');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // RBAC permissions in current workspace
  const userRole = user.workspaceRole || (activeWorkspace.ownerId === user.id ? 'owner' : 'member');
  const canManage = ['owner', 'admin'].includes(userRole);

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    });
  }, [departments, searchQuery]);

  // Handle Add Department
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!canManage) {
      setAddError('Permission Denied: Only Workspace Owners and Admins can add departments.');
      return;
    }

    const trimmed = addName.trim();
    if (!trimmed) {
      setAddError('Department name is required.');
      return;
    }

    if (departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      setAddError(`A department named "${trimmed}" already exists in this workspace.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDepartment({
        name: trimmed,
        description: addDescription.trim(),
      });
      setAddName('');
      setAddDescription('');
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || 'Could not create the department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Department
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setEditError('');

    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Department name is required.');
      return;
    }

    if (
      departments.some(
        (d) => d.id !== editingDept.id && d.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setEditError(`A department named "${trimmed}" already exists in this workspace.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDepartment(editingDept.id, {
        name: trimmed,
        description: editDescription.trim(),
      });
      setEditingDept(null);
    } catch (err: any) {
      setEditError(err.message || 'Could not update the department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open safe delete modal
  const openDeleteModal = (dept: Department) => {
    const activeTasksCount = tasks.filter(
      (t) => t.departmentId === dept.id && t.status !== 'completed'
    ).length;

    setDeletingDept({
      ...dept,
      activeTaskCount: activeTasksCount || dept.activeTaskCount || 0,
    });
    setDeleteError('');
    setTaskHandlingAction('unassign');
    const otherDepts = departments.filter((d) => d.id !== dept.id);
    setTargetDeptId(otherDepts[0]?.id || '');
  };

  // Confirm safe delete
  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const activeTasksCount = deletingDept.activeTaskCount || 0;
      const options =
        activeTasksCount > 0
          ? {
              taskAction: taskHandlingAction,
              targetDepartmentId:
                taskHandlingAction === 'reassign' ? targetDeptId : undefined,
            }
          : undefined;

      const result = await deleteDepartment(deletingDept.id, options);
      if (result.success) {
        setDeletingDept(null);
      } else if (result.requiresHandling) {
        setDeletingDept((prev) =>
          prev ? { ...prev, activeTaskCount: result.activeTaskCount } : null
        );
        setDeleteError(result.message || 'Active tasks must be handled before deletion.');
      } else {
        setDeleteError(result.message || 'Failed to delete department.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page active" id="page-departments" style={{ maxWidth: '1080px', margin: '0 auto' }}>
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
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Departments
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: canManage ? '#0f4cff' : 'var(--c-surface)',
                color: canManage ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                textTransform: 'uppercase',
              }}
            >
              {canManage ? userRole : 'View Only'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Organize workspace tasks and team structure by division.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setAddError('');
                setAddName('');
                setAddDescription('');
                setShowAddModal(true);
              }}
              style={{ fontWeight: 700 }}
            >
              + Add Department
            </button>
          )}
        </div>
      </div>

      {/* Control Bar */}
      {departments.length > 0 && (
        <div style={{ marginBottom: 'var(--sp-4)', maxWidth: '360px' }}>
          <input
            type="text"
            className="input"
            style={{ width: '100%', padding: '6px 12px', fontSize: '13px', height: '36px' }}
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Departments List */}
      {departments.length === 0 ? (
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
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>No departments yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Create your first department to organize tasks and team members.
          </p>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
              style={{ fontWeight: 700 }}
            >
              + Add Department
            </button>
          )}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
          No departments matching "{searchQuery}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredDepartments.map((dept) => {
            const memberCount = employees.filter(
              (e) => e.departmentId === dept.id || e.department?.toLowerCase() === dept.name.toLowerCase()
            ).length;
            const activeTaskCount = tasks.filter(
              (t) => t.departmentId === dept.id && t.status !== 'completed'
            ).length;

            return (
              <div
                key={dept.id}
                className="card"
                style={{
                  padding: '14px 18px',
                  background: 'var(--c-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1', minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A' }}>
                      {dept.name}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        background: 'var(--c-surface)',
                        padding: '1px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: activeTaskCount > 0 ? '#0f4cff' : 'var(--text-tertiary)',
                        fontWeight: activeTaskCount > 0 ? 600 : 400,
                      }}
                    >
                      {activeTaskCount} active {activeTaskCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  {dept.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {dept.description}
                    </p>
                  )}
                </div>

                {canManage && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingDept(dept);
                        setEditName(dept.name);
                        setEditDescription(dept.description || '');
                        setEditError('');
                      }}
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openDeleteModal(dept)}
                      style={{ fontSize: '12px', color: '#dc2626', padding: '4px 10px' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setShowAddModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title">Add Department</span>
              <button
                className="modal-close"
                onClick={() => !isSubmitting && setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {addError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#b91c1c',
                      fontSize: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    {addError}
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Department Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Engineering, Marketing, Design"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    required
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description (Optional)</label>
                  <textarea
                    className="input textarea"
                    placeholder="Brief description of divisional responsibilities..."
                    rows={3}
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setEditingDept(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title">Edit Department</span>
              <button
                className="modal-close"
                onClick={() => !isSubmitting && setEditingDept(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {editError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#b91c1c',
                      fontSize: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    {editError}
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Department Name *</label>
                  <input
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea
                    className="input textarea"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingDept(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Department Confirmation Modal */}
      {deletingDept && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeletingDept(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <span className="modal-title">Delete Department</span>
              <button
                className="modal-close"
                onClick={() => !isDeleting && setDeletingDept(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {deleteError && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#b91c1c',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  {deleteError}
                </div>
              )}

              <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
                Are you sure you want to remove <strong>"{deletingDept.name}"</strong>?
              </p>

              {(deletingDept.activeTaskCount || 0) > 0 ? (
                <div
                  style={{
                    padding: '12px',
                    background: '#fffbeb',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                    ⚠️ {deletingDept.name} has {deletingDept.activeTaskCount} active task(s).
                  </div>
                  <p style={{ fontSize: '12px', color: '#78350f', margin: '0 0 10px 0' }}>
                    Choose how to handle active tasks before deleting:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="taskAction"
                        checked={taskHandlingAction === 'unassign'}
                        onChange={() => setTaskHandlingAction('unassign')}
                      />
                      Remove department assignment from tasks
                    </label>

                    {departments.filter((d) => d.id !== deletingDept.id).length > 0 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="taskAction"
                          checked={taskHandlingAction === 'reassign'}
                          onChange={() => setTaskHandlingAction('reassign')}
                        />
                        Move tasks to another department:
                      </label>
                    )}

                    {taskHandlingAction === 'reassign' && (
                      <select
                        className="input select"
                        value={targetDeptId}
                        onChange={(e) => setTargetDeptId(e.target.value)}
                        style={{ fontSize: '12px', marginLeft: '24px', width: 'calc(100% - 24px)' }}
                      >
                        {departments
                          .filter((d) => d.id !== deletingDept.id)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  This department has no active tasks. Assigned members will be set to General.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingDept(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
