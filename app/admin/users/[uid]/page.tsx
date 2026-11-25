'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from '@/components/admin/AdminConsole.module.css';
import AdminUserDetailPanel from '@/components/admin/AdminUserDetailPanel';
import type { AdminUserDetail } from '@/lib/db/admin';

export default function AdminUserDetailPage() {
  const params = useParams<{ uid: string }>();
  const uid = params?.uid ? decodeURIComponent(String(params.uid)) : '';

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdminUid, setCurrentAdminUid] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const [meRes, detailRes] = await Promise.all([
        fetch('/api/auth/session', { credentials: 'include', cache: 'no-store', headers }),
        fetch(`/api/admin/users/${encodeURIComponent(uid)}`, { credentials: 'include', cache: 'no-store', headers }),
      ]);
      if (detailRes.status === 401 || meRes.status === 401) {
        window.location.replace('/login?redirect=/admin');
        return;
      }
      if (detailRes.status === 403 || meRes.status === 403) {
        window.location.replace('/dashboard');
        return;
      }
      const meJson = await meRes.json().catch(() => ({}));
      const sessUser = meJson?.user || meJson?.data?.user;
      if (sessUser?.platformRole !== 'admin') {
        window.location.replace('/dashboard');
        return;
      }
      setCurrentAdminUid(sessUser.uid || '');

      const detailJson = await detailRes.json().catch(() => ({}));
      if (!detailRes.ok) {
        throw new Error(detailJson?.error || 'Failed to load user profile');
      }
      setDetail(detailJson.detail);
    } catch (err: any) {
      setError(err?.message || 'Unable to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className={styles.adminRoot}>
      <header className={styles.adminHeader}>
        <div className={styles.adminHeaderInner}>
          <div className={styles.brandGroup}>
            <Link href="/admin" className={styles.btnSecondary}>
              ← Back to Admin Console
            </Link>
            <span className={styles.brandBadge}>User Profile</span>
          </div>
          <Link href="/dashboard" className={styles.btnSecondary}>
            Open App Dashboard →
          </Link>
        </div>
      </header>
      <main className={styles.adminContainer} style={{ maxWidth: '1040px' }}>
        <AdminUserDetailPanel
          detail={detail}
          loading={loading}
          error={error}
          currentAdminUid={currentAdminUid}
          showStandaloneLink={false}
          onRetry={() => void loadData()}
          onUpdated={(next, msg) => {
            setDetail(next);
            setToast({ text: msg, kind: 'success' });
            setTimeout(() => setToast(null), 3500);
          }}
          onErrorToast={(msg) => {
            setToast({ text: msg, kind: 'error' });
            setTimeout(() => setToast(null), 4000);
          }}
        />
      </main>
      {toast && (
        <div className={styles.toastStack} role="status" aria-live="polite">
          <div
            className={styles.toastItem}
            style={{
              borderColor: toast.kind === 'error' ? '#DC2626' : '#0A0A0A',
              background: toast.kind === 'error' ? '#FEE2E2' : '#FFFFFF',
              color: toast.kind === 'error' ? '#991B1B' : '#0A0A0A',
            }}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}
