'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckSquare,
  ExternalLink,
  FolderKanban,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import styles from './AdminConsole.module.css';
import type { AdminUserDetail } from '@/lib/db/admin';
import type { PaidPlanKey } from '@/lib/plans';

interface AdminUserDetailPanelProps {
  detail: AdminUserDetail | null;
  loading: boolean;
  error?: string | null;
  currentAdminUid: string;
  onRetry?: () => void;
  onClose?: () => void;
  onUpdated?: (nextDetail: AdminUserDetail, toastMsg: string) => void;
  onErrorToast?: (errMsg: string) => void;
  showStandaloneLink?: boolean;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return '—';
  return new Date(parsed).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminUserDetailPanel({
  detail,
  loading,
  error,
  currentAdminUid,
  onRetry,
  onClose,
  onUpdated,
  onErrorToast,
  showStandaloneLink = true,
}: AdminUserDetailPanelProps) {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlanKey>('pro');
  const [expiresAtDate, setExpiresAtDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [mutating, setMutating] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'revoke_plan' | 'suspend' | null>(null);

  useEffect(() => {
    if (detail?.user) {
      setSelectedPlan(detail.user.activePlan?.plan || 'pro');
      setExpiresAtDate(
        detail.user.activePlan?.expiresAt ? detail.user.activePlan.expiresAt.split('T')[0] : ''
      );
      setReason('');
      setConfirmAction(null);
    }
  }, [detail?.user?.uid, detail?.user?.activePlan?.plan, detail?.user?.activePlan?.expiresAt]);

  const executeAdminAction = async (
    payload:
      | { action: 'assign_plan'; plan: PaidPlanKey; expiresAt?: string | null; reason?: string }
      | { action: 'revoke_plan'; reason?: string }
      | { action: 'suspend'; reason?: string }
      | { action: 'activate'; reason?: string },
    successMessage: string
  ) => {
    if (!detail?.user?.uid) return;
    setMutating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
      const res = await fetch(`/api/admin/users/${encodeURIComponent(detail.user.uid)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Admin action failed.');
      }

      setConfirmAction(null);
      setReason('');
      if (data?.detail && onUpdated) {
        onUpdated(data.detail, successMessage);
      }
    } catch (err: any) {
      onErrorToast?.(err?.message || 'Action failed. Please try again.');
    } finally {
      setMutating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Loading User Profile…</h2>
          {onClose && (
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Close
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gap: '14px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '92px', borderRadius: '16px', background: 'var(--c-bg-subtle, #EDE7D9)', border: '2px solid var(--border-dark, #0A0A0A)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>User Profile</h2>
          {onClose && (
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Close
            </button>
          )}
        </div>
        <div style={{ padding: '20px', background: 'var(--c-error-bg, #FEE2E2)', border: '2.5px solid var(--border-dark, #0A0A0A)', borderRadius: '16px' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--c-error-text, #991B1B)' }}>
            {error || 'Unable to load this user profile.'}
          </p>
          {onRetry && (
            <button type="button" className={styles.btnSecondary} onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, workspaces, projects, tasks, payments, auditHistory } = detail;
  const activePlan = user.activePlan;
  const rawSub = user.subscription;
  const isSelfAdmin = user.uid === currentAdminUid || user.platformRole === 'admin';
  const subStatusLabel = activePlan
    ? 'Active'
    : rawSub?.status === 'revoked'
      ? 'Revoked'
      : rawSub?.expiresAt && Date.parse(rawSub.expiresAt) <= Date.now()
        ? 'Expired'
        : 'None';

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top User Header */}
      <div
        style={{
          background: 'var(--surface-card, #FFFFFF)',
          border: '3px solid var(--border-dark, #0A0A0A)',
          borderRadius: '18px',
          boxShadow: '5px 5px 0px #0A0A0A',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #0A0A0A' }}
            />
          ) : (
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: user.platformRole === 'admin' ? '#FF5500' : '#0A0A0A',
                color: '#FFFFFF',
                border: '2.5px solid #0A0A0A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '18px',
              }}
            >
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{user.displayName}</h2>
              <Badge variant={user.accountStatus === 'suspended' ? 'destructive' : 'success'}>
                {user.accountStatus === 'suspended' ? 'Suspended' : 'Active'}
              </Badge>
              {user.platformRole === 'admin' && (
                <Badge variant="solid">
                  <ShieldCheck size={11} aria-hidden="true" />
                  Platform Admin
                </Badge>
              )}
              {user.emailVerified && <Badge variant="warning">Email Verified</Badge>}
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary, #4A4A4A)', fontWeight: 600, marginTop: '4px' }}>
              {user.email}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary, #737373)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
              UID: {user.uid}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showStandaloneLink && (
            <Link href={`/admin/users/${encodeURIComponent(user.uid)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Full Page <ExternalLink size={12} aria-hidden="true" />
            </Link>
          )}
          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              <X size={13} aria-hidden="true" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div className={styles.statCard} style={{ padding: '14px 16px' }}>
          <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Workspaces</span>
            <Building2 size={14} aria-hidden="true" />
          </div>
          <div className={styles.statValue} style={{ fontSize: '24px' }}>{workspaces.totalCount}</div>
          <div className={styles.statSub}>
            Owned: <strong>{workspaces.ownedCount}</strong> · Member: <strong>{workspaces.memberCount}</strong>
          </div>
        </div>
        <div className={styles.statCard} style={{ padding: '14px 16px' }}>
          <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Projects</span>
            <FolderKanban size={14} aria-hidden="true" />
          </div>
          <div className={styles.statValue} style={{ fontSize: '24px' }}>{projects.totalCount}</div>
          <div className={styles.statSub}>Across accessible workspaces</div>
        </div>
        <div className={styles.statCard} style={{ padding: '14px 16px' }}>
          <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Tasks</span>
            <CheckSquare size={14} aria-hidden="true" />
          </div>
          <div className={styles.statValue} style={{ fontSize: '24px' }}>{tasks.totalCount}</div>
          <div className={styles.statSub}>
            In projects: {tasks.projectTaskCount} · Standalone: {tasks.standaloneTaskCount}
          </div>
        </div>
        <div className={styles.statCard} style={{ padding: '14px 16px' }}>
          <div className={styles.statLabel}>Current Plan</div>
          <div style={{ marginTop: '4px' }}>
            {activePlan ? (
              <Badge variant={activePlan.plan === 'starter' ? 'warning' : 'solid'} style={{ fontSize: '12.5px', padding: '4px 11px' }}>
                {activePlan.planName}
              </Badge>
            ) : (
              <Badge variant="secondary" style={{ fontSize: '12px' }}>
                {subStatusLabel === 'None' ? 'No Plan' : subStatusLabel}
              </Badge>
            )}
          </div>
          <div className={styles.statSub}>
            {activePlan
              ? activePlan.source === 'admin'
                ? 'Source: Admin-assigned'
                : 'Source: Purchased'
              : 'Free fallback quotas only'}
          </div>
        </div>
      </div>

      {/* Metadata & Subscription Details */}
      <div
        style={{
          background: 'var(--surface-card, #FFFFFF)',
          border: '3px solid var(--border-dark, #0A0A0A)',
          borderRadius: '18px',
          boxShadow: '4px 4px 0px #0A0A0A',
          padding: '18px 20px',
        }}
      >
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900 }}>Account &amp; Subscription Metadata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary, #737373)', textTransform: 'uppercase' }}>Signup Date</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>{formatDateTime(user.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary, #737373)', textTransform: 'uppercase' }}>Last Active</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>{formatDateTime(user.lastActiveAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary, #737373)', textTransform: 'uppercase' }}>Subscription Status</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>
              {activePlan ? `${activePlan.planName} (${subStatusLabel})` : subStatusLabel}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary, #737373)', textTransform: 'uppercase' }}>Plan Source</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>
              {rawSub?.source === 'admin' ? 'Admin-assigned' : rawSub?.source === 'purchased' ? 'Purchased' : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary, #737373)', textTransform: 'uppercase' }}>Plan Start Date</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>{formatDateTime(rawSub?.startedAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary, #737373)', textTransform: 'uppercase' }}>Plan Expiry</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>{rawSub?.expiresAt ? formatDateTime(rawSub.expiresAt) : 'No expiry'}</div>
          </div>
        </div>
        {user.accountStatus === 'suspended' && (
          <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'var(--c-error-bg, #FEE2E2)', border: '2px solid var(--border-dark, #0A0A0A)', fontSize: '12.5px', fontWeight: 700, color: 'var(--c-error-text, #991B1B)' }}>
            Suspended on {formatDateTime(user.suspendedAt)} — Reason: {user.suspendedReason || 'Suspended by administrator'}
          </div>
        )}
      </div>

      {/* Admin Controls: Assign/Revoke Plan & Suspend/Activate */}
      <div
        style={{
          background: 'var(--surface-card, #FFFFFF)',
          border: '3px solid var(--border-dark, #0A0A0A)',
          borderRadius: '18px',
          boxShadow: '4px 4px 0px #0A0A0A',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Admin Controls</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <Label style={{ marginBottom: '5px', fontWeight: 800, fontSize: '11.5px' }}>
              Assign or Change Plan
            </Label>
            <Select
              value={selectedPlan}
              disabled={mutating}
              onChange={(e) => setSelectedPlan(e.target.value as PaidPlanKey)}
            >
              <option value="starter">Starter Plan ($9/mo)</option>
              <option value="pro">Pro Plan ($20/mo)</option>
              <option value="business">Business (Custom)</option>
            </Select>
          </div>
          <div>
            <Label style={{ marginBottom: '5px', fontWeight: 800, fontSize: '11.5px' }}>
              Optional Expiry Date
            </Label>
            <Input
              type="date"
              value={expiresAtDate}
              disabled={mutating}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setExpiresAtDate(e.target.value)}
            />
          </div>
          <div>
            <Label style={{ marginBottom: '5px', fontWeight: 800, fontSize: '11.5px' }}>
              Audit Note (optional)
            </Label>
            <Input
              type="text"
              value={reason}
              disabled={mutating}
              placeholder="e.g. Founder grant / manual upgrade"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <Button
            type="button"
            disabled={mutating}
            onClick={() => {
              const expiryIso = expiresAtDate ? new Date(`${expiresAtDate}T23:59:59.000Z`).toISOString() : null;
              void executeAdminAction(
                { action: 'assign_plan', plan: selectedPlan, expiresAt: expiryIso, reason: reason.trim() || undefined },
                `Assigned ${selectedPlan.toUpperCase()} plan to ${user.displayName}`
              );
            }}
          >
            {mutating ? 'Saving…' : activePlan ? 'Change Plan' : 'Assign Plan'}
          </Button>

          {activePlan && (
            <Button
              type="button"
              variant="destructive"
              disabled={mutating}
              onClick={() => setConfirmAction('revoke_plan')}
            >
              Revoke Plan
            </Button>
          )}

          {!isSelfAdmin && (
            user.accountStatus === 'suspended' ? (
              <Button
                type="button"
                variant="outline"
                style={{ background: '#10B981', color: '#0A0A0A', borderColor: '#0A0A0A', fontWeight: 800 }}
                disabled={mutating}
                onClick={() =>
                  void executeAdminAction(
                    { action: 'activate', reason: reason.trim() || undefined },
                    `Activated ${user.displayName}`
                  )
                }
              >
                <UserCheck size={14} aria-hidden="true" />
                Activate User
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                disabled={mutating}
                onClick={() => setConfirmAction('suspend')}
              >
                <UserX size={14} aria-hidden="true" />
                Suspend User
              </Button>
            )
          )}
        </div>
      </div>

      {/* Workspaces Owned vs Member-Of */}
      <div
        style={{
          background: 'var(--surface-card, #FFFFFF)',
          border: '3px solid var(--border-dark, #0A0A0A)',
          borderRadius: '18px',
          boxShadow: '4px 4px 0px #0A0A0A',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>
            Workspaces ({workspaces.totalCount})
          </h3>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
            <span className={styles.pillOrange}>Owned: {workspaces.ownedCount}</span>
            <span className={styles.pillNeutral}>Member of: {workspaces.memberCount}</span>
          </div>
        </div>
        {workspaces.items.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary, #737373)' }}>No workspaces found for this user.</p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {workspaces.items.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '2px solid var(--border-dark, #0A0A0A)',
                  background: 'var(--c-bg-subtle, #FAF6EE)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13.5px' }}>{w.name}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #525252)', fontFamily: 'var(--font-mono)' }}>
                    {w.id} · {w.memberCount} member{w.memberCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Badge variant={w.relation === 'owned' ? 'warning' : 'secondary'}>
                    {w.relation === 'owned' ? 'Owned' : 'Member'}
                  </Badge>
                  <Badge variant="outline" style={{ textTransform: 'capitalize' }}>
                    {w.tier}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-Project Task Breakdown */}
      <div
        style={{
          background: 'var(--surface-card, #FFFFFF)',
          border: '3px solid var(--border-dark, #0A0A0A)',
          borderRadius: '18px',
          boxShadow: '4px 4px 0px #0A0A0A',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2.5px solid var(--border-dark, #0A0A0A)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>
            Projects ({projects.totalCount}) &amp; Task Breakdown ({tasks.totalCount} total tasks)
          </h3>
        </div>
        {tasks.byProject.length === 0 ? (
          <p style={{ margin: 0, padding: '18px 20px', fontSize: '13px', color: 'var(--text-tertiary, #737373)' }}>
            No projects or tasks recorded yet for this user.
          </p>
        ) : (
          <Table className={styles.adminTable}>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.byProject.map((row, idx) => (
                <TableRow key={row.projectId || `standalone_${idx}`}>
                  <TableCell style={{ fontWeight: 800 }}>{row.projectName}</TableCell>
                  <TableCell style={{ color: 'var(--text-secondary, #525252)' }}>{row.workspaceName || '—'}</TableCell>
                  <TableCell style={{ fontWeight: 800 }}>{row.taskCount}</TableCell>
                  <TableCell style={{ color: '#059669', fontWeight: 700 }}>{row.completedTaskCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <tfoot>
              <tr style={{ background: 'var(--c-bg-subtle, #F3EFE4)', fontWeight: 900 }}>
                <td colSpan={2} style={{ padding: '12px 14px' }}>Overall Total</td>
                <td style={{ padding: '12px 14px' }}>{tasks.totalCount}</td>
                <td style={{ padding: '12px 14px' }}>{tasks.byProject.reduce((acc, r) => acc + r.completedTaskCount, 0)}</td>
              </tr>
            </tfoot>
          </Table>
        )}
      </div>

      {/* Payments & Audit Trail */}
      {payments.length > 0 && (
        <div
          style={{
            background: 'var(--surface-card, #FFFFFF)',
            border: '3px solid var(--border-dark, #0A0A0A)',
            borderRadius: '18px',
            boxShadow: '4px 4px 0px #0A0A0A',
            padding: '18px 20px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 900 }}>Payment Records</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {payments.map((p) => (
              <div
                key={p.orderId}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid var(--border-dark, #0A0A0A)', background: 'var(--c-bg-subtle, #FAF6EE)' }}
              >
                <div>
                  <strong>{p.planName}</strong> · {p.currency === 'INR' ? '₹' : '$'}{p.amount} {p.currency} ({p.orderId})
                </div>
                <span className={p.status === 'paid' ? styles.pillMint : styles.pillNeutral}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {auditHistory.length > 0 && (
        <div
          style={{
            background: 'var(--surface-card, #FFFFFF)',
            border: '3px solid var(--border-dark, #0A0A0A)',
            borderRadius: '18px',
            boxShadow: '4px 4px 0px #0A0A0A',
            padding: '18px 20px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 900 }}>Recent Admin Audit Events</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {auditHistory.slice(0, 8).map((entry) => (
              <div key={entry.id} style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border-dark, #0A0A0A)', background: 'var(--c-bg-subtle, #FAF6EE)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 800 }}>
                  <span>{entry.action}</span>
                  <span style={{ color: 'var(--text-tertiary, #737373)' }}>{formatDateTime(entry.timestamp)}</span>
                </div>
                <div style={{ color: 'var(--text-secondary, #4A4A4A)', marginTop: '4px' }}>
                  {entry.details || `${JSON.stringify(entry.oldValue)} -> ${JSON.stringify(entry.newValue)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive Actions */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open && !mutating) setConfirmAction(null);
        }}
      >
        {confirmAction && (
          <DialogContent role="alertdialog" style={{ maxWidth: '420px' }}>
            <DialogHeader>
              <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#DC2626" aria-hidden="true" />
                <span>
                  {confirmAction === 'revoke_plan' ? 'Confirm Plan Revocation' : 'Confirm Account Suspension'}
                </span>
              </DialogTitle>
              <DialogDescription>
                {confirmAction === 'revoke_plan'
                  ? `Revoking ${user.displayName}'s active plan immediately removes their plan badge and resets owned workspaces to default quotas.`
                  : `Suspending ${user.displayName} (${user.email}) immediately terminates active sessions and blocks them from signing in.`}
              </DialogDescription>
            </DialogHeader>
            <Input
              type="text"
              style={{ marginBottom: '4px' }}
              placeholder="Optional audit reason…"
              value={reason}
              disabled={mutating}
              onChange={(e) => setReason(e.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={mutating} onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={mutating}
                onClick={() => {
                  if (confirmAction === 'revoke_plan') {
                    void executeAdminAction(
                      { action: 'revoke_plan', reason: reason.trim() || undefined },
                      `Revoked plan from ${user.displayName}`
                    );
                  } else {
                    void executeAdminAction(
                      { action: 'suspend', reason: reason.trim() || undefined },
                      `Suspended ${user.displayName}`
                    );
                  }
                }}
              >
                {mutating ? 'Processing…' : confirmAction === 'revoke_plan' ? 'Yes, Revoke Plan' : 'Yes, Suspend User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
