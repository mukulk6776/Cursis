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

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a valid voucher or license code.');
      return;
    }

    const res = await redeemCode(trimmed);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setRedeemResult(res);
    }
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
 
 </div>
 <div>
 <h3 style={{ margin: 0, fontSize: 'var(--fs-md)', fontWeight: 800 }}>
 Redeem Voucher &amp; License Key
 </h3>
 <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)' }}>
 Claim Autonomous Pro seats, unlock special features, and activate advanced AI capabilities.
 </p>
 </div>
 </div>

 <button
 type="button"
 className="btn btn-ghost btn-sm"
 style={{ fontSize: '16px', padding: '2px 8px', color: 'var(--text-tertiary)' }}
 onClick={handleClose}
 >
 
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
 Launch Ordis Copilot 
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
 borderRadius: '6px',
 background: 'rgba(239, 68, 68, 0.1)',
 border: '1px solid rgba(239, 68, 68, 0.3)',
 color: '#dc2626',
 fontSize: '12px',
 marginBottom: 'var(--sp-4)',
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 }}
 >
 <span></span>
 <span>{errorMsg}</span>
 </div>
 )}

 <div className="input-group" style={{ marginBottom: 'var(--sp-4)' }}>
 <label
 className="input-label"
 style={{
 fontSize: '12px',
 fontWeight: 700,
 marginBottom: '6px',
 display: 'flex',
 alignItems: 'center',
 gap: '6px',
 }}
 >
 <span>Enter Redeem Code or Activation Key</span>
 </label>
 <input
 type="text"
 className="input"
 placeholder="e.g. CURSIS-PRO-2026 or ENTERPRISE-SCALE-4"
 value={inputCode}
 onChange={(e) => setInputCode(e.target.value)}
 style={{
 textTransform: 'uppercase',
 letterSpacing: '1px',
 fontWeight: 700,
 fontSize: '14px',
 borderColor: inputCode.trim() ? '#7c3aed' : 'var(--border-color)',
 }}
 autoFocus
 />
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
            SINGLE-USE ACTIVATION GUARANTEE
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Each redeem code is strictly <strong>single-use</strong>. Once activated by a user, it is permanently locked and cannot be redeemed again by anyone. Redeeming upgrades your workspace to <strong>Autonomous Pro</strong> and activates <strong>Ordis Full Power AI multi-agent orchestration</strong>.
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
 Claim Pro Features →
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 </div>
 );
}
