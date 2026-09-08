'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function RedeemCodeModal() {
  const {
    activeModal,
    closeModal,
    redeemCode,
    redeemedCodes,
    setCurrentPage,
  } = useDashboard();

  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    message: string;
    perks?: string[];
  } | null>(null);

  if (activeModal !== 'redeem-code-modal') return null;

  const sampleVouchers = [
    { code: 'CURSIS-PRO-2026', label: 'Pro Seat + Autonomous AI' },
    { code: 'ENTERPRISE-SCALE-4', label: '4 Pro Seats + Enterprise Tier' },
    { code: 'ORDIS-VIP-ACCESS', label: 'Executive VIP Multi-Agent' },
    { code: 'FEATURE-STUDIO-PRO', label: '3 Special Dynamic Features' },
    { code: 'SPECIAL-FOUNDER', label: 'Sovereign Founder VIP' },
  ];

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a valid voucher or license code.');
      return;
    }

    const res = redeemCode(trimmed);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setRedeemResult(res);
    }
  };

  const handleSelectSample = (code: string) => {
    setInputCode(code);
    setErrorMsg('');
  };

  const handleClose = () => {
    setInputCode('');
    setErrorMsg('');
    setRedeemResult(null);
    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal"
        style={{
          maxWidth: '540px',
          width: '95%',
          background: 'var(--c-white)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          border: '1px solid rgba(124, 58, 237, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: 'var(--sp-4) var(--sp-5)',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(15, 76, 255, 0.04) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #0f4cff)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              }}
            >
              🎁
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--fs-md)', fontWeight: 800 }}>
                Redeem Voucher &amp; License Key
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Claim Autonomous Pro seats, elevate workspace tier, and unlock special features.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '16px', padding: '2px 8px', color: 'var(--text-tertiary)' }}
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: 'var(--sp-5)' }}>
          {redeemResult ? (
            /* Success View */
            <div style={{ textAlign: 'center', padding: 'var(--sp-2) 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto var(--sp-3)',
                  border: '2px solid #10b981',
                }}
              >
                ✓
              </div>

              <h3 style={{ margin: '0 0 var(--sp-1) 0', fontSize: 'var(--fs-lg)', fontWeight: 800 }}>
                Perks Claimed Successfully!
              </h3>
              <p style={{ margin: '0 0 var(--sp-4) 0', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                {redeemResult.message}
              </p>

              {redeemResult.perks && redeemResult.perks.length > 0 && (
                <div
                  style={{
                    background: 'var(--c-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: 'var(--sp-3)',
                    textAlign: 'left',
                    marginBottom: 'var(--sp-4)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    ACTIVATED SPECIAL PERKS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {redeemResult.perks.map((p, idx) => (
                      <div key={idx} style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    handleClose();
                    setCurrentPage('team');
                  }}
                >
                  View Team Directory
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0f4cff)', border: 'none' }}
                  onClick={() => {
                    handleClose();
                    setCurrentPage('ordis');
                  }}
                >
                  Launch Ordis Copilot 🚀
                </button>
              </div>
            </div>
          ) : (
            /* Input Form View */
            <form onSubmit={handleRedeem}>
              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: 'var(--sp-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Code Input Field */}
              <div className="input-group" style={{ marginBottom: 'var(--sp-4)' }}>
                <label
                  className="input-label"
                  style={{ fontSize: '12px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Enter Redeem Code or Activation Key</span>
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Case-insensitive</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '15px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '12px 14px',
                      height: '46px',
                      borderColor: '#7c3aed',
                    }}
                    placeholder="e.g. CURSIS-PRO-2026"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      setErrorMsg('');
                    }}
                    autoFocus
                  />
                  {inputCode && (
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      onClick={() => setInputCode('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Voucher Codes */}
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  AVAILABLE PROMOTIONAL KEYS (CLICK TO APPLY)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {sampleVouchers.map((v) => {
                    const isRedeemed = redeemedCodes.includes(v.code);
                    return (
                      <button
                        key={v.code}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: inputCode === v.code ? 'rgba(124, 58, 237, 0.15)' : 'var(--c-surface)',
                          border: inputCode === v.code ? '1px solid #7c3aed' : '1px solid var(--border-color)',
                          color: isRedeemed ? 'var(--text-tertiary)' : '#7c3aed',
                          fontWeight: 700,
                          cursor: isRedeemed ? 'not-allowed' : 'pointer',
                          textDecoration: isRedeemed ? 'line-through' : 'none',
                        }}
                        onClick={() => !isRedeemed && handleSelectSample(v.code)}
                        title={isRedeemed ? 'Already redeemed' : v.label}
                      >
                        {v.code} {isRedeemed && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What You Unlock Preview */}
              <div
                style={{
                  background: 'var(--c-surface)',
                  borderRadius: '8px',
                  padding: 'var(--sp-3)',
                  border: '1px solid var(--border-color)',
                  marginBottom: 'var(--sp-5)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  ENTITLEMENT GUARANTEE
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  Redeeming an active key instantly upgrades your account to <strong>Autonomous Pro</strong>, syncs with your workspace seat allocation quota, and unlocks <strong>Ordis Full Power AI multi-agent orchestration</strong>.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #0f4cff 100%)',
                    border: 'none',
                    fontWeight: 700,
                    padding: '8px 18px',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  }}
                  disabled={!inputCode.trim()}
                >
                  Claim Premium Features →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
