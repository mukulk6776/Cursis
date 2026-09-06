import React from 'react';

export default function ProblemSection() {
  return (
    <section className="lp-section" id="problem">
      <div className="lp-section-header">
        <div className="lp-section-label">Why Cursis</div>
        <h2 className="lp-section-title">Stop paying for 10 disconnected tools</h2>
        <p className="lp-section-subtitle">
          When your team’s tasks live in one app, messages in another, and deadlines on scattered calendars,
          work falls through the cracks. Cursis replaces the entire fragmented stack.
        </p>
      </div>

      <div className="lp-comparison-grid">
        {/* Fragmented Stack Card */}
        <div className="lp-comparison-card negative">
          <div className="lp-card-pill red">Without Cursis</div>
          <h3 className="lp-card-headline">The SaaS Sprawl Nightmare</h3>
          <ul className="lp-comparison-list">
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>$40+ / user / month</strong> across 5–8 separate subscriptions
              </div>
            </li>
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Context switching fatigue</strong> jumping between Slack, Jira, Notion, and Calendly
              </div>
            </li>
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Stalled tasks &amp; missed deadlines</strong> because nobody is watching the gaps
              </div>
            </li>
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Manual status updates</strong> and endless standup meetings to find out who is doing what
              </div>
            </li>
          </ul>
        </div>

        {/* Cursis Solution Card */}
        <div className="lp-comparison-card positive">
          <div className="lp-card-pill green">With Cursis</div>
          <h3 className="lp-card-headline">One Intelligent Workspace</h3>
          <ul className="lp-comparison-list">
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>100% Free Forever</strong> for your entire team, with zero tier restrictions
              </div>
            </li>
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Ordis AI Operations</strong> that actively monitor workloads, detect bottlenecks, and draft updates
              </div>
            </li>
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Connected Workspace</strong> where tasks, meetings, team bandwidth, and projects flow seamlessly
              </div>
            </li>
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Instant clarity</strong> with real-time visibility into team capacity and milestones
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

