'use client';

import React, { useState } from 'react';

export default function FeaturesSection() {
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  const ordisLogs = [
    { time: '10:42 AM', event: 'Sprint Check: 24 of 28 tasks completed on schedule.' },
    { time: '11:15 AM', event: 'Workload update: Sarah T. capacity rebalanced to 60%.' },
    { time: '01:30 PM', event: 'Meeting summary: Converted sync discussion into 3 actionable tasks.' },
    { time: '03:10 PM', event: 'Milestone verified: Design system tokens ready for staging.' },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="lp-section-header">
        <div className="lp-section-label">Features</div>
        <h2 className="lp-section-title">Everything your team needs to deliver.</h2>
        <p className="lp-section-subtitle">
          Fast, focused tools designed to replace clutter with clarity.
        </p>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="lp-bento-grid">
        {/* Bento Card 1: Autonomous Ordis Intelligence (Large Span 2) */}
        <div className="lp-bento-card lp-bento-span-2 lp-bento-featured">
          <div className="lp-bento-topbar">
            <span className="badge badge-brand">01 • AI ASSISTANT</span>
            <span className="lp-bento-metric">Real-Time Support</span>
          </div>

          <h3 className="lp-bento-title">Ordis AI Assistant</h3>
          <p className="lp-bento-desc">
            An intelligent partner that works alongside your team. Ask questions about tasks, summarize sprints, and catch delivery blockers early.
          </p>

          {/* Mini Live Event Feed */}
          <div className="lp-bento-log-box">
            <div className="lp-bento-log-header">
              <span className="lp-status-live-dot" />
              <span>Live Activity Stream</span>
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
            <span className="lp-bento-tag">Blocker Detection</span>
            <span className="lp-bento-tag">Instant Summaries</span>
            <span className="lp-bento-tag">Automated Updates</span>
          </div>
        </div>

        {/* Bento Card 2: Team Telemetry & Bandwidth (Span 1) */}
        <div className="lp-bento-card lp-bento-span-1">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">02 • COLLABORATION</span>
            <span className="lp-live-badge">4 Online</span>
          </div>

          <h3 className="lp-bento-title">Team Bandwidth</h3>
          <p className="lp-bento-desc">
            See who is working on what, track capacity in real time, and keep workloads balanced across the team.
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
            <span className="lp-bento-tag">Workload Balance</span>
            <span className="lp-bento-tag">Live Presence</span>
          </div>
        </div>

        {/* Bento Card 3: Sprint Velocity & SLA Dial (Span 1) */}
        <div className="lp-bento-card lp-bento-span-1">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">03 • EXECUTION</span>
            <span className="lp-sla-rate">99% On Time</span>
          </div>

          <h3 className="lp-bento-title">Sprint Velocity</h3>
          <p className="lp-bento-desc">
            Clean Kanban boards, milestone roadmaps, and delivery timelines that keep teams aligned.
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
            <span className="lp-bento-tag">Kanban Boards</span>
            <span className="lp-bento-tag">Milestones</span>
          </div>
        </div>

        {/* Bento Card 4: 5-Stage Creator & Media Pipeline (Span 2) */}
        <div className="lp-bento-card lp-bento-span-2">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">04 • WORKFLOW</span>
            <span className="lp-bento-metric">End-to-End Pipeline</span>
          </div>

          <h3 className="lp-bento-title">Project Pipeline</h3>
          <p className="lp-bento-desc">
            Track every project deliverable from initial brief and review to final launch with clear visual stages.
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
              <span>Team signoff</span>
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
            <span className="lp-bento-tag">Visual Stages</span>
            <span className="lp-bento-tag">Team Reviews</span>
            <span className="lp-bento-tag">Fast Approvals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
