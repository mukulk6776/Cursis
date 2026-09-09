import React from 'react';

export default function ProblemSection() {
  const problems = [
    {
      title: 'Excessive Licensing Overhead',
      desc: 'Compounding subscription overhead across 6–10 isolated vendors creates financial sprawl and procurement logjams.',
    },
    {
      title: 'Cognitive Context Switching',
      desc: 'Teams lose up to 40% of productive hours switching context between siloed chats, ticket trackers, spreadsheets, and calendar apps.',
    },
    {
      title: 'Unmonitored Execution Gaps',
      desc: 'Critical path dependencies slip undetected across disconnected point solutions until deadlines are already missed.',
    },
    {
      title: 'Manual Standup Friction',
      desc: 'Managers waste hours chasing verbal status updates rather than reviewing deterministic, live operational telemetry.',
    },
  ];

  const solutions = [
    {
      title: 'Single Consolidated Operating Fabric',
      desc: 'One unified workspace integrates tasks, roadmaps, discussions, docs, and creator pipelines without multiple logins or tool bloat.',
    },
    {
      title: 'Autonomous Ordis Intelligence',
      desc: 'Our native AI continuously monitors workloads, unblocks cross-functional tasks, generates executive summaries, and prevents deadlocks.',
    },
    {
      title: 'Single-Pane Institutional Telemetry',
      desc: 'Real-time visibility into team bandwidth, deliverable SLAs, and milestone trajectory without manual status meetings.',
    },
    {
      title: 'Deterministic Zero-Bypass Security',
      desc: 'Enterprise-grade session validation, role-based access control, and complete audit trails protecting your intellectual property.',
    },
  ];

  return (
    <section className="lp-section" id="problem">
      <div className="lp-section-header">
        <div className="lp-section-label">Enterprise Architecture Comparison</div>
        <h2 className="lp-section-title">The Disjointed Enterprise Stack vs. Unified Architecture</h2>
        <p className="lp-section-subtitle">
          When operational data is trapped across siloed point vendors, organizational velocity collapses.
          Cursis provides a single consolidated operating plane for enterprise execution.
        </p>
      </div>

      <div className="lp-comparison-grid">
        {/* Fragmented Stack Card */}
        <div className="lp-comparison-card negative">
          <div className="lp-comparison-header">
            <span className="lp-card-pill red">Fragmented Point Solutions</span>
            <h3 className="lp-card-headline">Multi-Vendor Tooling Sprawl</h3>
            <p className="lp-card-desc">Siloed systems without unified context or autonomous cross-functional oversight.</p>
          </div>

          <ul className="lp-comparison-list">
            {problems.map((p, i) => (
              <li key={i}>
                <div className="lp-comparison-icon-wrap cross">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Cursis Solution Card */}
        <div className="lp-comparison-card positive">
          <div className="lp-comparison-header">
            <span className="lp-card-pill green">Unified Cursis Operating Plane</span>
            <h3 className="lp-card-headline">Consolidated Enterprise Fabric</h3>
            <p className="lp-card-desc">Synchronized telemetry, native Ordis intelligence, and fluid cross-functional execution.</p>
          </div>

          <ul className="lp-comparison-list">
            {solutions.map((s, i) => (
              <li key={i}>
                <div className="lp-comparison-icon-wrap check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
