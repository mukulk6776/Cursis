import React from 'react';

export default function ProblemSection() {
  return (
    <section className="lp-section" id="problem">
      <div className="lp-section-header">
        <div className="lp-section-label">Enterprise Architecture Comparison</div>
        <h2 className="lp-section-title">The Disjointed Enterprise Stack vs. Unified Architecture</h2>
        <p className="lp-section-subtitle">
          When operational data is trapped across siloed vendors, organizational velocity collapses.
          Cursis provides a single consolidated operating plane for enterprise execution.
        </p>
      </div>

      <div className="lp-comparison-grid">
        {/* Fragmented Stack Card */}
        <div className="lp-comparison-card negative">
          <div className="lp-card-pill red">Fragmented Point Solutions</div>
          <h3 className="lp-card-headline">Multi-Vendor Tooling Sprawl</h3>
          <ul className="lp-comparison-list">
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Excessive Licensing Overhead</strong> with compounding subscription costs across 6–10 isolated vendors
              </div>
            </li>
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Cognitive Context Switching</strong> friction jumping between disparate chat, ticketing, docs, and calendars
              </div>
            </li>
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Unmonitored Execution Gaps</strong> causing stalled initiatives and delivery deadlines to slip undetected
              </div>
            </li>
            <li>
              <span className="lp-icon-cross">✕</span>
              <div>
                <strong>Manual Status Chasing</strong> and inefficient standup overhead required just to assess team bandwidth
              </div>
            </li>
          </ul>
        </div>

        {/* Cursis Solution Card */}
        <div className="lp-comparison-card positive">
          <div className="lp-card-pill green">Unified Cursis Operating Plane</div>
          <h3 className="lp-card-headline">Consolidated Enterprise Fabric</h3>
          <ul className="lp-comparison-list">
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Zero Tooling Bloat</strong> through a complete, integrated workspace architecture built for scale
              </div>
            </li>
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Ordis Intelligence</strong> continuously scanning workloads, resolving blockers, and automating updates
              </div>
            </li>
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Single-Pane-of-Glass Execution</strong> linking tasks, projects, calendar syncs, and team telemetry
              </div>
            </li>
            <li>
              <span className="lp-icon-check">✓</span>
              <div>
                <strong>Institutional Visibility</strong> with real-time sprint velocity, audit trails, and deterministic security
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

