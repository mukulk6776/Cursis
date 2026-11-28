'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { CSV_TEMPLATE, parseTaskCsv } from '@/lib/engagement/csv';

interface TaskCsvImportProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function TaskCsvImport({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: TaskCsvImportProps = {}) {
  const { activeWorkspace, employees, user, syncTeamAndNotifications } = useDashboard();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(open) : next;
    if (controlledOpen === undefined) setInternalOpen(resolved);
    onOpenChange?.(resolved);
  };

  const [batch, setBatch] = useState<{ id: string; csv: string; workspaceId: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [done, setDone] = useState(false);
  const workspaceId = activeWorkspace?.id;
  const currentWorkspace = useRef(workspaceId);
  const storageKey = `cursis_task_import:${user.id}:${workspaceId}`;

  useEffect(() => {
    currentWorkspace.current = workspaceId;
    setBatch(null);
    setAttempted(false);
    setDone(false);
    setError('');
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved?.workspaceId === workspaceId && typeof saved.csv === 'string' && typeof saved.id === 'string') {
        setBatch(saved);
        setAttempted(true);
        if (controlledOpen === undefined) setInternalOpen(true);
        onOpenChange?.(true);
      }
    } catch {
      setError('Could not restore the previous import preview.');
    }
  }, [storageKey, workspaceId]);

  let rows: ReturnType<typeof parseTaskCsv> = [];
  let validation = '';
  if (batch && batch.workspaceId === workspaceId) {
    try {
      rows = parseTaskCsv(batch.csv, [user.email, ...employees.map((employee) => employee.email || '')]);
    } catch (err) {
      validation = (err as Error).message;
    }
  }

  async function importTasks() {
    if (!batch || batch.workspaceId !== workspaceId) return;
    setBusy(true);
    setAttempted(true);
    setError('');
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(batch));
      const response = await fetch('/api/tasks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, batchId: batch.id, csv: batch.csv }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import could not be confirmed. Retry this batch safely.');
      sessionStorage.removeItem(storageKey);
      if (currentWorkspace.current !== workspaceId) return;
      setDone(true);
      await syncTeamAndNotifications(workspaceId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open && hideTrigger) return null;

  return (
    <section style={{ marginBottom: open ? 18 : 0 }} aria-label="CSV task import">
      {!hideTrigger && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <Upload size={13} aria-hidden="true" />
          Import tasks from CSV
        </Button>
      )}
      {open && (
        <Card style={{ padding: 20, marginTop: hideTrigger ? 0 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={18} color="#FF5500" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Import tasks from CSV</h2>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close CSV import">
              <X size={15} aria-hidden="true" />
            </Button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Up to 100 tasks, 64 KB. Leave assignee email blank for unassigned tasks. Dates use YYYY-MM-DD. Status: todo, in-progress, review, completed or blocked.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <a
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              download="cursis-tasks.csv"
              href={'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_TEMPLATE)}
            >
              <Download size={13} aria-hidden="true" />
              Download CSV template
            </a>
            <label
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
              style={{ cursor: busy || (attempted && !done) ? 'not-allowed' : 'pointer' }}
            >
              <Upload size={13} aria-hidden="true" />
              Choose CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                disabled={busy || (attempted && !done)}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  setBatch(null);
                  setError('');
                  setAttempted(false);
                  setDone(false);
                  if (!file || !workspaceId) return;
                  if (file.size > 64000) {
                    setError('CSV must be 64 KB or smaller.');
                    return;
                  }
                  try {
                    setBatch({ id: crypto.randomUUID(), csv: await file.text(), workspaceId });
                  } catch {
                    setError('Could not read this file.');
                  }
                }}
              />
            </label>
          </div>

          {validation && (
            <p role="alert" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-error-text, #dc2626)', marginBottom: 10 }}>
              {validation}
            </p>
          )}

          {rows.length > 0 && (
            <>
              <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {rows.length} task{rows.length === 1 ? '' : 's'}{' '}
                {done ? 'saved from this import.' : 'in this preview. Nothing is saved until you confirm.'}
              </p>
              <div role="region" aria-label="Task import preview" tabIndex={0} style={{ overflowX: 'auto', maxWidth: '100%', marginBottom: 12 }}>
                <Table className="csv-task-preview" style={{ minWidth: 720 }}>
                  <TableHeader>
                    <TableRow>
                      {['Row', 'Name', 'Assignee email', 'Due date', 'Status', 'Validation'].map((label) => (
                        <TableHead key={label}>{label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.line}>
                        <TableCell>{row.line}</TableCell>
                        <TableCell style={{ overflowWrap: 'anywhere', fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell style={{ overflowWrap: 'anywhere' }}>{row.email || 'Unassigned'}</TableCell>
                        <TableCell>{row.dueDate}</TableCell>
                        <TableCell>{row.status === 'done' ? 'completed' : row.status.replaceAll('_', ' ')}</TableCell>
                        <TableCell>{row.errors.join('; ') || 'Ready'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!done && (
                <Button
                  type="button"
                  disabled={busy || Boolean(validation) || rows.some((row) => row.errors.length > 0)}
                  onClick={importTasks}
                >
                  {busy ? 'Importing…' : attempted ? 'Retry this import' : `Confirm import of ${rows.length} tasks`}
                </Button>
              )}
            </>
          )}

          {done && (
            <p role="status" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-success-text, #047857)', marginTop: 8 }}>
              Import complete. Refresh the task list if your saved tasks do not appear.
            </p>
          )}
          {error && (
            <p role="alert" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-error-text, #dc2626)', marginTop: 8 }}>
              {error}
              {attempted && ' Keep this preview open and retry the same batch to avoid duplicates.'}
            </p>
          )}
          {attempted && !done && (
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 6 }}>
              This pending batch is saved in this browser tab for safe retries.
            </p>
          )}
        </Card>
      )}
    </section>
  );
}
