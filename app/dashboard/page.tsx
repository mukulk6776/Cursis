'use client';

import React, { useEffect, useState } from 'react';
import { DashboardProvider } from '@/lib/dashboard/DashboardContext';
import DashboardShell from '@/components/dashboard/DashboardShell';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const res = await fetch('/api/auth/session', {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          if (isMounted) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
          }
        } else {
          // Unauthenticated or invalid session: clear stale state and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cursis_token');
          }
          await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
          window.location.href = '/login?redirect=/dashboard';
        }
      } catch (err) {
        console.warn('Auth verification notice:', err);
        window.location.href = '/login?redirect=/dashboard';
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (checkingAuth || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#ffffff',
          fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#18181b',
              border: '2px solid #27272a',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 1024 1024" fill="none">
              <path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#ffffff" strokeWidth="142" strokeLinecap="round" fill="none" />
              <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#ff5710" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.01em', color: '#f4f4f5' }}>
              Verifying workspace credentials
            </div>
            <div style={{ fontSize: '13px', color: '#71717a', marginTop: '6px' }}>
              Authenticating session with Cursis...
            </div>
          </div>
          <div
            style={{
              width: '140px',
              height: '3px',
              background: '#27272a',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: '50%',
                height: '100%',
                background: '#ff5710',
                borderRadius: '2px',
                animation: 'indeterminate 1.2s infinite ease-in-out',
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.85; }
          }
          @keyframes indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}
