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
    switchWorkspace,
    setCurrentPage,
    openModal,
    openProfilePanel,
    toggleTaskComplete,
    getProject,
    getEmployee,
  } = useDashboard();

  const [dashboardMode, setDashboardMode] = useState<'personal' | 'team'>('personal');
  const [customizingWidgets, setCustomizingWidgets] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState({
    agencyBanner: true,
    quickActions: true,
    stats: true,
    ordisInsights: true,
    myWork: true,
    activity: true,
  });

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const [aiActionItems, setAiActionItems] = useState<Array<{ title: string; meta: string }>>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.deadline) && t.status !== 'completed');

  // Filter My Work based on tab & personal/team mode
  const filteredTasks = tasks.filter((t) => {
    if (dashboardMode === 'personal' && t.assignee !== user.id && !t.assignees?.includes(user.id)) {
      // In personal mode, show user tasks or first 5 if none
      if (tasks.some((task) => task.assignee === user.id)) {
        return false;
      }
    }
    if (activeTab === 'today') return t.status !== 'completed';
    if (activeTab === 'overdue') return isOverdue(t.deadline) && t.status !== 'completed';
    if (activeTab === 'upcoming') return !isOverdue(t.deadline) && t.status !== 'completed';
    return true;
  });

  const heavilyLoaded = employees.reduce((max, emp) => {
    const count = tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed').length;
    return count > max.count ? { emp, count } : max;
  }, { emp: employees[1] || employees[0], count: 0 });

  const handleSendAI = () => {
    const val = aiInput.trim();
    if (!val) return;
    setAiLoading(true);
    setAiResponseText(null);
    setAiActionItems([]);

    setTimeout(() => {
      setAiLoading(false);
      const lower = val.toLowerCase();
      if (lower.includes('create') && lower.includes('project')) {
        setAiResponseText("I'll set that up for you. Here's what I've prepared:");
        setAiActionItems([
          { title: 'Project: ' + val.replace(/create|project/gi, '').trim(), meta: 'Status: Planning · Target: 30 Days' },
          { title: 'Initial Milestone: Discovery & Specs', meta: 'Due in 7 days' },
        ]);
      } else if (lower.includes('task') || lower.includes('assign')) {
        setAiResponseText("Ready to create this task. Click below or review in Tasks:");
        setAiActionItems([
          { title: val, meta: 'Assignee: Auto-assigned · Priority: High' },
        ]);
      } else if (lower.includes('status') || lower.includes('summary')) {
        setAiResponseText(`Workspace health is optimal. You have ${inProgressTasks} tasks in flight, ${overdueTasks.length} overdue items requiring attention, and ${projects.length} active initiatives.`);
      } else {
        setAiResponseText(`ORDIS has parsed your instruction: "${val}". Memory context updated for ${activeWorkspace.name}.`);
      }
    }, 600);
  };

  const toggleWidget = (key: keyof typeof enabledWidgets) => {
    setEnabledWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="page active" id="page-home">
      {/* Home Greeting */}
      <div className="home-greeting" style={{ marginBottom: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
              <span className={`badge ${activeWorkspace.isCustomClient ? 'badge-brand' : 'badge-neutral'}`}>
                {activeWorkspace.badge.toUpperCase()}
              </span>
              <span style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                {activeWorkspace.name}
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-black)', margin: 0, letterSpacing: 'var(--ls-tight)' }}>
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Personal vs Team Toggle */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--c-surface)', border: 'var(--border-width) solid var(--border-color)', padding: '2px' }}>
              <button
                className={`btn ${dashboardMode === 'personal' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ fontSize: 'var(--fs-xs)', padding: '2px 8px' }}
                onClick={() => setDashboardMode('personal')}
              >
                My Focus
              </button>
              <button
                className={`btn ${dashboardMode === 'team' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ fontSize: 'var(--fs-xs)', padding: '2px 8px' }}
                onClick={() => setDashboardMode('team')}
              >
                Org Overview
              </button>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCustomizingWidgets((prev) => !prev)}
            >
              {customizingWidgets ? 'Done' : 'Customize Widgets'}
            </button>

            {!activeWorkspace.isCustomClient ? (
              <button className="btn btn-primary btn-sm" onClick={() => openModal('agency-modal')}>
                + Request Custom Client Solution
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => switchWorkspace('ws_public')}>
                &lt; Switch to Public Workspace
              </button>
            )}
          </div>
        </div>

        {/* Customize Widgets Panel */}
        {customizingWidgets && (
          <div className="card" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-3) var(--sp-4)', background: 'var(--c-surface)' }}>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
              TOGGLE HOME WIDGETS
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              {Object.keys(enabledWidgets).map((k) => {
                const key = k as keyof typeof enabledWidgets;
                const isEnabled = enabledWidgets[key];
                return (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleWidget(key)}
                    />
                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Agency Banner (for Public Workspace) */}
      {enabledWidgets.agencyBanner && !activeWorkspace.isCustomClient && (
        <div
          className="card"
          style={{
            padding: 'var(--sp-4) var(--sp-5)',
            marginBottom: 'var(--sp-5)',
            background: 'var(--c-white)',
            borderLeft: '6px solid var(--c-brand)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
              <span className="badge badge-brand">CURSIS AI SOLUTIONS AGENCY</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Bespoke Implementations</span>
            </div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--fs-md)', fontWeight: 'var(--fw-bold)' }}>
              Need bespoke operational agents, paperwork pipelines, or a custom CRM workspace?
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              We build isolated, production-grade custom client architectures tailored to your company.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('agency-modal')}>
            Request Custom Client Build →
          </button>
        </div>
      )}

      {/* Custom Client Workspace Banner (for Acme Global Client Workspace) */}
      {activeWorkspace.isCustomClient && activeWorkspace.clientDetails && (
        <div
          className="card"
          style={{
            padding: 'var(--sp-4) var(--sp-5)',
            marginBottom: 'var(--sp-5)',
            background: 'var(--c-white)',
            borderLeft: '6px solid var(--c-brand)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
            <div>
              <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-1)' }}>
                CLIENT IMPLEMENTATION ACTIVE
              </div>
              <h3 style={{ margin: '0 0 var(--sp-1) 0', fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)' }}>
                {activeWorkspace.name} · {activeWorkspace.clientDetails.industry}
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                Equipped with custom paperwork automation, dedicated agents, and external software webhooks.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage('workspace')}>
                View Client CRM Deals
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('documents')}>
                Paperwork Studio
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
            {activeWorkspace.clientDetails.customModules.map((m) => (
              <span key={m} className="tag" style={{ background: 'var(--c-surface)' }}>{m}</span>
            ))}
            {activeWorkspace.clientDetails.dedicatedAgents.map((a) => (
              <span key={a} className="tag" style={{ background: 'var(--c-accent-light)', borderColor: 'var(--border-color)' }}>🤖 {a}</span>
            ))}
          </div>
        </div>
      )}

      {/* AI Command Bar */}
      <div className="ai-command-wrapper" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="ai-command-bar">
          <textarea
            className="ai-command-input"
            id="ai-command-input"
            rows={1}
            placeholder="Ask ORDIS to create tasks, search documents, summarize meetings, or query agency solutions..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendAI();
              }
            }}
          />
          <div className="ai-command-actions">
            <div className="ai-command-tools">
              <button className="ai-tool-btn" onClick={() => openModal('task-modal')}>
                <span>+</span> Add Task
              </button>
              <button className="ai-tool-btn" onClick={() => openModal('document-modal')}>
                <span>📄</span> Attach Doc
              </button>
              <button className="ai-tool-btn" onClick={() => setCurrentPage('meetings')}>
                <span>📅</span> Meetings
              </button>
              <button className="ai-tool-btn" onClick={() => setCurrentPage('automations')}>
                <span>—</span> Automations
              </button>
              <button className="ai-tool-btn" onClick={() => setCurrentPage('ordis')}>
                <span>AI</span> ORDIS AI
              </button>
            </div>
            <button
              className="ai-send-btn"
              id="ai-send-btn"
              onClick={handleSendAI}
              disabled={aiLoading}
            >
              {aiLoading ? '...' : '→'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Response Area */}
      {(aiLoading || aiResponseText) && (
        <div className="ai-response" style={{ display: 'block', marginBottom: 'var(--sp-5)' }}>
          {aiLoading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
              ORDIS is analyzing your instruction across workspace data...
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--sp-2)' }}>
                {aiResponseText}
              </div>
              {aiActionItems.map((item, idx) => (
                <div key={idx} className="ai-action-item">
                  <div className="ai-action-icon">✓</div>
                  <div className="ai-action-text">
                    <div className="ai-action-title">{item.title}</div>
                    <div className="ai-action-meta">{item.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Row */}
      {enabledWidgets.quickActions && (
        <div className="quick-actions" style={{ marginBottom: 'var(--sp-5)' }}>
          <button className="quick-action-btn" onClick={() => openModal('task-modal')}>+ New Task</button>
          <button className="quick-action-btn" onClick={() => openModal('project-modal')}>+ New Project</button>
          <button className="quick-action-btn" onClick={() => openModal('document-modal')}>+ Upload Doc</button>
          <button className="quick-action-btn" onClick={() => openModal('meeting-modal')}>+ Schedule Meeting</button>
          <button className="quick-action-btn" onClick={() => openModal('invite-modal')}>+ Add Member</button>
          <button className="quick-action-btn" onClick={() => openModal('agency-modal')}>+ Request Agency Solution</button>
        </div>
      )}

      {/* Stats Grid */}
      {enabledWidgets.stats && (
        <div className="stats-grid anim-stagger" id="home-stats" style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="stat-card">
            <div className="stat-label">ACTIVE TASKS</div>
            <div className="stat-value">{tasks.length - completedTasks}</div>
            <div className="stat-change positive">{completedTasks} completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">OVERDUE ITEMS</div>
            <div className="stat-value" style={{ color: overdueTasks.length > 0 ? 'var(--c-error)' : 'inherit' }}>
              {overdueTasks.length}
            </div>
            <div className="stat-change negative">{overdueTasks.length > 0 ? 'Requires attention' : 'All clear'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ACTIVE PROJECTS</div>
            <div className="stat-value">{projects.length}</div>
            <div className="stat-change positive">
              {projects.length > 0 ? `${projects.length} active initiatives` : 'Ready to create'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ONLINE MEMBERS</div>
            <div className="stat-value">{employees.filter((e) => e.status === 'online').length}</div>
            <div className="stat-change positive">of {employees.length} total team</div>
          </div>
        </div>
      )}

      {/* ORDIS Insights */}
      {enabledWidgets.ordisInsights && (
        <div className="card" style={{ padding: 'var(--sp-4) var(--sp-5)', marginBottom: 'var(--sp-5)', background: 'var(--c-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: 'var(--border-radius-xs)', background: 'var(--c-near-black)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                AI
              </div>
              <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
                ORDIS Proactive Operational Insights
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('ordis')}>
              Open Full AI Console →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'white' }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: heavilyLoaded.count > 0 ? 'var(--c-warning)' : 'var(--c-brand)', marginBottom: '4px' }}>
                {heavilyLoaded.count > 0 ? 'WORKLOAD ALLOCATION NOTICE' : 'WORKLOAD HEALTHY'}
              </div>
              <p style={{ fontSize: 'var(--fs-xs)', margin: '0 0 var(--sp-2) 0', color: 'var(--text-secondary)' }}>
                {heavilyLoaded.count > 0 ? (
                  <><strong>{heavilyLoaded.emp?.name}</strong> has {heavilyLoaded.count} active tasks. Consider delegating non-critical items.</>
                ) : (
                  <>All team workloads are balanced. No operational bottlenecks detected.</>
                )}
              </p>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={() => setCurrentPage('tasks')}>
                Inspect Workload
              </button>
            </div>

            <div className="card" style={{ padding: 'var(--sp-3)', background: 'white' }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--c-brand)', marginBottom: '4px' }}>
                PAPERWORK OCR ENGINE
              </div>
              <p style={{ fontSize: 'var(--fs-xs)', margin: '0 0 var(--sp-2) 0', color: 'var(--text-secondary)' }}>
                Automated extraction pipeline ready for contracts, NDAs, invoices, and service agreements.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={() => setCurrentPage('documents')}>
                Open Paperwork Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: My Work & Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--sp-5)' }}>
        {/* My Work */}
        {enabledWidgets.myWork && (
          <div className="my-work">
            <div className="my-work-header">
              <span className="my-work-title">
                {dashboardMode === 'personal' ? 'My Focus' : 'Workspace Tasks'}
              </span>
              <div className="tabs tabs-pill" style={{ margin: 0 }}>
                <span
                  className={`tab ${activeTab === 'today' ? 'active' : ''}`}
                  onClick={() => setActiveTab('today')}
                >
                  Active ({tasks.filter((t) => t.status !== 'completed').length})
                </span>
                <span
                  className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                </span>
                <span
                  className={`tab ${activeTab === 'overdue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overdue')}
                >
                  Overdue ({overdueTasks.length})
                </span>
              </div>
            </div>

            <div className="my-work-body anim-stagger" id="my-work-body">
              {filteredTasks.length === 0 ? (
                <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                  No tasks matching the selected filter.
                </div>
              ) : (
                filteredTasks.slice(0, 7).map((t) => {
                  const proj = getProject(t.project);
                  const assigneeEmp = getEmployee(t.assignee);
                  const isDone = t.status === 'completed';
                  return (
                    <div
                      key={t.id}
                      className="task-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-3)',
                        padding: 'var(--sp-3) var(--sp-4)',
                        borderBottom: '1px solid var(--c-gray-200)',
                        background: 'var(--c-white)',
                        opacity: isDone ? 0.6 : 1,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTaskComplete(t.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: 'var(--c-brand)',
                          flexShrink: 0,
                          margin: 0,
                        }}
                      />
                      <div className="task-item-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          className="task-item-name"
                          style={{
                            fontSize: 'var(--fs-sm)',
                            fontWeight: 'var(--fw-bold)',
                            color: 'var(--text-primary)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.name}
                        </div>
                        <div className="task-item-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj && <span>{proj.name}</span>}
                          {assigneeEmp && <span>· {assigneeEmp.name}</span>}
                          <span>· Due {formatDate(t.deadline)}</span>
                        </div>
                      </div>
                      <span
                        className={`badge badge-${t.priority === 'urgent' || t.priority === 'high' ? 'error' : 'neutral'}`}
                        style={{ flexShrink: 0, fontSize: '9px', padding: '2px 6px' }}
                      >
                        {t.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {enabledWidgets.activity && (
          <div className="activity-feed anim-stagger" id="activity-feed">
            <div className="activity-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>Recent Activity</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>Real-time</span>
            </div>
            {activity.length === 0 ? (
              <div style={{ padding: 'var(--sp-6) var(--sp-4)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)' }}>
                No recent activity. Real-time actions across tasks and documents will appear here.
              </div>
            ) : (
              activity.slice(0, 6).map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-dot" style={{ background: act.dot }} />
                  <div className="activity-content">
                    <div
                      className="activity-text"
                      dangerouslySetInnerHTML={{ __html: act.text }}
                    />
                    <div className="activity-time">{act.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
