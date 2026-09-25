import React from 'react';

export default function ProblemSection() {
  const problems = [
    {
      title: 'Tool sprawl',
      desc: 'Paying for 5–8 different apps for chat, tasks, docs, and calendar creates confusion.',
    },
    {
      title: 'Context switching',
      desc: 'Teams lose hours every day copying updates between Slack, Jira, and spreadsheets.',
    },
    {
      title: 'Missed deadlines',
      desc: 'Important blockers get buried in unread channels until launch dates are missed.',
    },
    {
      title: 'Manual status meetings',
      desc: 'Wasting valuable team time asking "what are you working on?" every single week.',
    },
  ];

  const solutions = [
    {
      title: 'All-in-one workspace',
      desc: 'Tasks, roadmaps, docs, and channels integrated in one fast, unified interface.',
    },
    {
      title: 'Ordis AI partner',
      desc: 'Ask questions, get instant sprint summaries, and spot blockers automatically.',
    },
    {
      title: 'Real-time visibility',
      desc: 'See team bandwidth, active deliverables, and sprint progress at a glance.',
    },
    {
      title: 'Built for speed',
      desc: 'Keyboard shortcuts, instant search, and zero lag keep your team focused.',
    },
  ];

  return (
    <section className="lp-section" id="problem">
      <div className="lp-section-header">
        <div className="lp-section-label">Why Cursis</div>
        <h2 className="lp-section-title">Stop switching between 10 different tools.</h2>
        <p className="lp-section-subtitle">
          Replace scattered spreadsheets, chat threads, and trackers with one unified workspace.
        </p>
      </div>

      <div className="lp-comparison-grid">
        {/* Fragmented Stack Card */}
        <div className="lp-comparison-card negative">
          <div className="lp-comparison-header">
            <span className="lp-card-pill red">The Old Way</span>
            <h3 className="lp-card-headline">Scattered &amp; Disconnected</h3>
            <p className="lp-card-desc">Siloed tools where context is lost and updates require constant manual effort.</p>
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
            <span className="lp-card-pill green">With Cursis</span>
            <h3 className="lp-card-headline">Unified &amp; Fast</h3>
            <p className="lp-card-desc">One connected workspace where planning, chat, and execution live together.</p>
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
