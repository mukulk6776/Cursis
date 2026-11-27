'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Columns3,
  Folder,
  ListTodo,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { PriorityLevel, Task, TaskStatus } from '@/lib/dashboard/types';
import { formatDate, isOverdue } from '@/lib/dashboard/data';
import TaskCsvImport from '@/components/dashboard/TaskCsvImport';
import EmptyState from '@/components/dashboard/EmptyState';

type ViewMode = 'list' | 'board' | 'calendar' | 'timeline';

const STATUS_COLUMNS: {
  id: TaskStatus;
  label: string;
  dotColor: string;
  pillBg: string;
  pillFg: string;
}[] = [
    { id: 'in-progress', label: 'In Progress', dotColor: '#FF5500', pillBg: '#FFF3EB', pillFg: '#C2410C' },
    { id: 'todo', label: 'To Do', dotColor: '#6B7280', pillBg: '#F3F4F6', pillFg: '#374151' },
    { id: 'review', label: 'In Review', dotColor: '#8B5CF6', pillBg: '#F5F3FF', pillFg: '#6D28D9' },
    { id: 'completed', label: 'Completed', dotColor: '#10B981', pillBg: '#ECFDF5', pillFg: '#047857' },
  ];

const PRIORITY_BADGE_MAP: Record<PriorityLevel, { variant: BadgeVariant; label: string }> = {
  urgent: { variant: 'destructive', label: 'Urgent' },
  high: { variant: 'warning', label: 'High' },
  medium: { variant: 'success', label: 'Medium' },
  low: { variant: 'secondary', label: 'Low' },
};

function statusConfig(status: TaskStatus) {
  return STATUS_COLUMNS.find((c) => c.id === status) || STATUS_COLUMNS[1];
}

export default function TasksPage() {
  const {
    tasks,
    projects,
    getProject,
    getEmployee,
    updateTaskStatus,
    toggleTaskComplete,
    deleteTask,
    openModal,
    showToast,
  } = useDashboard();

  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [csvOpen, setCsvOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedTaskSnapshot, setSelectedTaskDetail] = useState<Task | null>(null);
  const selectedTaskDetail = tasks.find((task) => task.id === selectedTaskSnapshot?.id) || selectedTaskSnapshot;

  const filteredTasks: Task[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (projectFilter !== 'all') {
        if (projectFilter === 'standalone' && t.project) return false;
        if (projectFilter !== 'standalone' && t.project !== projectFilter) return false;
      }

      if (q) {
        const emp = getEmployee(t.assignee);
        const proj = t.project ? getProject(t.project) : undefined;
        const match =
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (emp && emp.name.toLowerCase().includes(q)) ||
          (proj && proj.name.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [tasks, projectFilter, searchQuery, getEmployee, getProject]);

  // Bulk Actions
  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkComplete = () => {
    selectedTaskIds.forEach((id) => updateTaskStatus(id, 'completed'));
    showToast(`Marked ${selectedTaskIds.length} tasks as completed`);
    setSelectedTaskIds([]);
  };

  const handleBulkInProgress = () => {
    selectedTaskIds.forEach((id) => updateTaskStatus(id, 'in-progress'));
    showToast(`Marked ${selectedTaskIds.length} tasks as in-progress`);
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected task(s)?`)) {
      selectedTaskIds.forEach((id) => deleteTask(id));
      setSelectedTaskIds([]);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleColumnDrop = (targetStatus: TaskStatus) => {
    if (dragTaskId) {
      updateTaskStatus(dragTaskId, targetStatus);
    }
    setDragTaskId(null);
    setDragOverColumn(null);
  };

  const viewOptions: { id: ViewMode; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'list', label: 'List', Icon: ListTodo },
    { id: 'board', label: 'Board', Icon: Columns3 },
    { id: 'calendar', label: 'Calendar', Icon: Calendar },
    { id: 'timeline', label: 'Timeline', Icon: BarChart3 },
  ];

  const renderGroupRow = (t: Task) => {
    const emp = getEmployee(t.assignee);
    const proj = t.project ? getProject(t.project) : undefined;
    const isDone = t.status === 'completed';
    const overdue = !isDone && isOverdue(t.deadline);
    const pBadge = PRIORITY_BADGE_MAP[t.priority] || PRIORITY_BADGE_MAP.medium;
    const sCfg = statusConfig(t.status);
    const selected = selectedTaskIds.includes(t.id);

    return (
      <div
        key={t.id}
        className={`cursis-task-row ${selected ? 'cursis-task-row--selected' : ''}`}
        onClick={() => setSelectedTaskDetail(t)}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={selected}
            aria-label={`Select ${t.name}`}
            onChange={() => toggleSelectTask(t.id)}
            style={{ width: '15px', height: '15px', accentColor: '#FF5500', cursor: 'pointer' }}
          />
        </div>

        <button
          type="button"
          aria-label={isDone ? `Mark ${t.name} incomplete` : `Mark ${t.name} complete`}
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(t.id);
          }}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: isDone ? '1.5px solid #10B981' : '1.5px solid #D1D5DB',
            background: isDone ? '#10B981' : '#FFFFFF',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isDone && <Check size={12} strokeWidth={2.8} aria-hidden="true" />}
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: '13.5px',
                color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: isDone ? 'line-through' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t.name}
            </span>
            {proj && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: '#F5F2EA',
                  color: '#4A4A4A',
                  border: '1px solid rgba(10, 10, 10, 0.08)',
                }}
              >
                <Folder size={10} color={proj.color || '#FF5500'} aria-hidden="true" />
                {proj.name}
              </span>
            )}
          </div>
          {t.description && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '460px',
              }}
            >
              {t.description}
            </div>
          )}
        </div>

        <div className="cursis-task-row-meta" style={{ display: 'contents' }}>
          <Badge variant={pBadge.variant}>{pBadge.label}</Badge>

          <div onClick={(e) => e.stopPropagation()}>
            <select
              className="cursis-task-status-select"
              value={t.status}
              aria-label={`Change status for ${t.name}`}
              onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
              style={{
                backgroundColor: sCfg.pillBg,
                color: sCfg.pillFg,
                borderColor: 'rgba(10, 10, 10, 0.12)',
              }}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={{ minWidth: '120px', fontSize: '12.5px' }}>
            {emp ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div
                  className="avatar avatar-sm"
                  style={{
                    background: emp.color || '#FF5500',
                    width: '22px',
                    height: '22px',
                    fontSize: '9.5px',
                  }}
                >
                  {emp.initials}
                </div>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {emp.name}
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Unassigned</span>
            )}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              minWidth: '82px',
              fontSize: '12px',
              fontWeight: overdue ? 600 : 500,
              color: overdue ? '#dc2626' : 'var(--text-secondary)',
            }}
          >
            <Calendar size={12} aria-hidden="true" />
            <span>{formatDate(t.deadline)}</span>
          </div>
        </div>

        <div className="cursis-task-row-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Delete task"
            aria-label={`Delete ${t.name}`}
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete task "${t.name}"?`)) {
                deleteTask(t.id);
              }
            }}
            style={{ width: '30px', height: '30px', color: '#dc2626' }}
          >
            <Trash2 size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="page active" id="page-tasks" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Tasks
            </h1>
            <Badge variant="secondary" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
              {tasks.length} total
            </Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Organize sprints, assign owners, and track status across stages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Switcher */}
          <div className="ui-tabs-list" role="tablist" aria-label="Task view mode">
            {viewOptions.map(({ id, label, Icon }) => {
              const active = currentView === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-state={active ? 'active' : 'inactive'}
                  className="ui-tabs-trigger"
                  onClick={() => setCurrentView(id)}
                  style={{ padding: '5px 10px', fontSize: '12.5px' }}
                >
                  <Icon size={13} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCsvOpen((v) => !v)}
            aria-expanded={csvOpen}
          >
            <Upload size={13} aria-hidden="true" />
            Import CSV
          </Button>

          <Button type="button" size="sm" onClick={() => openModal('task-modal')}>
            <Plus size={14} aria-hidden="true" />
            New Task
          </Button>
        </div>
      </div>

      {/* Collapsible CSV Import Panel */}
      <TaskCsvImport open={csvOpen} onOpenChange={setCsvOpen} hideTrigger />

      {/* Search & Project Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: 'var(--sp-4)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '240px', maxWidth: '100%' }}>
          <Search
            size={13}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <Input
            type="search"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
            style={{ height: '32px', paddingLeft: '30px', fontSize: '12.5px' }}
          />
        </div>

        <Select
          aria-label="Filter by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '145px', height: '32px', fontSize: '12.5px' }}
        >
          <option value="all">All Projects</option>
          <option value="standalone">Independent Tasks</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <Card
          id="bulk-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            marginBottom: 'var(--sp-4)',
            flexWrap: 'wrap',
          }}
        >
          <Badge variant="default">{selectedTaskIds.length} selected</Badge>
          <Button type="button" variant="outline" size="sm" onClick={handleBulkComplete}>
            <CheckCircle2 size={13} aria-hidden="true" />
            Mark Complete
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleBulkInProgress}>
            Set In Progress
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 size={13} aria-hidden="true" />
            Delete ({selectedTaskIds.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setSelectedTaskIds([])}
          >
            Clear
          </Button>
        </Card>
      )}

      {/* View Content */}
      <div id="task-view-content">
        {filteredTasks.length === 0 ? (
          <EmptyState
            title={tasks.length === 0 ? 'No tasks in this workspace yet' : 'No tasks match active filters'}
            description={
              tasks.length === 0
                ? 'Start organizing your sprint deliverables. Give the work a name, assign an owner, and set a deadline.'
                : 'No tasks match your selected filter or search criteria. Try clearing filters or switching project views.'
            }
            actionLabel={tasks.length === 0 ? 'Create Your First Task' : 'Reset Filters'}
            onAction={
              tasks.length === 0
                ? () => openModal('task-modal')
                : () => {
                  setProjectFilter('all');
                  setSearchQuery('');
                }
            }
          />
        ) : (
          <>
            {/* 1. Grouped Interactive List View (Slack Lists / Linear style) */}
            {currentView === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {STATUS_COLUMNS.map((group) => {
                  const groupTasks = filteredTasks.filter((t) => t.status === group.id);
                  if (groupTasks.length === 0) return null;
                  const collapsed = !!collapsedGroups[group.id];

                  return (
                    <section key={group.id} className="cursis-task-group" aria-label={`${group.label} tasks`}>
                      <div className="cursis-task-group-header">
                        <button
                          type="button"
                          onClick={() => handleToggleGroup(group.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontWeight: 700,
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {collapsed ? (
                            <ChevronRight size={15} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={15} aria-hidden="true" />
                          )}
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: group.dotColor,
                              display: 'inline-block',
                            }}
                          />
                          <span>{group.label}</span>
                          <Badge variant="secondary" style={{ padding: '1px 7px', fontSize: '11px' }}>
                            {groupTasks.length}
                          </Badge>
                        </button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal('task-modal')}
                          style={{ height: '26px', fontSize: '11.5px', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={12} aria-hidden="true" />
                          Add task
                        </Button>
                      </div>

                      {!collapsed && <div>{groupTasks.map(renderGroupRow)}</div>}
                    </section>
                  );
                })}
              </div>
            )}

            {/* 2. Drag-and-Drop Board View */}
            {currentView === 'board' && (
              <div className="cursis-task-board" aria-label="Task Kanban board">
                {STATUS_COLUMNS.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.id);
                  const isDragTarget = dragOverColumn === col.id;
                  return (
                    <section
                      key={col.id}
                      className={`cursis-task-column ${isDragTarget ? 'cursis-task-column--drag' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverColumn !== col.id) setDragOverColumn(col.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverColumn === col.id) setDragOverColumn(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleColumnDrop(col.id);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700, fontSize: '13px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: col.dotColor,
                              display: 'inline-block',
                            }}
                          />
                          <span>{col.label}</span>
                          <Badge variant="secondary" style={{ fontSize: '11px', padding: '1px 7px' }}>
                            {colTasks.length}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Add task in ${col.label}`}
                          onClick={() => openModal('task-modal')}
                          style={{ width: '26px', height: '26px' }}
                        >
                          <Plus size={13} aria-hidden="true" />
                        </Button>
                      </div>

                      {colTasks.length === 0 ? (
                        <div
                          style={{
                            border: '1.5px dashed rgba(10, 10, 10, 0.14)',
                            borderRadius: '10px',
                            padding: '20px 12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Drop tasks here
                        </div>
                      ) : (
                        colTasks.map((t) => {
                          const emp = getEmployee(t.assignee);
                          const proj = t.project ? getProject(t.project) : undefined;
                          const pBadge = PRIORITY_BADGE_MAP[t.priority] || PRIORITY_BADGE_MAP.medium;
                          const overdue = t.status !== 'completed' && isOverdue(t.deadline);

                          return (
                            <article
                              key={t.id}
                              draggable
                              onDragStart={() => setDragTaskId(t.id)}
                              onDragEnd={() => {
                                setDragTaskId(null);
                                setDragOverColumn(null);
                              }}
                              onClick={() => setSelectedTaskDetail(t)}
                              className="cursis-task-card"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '7px' }}>
                                <Badge variant={pBadge.variant} style={{ fontSize: '10.5px', padding: '1px 7px' }}>
                                  {pBadge.label}
                                </Badge>
                                {proj && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {proj.name}
                                  </span>
                                )}
                              </div>

                              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '8px', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                                {t.name}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: overdue ? '#dc2626' : 'var(--text-tertiary)' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: overdue ? 600 : 500 }}>
                                  <Calendar size={11} aria-hidden="true" />
                                  {formatDate(t.deadline)}
                                </span>
                                {emp && (
                                  <div
                                    className="avatar avatar-sm"
                                    title={emp.name}
                                    style={{
                                      background: emp.color || '#FF5500',
                                      width: '22px',
                                      height: '22px',
                                      fontSize: '9px',
                                    }}
                                  >
                                    {emp.initials}
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {/* 3. Calendar View */}
            {currentView === 'calendar' && (
              <Card style={{ padding: '18px 20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
                  Tasks by Due Date
                </h3>
                {Array.from(new Set<string>(filteredTasks.filter((t) => Boolean(t.deadline)).map((t) => t.deadline))).length === 0 ? (
                  <EmptyState
                    compact
                    title="No scheduled tasks on the calendar"
                    description="None of your active tasks have deadlines set. Assign due dates to view them on the calendar."
                    actionLabel="Schedule Task"
                    onAction={() => openModal('task-modal')}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                    {Array.from(new Set<string>(filteredTasks.filter((t) => Boolean(t.deadline)).map((t) => t.deadline)))
                      .sort()
                      .map((dateStr) => {
                        const dayTasks = filteredTasks.filter((t) => t.deadline === dateStr);
                        return (
                          <Card key={dateStr} style={{ padding: '14px', background: '#FCFBF8' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--c-brand)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{formatDate(dateStr)}</span>
                              <Badge variant="secondary">{dayTasks.length}</Badge>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {dayTasks.map((t) => (
                                <div
                                  key={t.id}
                                  onClick={() => setSelectedTaskDetail(t)}
                                  style={{
                                    padding: '8px 10px',
                                    background: '#FFFFFF',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                                  <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '2px' }}>
                                    {statusConfig(t.status).label} · {PRIORITY_BADGE_MAP[t.priority]?.label || t.priority}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </Card>
            )}

            {/* 4. Timeline / Progress View */}
            {currentView === 'timeline' && (
              <Card style={{ padding: '18px 20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
                  Sprint Progress
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTasks.map((t) => {
                    const pct = t.status === 'completed' ? '100%' : t.status === 'in-progress' ? '55%' : t.status === 'review' ? '82%' : '18%';
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskDetail(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 6px',
                          borderBottom: '1px solid rgba(10, 10, 10, 0.06)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ width: '220px', fontWeight: 600, fontSize: '12.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          {t.name}
                        </div>
                        <div style={{ flex: 1, background: '#F3EFE4', height: '10px', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: pct,
                              borderRadius: '999px',
                              background: t.status === 'completed' ? '#10B981' : '#FF5500',
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </div>
                        <Badge variant="secondary" style={{ fontSize: '11px' }}>
                          {statusConfig(t.status).label}
                        </Badge>
                        <span style={{ fontSize: '11.5px', width: '78px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatDate(t.deadline)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Task Detail Dialog */}
      <Dialog
        open={!!selectedTaskDetail}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskDetail(null);
        }}
      >
        {selectedTaskDetail && (
          <DialogContent style={{ maxWidth: '580px' }}>
            <DialogHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Badge variant={PRIORITY_BADGE_MAP[selectedTaskDetail.priority]?.variant || 'secondary'}>
                  {PRIORITY_BADGE_MAP[selectedTaskDetail.priority]?.label || selectedTaskDetail.priority} Priority
                </Badge>
                {selectedTaskDetail.project && getProject(selectedTaskDetail.project) && (
                  <Badge variant="outline">{getProject(selectedTaskDetail.project)?.name}</Badge>
                )}
              </div>
              <DialogTitle>{selectedTaskDetail.name}</DialogTitle>
              <DialogDescription>
                {selectedTaskDetail.description || 'No detailed description provided.'}
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '10px 0 16px' }}>
              <div>
                <Label style={{ marginBottom: '5px' }}>Status</Label>
                <Select
                  value={selectedTaskDetail.status}
                  aria-label="Task status"
                  onChange={(e) => {
                    updateTaskStatus(selectedTaskDetail.id, e.target.value as TaskStatus);
                    setSelectedTaskDetail({ ...selectedTaskDetail, status: e.target.value as TaskStatus });
                  }}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">
                    Completed
                  </option>
                </Select>
              </div>
              <div>
                <Label style={{ marginBottom: '5px' }}>Deadline</Label>
                <div style={{ fontSize: '13px', height: '38px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <Calendar size={14} aria-hidden="true" />
                  {formatDate(selectedTaskDetail.deadline)}
                </div>
              </div>
            </div>

            <DialogFooter style={{ justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete task "${selectedTaskDetail.name}"?`)) {
                    deleteTask(selectedTaskDetail.id);
                    setSelectedTaskDetail(null);
                  }
                }}
              >
                <Trash2 size={13} aria-hidden="true" />
                Delete Task
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTaskDetail(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    toggleTaskComplete(selectedTaskDetail.id);
                    setSelectedTaskDetail(null);
                  }}
                >
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {selectedTaskDetail.status === 'completed' ? 'Reopen Task' : 'Mark Completed'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
