'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function FeaturesSection() {
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  const ordisLogs = [
    { time: '10:42 AM', event: 'Progress update: 21 of 25 planned tasks done (84%).' },
    { time: '11:15 AM', event: 'Work shared: Sarah T. now has more room in her week.' },
    { time: '01:30 PM', event: 'Meeting notes: Turned the discussion into 3 tasks.' },
    { time: '03:10 PM', event: 'Project update: Brand colors and fonts are ready for review.' },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="lp-section-header">
        <div className="lp-section-label">Features</div>
        <h2 className="lp-section-title">Keep work moving without the chase.</h2>
        <p className="lp-section-subtitle">
          See what needs doing, who can help, and what needs your attention.
        </p>
      </div>

      {/* Asymmetrical Bento Grid */}
      <p className="marketing-sample">Sample data · All names, activity and metrics are illustrative demo content.</p><div className="lp-bento-grid">
        {/* Bento Card 1: Autonomous Ordis Intelligence (Large Span 2) */}
        <div className="lp-bento-card lp-bento-span-2 lp-bento-featured">
          <div className="lp-bento-topbar">
            <span className="badge badge-brand">01 • AI ASSISTANT</span>
            <span className="lp-bento-metric">Help When You Need It</span>
          </div>

          <h3 className="lp-bento-title">Ordis AI Assistant</h3>
          <p className="lp-bento-desc">
            Find out what is running late, get a quick progress update, and see who can help before deadlines slip.
          </p>

          {/* Mini Live Event Feed */}
          <div className="lp-bento-log-box">
            <div className="lp-bento-log-header">
              <span className="lp-status-live-dot" />
              <span>Team Updates</span>
            </div>
            <div className="lp-bento-log-list">
              {ordisLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`lp-bento-log-item ${activeLogIndex === idx ? 'active' : ''}`}
                  role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveLogIndex(idx); } }} onClick={() => setActiveLogIndex(idx)}
                >
                  <span className="lp-log-time">{log.time}</span>
                  <span className="lp-log-text">{log.event}</span>
                </div>
              ))}
            </div>
          </div>

          <Link className="marketing-learn" href="/#ordis">Learn more about this feature →</Link><div className="lp-bento-tags">
            <span className="lp-bento-tag">Spot Delays</span>
            <span className="lp-bento-tag">Quick Catch-Ups</span>
            <span className="lp-bento-tag">Updates Without Chasing</span>
          </div>
        </div>

        {/* Bento Card 2: Team Telemetry & Bandwidth (Span 1) */}
        <div className="lp-bento-card lp-bento-span-1">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">02 • TEAMWORK</span>
            <span className="lp-live-badge">4 Online</span>
          </div>

          <h3 className="lp-bento-title">Share the Work Fairly</h3>
          <p className="lp-bento-desc">
            See who is busy and who has room to help, so the same people do not end up doing everything.
          </p>

          <div className="lp-bento-roster-preview">
            <div className="lp-roster-row">
              <div className="lp-roster-avatar" style={{ background: '#1A1612' }}>MK</div>
              <div className="lp-roster-info">
                <strong>Mukul Kumar</strong>
                <span>Team Lead • 3 tasks</span>
              </div>
              <span className="lp-capacity-badge">65% Booked</span>
            </div>

            <div className="lp-roster-row">
              <div className="lp-roster-avatar" style={{ background: '#2965ff' }}>ST</div>
              <div className="lp-roster-info">
                <strong>Sarah Taylor</strong>
                <span>Developer • 2 tasks</span>
              </div>
              <span className="lp-capacity-badge">50% Booked</span>
            </div>

            <div className="lp-roster-row">
              <div className="lp-roster-avatar" style={{ background: '#10b981' }}>AR</div>
              <div className="lp-roster-info">
                <strong>Alex Rivera</strong>
                <span>Security • 1 task</span>
              </div>
              <span className="lp-capacity-badge">35% Booked</span>
            </div>
          </div>

          <Link className="marketing-learn" href="/#ordis">Learn more about this feature →</Link><div className="lp-bento-tags">
            <span className="lp-bento-tag">Share Work Fairly</span>
            <span className="lp-bento-tag">See Who Is Online</span>
          </div>
        </div>

        {/* Bento Card 3: Keep Deadlines in Sight & SLA Dial (Span 1) */}
        <div className="lp-bento-card lp-bento-span-1">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">03 • PROGRESS</span>
            <span className="lp-sla-rate">84% planned work done</span>
          </div>

          <h3 className="lp-bento-title">Keep Deadlines in Sight</h3>
          <p className="lp-bento-desc">
            Give every task an owner and a deadline. See what is done and what still needs attention.
          </p>

          <div className="lp-bento-stat-card">
            <div className="lp-stat-number">1.8 <small>Days</small></div>
            <span className="lp-stat-label">Average Time per Task</span>
            <div className="lp-stat-bar-track">
              <div className="lp-stat-bar-fill" style={{ width: '84%' }} />
            </div>
            <span className="lp-stat-sub">Sample data: 84% of planned work done</span>
          </div>

          <Link className="marketing-learn" href="/blog/catch-delayed-tasks">Learn more about this feature →</Link><div className="lp-bento-tags">
            <span className="lp-bento-tag">Task Boards</span>
            <span className="lp-bento-tag">Key Deadlines</span>
          </div>
        </div>

        {/* Bento Card 4: 5-Stage Creator & Media Pipeline (Span 2) */}
        <div className="lp-bento-card lp-bento-span-2">
          <div className="lp-bento-topbar">
            <span className="badge badge-neutral">04 • PROJECT STEPS</span>
            <span className="lp-bento-metric">From Start to Finish</span>
          </div>

          <h3 className="lp-bento-title">Know What Happens Next</h3>
          <p className="lp-bento-desc">
            Follow each piece of work from the first idea to final approval, so nothing gets lost between steps.
          </p>

          <div className="lp-bento-stages-row">
            <div className="lp-stage-step">
              <span className="lp-stage-num">01</span>
              <strong>Write</strong>
              <span>Plan &amp; draft</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step">
              <span className="lp-stage-num">02</span>
              <strong>Create</strong>
              <span>Record &amp; create</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step active">
              <span className="lp-stage-num">03</span>
              <strong>Review</strong>
              <span>Team approval</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step">
              <span className="lp-stage-num">04</span>
              <strong>Ready</strong>
              <span>Ready to publish</span>
            </div>
            <div className="lp-stage-sep">→</div>
            <div className="lp-stage-step done">
              <span className="lp-stage-num">05</span>
              <strong>Finished</strong>
              <span>Published &amp; shared</span>
            </div>
          </div>

          <Link className="marketing-learn" href="/creators">Learn more about this feature →</Link><div className="lp-bento-tags">
            <span className="lp-bento-tag">Clear Next Steps</span>
            <span className="lp-bento-tag">Team Reviews</span>
            <span className="lp-bento-tag">Fast Approvals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
