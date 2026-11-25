'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate, isOverdue, getGreeting } from '@/lib/dashboard/data';
import ActivationChecklist from '@/components/dashboard/ActivationChecklist';
import EmptyState from '@/components/dashboard/EmptyState';
import ActivePlanBadge from '@/components/dashboard/ActivePlanBadge';

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
    planLimits,
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
      <ActivationChecklist />
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {getGreeting()}, {user.name.split(' ')[0]}
              </h1>
              <ActivePlanBadge activePlan={user.activePlan} size="md" />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {activeWorkspace.tagline || 'Workspace overview and operational focus.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openModal('meeting-modal')}
          >
            <Calendar size={14} aria-hidden="true" />
            Schedule Sync
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openModal('task-modal')}
          >
            <Plus size={14} aria-hidden="true" />
            New Task
          </Button>
        </div>
      </div>

      {/* Ordis Action Bar */}
      <Card
        style={{
          padding: '18px 20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={15} color="#FF5500" aria-hidden="true" />
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              Ordis Copilot
            </span>
            <Badge style={{ fontSize: '10px', borderRadius: '6px', textTransform: 'uppercase' }}>
              Action Console
            </Badge>
          </div>

          {planLimits.hasOrdisAi ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('ordis')}
              style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 8px' }}
            >
              Open Full Console <ArrowRight size={13} aria-hidden="true" />
            </Button>
          ) : (
            <a
              href="/pay?plan=pro"
              className={buttonVariants({ size: 'sm' })}
              style={{ fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
            >
              Unlock on Pro ($20/mo) <ArrowRight size={13} aria-hidden="true" />
            </a>
          )}
        </div>

        {planLimits.hasOrdisAi ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Input
                style={{
                  flex: 1,
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
              <Button
                type="button"
                size="sm"
                onClick={() => handleSendPrompt()}
                style={{
                  padding: '0 16px',
                  fontWeight: 700,
                  height: '36px',
                }}
              >
                Execute <ArrowRight size={14} aria-hidden="true" />
              </Button>
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
          </>
        ) : (
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span>
              Ordis AI and My Day focus planner require the <strong>Pro Plan</strong>{user.activePlan ? ` (${user.activePlan.planName} active)` : ''}.
            </span>
            <a href="/pricing" style={{ fontSize: '12px', fontWeight: 700, color: '#FF5500', textDecoration: 'underline' }}>
              Compare Plans
            </a>
          </div>
        )}
      </Card>

      {/* Core Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <Card
          className="stat-card"
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentPage('tasks')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <span>Active Tasks</span>
            <CheckCircle2 size={14} aria-hidden="true" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {inProgressTasks}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--c-success)', fontWeight: 600 }}>
            {completedTasks} completed
          </div>
        </Card>

        <Card
          className="stat-card"
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentPage('tasks')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <span>Overdue Tasks</span>
            <AlertCircle size={14} color={overdueTasks.length > 0 ? '#dc2626' : 'currentColor'} aria-hidden="true" />
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '4px 0',
              color: overdueTasks.length > 0 ? '#dc2626' : 'var(--text-primary)',
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
        </Card>

        <Card
          className="stat-card"
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentPage('projects')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <span>Active Projects</span>
            <FolderKanban size={14} aria-hidden="true" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--c-brand-text)', fontWeight: 600 }}>
            {projects.length > 0
              ? `${Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)}% avg progress`
              : 'No active projects'}
          </div>
        </Card>

        <Card
          className="stat-card"
          style={{
            padding: '18px 20px',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentPage('team')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <span>Team Roster</span>
            <Users size={14} aria-hidden="true" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {employees.length > 0 ? employees.length : 1}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--c-success)', fontWeight: 600 }}>
            {employees.length > 0 ? `${employees.filter((e) => e.status === 'online').length} online now` : 'Workspace active'}
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Tasks Section */}
        <Card
          style={{
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Sprint Tasks</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                type="button"
                variant={activeTab === 'active' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('active')}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
              >
                Active ({inProgressTasks})
              </Button>
              <Button
                type="button"
                variant={activeTab === 'overdue' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('overdue')}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
              >
                Overdue ({overdueTasks.length})
              </Button>
              <Button
                type="button"
                variant={activeTab === 'completed' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('completed')}
                style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
              >
                Done ({completedTasks})
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.length === 0 ? (
              <EmptyState
                compact
                title="No tasks in this view"
                description={tasks.length === 0 ? "Get started by adding your team's first deliverable." : "All tasks in this view are completed or cleared."}
                actionLabel="+ Create Task"
                onAction={() => openModal('task-modal')}
              />
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
                      background: 'var(--surface-card)',
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
                          color: 'var(--text-primary)',
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('tasks')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              Open All Tasks <ArrowRight size={13} aria-hidden="true" />
            </Button>
          </div>
        </Card>

        {/* Right Column: Upcoming Meetings & Live Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upcoming Meetings */}
          <Card
            style={{
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Upcoming Syncs</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage('meetings')}
                style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 8px' }}
              >
                All Syncs <ArrowRight size={13} aria-hidden="true" />
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingMeetings.length === 0 ? (
                <EmptyState
                  compact
                  title="No upcoming syncs today"
                  description="Coordinate with team members by scheduling a video sync."
                  actionLabel="+ Schedule Sync"
                  onAction={() => openModal('meeting-modal')}
                />
              ) : (
                upcomingMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{m.name || m.title}</div>
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
          </Card>

          {/* Activity Feed */}
          <Card
            style={{
              padding: '18px 20px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '14px' }}>
              Workspace Activity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activity.length === 0 ? (
                <EmptyState
                  compact
                  title="No recent activity"
                  description="Actions, task completions, and meetings will show up in this audit log."
                />
              ) : (
                activity.slice(0, 4).map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: act.dot || '#FF5500', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {act.text}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {act.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
