'use client';

import React, { useEffect, useState } from 'react';
import { DashboardProvider } from '@/lib/dashboard/DashboardContext';
import DashboardShell from '@/components/dashboard/DashboardShell';
import '@/styles/dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        let res = await fetch('/api/auth/session', {
          headers,
          credentials: 'include',
        });

        // If initial check was not ok but we have a stored signed token, attempt to re-establish session
        if (!res.ok && storedToken && storedToken.startsWith('cursis_usr_')) {
          try {
            const reAuthRes = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ idToken: storedToken }),
            });
            if (reAuthRes.ok) {
              res = await fetch('/api/auth/session', {
                headers,
                credentials: 'include',
              });
            }
          } catch {}
        }

        if (!res.ok) {
          // Unauthenticated: clear stale local token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cursis_token');
          }
          await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
          if (isMounted) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      } catch (err) {
        console.warn('Auth verification notice:', err);
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
