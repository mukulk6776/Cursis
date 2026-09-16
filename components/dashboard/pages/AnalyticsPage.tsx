'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function AnalyticsPage() {
  const { tasks, projects, employees, customCrm, showToast } = useDashboard();
  const [metricGroup, setMetricGroup] = useState('Task Completion Rate');
  const [timeHorizon, setTimeHorizon] = useState('Last 30 Days (Sprint Cycle)');
  const [deptScope, setDeptScope] = useState('All Organization');

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const overdue = tasks.filter(
    (t) => t.status !== 'completed' && t.deadline && new Date(t.deadline).getTime() < Date.now()
  ).length;
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length)
      : 0;

  const deals = customCrm.deals || [];
  const pipelineValue = deals.reduce(
    (sum: number, d: any) => sum + parseInt(String(d?.value || '0').replace(/[^0-9]/g, '') || '0', 10),
    0
  );

  const workload = employees.slice(0, 8).map((emp) => ({
    name: emp.name.split(' ')[0],
    tasks: tasks.filter((t) => t.assignee === emp.id && t.status !== 'completed').length,
    color: emp.color,
  }));
  const maxTasks = Math.max(...workload.map((w) => w.tasks), 1);

  return (
    <div className="page active" id="page-analytics" style={{ maxWidth: '1080px', margin: '0 auto' }}>
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
              Analytics
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
              Live Telemetry
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Sprint velocity, workload capacity, and project progress metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => showToast('Exporting PDF report...')}
            style={{ fontWeight: 600 }}
          >
            Export PDF
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => showToast('Exporting CSV telemetry data...')}
            style={{ fontWeight: 600 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
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
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Completion Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
            {completed} tasks completed
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 18px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Overdue Tasks
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '4px 0',
              color: overdue > 0 ? '#dc2626' : '#0A0A0A',
              letterSpacing: '-0.02em',
            }}
          >
            {overdue}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: overdue > 0 ? '#dc2626' : 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            {overdue > 0 ? 'Requires attention' : 'Zero overdue items'}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 18px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Project Progress
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {avgProgress}%
          </div>
          <div style={{ fontSize: '12px', color: '#0f4cff', fontWeight: 600 }}>
            {projects.filter((p) => p.status === 'In Progress').length} active projects
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 18px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--c-white)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Pipeline Volume
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            ${(pipelineValue / 1000).toFixed(0)}k
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {deals.length} active opportunities
          </div>
        </div>
      </div>

      {/* Charts & Reports Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Executive Brief Card */}
        <div
          className="card"
          style={{
            gridColumn: '1 / -1',
            padding: '16px 20px',
            background: 'var(--c-white)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                Performance Synthesis
              </span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>
                Operational Summary
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {projects.length > 0
                ? `${tasks.length} sprint items tracked across ${projects.length} active project${projects.length > 1 ? 's' : ''}. ${completed} completed (${tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}% delivery rate).`
                : 'Workspace telemetry is active. Add tasks and projects to track real-time delivery and team workload.'}
            </div>
          </div>
        </div>

        {/* Chart 1: Team Workload */}
        <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>
              Team Task Allocation
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--c-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Active tasks
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingBottom: '24px',
              minHeight: '160px',
              position: 'relative',
              gap: '8px',
            }}
          >
            {workload.map((w, idx) => (
              <div
                key={idx}
                style={{
                  height: `${Math.max((w.tasks / maxTasks) * 100, 15)}%`,
                  background: w.color || '#0f4cff',
                  borderRadius: '4px 4px 0 0',
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0A0A0A',
                  }}
                >
                  {w.tasks}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {w.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Project Delivery */}
        <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>
              Project Completion
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--c-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              % Progress
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '16px 0', textAlign: 'center' }}>No projects currently active.</div>
            ) : (
              projects.map((p) => (
                <div key={p.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{p.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--c-surface)', border: '1px solid var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: p.color || '#0f4cff', width: `${p.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Report Builder Panel */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: '18px 20px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0A0A0A' }}>Custom Report Builder</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Configure analytical views across departments, categories, and timelines.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Metric Focus</label>
              <select
                className="input select"
                value={metricGroup}
                onChange={(e) => setMetricGroup(e.target.value)}
                style={{ width: '100%', height: '32px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option>Task Completion Rate</option>
                <option>Meeting Frequency &amp; Hours</option>
                <option>Client Pipeline Volume</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Time Horizon</label>
              <select
                className="input select"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                style={{ width: '100%', height: '32px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option>Last 30 Days (Sprint Cycle)</option>
                <option>Last 7 Days</option>
                <option>Quarter to Date</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Department Scope</label>
              <select
                className="input select"
                value={deptScope}
                onChange={(e) => setDeptScope(e.target.value)}
                style={{ width: '100%', height: '32px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option>All Organization</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Operations &amp; Legal</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => showToast('Report preset saved')}
            >
              Save Preset
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => showToast(`Generated report for ${metricGroup}`)}
              style={{ fontWeight: 700 }}
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
