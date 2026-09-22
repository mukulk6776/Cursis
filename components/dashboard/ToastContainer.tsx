'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { motion, AnimatePresence } from 'motion/react';

const TOAST_ICONS: Record<string, { color: string; bg: string; path: string }> = {
  success: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    path: 'M20 6L9 17l-5-5',
  },
  error: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    path: 'M18 6L6 18M6 6l12 12',
  },
  warning: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    path: 'M12 9v4m0 4h.01M10.29 3.86l-8.97 15.7A1 1 0 002.18 21h19.64a1 1 0 00.86-1.44l-8.97-15.7a1 1 0 00-1.72 0z',
  },
  info: {
    color: '#FF5500',
    bg: 'rgba(255, 85, 0, 0.1)',
    path: 'M20 6L9 17l-5-5',
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useDashboard();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        zIndex: 99999,
        pointerEvents: 'none',
        maxWidth: '400px',
        width: 'calc(100vw - 48px)',
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const toastType = t.type || 'info';
          const icon = TOAST_ICONS[toastType] || TOAST_ICONS.info;
          const duration = t.duration || 4000;

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: -40, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                pointerEvents: 'auto',
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '14px',
                boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 14px 10px',
                }}
              >
                {/* Type-aware Icon Badge */}
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: icon.bg,
                    color: icon.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon.path} />
                  </svg>
                </div>

                {/* Message Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9CA3AF',
                      marginBottom: '3px',
                    }}
                  >
                    {toastType === 'error' ? 'Error' : toastType === 'warning' ? 'Attention' : 'Workspace Update'}
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#111827',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.message}
                  </div>
                </div>

                {/* Close Button */}
                {typeof removeToast === 'function' && (
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease, background 0.15s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#111827';
                      e.currentTarget.style.background = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9CA3AF';
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title="Dismiss notification"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Action Button Row */}
              {t.action && (
                <div
                  style={{
                    padding: '0 14px 10px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                    style={{
                      background: 'rgba(255, 85, 0, 0.08)',
                      color: '#FF5500',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      letterSpacing: '0.02em',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 85, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 85, 0, 0.08)';
                    }}
                  >
                    {t.action.label}
                  </button>
                </div>
              )}

              {/* Countdown Progress Bar */}
              <div
                style={{
                  height: '3px',
                  background: icon.color,
                  width: '100%',
                  borderRadius: '0 0 14px 14px',
                  animation: `toastProgress ${duration}ms linear forwards`,
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Toast progress animation */}
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
