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
 openModal,
 showToast,
 addTask,
 } = useDashboard();

 const [currentView, setCurrentView] = useState<ViewMode>('kanban');
 const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
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
 <div className="page active" id="page-tasks">
 {/* Header */}
 <div className="page-header">
 <div>
 <h1 className="page-title">Tasks &amp; Execution</h1>
 </div>
 <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)' }}>
 {/* View Switcher */}
 <div style={{ display: 'flex', border: 'var(--border-width) solid var(--border-color)', background: 'var(--c-surface)' }}>
 {(['kanban', 'list', 'calendar', 'timeline'] as ViewMode[]).map((v) => (
 <button
 key={v}
 className={`btn ${currentView === v ? 'btn-primary' : 'btn-ghost'} btn-sm`}
 style={{ textTransform: 'capitalize', fontSize: 'var(--fs-xs)', padding: '4px 10px' }}
 onClick={() => setCurrentView(v)}
 >
 {v}
 </button>
 ))}
 </div>

 <button className="btn btn-primary btn-sm" onClick={() => openModal('task-modal')}>
 + New Task
 </button>
 </div>
 </div>

 {/* Smart View Filters */}
 <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
 {(
 [
 { id: 'all', label: 'All Tasks' },
 { id: 'overdue', label: 'Overdue' },
 { id: 'high-priority', label: 'High Priority' },
 { id: 'assigned-to-me', label: 'Assigned to Me' },
 { id: 'upcoming', label: 'Upcoming' },
 { id: 'completed', label: 'Completed' },
 ] as { id: FilterMode; label: string }[]
 ).map((f) => (
 <button
 key={f.id}
 className={`btn ${activeFilter === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
 onClick={() => setActiveFilter(f.id)}
 >
 {f.label}
 <span style={{ marginLeft: '4px', opacity: 0.75, fontWeight: 'bold' }}>
 {getFilterCount(f.id)}
 </span>
 </button>
 ))}
 </div>

 {/* Bulk Actions Bar */}
 {selectedTaskIds.length > 0 && (
 <div
 id="bulk-bar"
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 'var(--sp-3)',
 padding: 'var(--sp-3) var(--sp-4)',
 background: 'var(--c-near-black)',
 color: 'var(--c-white)',
 marginBottom: 'var(--sp-4)',
 fontSize: 'var(--fs-sm)',
 }}
 >
 <span style={{ fontWeight: 'var(--fw-bold)' }}>{selectedTaskIds.length} selected</span>
 <button
 className="btn btn-sm"
 style={{ background: 'var(--c-white)', color: 'var(--c-near-black)', fontSize: 'var(--fs-xs)' }}
 onClick={handleBulkComplete}
 >
 Mark Complete
 </button>
 <button
 className="btn btn-sm"
 style={{ background: 'var(--c-white)', color: 'var(--c-near-black)', fontSize: 'var(--fs-xs)' }}
 onClick={handleBulkInProgress}
 >
 Set In Progress
 </button>
 <button
 className="btn btn-sm"
 style={{ background: 'transparent', color: 'var(--c-white)', fontSize: 'var(--fs-xs)', marginLeft: 'auto' }}
 onClick={() => setSelectedTaskIds([])}
 >
 Clear
 </button>
 </div>
 )}

 {/* View Content */}
 <div id="task-view-content">
 {/* 1. Kanban View */}
 {currentView === 'kanban' && (
 <div
 className="kanban-board"
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(4, 1fr)',
 gap: 'var(--sp-4)',
 alignItems: 'start',
 }}
 >
 {columns.map((col) => {
 const colTasks = filteredTasks.filter((t) => t.status === col.id);
 const isOver = dragOverColumn === col.id;
 return (
 <div
 key={col.id}
 className="kanban-column"
 style={{
 background: isOver ? 'var(--c-surface-hover)' : 'var(--c-surface)',
 border: `var(--border-width) solid ${isOver ? 'var(--c-brand)' : 'var(--border-color)'}`,
 padding: 'var(--sp-3)',
 minHeight: '480px',
 }}
 onDragOver={(e) => handleDragOver(e, col.id)}
 onDrop={(e) => handleDrop(e, col.id)}
 >
 {/* Column Header */}
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingBottom: 'var(--sp-2)',
 borderBottom: 'var(--border-width) solid var(--border-color)',
 marginBottom: 'var(--sp-3)',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <span style={{ width: '10px', height: '10px', background: col.color, display: 'inline-block' }} />
 <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{col.label}</span>
 </div>
 <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{colTasks.length}</span>
 </div>

 {/* Tasks Container */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
 {colTasks.map((t) => {
 const proj = getProject(t.project);
 const assigneeEmp = getEmployee(t.assignee);
 const isOverdueItem = isOverdue(t.deadline) && t.status !== 'completed';
 return (
 <div
 key={t.id}
 className="kanban-card"
 draggable
 onDragStart={(e) => handleDragStart(e, t.id)}
 onDragEnd={handleDragEnd}
 onClick={() => setSelectedTaskDetail(t)}
 style={{
 background: 'var(--c-white)',
 border: 'var(--border-width) solid var(--border-color)',
 boxShadow: 'var(--shadow-sm)',
 padding: 'var(--sp-3)',
 cursor: 'grab',
 transition: 'all var(--dur-fast) var(--ease-default)',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <input
 type="checkbox"
 checked={selectedTaskIds.includes(t.id)}
 onChange={(e) => {
 e.stopPropagation();
 toggleSelectTask(t.id);
 }}
 style={{ cursor: 'pointer' }}
 />
 {proj && (
 <span
 className="tag"
 style={{ background: 'var(--c-surface)', fontSize: '10px', padding: '1px 6px' }}
 >
 {proj.name}
 </span>
 )}
 </div>
 <span
 className={`badge badge-${
 t.priority === 'urgent' || t.priority === 'high' ? 'error' : 'neutral'
 }`}
 style={{ fontSize: '9px', padding: '1px 5px' }}
 >
 {t.priority}
 </span>
 </div>

 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-2)' }}>
 {t.name}
 </div>

 {t.subtasks && t.subtasks.length > 0 && (
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)' }}>
 Subtasks: {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}
 </div>
 )}

 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--sp-2)', paddingTop: 'var(--sp-2)', borderTop: '1px solid var(--c-gray-200)' }}>
 {assigneeEmp && (
 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
 <div
 className="avatar avatar-sm"
 style={{ background: assigneeEmp.color, fontSize: '10px' }}
 >
 {assigneeEmp.initials}
 </div>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
 {assigneeEmp.name.split(' ')[0]}
 </span>
 </div>
 )}

 <span
 style={{
 fontSize: '10px',
 fontFamily: 'var(--font-mono)',
 color: isOverdueItem ? 'var(--c-error)' : 'var(--text-tertiary)',
 fontWeight: isOverdueItem ? 'bold' : 'normal',
 }}
 >
 {formatDate(t.deadline)}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* 2. List View */}
 {currentView === 'list' && (
 <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
 <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead>
 <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
 <th style={{ width: '40px', padding: 'var(--sp-3)' }}>
 <input
 type="checkbox"
 checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
 onChange={(e) => {
 if (e.target.checked) setSelectedTaskIds(filteredTasks.map((t) => t.id));
 else setSelectedTaskIds([]);
 }}
 />
 </th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Task Name</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Project</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Assignee</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Priority</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Status</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Deadline</th>
 </tr>
 </thead>
 <tbody>
 {filteredTasks.map((t) => {
 const proj = getProject(t.project);
 const emp = getEmployee(t.assignee);
 return (
 <tr
 key={t.id}
 style={{ borderBottom: '1px solid var(--c-gray-200)', cursor: 'pointer' }}
 onClick={() => setSelectedTaskDetail(t)}
 >
 <td style={{ padding: 'var(--sp-3)' }} onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 checked={selectedTaskIds.includes(t.id)}
 onChange={() => toggleSelectTask(t.id)}
 />
 </td>
 <td style={{ padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)' }}>{t.name}</td>
 <td style={{ padding: 'var(--sp-3)' }}>{proj?.name || '—'}</td>
 <td style={{ padding: 'var(--sp-3)' }}>{emp?.name || '—'}</td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <span className={`badge badge-${t.priority === 'urgent' || t.priority === 'high' ? 'error' : 'neutral'}`}>
 {t.priority}
 </span>
 </td>
 <td style={{ padding: 'var(--sp-3)' }} onClick={(e) => e.stopPropagation()}>
 <select
 className="input select"
 style={{ padding: '2px 6px', fontSize: 'var(--fs-xs)', width: 'auto' }}
 value={t.status}
 onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
 >
 <option value="todo">To Do</option>
 <option value="in-progress">In Progress</option>
 <option value="review">Review</option>
 <option value="completed">Completed</option>
 </select>
 </td>
 <td style={{ padding: 'var(--sp-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
 {formatDate(t.deadline)}
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
 <div className="card" style={{ padding: 'var(--sp-4)' }}>
 <h3 style={{ marginBottom: 'var(--sp-3)' }}>Tasks by Deadline Date</h3>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-3)' }}>
 {Array.from(new Set(filteredTasks.map((t) => t.deadline))).sort().map((dateStr) => {
 const dayTasks = filteredTasks.filter((t) => t.deadline === dateStr);
 return (
 <div key={dateStr} className="card" style={{ background: 'var(--c-surface)', padding: 'var(--sp-3)' }}>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-2)', color: 'var(--c-brand)' }}>
 {formatDate(dateStr)} ({dayTasks.length})
 </div>
 {dayTasks.map((t) => (
 <div
 key={t.id}
 style={{ padding: '6px', background: 'white', border: 'var(--border-width) solid var(--border-color)', marginBottom: '4px', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}
 onClick={() => setSelectedTaskDetail(t)}
 >
 <div style={{ fontWeight: 'bold' }}>{t.name}</div>
 <div style={{ color: 'var(--text-tertiary)' }}>{t.status} · {t.priority}</div>
 </div>
 ))}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* 4. Timeline / Gantt View */}
 {currentView === 'timeline' && (
 <div className="card" style={{ padding: 'var(--sp-4)' }}>
 <h3 style={{ marginBottom: 'var(--sp-3)' }}>Sprint Timeline &amp; Task Progress</h3>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
 {filteredTasks.map((t) => (
 <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--c-gray-200)' }}>
 <div style={{ width: '220px', fontWeight: 'bold', fontSize: 'var(--fs-xs)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
 {t.name}
 </div>
 <div style={{ flex: 1, background: 'var(--c-surface)', height: '24px', border: 'var(--border-width) solid var(--border-color)', position: 'relative' }}>
 <div
 style={{
 height: '100%',
 width: t.status === 'completed' ? '100%' : t.status === 'in-progress' ? '50%' : t.status === 'review' ? '80%' : '15%',
 background: t.status === 'completed' ? 'var(--c-success)' : 'var(--c-brand)',
 }}
 />
 </div>
 <span style={{ fontSize: '10px', width: '80px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
 {formatDate(t.deadline)}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Task Templates Section */}
 <div style={{ marginTop: 'var(--sp-6)' }}>
 <h3 style={{ marginBottom: 'var(--sp-3)' }}>Task Templates</h3>
 <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
 {[
 { name: 'Bug Report', fields: 'Title, Steps to Reproduce, Expected, Actual, Severity' },
 { name: 'Feature Request', fields: 'Title, User Story, Acceptance Criteria, Priority' },
 { name: 'Onboarding Checklist', fields: 'New Hire Tasks, Documents, Meetings, Training' },
 { name: 'Sprint Task', fields: 'Story Points, Sprint, Assignee, Definition of Done' },
 ].map((tmpl) => (
 <div
 key={tmpl.name}
 className="card"
 style={{ padding: 'var(--sp-3)', flex: 1, minWidth: '200px', cursor: 'pointer' }}
 onClick={() => loadTemplate(tmpl.name)}
 >
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', marginBottom: '4px' }}>
 {tmpl.name}
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{tmpl.fields}</div>
 </div>
 ))}
 </div>
 </div>

 {/* Task Detail Modal */}
 {selectedTaskDetail && (
 <div
 className="modal-overlay active"
 onClick={() => setSelectedTaskDetail(null)}
 >
 <div
 className="modal"
 style={{ maxWidth: '560px' }}
 onClick={(e) => e.stopPropagation()}
 >
 <div className="modal-header">
 <div>
 <span className={`badge badge-${selectedTaskDetail.priority === 'urgent' ? 'error' : 'brand'}`}>
 {selectedTaskDetail.priority.toUpperCase()}
 </span>
 <h3 style={{ margin: '4px 0 0 0', fontSize: 'var(--fs-lg)' }}>{selectedTaskDetail.name}</h3>
 </div>
 <button className="modal-close" onClick={() => setSelectedTaskDetail(null)}></button>
 </div>
 <div className="modal-body">
 <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
 {selectedTaskDetail.description || 'No detailed description provided.'}
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', margin: 'var(--sp-4) 0' }}>
 <div>
 <label className="input-label">Status</label>
 <select
 className="input select"
 value={selectedTaskDetail.status}
 onChange={(e) => {
 updateTaskStatus(selectedTaskDetail.id, e.target.value as TaskStatus);
 setSelectedTaskDetail({ ...selectedTaskDetail, status: e.target.value as TaskStatus });
 }}
 >
 <option value="todo">To Do</option>
 <option value="in-progress">In Progress</option>
 <option value="review">Review</option>
 <option value="completed">Completed</option>
 </select>
 </div>
 <div>
 <label className="input-label">Deadline</label>
 <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', padding: 'var(--sp-2)' }}>
 {formatDate(selectedTaskDetail.deadline)}
 </div>
 </div>
 </div>

 {selectedTaskDetail.subtasks && selectedTaskDetail.subtasks.length > 0 && (
 <div>
 <label className="input-label">Subtasks</label>
 {selectedTaskDetail.subtasks.map((st) => (
 <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: '4px 0' }}>
 <input type="checkbox" checked={st.done} readOnly />
 <span style={{ textDecoration: st.done ? 'line-through' : 'none', fontSize: 'var(--fs-sm)' }}>
 {st.name}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="modal-footer">
 <button className="btn btn-secondary" onClick={() => setSelectedTaskDetail(null)}>
 Close
 </button>
 <button
 className="btn btn-primary"
 onClick={() => {
 toggleTaskComplete(selectedTaskDetail.id);
 setSelectedTaskDetail(null);
 }}
 >
 {selectedTaskDetail.status === 'completed' ? 'Reopen Task' : 'Complete Task'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
