'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function InviteModal() {
  const { activeModal, closeModal, activeWorkspaceId, workspaces, user, showToast, syncTeamAndNotifications } = useDashboard();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [department, setDepartment] = useState('Engineering');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (activeModal !== 'invite-modal') return null;

  const handleClose = () => {
    setErrorMsg('');
    setEmail('');
    setNote('');
    closeModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
      />

      {/* Modal Dialog */}
      <div
        className="modal open"
        id="invite-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '480px',
          width: '92%',
          background: 'var(--c-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          zIndex: 1001,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--sp-4) var(--sp-5)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)' }}>
              Invite to Workspace
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              Send an email-only invitation. Recipient must be a registered Cursis user.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            aria-label="Close"
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--sp-5)' }}>
          {errorMsg && (
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
              {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <label
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
              type="email"
              required
              className="input"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
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
                className="input select"
                value={role}
                onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
                disabled={isSubmitting}
                style={{ width: '100%' }}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label
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
                className="input select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={isSubmitting}
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
              className="input textarea"
              rows={2}
              placeholder="Join our team on Cursis to collaborate on projects..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              style={{ minWidth: '120px' }}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
