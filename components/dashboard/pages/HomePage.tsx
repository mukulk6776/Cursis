'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate, isOverdue, getGreeting } from '@/lib/dashboard/data';

export default function HomePage() {
  const {
    user,
    tasks,
    projects,
    meetings,
    employees,
    activity,
    activeWorkspace,
    setCurrentPage,
    openModal,
    toggleTaskComplete,
    getProject,
    getEmployee,
    sendOrdisMessage,
  } = useDashboard();

  const [aiInput, setAiInput] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'completed'>('active');

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status !== 'completed').length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.deadline) && t.status !== 'completed');
  const upcomingMeetings = meetings.filter((m) => m.status !== 'completed');

  const handleSendPrompt = (promptText?: string) => {
    const text = (promptText || aiInput).trim();
    if (!text) return;
    sendOrdisMessage(text);
    setCurrentPage('ordis');
    setAiInput('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'active') return t.status !== 'completed';
    if (activeTab === 'overdue') return isOverdue(t.deadline) && t.status !== 'completed';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="page active" id="page-home">
      {/* Header */}
      <div className="home-greeting" style={{ marginBottom: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
              <span className="badge badge-brand" style={{ fontSize: '10px' }}>
                {activeWorkspace.shortName.toUpperCase()}
              </span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                {activeWorkspace.tagline || 'Intelligent Workspace'}
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', margin: 0 }}>
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal('meeting-modal')}>
              + Schedule Sync
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal('task-modal')}>
              + New Task
            </button>
          </div>
        </div>
      </div>

      {/* Ordis Hero Operational Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-4)',
          marginBottom: 'var(--sp-5)',
          background: 'var(--c-white)',
          borderLeft: '4px solid var(--c-brand-lime)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
              Ordis Operational Copilot
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '9px' }}>
              NATURAL LANGUAGE ENGINE
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentPage('ordis')}
            style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-brand)' }}
          >
            Open Full Copilot Console →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Ask Ordis: e.g. 'Create task for Mukul', 'What is my team working on?', 'Schedule team sync'..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSendPrompt()}
            style={{ padding: '0 var(--sp-4)' }}
          >
            Execute →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)' }}>QUICK COMMANDS:</span>
          {[
            'Create task for Mukul',
            'What is my team working on?',
            'Show upcoming deadlines',
            'Schedule a meeting',
            'Summarize project progress',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="tag"
              onClick={() => handleSendPrompt(prompt)}
              style={{
                cursor: 'pointer',
                background: 'var(--c-surface)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                padding: '3px 8px',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-5)',
        }}
      >
        <div className="card" style={{ padding: 'var(--sp-4)', cursor: 'pointer' }} onClick={() => setCurrentPage('tasks')}>
          <div style={{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-wide)' }}>
            ACTIVE TASKS
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', margin: 'var(--sp-1) 0' }}>
            {inProgressTasks}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-success)', fontWeight: 'var(--fw-medium)' }}>
            {completedTasks} completed
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-4)', cursor: 'pointer' }} onClick={() => setCurrentPage('tasks')}>
          <div style={{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-wide)' }}>
            OVERDUE ITEMS
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', margin: 'var(--sp-1) 0', color: overdueTasks.length > 0 ? 'var(--c-error)' : 'inherit' }}>
            {overdueTasks.length}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: overdueTasks.length > 0 ? 'var(--c-error)' : 'var(--text-tertiary)' }}>
            {overdueTasks.length > 0 ? 'Requires attention' : 'All deadlines on track'}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-4)', cursor: 'pointer' }} onClick={() => setCurrentPage('projects')}>
          <div style={{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-wide)' }}>
            PROJECTS IN FLIGHT
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', margin: 'var(--sp-1) 0' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-brand)', fontWeight: 'var(--fw-medium)' }}>
            Average 82% sprint velocity
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-4)', cursor: 'pointer' }} onClick={() => setCurrentPage('team')}>
          <div style={{ fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-wide)' }}>
            TEAM PRESENCE
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', margin: 'var(--sp-1) 0' }}>
            {employees.filter((e) => e.status === 'online').length} / {employees.length}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-success)', fontWeight: 'var(--fw-medium)' }}>
            Team active &amp; ready
          </div>
        </div>
      </div>

      {/* Main Split: Sprint Tasks & Upcoming Meetings / Live Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-5)' }}>
        {/* Tasks Section */}
        <div className="card" style={{ padding: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
            <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-base)' }}>Sprint Tasks</div>
            <div className="tabs tabs-pill" style={{ margin: 0 }}>
              <button
                type="button"
                className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Active ({inProgressTasks})
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'overdue' ? 'active' : ''}`}
                onClick={() => setActiveTab('overdue')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Overdue ({overdueTasks.length})
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Done ({completedTasks})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: 'var(--sp-5)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)' }}>
                No tasks in this view.
              </div>
            ) : (
              filteredTasks.slice(0, 6).map((task) => {
                const proj = getProject(task.project);
                const emp = getEmployee(task.assignee);
                const isDone = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-3)',
                      padding: 'var(--sp-2) var(--sp-3)',
                      background: 'var(--c-surface)',
                      border: '1px solid var(--border-color)',
                      opacity: isDone ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleTaskComplete(task.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 'var(--fw-bold)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {proj ? proj.name : 'General'} · {emp ? emp.name : 'Unassigned'} · Due {formatDate(task.deadline)}
                      </div>
                    </div>
                    <span
                      className={`badge badge-${task.priority === 'urgent' || task.priority === 'high' ? 'error' : 'neutral'}`}
                      style={{ fontSize: '9px', textTransform: 'capitalize' }}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 'var(--sp-3)', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentPage('tasks')}
              style={{ fontSize: 'var(--fs-xs)' }}
            >
              View All Tasks in Board / List Mode →
            </button>
          </div>
        </div>

        {/* Right Column: Upcoming Meetings & Live Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* Upcoming Meetings */}
          <div className="card" style={{ padding: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
              <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-base)' }}>Upcoming Meetings</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCurrentPage('meetings')}
                style={{ fontSize: 'var(--fs-xs)' }}
              >
                All Syncs →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {upcomingMeetings.length === 0 ? (
                <div style={{ padding: 'var(--sp-3)', color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)' }}>
                  No upcoming meetings scheduled.
                </div>
              ) : (
                upcomingMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: 'var(--sp-2) var(--sp-3)',
                      background: 'var(--c-surface)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>{m.name || m.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {m.date} at {m.time} ({m.duration} min) · {m.platform}
                      </div>
                    </div>
                    <a
                      href={m.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      Join
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card" style={{ padding: 'var(--sp-4)' }}>
            <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-base)', marginBottom: 'var(--sp-3)' }}>
              Workspace Live Activity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {activity.slice(0, 4).map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: act.dot || 'var(--c-brand)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.text}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {act.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
