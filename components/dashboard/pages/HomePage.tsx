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
    ordisPlan,
    toggleOrdisPlan,
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
      <div className="home-greeting" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                className="badge badge-brand"
                style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}
              >
                {activeWorkspace.shortName.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                {activeWorkspace.tagline || 'Unified Operations Platform'}
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', color: '#0A0A0A' }}>
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => openModal('meeting-modal')}
              style={{ border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 0 #0A0A0A', fontWeight: 800 }}
            >
              + Schedule Sync
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => openModal('task-modal')}
              style={{
                background: '#FF5500',
                border: '2px solid #0A0A0A',
                boxShadow: '2px 2px 0 0 #0A0A0A',
                color: '#FFFFFF',
                fontWeight: 800,
              }}
            >
              + New Task
            </button>
          </div>
        </div>
      </div>

      {/* Ordis Hero Operational Bar (Clean, Neo-brutalist, Zero Fuss) */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          background: '#FFFFFF',
          border: '2px solid #0A0A0A',
          borderRadius: '12px',
          boxShadow: '4px 4px 0 0 #0A0A0A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '-0.02em', color: '#0A0A0A' }}>
              Ordis Workspace Copilot
            </span>
            <span
              className="badge"
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '9999px',
                border: '1.5px solid #0A0A0A',
                background: ordisPlan === 'paid' ? '#FF5500' : '#FAF6EE',
                color: ordisPlan === 'paid' ? '#FFFFFF' : '#0A0A0A',
              }}
            >
              {ordisPlan === 'paid' ? 'PRO • AUTONOMOUS ACTIONS' : 'FREE • TEXT REPORTS & CHAT (CHATGPT STYLE)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={toggleOrdisPlan}
              title="Toggle between Free (text reports) and Pro (autonomous execution)"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                border: '1.5px solid #0A0A0A',
                background: ordisPlan === 'paid' ? '#0A0A0A' : '#FFFFFF',
                color: ordisPlan === 'paid' ? '#FFFFFF' : '#0A0A0A',
                boxShadow: '2px 2px 0 0 #0A0A0A',
                cursor: 'pointer',
              }}
            >
              {ordisPlan === 'paid' ? 'Mode: Pro (Click for Free)' : 'Mode: Free (Click for Pro)'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentPage('ordis')}
              style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0A' }}
            >
              Full Chat Console →
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input
            className="input"
            style={{
              flex: 1,
              border: '2px solid #0A0A0A',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#FAF8F5',
            }}
            placeholder={
              ordisPlan === 'paid'
                ? "Ask Ordis: e.g. 'Add a team member and give him xyz task', 'Mark auth task completed'..."
                : "Ask Ordis: e.g. 'Give me a workspace status report', 'What is our current sprint status?'..."
            }
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
            style={{
              padding: '0 20px',
              background: '#FF5500',
              color: '#FFFFFF',
              border: '2px solid #0A0A0A',
              fontWeight: 800,
              boxShadow: '2px 2px 0 0 #0A0A0A',
            }}
          >
            {ordisPlan === 'paid' ? 'Execute Action →' : 'Ask Ordis →'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#666', letterSpacing: '0.05em' }}>
            QUICK PROMPTS:
          </span>
          {[
            'Give me a workspace status report',
            'What is my team working on?',
            'Show sprint bottlenecks & overdue items',
            ordisPlan === 'paid'
              ? 'Add a team member and give him xyz task'
              : 'How should I prioritize our sprint roadmap?',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="tag"
              onClick={() => handleSendPrompt(prompt)}
              style={{
                cursor: 'pointer',
                background: '#FFFFFF',
                border: '1.5px solid #0A0A0A',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 12px',
                boxShadow: '1.5px 1.5px 0 0 #0A0A0A',
                color: '#0A0A0A',
                transition: 'all 0.1s ease',
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
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            border: '2px solid #0A0A0A',
            borderRadius: '12px',
            boxShadow: '4px 4px 0 0 #0A0A0A',
            background: '#FFFFFF',
          }}
          onClick={() => setCurrentPage('tasks')}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            ACTIVE TASKS
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, margin: '6px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {inProgressTasks}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
            {completedTasks} completed
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            border: '2px solid #0A0A0A',
            borderRadius: '12px',
            boxShadow: '4px 4px 0 0 #0A0A0A',
            background: '#FFFFFF',
          }}
          onClick={() => setCurrentPage('tasks')}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            OVERDUE ITEMS
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 900,
              margin: '6px 0',
              color: overdueTasks.length > 0 ? '#dc2626' : '#0A0A0A',
              letterSpacing: '-0.02em',
            }}
          >
            {overdueTasks.length}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: overdueTasks.length > 0 ? '#dc2626' : 'var(--text-tertiary)',
              fontWeight: 700,
            }}
          >
            {overdueTasks.length > 0 ? 'Requires attention' : 'All deadlines on track'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            border: '2px solid #0A0A0A',
            borderRadius: '12px',
            boxShadow: '4px 4px 0 0 #0A0A0A',
            background: '#FFFFFF',
          }}
          onClick={() => setCurrentPage('projects')}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            PROJECTS IN FLIGHT
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, margin: '6px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '12px', color: '#FF5500', fontWeight: 700 }}>
            {projects.length > 0
              ? `${Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)}% average progress`
              : 'No active projects'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            border: '2px solid #0A0A0A',
            borderRadius: '12px',
            boxShadow: '4px 4px 0 0 #0A0A0A',
            background: '#FFFFFF',
          }}
          onClick={() => setCurrentPage('team')}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            TEAM PRESENCE
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, margin: '6px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {employees.length > 0 ? `${employees.filter((e) => e.status === 'online').length} / ${employees.length}` : '1 / 1'}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
            {employees.length > 1 ? 'Team active & ready' : 'Workspace active'}
          </div>
        </div>
      </div>

      {/* Main Split: Sprint Tasks & Upcoming Meetings / Live Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Tasks Section */}
        <div
          className="card"
          style={{
            padding: '20px',
            border: '2px solid #0A0A0A',
            borderRadius: '12px',
            boxShadow: '4px 4px 0 0 #0A0A0A',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '-0.02em' }}>Sprint Tasks</div>
            <div className="tabs tabs-pill" style={{ margin: 0, gap: '4px' }}>
              <button
                type="button"
                className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
                style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '9999px' }}
              >
                Active ({inProgressTasks})
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'overdue' ? 'active' : ''}`}
                onClick={() => setActiveTab('overdue')}
                style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '9999px' }}
              >
                Overdue ({overdueTasks.length})
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
                style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '9999px' }}
              >
                Done ({completedTasks})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
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
                      background: '#FAF8F5',
                      border: '1.5px solid #0A0A0A',
                      borderRadius: '8px',
                      opacity: isDone ? 0.6 : 1,
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleTaskComplete(task.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#FF5500' }}
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
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>
                        {proj ? proj.name : 'General'} · {emp ? emp.name : 'Unassigned'} · Due {formatDate(task.deadline)}
                      </div>
                    </div>
                    <span
                      className={`badge badge-${task.priority === 'urgent' || task.priority === 'high' ? 'error' : 'neutral'}`}
                      style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #0A0A0A',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentPage('tasks')}
              style={{ fontSize: '12px', fontWeight: 800, color: '#0A0A0A' }}
            >
              Open All Tasks in Kanban Board →
            </button>
          </div>
        </div>

        {/* Right Column: Upcoming Meetings & Live Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Upcoming Meetings */}
          <div
            className="card"
            style={{
              padding: '20px',
              border: '2px solid #0A0A0A',
              borderRadius: '12px',
              boxShadow: '4px 4px 0 0 #0A0A0A',
              background: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '-0.02em' }}>Upcoming Syncs</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCurrentPage('meetings')}
                style={{ fontSize: '12px', fontWeight: 800, color: '#0A0A0A' }}
              >
                All Syncs →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingMeetings.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  No upcoming meetings scheduled today.
                </div>
              ) : (
                upcomingMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      background: '#FAF8F5',
                      border: '1.5px solid #0A0A0A',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#0A0A0A' }}>{m.name || m.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>
                        {m.date} at {m.time} ({m.duration} min) · {m.platform}
                      </div>
                    </div>
                    <a
                      href={m.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 10px', border: '1.5px solid #0A0A0A', fontWeight: 800 }}
                    >
                      Join
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div
            className="card"
            style={{
              padding: '20px',
              border: '2px solid #0A0A0A',
              borderRadius: '12px',
              boxShadow: '4px 4px 0 0 #0A0A0A',
              background: '#FFFFFF',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '-0.02em', marginBottom: '14px' }}>
              Workspace Live Activity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activity.slice(0, 4).map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.dot || '#FF5500', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, color: '#1A1A1A' }}>
                    {act.text}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
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
