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
    <div className="page active" id="page-home" style={{ maxWidth: '1080px', margin: '0 auto' }}>
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
              {getGreeting()}, {user.name.split(' ')[0]}
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
              {activeWorkspace.shortName || 'Workspace'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {activeWorkspace.tagline || 'Workspace overview and operational focus.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => openModal('meeting-modal')}
            style={{ fontWeight: 600 }}
          >
            + Schedule Sync
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('task-modal')}
            style={{ fontWeight: 700 }}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Ordis Action Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: 'var(--c-white)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>
              Ordis Copilot
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(15, 76, 255, 0.08)',
                color: '#0f4cff',
                border: '1px solid rgba(15, 76, 255, 0.2)',
                textTransform: 'uppercase',
              }}
            >
              Action Console
            </span>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentPage('ordis')}
            style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 6px' }}
          >
            Open Full Console →
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            className="input"
            style={{
              flex: 1,
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              height: '36px',
            }}
            placeholder="Ask Ordis: e.g. 'Add a team member', 'Mark auth task completed', 'Schedule meeting'..."
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
            className="btn btn-primary btn-sm"
            onClick={() => handleSendPrompt()}
            style={{
              padding: '0 16px',
              fontWeight: 700,
              height: '36px',
            }}
          >
            Execute →
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>
            Quick Prompts:
          </span>
          {[
            'Workspace status report',
            'Show sprint bottlenecks',
            'Add team member',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendPrompt(prompt)}
              style={{
                cursor: 'pointer',
                background: 'var(--c-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                color: 'var(--text-secondary)',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
          onClick={() => setCurrentPage('tasks')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Active Tasks
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {inProgressTasks}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
            {completedTasks} completed
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
          onClick={() => setCurrentPage('tasks')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Overdue Tasks
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '4px 0',
              color: overdueTasks.length > 0 ? '#dc2626' : '#0A0A0A',
              letterSpacing: '-0.02em',
            }}
          >
            {overdueTasks.length}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: overdueTasks.length > 0 ? '#dc2626' : 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            {overdueTasks.length > 0 ? 'Requires attention' : 'All deadlines on track'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
          onClick={() => setCurrentPage('projects')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Active Projects
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '12px', color: '#0f4cff', fontWeight: 600 }}>
            {projects.length > 0
              ? `${Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)}% avg progress`
              : 'No active projects'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 18px',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
          onClick={() => setCurrentPage('team')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Team Roster
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {employees.length > 0 ? employees.length : 1}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
            {employees.length > 0 ? `${employees.filter((e) => e.status === 'online').length} online now` : 'Workspace active'}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Tasks Section */}
        <div
          className="card"
          style={{
            padding: '18px 20px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0A0A0A' }}>Sprint Tasks</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('active')}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
              >
                Active ({inProgressTasks})
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'overdue' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('overdue')}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
              >
                Overdue ({overdueTasks.length})
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('completed')}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
              >
                Done ({completedTasks})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
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
                      gap: '12px',
                      padding: '10px 14px',
                      background: 'var(--c-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
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
                          fontSize: '13px',
                          fontWeight: 700,
                          textDecoration: isDone ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#0A0A0A',
                        }}
                      >
                        {task.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {proj ? proj.name : 'General'} · {emp ? emp.name : 'Unassigned'} · Due {formatDate(task.deadline)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--c-surface)',
                        color: task.priority === 'urgent' || task.priority === 'high' ? '#dc2626' : 'var(--text-secondary)',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentPage('tasks')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              Open All Tasks →
            </button>
          </div>
        </div>

        {/* Right Column: Upcoming Meetings & Live Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upcoming Meetings */}
          <div
            className="card"
            style={{
              padding: '18px 20px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'var(--c-white)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0A0A0A' }}>Upcoming Syncs</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCurrentPage('meetings')}
                style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 6px' }}
              >
                All Syncs →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingMeetings.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No upcoming meetings scheduled today.
                </div>
              ) : (
                upcomingMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--c-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{m.name || m.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {m.date} at {m.time} ({m.duration} min) · {m.platform === 'google_meet' ? 'Google Meet' : m.platform}
                      </div>
                    </div>
                    {m.meetingUrl ? (
                      <a
                        href={m.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 10px', fontWeight: 600 }}
                      >
                        Join
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div
            className="card"
            style={{
              padding: '18px 20px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'var(--c-white)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0A0A0A', marginBottom: '14px' }}>
              Workspace Activity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activity.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  No recent activity recorded.
                </div>
              ) : (
                activity.slice(0, 4).map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: act.dot || '#0f4cff', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1A1A1A', fontWeight: 500 }}>
                      {act.text}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {act.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
