'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function ToastContainer() {
 const { toasts } = useDashboard();

 if (toasts.length === 0) return null;

 return (
 <div
 style={{
 position: 'fixed',
 bottom: '24px',
 right: '24px',
 display: 'flex',
 flexDirection: 'column',
 gap: '8px',
 zIndex: 9999,
 pointerEvents: 'none',
 }}
 >
 {toasts.map((t) => (
 <div key={t.id} className="cursis-toast" style={{ pointerEvents: 'auto' }}>
 <span></span>
 <span>{t.message}</span>
 </div>
 ))}
 </div>
 );
}
