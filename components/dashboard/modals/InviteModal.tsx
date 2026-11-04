'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { MAX_TEAM_MEMBERS } from '@/lib/db/types';

export default function InviteModal() {
  const { activeModal, closeModal, activeWorkspaceId, workspaces, user, showToast, syncTeamAndNotifications, employees = [], invitations = [] } = useDashboard();

  const activeCount = employees.length;
  const pendingInvs = invitations.filter((i) => i.status === 'pending');
  const pendingCount = pendingInvs.length;
  const isAtMemberLimit = activeCount >= MAX_TEAM_MEMBERS;
  const isAtCapacity = activeCount + pendingCount >= MAX_TEAM_MEMBERS;

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [department, setDepartment] = useState('Engineering');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (activeModal !== 'invite-modal' || !['owner', 'admin'].includes(user.workspaceRole || 'member')) return null;

  const handleClose = () => {
    setErrorMsg('');
    setEmail('');
    setNote('');
    closeModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isAtMemberLimit) {
      setErrorMsg(`Workspace team member limit reached (max ${MAX_TEAM_MEMBERS} members). Please remove a member before sending invitations.`);
      return;
    }
    if (isAtCapacity) {
      setErrorMsg(`Workspace team capacity reached (${activeCount} members + ${pendingCount} pending invites = ${MAX_TEAM_MEMBERS} max). Please revoke a pending invite or remove a member.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const effectiveWsId = (activeWorkspaceId && activeWorkspaceId !== 'ws_default' && activeWorkspaceId !== 'ws_public')
      ? activeWorkspaceId
      : (workspaces?.find((w) => w.id !== 'ws_default' && w.id !== 'ws_public')?.id || user.id || 'ws_cursis_user');

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(effectiveWsId)}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          role,
          department,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to send invitation. Please try again.');
        setIsSubmitting(false);
        return;
      }

      showToast(`Invitation sent to ${cleanEmail}`);
      if (typeof syncTeamAndNotifications === 'function') {
        syncTeamAndNotifications(effectiveWsId);
      }
      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred while sending invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal"
        id="invite-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        style={{
          maxWidth: '480px',
          width: '92%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 id="invite-modal-title" className="modal-title">
                Invite to Workspace
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isAtCapacity ? '#FEE2E2' : '#FFFFFF',
                  color: isAtCapacity ? '#DC2626' : '#0A0A0A',
                  border: '2px solid #0A0A0A',
                  boxShadow: '2px 2px 0px #0A0A0A',
                }}
              >
                {activeCount} / {MAX_TEAM_MEMBERS} Members {pendingCount > 0 ? `(${pendingCount} pending)` : ''}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              Send an email-only invitation. Recipient must be a registered Cursis user.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {isAtMemberLimit ? (
            <div
              style={{
                marginBottom: 'var(--sp-4)',
                padding: 'var(--sp-3)',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--c-error)',
                color: 'var(--c-error)',
                fontSize: 'var(--fs-xs)',
                lineHeight: 1.4,
              }}
            >
              <strong>Team Limit Reached ({MAX_TEAM_MEMBERS} / {MAX_TEAM_MEMBERS} members):</strong> This workspace has reached the maximum allowed limit of {MAX_TEAM_MEMBERS} team members. Please remove an existing member before sending new invitations.
            </div>
          ) : isAtCapacity ? (
            <div
              style={{
                marginBottom: 'var(--sp-4)',
                padding: 'var(--sp-3)',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid #f59e0b',
                color: '#d97706',
                fontSize: 'var(--fs-xs)',
                lineHeight: 1.4,
              }}
            >
              <strong>Capacity Limit Reached ({MAX_TEAM_MEMBERS} max):</strong> Workspace has {activeCount} active member{activeCount === 1 ? '' : 's'} and {pendingCount} pending invitation{pendingCount === 1 ? '' : 's'}. Revoke a pending invitation or remove a member to invite someone else.
            </div>
          ) : null}

          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                marginBottom: 'var(--sp-4)',
                padding: 'var(--sp-3)',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--c-error)',
                color: 'var(--c-error)',
                fontSize: 'var(--fs-xs)',
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <label
              htmlFor="invite-modal-email-input"
              style={{
                display: 'block',
                fontSize: 'var(--fs-xs)',
                fontWeight: 'var(--fw-bold)',
                marginBottom: 'var(--sp-1)',
                color: 'var(--text-secondary)',
              }}
            >
              Email Address <span style={{ color: 'var(--c-brand)' }}>*</span>
            </label>
            <input
              id="invite-modal-email-input"
              type="email"
              required
              className="input"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || isAtCapacity}
              style={{ width: '100%' }}
              autoFocus
            />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
              The invitee will receive an actionable notification card in their account.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
            <div>
              <label
                htmlFor="invite-modal-role-select"
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 'var(--fw-bold)',
                  marginBottom: 'var(--sp-1)',
                  color: 'var(--text-secondary)',
                }}
              >
                Assigned Role
              </label>
              <select
                id="invite-modal-role-select"
                className="input select"
                value={role}
                onChange={(e) => setRole(e.target.value as 'member' | 'admin' | 'viewer')}
                disabled={isSubmitting || isAtCapacity}
                style={{ width: '100%' }}
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="invite-modal-dept-select"
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 'var(--fw-bold)',
                  marginBottom: 'var(--sp-1)',
                  color: 'var(--text-secondary)',
                }}
              >
                Department
              </label>
              <select
                id="invite-modal-dept-select"
                className="input select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={isSubmitting || isAtCapacity}
                style={{ width: '100%' }}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Leadership">Leadership</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label
              htmlFor="invite-modal-note-textarea"
              style={{
                display: 'block',
                fontSize: 'var(--fs-xs)',
                fontWeight: 'var(--fw-bold)',
                marginBottom: 'var(--sp-1)',
                color: 'var(--text-secondary)',
              }}
            >
              Invitation Note <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <textarea
              id="invite-modal-note-textarea"
              className="input textarea"
              rows={2}
              placeholder="Join our team on Cursis to collaborate on projects..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting || isAtCapacity}
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting || isAtCapacity}
              style={{ minWidth: '120px' }}
            >
              {isSubmitting ? 'Sending...' : isAtCapacity ? `Limit Reached (${MAX_TEAM_MEMBERS} max)` : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
