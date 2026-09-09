'use client';

import React, { useState } from 'react';

export default function FeaturesSection() {
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  const ordisLogs = [
    { time: '10:42 AM', event: 'Sprint Risk Scan: Evaluated 38 deliverables. Zero deadlocks identified.' },
    { time: '11:15 AM', event: 'Capacity Optimization: Rebalanced Brand Design QA to Sarah T. (SLA +1.2d ahead).' },
    { time: '01:30 PM', event: 'Meeting Synthesis: Converted 30m Client Sync audio into 4 actionable tasks.' },
    { time: '03:10 PM', event: 'Milestone Verification: SOC-2 deployment audit passed deterministic checks.' },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="lp-section-header">
        <div className="lp-section-label">Enterprise Capabilities</div>
        <h2 className="lp-section-title">An Asymmetric Operating Architecture</h2>
        <p className="lp-section-subtitle">
          Engineered as one coherent system. No feature bloat, no third-party glue code, and zero context switching.
        </p>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="lp-bento-grid">
        {/* Bento Card 1: Autonomous Ordis Intelligence (Large Span 2) */}
        <div className="lp-bento-card lp-bento-span-2 lp-bento-featured">
          <div className="lp-bento-topbar">
            <span className="badge badge-brand">01 • CORE ENGINE</span>
            <span className="lp-bento-metric">Continuous Autonomous Orchestration</span>
          </div>

          <h3 className="lp-bento-title">Ordis Workspace Intelligence</h3>
          <p className="lp-bento-desc">
            Unlike static chatbots, Ordis operates directly upon your live workspace graph — proactively resolving delivery bottlenecks, synthesizing standups, and balancing workload across all teams.
          </p>

          {/* Mini Live Event Feed */}
          <div className="lp-bento-log-box">
            <div className="lp-bento-log-header">
              <span className="lp-status-live-dot" />
              <span>Real-Time Workspace Telemetry Stream</span>
            </div>
            <div className="lp-bento-log-list">
              {ordisLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`lp-bento-log-item ${activeLogIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveLogIndex(idx)}
                >
                  <span className="lp-log-time">{log.time}</span>
                  <span className="lp-log-text">{log.event}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-bento-tags">
            <span className="lp-bento-tag">Proactive Bottleneck Detection</span>
            <span className="lp-bento-tag">Natural Language Work Routing</span>
            <span className="lp-bento-tag">Deterministic Executive Synthesis</span>
          </div>
        </div>

        {/* Bento Card 2: Team Telemetry & Bandwidth (Span 1) */}
        <div className="lp-bento-card lp-bento-span-1">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">02 • COLLABORATION</span>
            <span className="lp-live-badge">4 Online</span>
          </div>

          <h3 className="lp-bento-title">Team Bandwidth &amp; Presence</h3>
          <p className="lp-bento-desc">
            Instantly see who is executing, track live availability, and prevent engineer burnout before deadlines arrive.
          </p>

          <div className="lp-bento-roster-preview">
            <div className="lp-roster-row">
              <div className="lp-roster-avatar" style={{ background: '#1A1612' }}>MK</div>
              <div className="lp-roster-info">
                <strong>Mukul Kumar</strong>
                <span>Lead Ops • 3 tasks</span>
              </div>
              <span className="lp-capacity-badge">65% Load</span>
            </div>

            <div className="lp-roster-row">
              <div className="lp-roster-avatar" style={{ background: '#2965ff' }}>ST</div>
              <div className="lp-roster-info">
                <strong>Sarah Taylor</strong>
                <span>Architect • 2 tasks</span>
              </div>
              <span className="lp-capacity-badge">50% Load</span>
            </div>

            <div className="lp-roster-row">
              <div className="lp-roster-avatar" style={{ background: '#10b981' }}>AR</div>
              <div className="lp-roster-info">
                <strong>Alex Rivera</strong>
                <span>Security • 1 task</span>
              </div>
              <span className="lp-capacity-badge">35% Load</span>
            </div>
          </div>

          <div className="lp-bento-tags">
            <span className="lp-bento-tag">Role-Based Access (RBAC)</span>
            <span className="lp-bento-tag">Zero-Standup Telemetry</span>
          </div>
        </div>

        {/* Bento Card 3: Sprint Velocity & SLA Dial (Span 1) */}
        <div className="lp-bento-card lp-bento-span-1">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">03 • EXECUTION</span>
            <span className="lp-sla-rate">99.4% SLA</span>
          </div>

          <h3 className="lp-bento-title">Deterministic Velocity</h3>
          <p className="lp-bento-desc">
            Interactive Kanban matrices, critical path milestone roadmaps, and automated SLA compliance tracking.
          </p>

          <div className="lp-bento-stat-card">
            <div className="lp-stat-number">1.8 <small>Days</small></div>
            <span className="lp-stat-label">Average Task Cycle Time</span>
            <div className="lp-stat-bar-track">
              <div className="lp-stat-bar-fill" style={{ width: '84%' }} />
            </div>
            <span className="lp-stat-sub">84% of sprint deliverables completed ahead of schedule</span>
          </div>

          <div className="lp-bento-tags">
            <span className="lp-bento-tag">Kanban &amp; Milestones</span>
            <span className="lp-bento-tag">Multi-Tenant Isolation</span>
          </div>
        </div>

        {/* Bento Card 4: 5-Stage Creator & Media Pipeline (Span 2) */}
        <div className="lp-bento-card lp-bento-span-2">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">04 • PRODUCTION</span>
            <span className="lp-bento-metric">End-to-End Media Pipeline</span>
          </div>

          <h3 className="lp-bento-title">5-Stage Creator Pipeline</h3>
          <p className="lp-bento-desc">
            From creative brief and script ideation to 4K post-production, legal review, and multi-channel asset distribution — managed within a unified workflow.
          </p>

          <div className="lp-bento-stages-row">
            <div className="lp-stage-step">
              <span className="lp-stage-num">01</span>
              <strong>Scripting</strong>
              <span>Brief &amp; RFC</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step">
              <span className="lp-stage-num">02</span>
              <strong>Production</strong>
              <span>Asset capture</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step active">
              <span className="lp-stage-num">03</span>
              <strong>Review &amp; QA</strong>
              <span>Stakeholder signoff</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step">
              <span className="lp-stage-num">04</span>
              <strong>Scheduled</strong>
              <span>Launch queue</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step done">
              <span className="lp-stage-num">05</span>
              <strong>Delivered</strong>
              <span>Live distribution</span>
            </div>
          </div>

          <div className="lp-bento-tags">
            <span className="lp-bento-tag">Automated Asset Ingestion</span>
            <span className="lp-bento-tag">Client Approval Portals</span>
            <span className="lp-bento-tag">Version Control &amp; RFCs</span>
          </div>
        </div>
      </div>
    </section>
  );
}
