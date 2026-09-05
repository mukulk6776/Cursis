'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function ProfilePanel() {
  const {
    profilePanelEmployeeId,
    closeProfilePanel,
    getEmployee,
    getTasksForEmployee,
    projects,
  } = useDashboard();

  if (!profilePanelEmployeeId) return null;

  const emp = getEmployee(profilePanelEmployeeId);
  if (!emp) return null;

  const empTasks = getTasksForEmployee(emp.id);
  const activeTasks = empTasks.filter((t) => t.status !== 'completed');
  const doneTasks = empTasks.filter((t) => t.status === 'completed');
  const empProjects = projects.filter((p) => p.team.includes(emp.id));

  return (
    <div className="profile-panel open" id="profile-panel">
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
        <button className="btn btn-ghost btn-sm" onClick={closeProfilePanel}>
          ✕
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
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', marginTop: 'var(--sp-3)' }}>
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
      </div>
    </div>
  );
}
