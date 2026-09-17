'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { Task, TaskStatus } from '@/lib/dashboard/types';
import { formatDate, isOverdue } from '@/lib/dashboard/data';

type ViewMode = 'kanban' | 'list' | 'calendar' | 'timeline';
type FilterMode = 'all' | 'overdue' | 'high-priority' | 'assigned-to-me' | 'upcoming' | 'completed';

export default function TasksPage() {
  const {
    tasks,
    user,
    getProject,
    getEmployee,
    updateTaskStatus,
    toggleTaskComplete,
    deleteTask,
    openModal,
    showToast,
    addTask,
    departments,
  } = useDashboard();

  const [currentView, setCurrentView] = useState<ViewMode>('kanban');
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'var(--c-gray-400)' },
    { id: 'in-progress', label: 'In Progress', color: 'var(--c-brand)' },
    { id: 'review', label: 'Review', color: 'var(--c-warning)' },
    { id: 'completed', label: 'Completed', color: 'var(--c-success)' },
  ];

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId) {
      updateTaskStatus(taskId, colId);
    }
  };

  // Filter logic
  const getFilteredTasks = () => {
    return tasks.filter((t) => {
      if (selectedDeptFilter && t.departmentId !== selectedDeptFilter) return false;
      if (activeFilter === 'overdue') return t.status !== 'completed' && isOverdue(t.deadline);
      if (activeFilter === 'high-priority') return t.priority === 'high' || t.priority === 'urgent';
      if (activeFilter === 'assigned-to-me') return t.assignee === user.id || t.assignees?.includes(user.id);
      if (activeFilter === 'upcoming') return !isOverdue(t.deadline) && t.status !== 'completed';
      if (activeFilter === 'completed') return t.status === 'completed';
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  const getFilterCount = (filter: FilterMode) => {
    return tasks.filter((t) => {
      if (filter === 'overdue') return t.status !== 'completed' && isOverdue(t.deadline);
      if (filter === 'high-priority') return t.priority === 'high' || t.priority === 'urgent';
      if (filter === 'assigned-to-me') return t.assignee === user.id || t.assignees?.includes(user.id);
      if (filter === 'upcoming') return !isOverdue(t.deadline) && t.status !== 'completed';
      if (filter === 'completed') return t.status === 'completed';
      return true;
    }).length;
  };

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

  const loadTemplate = (templateName: string) => {
    addTask({
      name: `[${templateName}] New Task`,
      description: `Task created from template: ${templateName}`,
      priority: 'high',
      status: 'todo',
    });
    showToast(`Template: ${templateName} created`);
  };

  return (
    <div className="page active" id="page-tasks" style={{ maxWidth: '1080px', margin: '0 auto' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0A0A0A' }}>
              Tasks
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--c-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                textTransform: 'uppercase',
              }}
            >
              {tasks.length} total
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Track, assign, and manage deliverables across workspace departments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View Switcher */}
          <div style={{ display: 'flex', background: '#F3F4F6', padding: '3px', borderRadius: '8px', border: '1px solid #E5E7EB', gap: '2px' }}>
            {(['kanban', 'list', 'calendar', 'timeline'] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                style={{
                  textTransform: 'capitalize',
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  height: '28px',
                  fontWeight: currentView === v ? 600 : 500,
                  background: currentView === v ? '#FFFFFF' : 'transparent',
                  color: currentView === v ? '#111827' : '#6B7280',
                  border: currentView === v ? '1px solid #E5E7EB' : '1px solid transparent',
                  boxShadow: currentView === v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setCurrentView(v)}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('task-modal')}
            style={{ fontWeight: 600 }}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Department Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: 'var(--sp-4)',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'high-priority', label: 'High Priority' },
              { id: 'assigned-to-me', label: 'Assigned to Me' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
            ] as { id: FilterMode; label: string }[]
          ).map((f) => {
            const isActive = activeFilter === f.id;
            const count = getFilterCount(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  height: '30px',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isActive ? '#FF5500' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#374151',
                  border: `1px solid ${isActive ? '#FF5500' : '#E5E7EB'}`,
                  boxShadow: isActive ? '0 2px 4px rgba(255, 85, 0, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{f.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F3F4F6',
                    color: isActive ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {departments.length > 0 && (
          <select
            className="input select"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            style={{
              fontSize: '12px',
              height: '32px',
              padding: '0 8px',
              width: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <div
          id="bulk-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: 'var(--c-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            marginBottom: 'var(--sp-4)',
            fontSize: '12px',
          }}
        >
          <span style={{ fontWeight: 700 }}>{selectedTaskIds.length} selected</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 8px' }}
            onClick={handleBulkComplete}
          >
            Mark Complete
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '2px 8px' }}
            onClick={handleBulkInProgress}
          >
            Set In Progress
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', padding: '2px 8px', color: '#dc2626' }}
            onClick={handleBulkDelete}
          >
            Delete Selected ({selectedTaskIds.length})
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', padding: '2px 8px', marginLeft: 'auto' }}
            onClick={() => setSelectedTaskIds([])}
          >
            Clear
          </button>
        </div>
      )}

      {/* View Content */}
      <div id="task-view-content">
        {filteredTasks.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--c-white)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#0A0A0A' }}>
              No tasks found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              {tasks.length === 0
                ? 'Get started by creating your first task for this workspace.'
                : 'No tasks match the active filter criteria.'}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => openModal('task-modal')}
              style={{ fontWeight: 700 }}
            >
              + New Task
            </button>
          </div>
        ) : (
          <>
            {/* 1. Kanban View */}
            {currentView === 'kanban' && (
              <div className="kanban-board-wrapper">
                <div className="kanban-board">
                  {columns.map((col) => {
                    const colTasks = filteredTasks.filter((t) => t.status === col.id);
                    const isOver = dragOverColumn === col.id;
                    return (
                      <div
                        key={col.id}
                        className={`kanban-column ${isOver ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDrop={(e) => handleDrop(e, col.id)}
                      >
                        {/* Column Header */}
                        <div className="kanban-column-header">
                          <div className="kanban-column-title">
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                            <span>{col.label}</span>
                          </div>
                          <span className="kanban-column-count">
                            {colTasks.length}
                          </span>
                        </div>

                        {/* Tasks Container */}
                        <div className="kanban-column-body">
                          {colTasks.length === 0 ? (
                            <div
                              style={{
                                border: '1.5px dashed #E5E7EB',
                                borderRadius: '8px',
                                padding: '32px 14px',
                                textAlign: 'center',
                                color: '#9CA3AF',
                                fontSize: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                minHeight: '140px',
                                background: '#FAFAFA',
                              }}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v8M8 12h8" />
                              </svg>
                              <span>No tasks in {col.label.toLowerCase()}</span>
                            </div>
                          ) : (
                            colTasks.map((t) => {
                              const proj = getProject(t.project);
                              const assigneeEmp = getEmployee(t.assignee);
                              const isOverdueItem = isOverdue(t.deadline) && t.status !== 'completed';
                              const dept = departments.find((d) => d.id === t.departmentId);

                              return (
                                <div
                                  key={t.id}
                                  className="kanban-card"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, t.id)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => setSelectedTaskDetail(t)}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedTaskIds.includes(t.id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleSelectTask(t.id);
                                        }}
                                        style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#FF5500' }}
                                      />
                                      {dept && (
                                        <span
                                          style={{
                                            background: 'rgba(15, 76, 255, 0.08)',
                                            color: '#0f4cff',
                                            border: '1px solid rgba(15, 76, 255, 0.2)',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                          }}
                                        >
                                          {dept.name}
                                        </span>
                                      )}
                                      {proj && (
                                        <span
                                          style={{
                                            background: 'var(--c-surface)',
                                            fontSize: '10px',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            color: 'var(--text-secondary)',
                                          }}
                                        >
                                          {proj.name}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span
                                        style={{
                                          fontSize: '9px',
                                          textTransform: 'uppercase',
                                          fontWeight: 700,
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid var(--border-color)',
                                          background: t.priority === 'urgent' || t.priority === 'high' ? 'rgba(239, 68, 68, 0.08)' : 'var(--c-surface)',
                                          color: t.priority === 'urgent' || t.priority === 'high' ? '#dc2626' : 'var(--text-secondary)',
                                        }}
                                      >
                                        {t.priority}
                                      </span>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{
                                          padding: 0,
                                          height: '18px',
                                          width: '18px',
                                          minWidth: '18px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: 'var(--text-tertiary)',
                                        }}
                                        title="Delete task"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm(`Are you sure you want to delete task "${t.name}"?`)) {
                                            deleteTask(t.id);
                                          }
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '6px', lineHeight: 1.4 }}>
                                    {t.name}
                                  </div>

                                  {t.subtasks && t.subtasks.length > 0 && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                                      Subtasks: {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                                    {assigneeEmp ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div
                                          className="avatar avatar-sm"
                                          style={{ background: assigneeEmp.color || '#0f4cff', fontSize: '9px', width: '20px', height: '20px', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                          {assigneeEmp.initials}
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                          {assigneeEmp.name.split(' ')[0]}
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Unassigned</span>
                                    )}

                                    <span
                                      style={{
                                        fontSize: '11px',
                                        color: isOverdueItem ? '#dc2626' : 'var(--text-secondary)',
                                        fontWeight: isOverdueItem ? 700 : 500,
                                      }}
                                    >
                                      {formatDate(t.deadline)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. List View */}
            {currentView === 'list' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ width: '40px', padding: '10px 14px' }}>
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTaskIds(filteredTasks.map((t) => t.id));
                            else setSelectedTaskIds([]);
                          }}
                        />
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Task Title</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Department</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Assignee</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Priority</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Due Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t) => {
                      const emp = getEmployee(t.assignee);
                      const isDone = t.status === 'completed';
                      const dept = departments.find((d) => d.id === t.departmentId);

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTaskDetail(t)}
                          style={{
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            background: selectedTaskIds.includes(t.id) ? 'var(--c-surface-hover)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedTaskIds.includes(t.id)}
                              onChange={() => toggleSelectTask(t.id)}
                            />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {t.name}
                            </div>
                            {t.description && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '12px' }}>
                            {dept ? (
                              <span
                                style={{
                                  background: 'rgba(15, 76, 255, 0.08)',
                                  color: '#0f4cff',
                                  border: '1px solid rgba(15, 76, 255, 0.2)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                {dept.name}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '12px' }}>
                            {emp ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="avatar avatar-sm" style={{ background: emp.color || '#0f4cff', width: '20px', height: '20px', fontSize: '9px' }}>
                                  {emp.initials}
                                </div>
                                <span>{emp.name}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--c-surface)',
                                color: t.priority === 'urgent' || t.priority === 'high' ? '#dc2626' : 'var(--text-secondary)',
                              }}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }} onClick={(e) => e.stopPropagation()}>
                            <select
                              className="input select"
                              value={t.status}
                              onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                              style={{ fontSize: '11px', height: '28px', padding: '0 6px', width: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {formatDate(t.deadline)}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#dc2626', fontSize: '12px', padding: '2px 8px' }}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete task "${t.name}"?`)) {
                                  deleteTask(t.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Calendar View */}
            {currentView === 'calendar' && (
              <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#0A0A0A' }}>
                  Tasks by Due Date
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {Array.from(new Set(filteredTasks.map((t) => t.deadline))).sort().map((dateStr) => {
                    const dayTasks = filteredTasks.filter((t) => t.deadline === dateStr);
                    return (
                      <div key={dateStr} className="card" style={{ background: 'var(--c-surface)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: '#0f4cff' }}>
                          {formatDate(dateStr)} ({dayTasks.length})
                        </div>
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            style={{ padding: '6px 8px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', cursor: 'pointer' }}
                            onClick={() => setSelectedTaskDetail(t)}
                          >
                            <div style={{ fontWeight: 600, color: '#0A0A0A' }}>{t.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{t.status} · {t.priority}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Timeline / Progress View */}
            {currentView === 'timeline' && (
              <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#0A0A0A' }}>
                  Sprint Progress
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTasks.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ width: '220px', fontWeight: 600, fontSize: '12px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#0A0A0A' }}>
                        {t.name}
                      </div>
                      <div style={{ flex: 1, background: 'var(--c-surface)', height: '16px', borderRadius: '4px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: t.status === 'completed' ? '100%' : t.status === 'in-progress' ? '50%' : t.status === 'review' ? '80%' : '15%',
                            background: t.status === 'completed' ? '#16a34a' : '#0f4cff',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', width: '80px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatDate(t.deadline)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task Templates Section */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#0A0A0A' }}>
          Quick Task Templates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {[
            { name: 'Bug Report', fields: 'Steps to Reproduce, Severity' },
            { name: 'Feature Request', fields: 'User Story, Acceptance Criteria' },
            { name: 'Onboarding Item', fields: 'New Hire Checklist, Training' },
            { name: 'Sprint Deliverable', fields: 'Deliverable, Definition of Done' },
          ].map((tmpl) => (
            <div
              key={tmpl.name}
              className="card"
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'var(--c-white)',
              }}
              onClick={() => loadTemplate(tmpl.name)}
            >
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0A0A0A', marginBottom: '2px' }}>
                + {tmpl.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tmpl.fields}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskDetail && (
        <div
          className="modal-overlay active"
          onClick={() => setSelectedTaskDetail(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--c-white)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--c-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedTaskDetail.priority}
                </span>
                <h3 style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: 700, color: '#0A0A0A' }}>
                  {selectedTaskDetail.name}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedTaskDetail(null)}
                style={{ fontSize: '16px', padding: '0 4px', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                {selectedTaskDetail.description || 'No detailed description provided.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '14px 0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    className="input select"
                    value={selectedTaskDetail.status}
                    onChange={(e) => {
                      updateTaskStatus(selectedTaskDetail.id, e.target.value as TaskStatus);
                      setSelectedTaskDetail({ ...selectedTaskDetail, status: e.target.value as TaskStatus });
                    }}
                    style={{ width: '100%', height: '32px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Deadline
                  </label>
                  <div style={{ fontSize: '12px', padding: '6px 0', color: '#0A0A0A', fontWeight: 500 }}>
                    {formatDate(selectedTaskDetail.deadline)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#dc2626', fontSize: '12px' }}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete task "${selectedTaskDetail.name}"?`)) {
                    deleteTask(selectedTaskDetail.id);
                    setSelectedTaskDetail(null);
                  }
                }}
              >
                Delete Task
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedTaskDetail(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    toggleTaskComplete(selectedTaskDetail.id);
                    setSelectedTaskDetail(null);
                  }}
                  style={{ fontWeight: 700 }}
                >
                  {selectedTaskDetail.status === 'completed' ? 'Reopen' : 'Mark Completed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
