'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { PriorityLevel, TaskStatus } from '@/lib/dashboard/types';

export default function TaskModal() {
  const { activeModal, closeModal, addTask, projects, employees, tasks, activeWorkspace, planLimits } = useDashboard();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState(''); // "" (unselected), "standalone", or projectId
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');

  if (activeModal !== 'task-modal') return null;

  const handleClose = () => {
    setErrorMsg('');
    closeModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a task title.');
      return;
    }

    if (!assignee) {
      setErrorMsg('Please select a team member to assign this task to.');
      return;
    }

    if (!deadline) {
      setErrorMsg('Please select a deadline / due date for this task.');
      return;
    }

    if (!status) {
      setErrorMsg('Please select a task status.');
      return;
    }

    if (!project) {
      setErrorMsg('Please select a project or choose "Independent Task (No Project)".');
      return;
    }

    if (project !== 'standalone' && planLimits.maxTasksPerProject !== null) {
      const existingInProject = tasks.filter((t) => t.project === project).length;
      if (existingInProject >= planLimits.maxTasksPerProject) {
        setErrorMsg(`Task limit reached: maximum ${planLimits.maxTasksPerProject} tasks per project. Choose Independent Task or upgrade to Pro ($20/mo).`);
        return;
      }
    }

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addTask({
      name: name.trim(),
      description: description.trim(),
      project: project === 'standalone' ? undefined : project,
      assignee,
      priority,
      status,
      deadline,
      tags: parsedTags,
      estimatedHours,
    });

    setName('');
    setDescription('');
    setProject('');
    setAssignee('');
    setStatus('todo');
    setPriority('medium');
    setTags('');
    setErrorMsg('');
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="task-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: '560px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
              Assign New Task
            </span>
            <Badge variant="secondary">
              {activeWorkspace?.name || 'Current Workspace'}
            </Badge>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close modal">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div
                style={{
                  background: 'var(--c-error-bg, #FEF2F2)',
                  border: '1px solid var(--c-error, #FCA5A5)',
                  color: 'var(--c-error-text, #DC2626)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={15} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Task Name */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                Task Title <span style={{ color: 'var(--c-error, #DC2626)' }}>*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Implement authentication middleware"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                required
                autoFocus
              />
            </div>

            {/* Grid 1: Assignee and Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Assignee */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Assignee (Person Responsible) <span style={{ color: 'var(--c-error, #DC2626)' }}>*</span>
                </label>
                <select
                  className="input select"
                  value={assignee}
                  onChange={(e) => {
                    setAssignee(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                >
                  <option value="">-- Select Assignee * --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.role ? `(${emp.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Deadline / Due Date <span style={{ color: 'var(--c-error, #DC2626)' }}>*</span>
                </label>
                <input
                  className="input"
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                />
              </div>
            </div>

            {/* Grid 2: Project and Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Project */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Project <span style={{ color: 'var(--c-error, #DC2626)' }}>*</span>
                </label>
                <select
                  className="input select"
                  value={project}
                  onChange={(e) => {
                    setProject(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                >
                  <option value="">-- Select Project or Standalone * --</option>
                  <option value="standalone">Independent Task (No Project)</option>
                  {projects.length > 0 && (
                    <optgroup label="Workspace Projects">
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Choose a project or mark as independent standalone.
                </span>
              </div>

              {/* Status */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Initial Status <span style={{ color: 'var(--c-error, #DC2626)' }}>*</span>
                </label>
                <select
                  className="input select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  required
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Grid 3: Priority and Effort */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Priority */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Priority
                </label>
                <select
                  className="input select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>

              {/* Effort estimate */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Effort Estimate
                </label>
                <select
                  className="input select"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                >
                  {[1, 2, 4, 8, 16, 24].map((hours) => (
                    <option key={hours} value={hours}>
                      {hours} hour{hours > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                Description & Notes
              </label>
              <textarea
                className="input textarea"
                placeholder="Add necessary details, context, and acceptance criteria..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                Tags <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(comma separated)</span>
              </label>
              <input
                className="input"
                placeholder="e.g. backend, security, api"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--surface-secondary)',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" style={{ fontWeight: 700 }}>
              Assign Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
