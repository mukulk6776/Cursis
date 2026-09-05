'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function InviteModal() {
  const { activeModal, closeModal, sendInvitation, departments, teams } = useDashboard();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [workspaceRole, setWorkspaceRole] = useState('member');
  const [department, setDepartment] = useState('dept_engineering');
  const [team, setTeam] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  if (activeModal !== 'invite-modal') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter a valid work email address');
      return;
    }

    sendInvitation({
      email: email.trim(),
      name: name.trim() || undefined,
      roleTitle: roleTitle.trim() || undefined,
      workspaceRole,
      department,
      team: team || null,
    });

    setEmail('');
    setName('');
    setRoleTitle('');
    setErrorMsg('');
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="invite-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <span className="modal-title">Invite Member to Workspace</span>
          <button className="modal-close" onClick={closeModal}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{
                background: 'var(--c-error-bg)',
                color: 'var(--c-error)',
                border: 'var(--border-width) solid var(--c-error)',
                padding: 'var(--sp-2) var(--sp-3)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 'var(--fw-bold)',
                marginBottom: 'var(--sp-3)'
              }}>
                {errorMsg}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Work Email Address <span style={{ color: 'var(--c-error)' }}>*</span></label>
              <input
                className="input"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Full Name (Optional)</label>
                <input
                  className="input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role Title (Optional)</label>
                <input
                  className="input"
                  placeholder="e.g. AI Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Permission Level</label>
                <select
                  className="input select"
                  value={workspaceRole}
                  onChange={(e) => setWorkspaceRole(e.target.value)}
                >
                  <option value="member">Member (Standard Access)</option>
                  <option value="manager">Manager (Team Lead)</option>
                  <option value="admin">Admin (Workspace Admin)</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <select
                  className="input select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Assigned Team (Optional)</label>
              <select
                className="input select"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option value="">All department members / No specific team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ background: 'var(--c-surface)', border: 'var(--border-width) solid var(--border-color)', padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              <strong>Expiring Link Security:</strong> A unique 7-day invitation token is generated. The member will show as <em>&quot;Invited / Pending&quot;</em> in the directory and will become assignable upon acceptance.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Workspace Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
