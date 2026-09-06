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
    <div className="page active" id="page-analytics" style={{ display: 'block' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <h1 className="page-title">Analytics &amp; Reporting Engine</h1>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div
        className="stats-grid"
        id="analytics-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-5)',
        }}
      >
        <div className="stat-card">
          <div className="stat-card-value">
            {tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%
          </div>
          <div className="stat-card-label">Sprint Velocity / Adherence</div>
          <div className="stat-card-meta">
            <span style={{ color: 'var(--c-success)', fontWeight: 'var(--fw-bold)' }}>
              {completed} tasks delivered
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-value" style={{ color: overdue > 0 ? 'var(--c-error)' : 'inherit' }}>
            {overdue}
          </div>
          <div className="stat-card-label">Deadline Slippage</div>
          <div className="stat-card-meta">
            <span style={{ color: overdue > 0 ? 'var(--c-error)' : 'var(--c-success)', fontWeight: 'var(--fw-bold)' }}>
              {overdue > 0 ? 'Action required' : 'Zero overdue items'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-value">{avgProgress}%</div>
          <div className="stat-card-label">Average Project Progress</div>
          <div className="stat-card-meta">
            <span>{projects.filter((p) => p.status === 'In Progress').length} projects active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--c-brand)' }}>
            ${(pipelineValue / 1000).toFixed(0)}k
          </div>
          <div className="stat-card-label">Client Pipeline Volume</div>
          <div className="stat-card-meta">
            <span>{deals.length} active opportunities</span>
          </div>
        </div>
      </div>

      {/* Charts & Reports Grid */}
      <div
        id="analytics-charts"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--sp-4)',
        }}
      >
        {/* AI Executive Brief Card */}
        <div
          className="card"
          style={{
            gridColumn: '1 / -1',
            padding: 'var(--sp-4)',
            background: 'var(--c-surface)',
            border: 'var(--border-width) solid var(--c-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--sp-4)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '2px' }}>
              <span className="badge badge-brand" style={{ fontSize: '9px' }}>
                ORDIS EXECUTIVE REPORT
              </span>
              <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
                Weekly Performance Synthesis
              </span>
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-normal)' }}>
              {projects.length > 0
                ? `${tasks.length} sprint items tracked across ${projects.length} active initiative${projects.length > 1 ? 's' : ''}. ${completed} delivered (${tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}% velocity). Top initiative: "${projects[0].name}" is at ${projects[0].progress}% completion.`
                : 'Workspace telemetry is live. Create projects and sprint deliverables to track live velocity, completion ratios, and team workload in real time.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Exporting PDF report *')}>
              Export PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Exporting CSV telemetry data *')}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Chart 1: Team Workload */}
        <div className="chart-card card" style={{ padding: 'var(--sp-4)' }}>
          <div
            className="chart-card-header"
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
          >
            <span className="chart-title" style={{ fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-sm)' }}>
              Team Workload Distribution
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
              Active tasks per member
            </span>
          </div>
          <div
            className="chart-container"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingBottom: '24px',
              minHeight: '180px',
              position: 'relative',
            }}
          >
            {workload.map((w, idx) => (
              <div
                key={idx}
                className="chart-bar"
                style={{
                  height: `${Math.max((w.tasks / maxTasks) * 100, 15)}%`,
                  background: w.color,
                  width: '28px',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    fontSize: '10px',
                    fontWeight: 'var(--fw-bold)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {w.tasks}
                </div>
                <div
                  className="chart-bar-label"
                  style={{
                    position: 'absolute',
                    bottom: '-22px',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {w.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Project Milestones & Progress */}
        <div className="chart-card card" style={{ padding: 'var(--sp-4)' }}>
          <div
            className="chart-card-header"
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
          >
            <span className="chart-title" style={{ fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-sm)' }}>
              Project Milestones &amp; Delivery
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
              % Completion
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', paddingTop: 'var(--sp-2)' }}>
            {projects.map((p) => (
              <div key={p.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--fs-xs)',
                    marginBottom: '3px',
                  }}
                >
                  <span style={{ fontWeight: 'var(--fw-bold)' }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{p.progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--c-gray-200)' }}>
                  <div style={{ height: '100%', background: p.color, width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Builder Panel */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--sp-5)' }}>
          <h3 style={{ marginBottom: 'var(--sp-2)' }}>Custom Metric &amp; Telemetry Builder</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)' }}>
            Build custom analytical views across departments, task categories, and client accounts.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--sp-3)',
            }}
          >
            <div className="input-group">
              <label className="input-label">Metric Group</label>
              <select
                className="input select"
                value={metricGroup}
                onChange={(e) => setMetricGroup(e.target.value)}
              >
                <option>Task Completion Rate</option>
                <option>Meeting Hours &amp; Frequency</option>
                <option>CRM Deal Progression</option>
                <option>Paperwork Extraction Accuracy</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Time Horizon</label>
              <select
                className="input select"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
              >
                <option>Last 30 Days (Sprint Cycle)</option>
                <option>Last 7 Days</option>
                <option>Quarter to Date (Q3)</option>
                <option>Year to Date (2026)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Department Scope</label>
              <select
                className="input select"
                value={deptScope}
                onChange={(e) => setDeptScope(e.target.value)}
              >
                <option>All Organization</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Operations &amp; Legal</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => showToast('Report configuration saved as preset *')}
            >
              Save Preset
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => showToast(`Generated custom telemetry report for ${metricGroup} *`)}
            >
              Generate Custom Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
