'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FolderKanban,
  History,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
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
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import styles from './AdminConsole.module.css';
import AdminUserDetailPanel from './AdminUserDetailPanel';
import { signOutUser } from '@/lib/auth/firebase';
import type { AdminOverviewStats, AdminUserDetail, AdminUserRow } from '@/lib/db/admin';
import type { AdminAuditLogEntry } from '@/lib/db/types';
import type { PaidPlanKey } from '@/lib/plans';

interface AdminConsoleProps {
  currentAdmin: {
    uid: string;
    email: string;
    displayName: string;
  };
}

interface ToastMsg {
  id: string;
  text: string;
  kind: 'success' | 'error';
}

type SortField = 'createdAt' | 'displayName' | 'email' | 'lastActiveAt' | 'accountStatus' | 'plan';

function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '—';
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminConsole({ currentAdmin }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'none' | 'starter' | 'pro' | 'business'>('all');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // User Detail Drawer
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Quick Inline Plan Modal / Popover
  const [inlineAssignUser, setInlineAssignUser] = useState<AdminUserRow | null>(null);
  const [inlinePlan, setInlinePlan] = useState<PaidPlanKey>('pro');
  const [inlineSaving, setInlineSaving] = useState<boolean>(false);

  // Global Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const pushToast = useCallback((text: string, kind: 'success' | 'error' = 'success') => {
    const id = `adm_toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 260);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleUnauthorizedResponse = useCallback((status: number) => {
    if (status === 401) {
      window.location.replace('/login?redirect=/admin');
      return true;
    }
    if (status === 403) {
      window.location.replace('/dashboard');
      return true;
    }
    return false;
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      setOverviewError(null);
      const res = await fetch('/api/admin/overview', {
        credentials: 'include',
        cache: 'no-store',
        headers: authHeaders(),
      });
      if (handleUnauthorizedResponse(res.status)) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch platform overview');
      setOverview(data.stats);
    } catch (err: any) {
      setOverviewError(err?.message || 'Unable to load platform overview.');
    }
  }, [handleUnauthorizedResponse]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        plan: planFilter,
        sortBy,
        sortDir,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: authHeaders(),
      });
      if (handleUnauthorizedResponse(res.status)) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch user directory');
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotalUsersCount(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (err: any) {
      setUsersError(err?.message || 'Unable to load user directory.');
    } finally {
      setUsersLoading(false);
    }
  }, [searchQuery, statusFilter, planFilter, sortBy, sortDir, page, pageSize, handleUnauthorizedResponse]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const res = await fetch('/api/admin/audit-logs?page=1&pageSize=50', {
        credentials: 'include',
        cache: 'no-store',
        headers: authHeaders(),
      });
      if (handleUnauthorizedResponse(res.status)) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch audit logs');
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err: any) {
      setAuditError(err?.message || 'Unable to load admin audit log.');
    } finally {
      setAuditLoading(false);
    }
  }, [handleUnauthorizedResponse]);

  const fetchUserDetail = useCallback(
    async (uid: string) => {
      setSelectedUid(uid);
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: authHeaders(),
        });
        if (handleUnauthorizedResponse(res.status)) return;
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load user details');
        setSelectedDetail(data.detail);
      } catch (err: any) {
        setDetailError(err?.message || 'Failed to load user details.');
      } finally {
        setDetailLoading(false);
      }
    },
    [handleUnauthorizedResponse]
  );

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === 'audit') {
      void fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'displayName' || field === 'email' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const handleDetailUpdated = (nextDetail: AdminUserDetail, toastMsg: string) => {
    setSelectedDetail(nextDetail);
    pushToast(toastMsg, 'success');
    void fetchOverview();
    void fetchUsers();
    if (activeTab === 'audit') void fetchAuditLogs();
  };

  const handleInlineAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineAssignUser) return;
    setInlineSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(inlineAssignUser.uid)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          action: 'assign_plan',
          plan: inlinePlan,
          reason: 'Quick-assigned from User Directory',
        }),
      });
      if (handleUnauthorizedResponse(res.status)) return;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to assign plan');
      pushToast(`Assigned ${inlinePlan.toUpperCase()} plan to ${inlineAssignUser.displayName}`, 'success');
      if (selectedUid === inlineAssignUser.uid && data?.detail) {
        setSelectedDetail(data.detail);
      }
      setInlineAssignUser(null);
      void fetchOverview();
      void fetchUsers();
    } catch (err: any) {
      pushToast(err?.message || 'Failed to assign plan', 'error');
    } finally {
      setInlineSaving(false);
    }
  };

  return (
    <div className={styles.adminRoot}>
      {/* Sticky Header */}
      <header className={styles.adminHeader}>
        <div className={styles.adminHeaderInner}>
          <div className={styles.brandGroup}>
            <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#0A0A0A' }}>
              <svg viewBox="0 0 1024 1024" fill="none" width="34" height="34" aria-hidden="true">
                <path d="M545 240 A282 282 0 1 0 782 566" stroke="#0A0A0A" strokeWidth="142" strokeLinecap="round" />
                <rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" />
              </svg>
              <span style={{ fontSize: '19px', fontWeight: 900, letterSpacing: '-0.02em' }}>CURSIS</span>
            </Link>
            <Badge variant="solid" style={{ border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <ShieldCheck size={12} aria-hidden="true" />
              Admin Console
            </Badge>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#525252' }}>
              Signed in as {currentAdmin.email}
            </span>
          </div>

          <div className={styles.headerActions}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void fetchOverview();
                void fetchUsers();
                if (activeTab === 'audit') void fetchAuditLogs();
                pushToast('Platform telemetry refreshed', 'success');
              }}
            >
              <RefreshCw size={13} aria-hidden="true" />
              Refresh Data
            </Button>
            <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Open App Dashboard <ExternalLink size={13} aria-hidden="true" />
            </Link>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void signOutUser('/login?logout=true')}
            >
              <LogOut size={13} aria-hidden="true" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.adminContainer}>
        {/* Platform Overview Stat Cards */}
        {overviewError && (
          <div style={{ marginBottom: '18px', padding: '12px 16px', background: '#FEE2E2', border: '2.5px solid #0A0A0A', borderRadius: '14px', fontWeight: 700, color: '#991B1B' }}>
            {overviewError}
          </div>
        )}

        <section className={styles.statsGrid} aria-label="Platform Overview">
          <div className={styles.statCard}>
            <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Total Users</span>
              <Users size={15} aria-hidden="true" />
            </div>
            <div className={styles.statValue}>{overview ? overview.totalUsers : '—'}</div>
            <div className={styles.statSub}>All registered accounts</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Active Users</span>
              <CheckCircle2 size={15} color="#059669" aria-hidden="true" />
            </div>
            <div className={styles.statValue} style={{ color: '#059669' }}>
              {overview ? overview.activeUsers : '—'}
            </div>
            <div className={styles.statSub}>
              {overview ? `${overview.suspendedUsers} suspended` : 'Loading…'}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Active Paid Plans</span>
              <CreditCard size={15} color="#FF5500" aria-hidden="true" />
            </div>
            <div className={styles.statValue} style={{ color: '#FF5500' }}>
              {overview ? overview.activePaidPlans : '—'}
            </div>
            <div className={styles.statSub}>
              {overview
                ? `Starter: ${overview.planBreakdown.starter} · Pro: ${overview.planBreakdown.pro} · Biz: ${overview.planBreakdown.business}`
                : 'Loading…'}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Total Workspaces</span>
              <Building2 size={15} aria-hidden="true" />
            </div>
            <div className={styles.statValue}>{overview ? overview.totalWorkspaces : '—'}</div>
            <div className={styles.statSub}>Personal &amp; team workspaces</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Total Projects</span>
              <FolderKanban size={15} aria-hidden="true" />
            </div>
            <div className={styles.statValue}>{overview ? overview.totalProjects : '—'}</div>
            <div className={styles.statSub}>Across all workspaces</div>
          </div>
        </section>

        {/* Section Tabs */}
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
          >
            <Users size={14} aria-hidden="true" />
            User Directory ({totalUsersCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audit'}
            className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('audit')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
          >
            <History size={14} aria-hidden="true" />
            Admin Audit Log
          </button>
        </div>

        {activeTab === 'users' ? (
          <section className={styles.surfaceCard} aria-label="User Directory">
            {/* Search, Filter, Page Size Controls */}
            <div className={styles.toolbar}>
              <div className={styles.controlGroup}>
                <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '380px' }}>
                  <Search size={14} aria-hidden="true" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#737373', pointerEvents: 'none' }} />
                  <Input
                    type="search"
                    style={{ paddingLeft: '32px' }}
                    placeholder="Search by name or email…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    aria-label="Search registered users"
                  />
                </div>
                <Select
                  style={{ width: 'auto', minWidth: '140px' }}
                  value={statusFilter}
                  aria-label="Filter by status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
                <Select
                  style={{ width: 'auto', minWidth: '140px' }}
                  value={planFilter}
                  aria-label="Filter by plan"
                  onChange={(e) => {
                    setPlanFilter(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="business">Business</option>
                  <option value="none">No Plan</option>
                </Select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700 }}>
                <span>Per page:</span>
                <Select
                  style={{ width: '76px' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </Select>
              </div>
            </div>

            {/* Directory Table */}
            {usersError ? (
              <div style={{ padding: '28px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#B91C1C' }}>{usersError}</p>
                <button type="button" className={styles.btnSecondary} onClick={() => void fetchUsers()}>
                  Retry
                </button>
              </div>
            ) : usersLoading ? (
              <div style={{ padding: '28px', display: 'grid', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ height: '48px', borderRadius: '10px', background: '#F3EFE4' }} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#525252' }}>
                <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '6px' }}>No matching users found</div>
                <p style={{ margin: 0, fontSize: '13px' }}>Try clearing your search query or changing filters.</p>
              </div>
            ) : (
              <Table className={styles.adminTable}>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button type="button" className={styles.sortHeaderBtn} onClick={() => toggleSort('displayName')}>
                        <span>Name</span>
                        {sortBy === 'displayName' ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className={styles.sortHeaderBtn} onClick={() => toggleSort('email')}>
                        <span>Email</span>
                        {sortBy === 'email' ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className={styles.sortHeaderBtn} onClick={() => toggleSort('accountStatus')}>
                        <span>Status</span>
                        {sortBy === 'accountStatus' ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className={styles.sortHeaderBtn} onClick={() => toggleSort('plan')}>
                        <span>Current Plan</span>
                        {sortBy === 'plan' ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className={styles.sortHeaderBtn} onClick={() => toggleSort('lastActiveAt')}>
                        <span>Last Active</span>
                        {sortBy === 'lastActiveAt' ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className={styles.sortHeaderBtn} onClick={() => toggleSort('createdAt')}>
                        <span>Joined</span>
                        {sortBy === 'createdAt' ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
                      </button>
                    </TableHead>
                    <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.uid}
                      className={styles.userRow}
                      onClick={() => void fetchUserDetail(u.uid)}
                    >
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: u.platformRole === 'admin' ? '#FF5500' : '#0A0A0A',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              flexShrink: 0,
                            }}
                          >
                            {u.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{u.displayName}</div>
                            {u.platformRole === 'admin' && (
                              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#FF5500' }}>Admin</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: '#262626' }}>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.accountStatus === 'suspended' ? 'destructive' : 'success'}>
                          {u.accountStatus === 'suspended' ? 'Suspended' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.activePlan ? (
                          <Badge variant={u.activePlan.plan === 'starter' ? 'warning' : 'solid'}>
                            {u.activePlan.planName}
                          </Badge>
                        ) : (
                          <span style={{ color: '#737373', fontWeight: 600 }}>None</span>
                        )}
                      </TableCell>
                      <TableCell style={{ color: '#525252' }}>{formatShortDate(u.lastActiveAt)}</TableCell>
                      <TableCell style={{ color: '#525252' }}>{formatShortDate(u.createdAt)}</TableCell>
                      <TableCell style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInlineAssignUser(u);
                              setInlinePlan(u.activePlan?.plan || 'pro');
                            }}
                          >
                            Plan
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void fetchUserDetail(u.uid)}
                          >
                            Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Footer */}
            <div style={{ padding: '14px 20px', borderTop: '2.5px solid #0A0A0A', background: '#FFFDF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '13px', fontWeight: 700 }}>
              <div>
                Showing {users.length} of {totalUsersCount} user{totalUsersCount === 1 ? '' : 's'} (Page {page} of {totalPages})
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || usersLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ArrowLeft size={13} aria-hidden="true" /> Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || usersLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ArrowRight size={13} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.surfaceCard} aria-label="Admin Audit Log">
            <div className={styles.toolbar}>
              <div style={{ fontWeight: 900, fontSize: '15px' }}>Admin Write Audit Trail</div>
              <Button type="button" variant="outline" size="sm" onClick={() => void fetchAuditLogs()} disabled={auditLoading}>
                <RefreshCw size={13} aria-hidden="true" />
                Refresh Log
              </Button>
            </div>
            {auditError ? (
              <div style={{ padding: '24px', color: '#B91C1C', fontWeight: 700 }}>{auditError}</div>
            ) : auditLoading ? (
              <div style={{ padding: '24px', fontWeight: 700 }}>Loading audit entries…</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#525252', fontWeight: 600 }}>
                No admin write actions logged yet.
              </div>
            ) : (
              <Table className={styles.adminTable}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Old → New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700 }}>{log.adminEmail}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 800 }}>{log.targetUserName || log.targetUserId}</div>
                        {log.targetUserEmail && <div style={{ fontSize: '12px', color: '#525252' }}>{log.targetUserEmail}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">{log.action}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        <div>Old: {JSON.stringify(log.oldValue)}</div>
                        <div>New: {JSON.stringify(log.newValue)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        )}
      </main>

      {/* Slide-Over User Detail Drawer */}
      {selectedUid && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => {
            setSelectedUid(null);
            setSelectedDetail(null);
          }}
        >
          <div className={styles.drawerPanel} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <AdminUserDetailPanel
              detail={selectedDetail}
              loading={detailLoading}
              error={detailError}
              currentAdminUid={currentAdmin.uid}
              onRetry={() => selectedUid && void fetchUserDetail(selectedUid)}
              onClose={() => {
                setSelectedUid(null);
                setSelectedDetail(null);
              }}
              onUpdated={handleDetailUpdated}
              onErrorToast={(msg) => pushToast(msg, 'error')}
            />
          </div>
        </div>
      )}

      {/* Quick Inline Plan Assign Modal */}
      <Dialog
        open={!!inlineAssignUser}
        onOpenChange={(open) => {
          if (!open && !inlineSaving) setInlineAssignUser(null);
        }}
      >
        {inlineAssignUser && (
          <DialogContent style={{ maxWidth: '420px' }}>
            <form onSubmit={handleInlineAssignSubmit}>
              <DialogHeader>
                <DialogTitle>Assign Plan — {inlineAssignUser.displayName}</DialogTitle>
                <DialogDescription>{inlineAssignUser.email}</DialogDescription>
              </DialogHeader>
              <Select
                style={{ width: '100%', marginBottom: '12px' }}
                value={inlinePlan}
                disabled={inlineSaving}
                onChange={(e) => setInlinePlan(e.target.value as PaidPlanKey)}
              >
                <option value="starter">Starter Plan ($9/mo)</option>
                <option value="pro">Pro Plan ($20/mo)</option>
                <option value="business">Business (Custom)</option>
              </Select>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={inlineSaving}
                  onClick={() => setInlineAssignUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inlineSaving}>
                  {inlineSaving ? 'Applying…' : 'Assign Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className={styles.toastStack} role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={styles.toastItem}
              style={{
                borderColor: t.kind === 'error' ? '#DC2626' : '#0A0A0A',
                background: t.kind === 'error' ? '#FEE2E2' : '#FFFFFF',
                color: t.kind === 'error' ? '#991B1B' : '#0A0A0A',
              }}
            >
              <span>{t.text}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
