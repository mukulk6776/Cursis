'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function GenericModal() {
 const { genericModal, closeGenericModal } = useDashboard();

 if (!genericModal) return null;

 return (
 <div
 className="modal-overlay active"
 id="generic-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) closeGenericModal();
 }}
 >
 <div className="modal" style={{ maxWidth: '560px' }}>
 <div className="modal-header">
 <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-black)', margin: 0 }}>
 {genericModal.title}
 </h2>
 <button className="btn btn-ghost btn-sm" onClick={closeGenericModal}>
 
 </button>
 </div>
 <div className="modal-body" id="generic-modal-body">
 {genericModal.body}
 </div>
 </div>
 </div>
 );
}
