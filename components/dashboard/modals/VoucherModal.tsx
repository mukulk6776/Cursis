'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function VoucherModal() {
  const { activeModal, closeModal, user, showToast } = useDashboard();

  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [premiumDetails, setPremiumDetails] = useState<{ planTier?: string; expiresAt?: string }>({});

  if (activeModal !== 'voucher-modal') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = voucherCode.trim();
    if (!code) {
      setError('Please enter a voucher code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to redeem voucher');
        setLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      setPremiumDetails({
        planTier: data.planTier,
        expiresAt: data.expiresAt,
      });

      showToast('Voucher redeemed successfully! Your premium access is now active.');

      // Reload user data after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Voucher redemption error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVoucherCode('');
    setError('');
    setSuccess(false);
    setPremiumDetails({});
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="voucher-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div>
            <span className="modal-title">Redeem Voucher Code</span>
          </div>
          <button className="modal-close" onClick={handleClose}></button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)' }}>
                Enter your voucher code to unlock premium features and extend your subscription.
              </p>

              <div className="input-group">
                <label className="input-label">Voucher Code</label>
                <input
                  className="input"
                  placeholder="PREMIUM-2024-XXXX"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  required
                  autoFocus
                  style={{
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: 'var(--sp-3)',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    marginTop: 'var(--sp-3)',
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  background: 'var(--c-surface)',
                  border: 'var(--border-width) solid var(--border-color)',
                  padding: 'var(--sp-3)',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--sp-4)',
                  borderRadius: '8px',
                }}
              >
                <strong>Note:</strong> Each voucher code can only be redeemed once per account. If you already have an active premium subscription, the time will be extended.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !voucherCode.trim()}
              >
                {loading ? 'Redeeming...' : 'Redeem Voucher'}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body">
            <div
              style={{
                padding: 'var(--sp-5)',
                background: '#ECFDF5',
                border: '2px solid #10B981',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: 'var(--sp-3)' }}>✓</div>
              <h3 style={{ margin: 0, marginBottom: 'var(--sp-2)', color: '#065F46', fontSize: 'var(--fs-lg)' }}>
                Voucher Redeemed Successfully!
              </h3>
              <p style={{ margin: 0, color: '#047857', fontSize: 'var(--fs-sm)' }}>
                Your {premiumDetails.planTier || 'premium'} access is now active
                {premiumDetails.expiresAt && ` until ${new Date(premiumDetails.expiresAt).toLocaleDateString()}`}.
              </p>
            </div>

            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 'var(--sp-4)', textAlign: 'center' }}>
              The page will reload in a moment to apply your new premium features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
