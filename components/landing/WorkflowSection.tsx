import React from 'react';

export default function WorkflowSection() {
  const steps = [
    {
      num: '01',
      title: 'Operational Signal',
      subtitle: 'Discussion Ingestion',
      text: 'Discussion in project channel: "Client requires SOC-2 Type II audit report delivered by Friday."',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'One-Click Synthesis',
      subtitle: 'Autonomous Creation',
      text: 'Ordis parses the message, creates deliverable ticket "Generate SOC-2 Report", sets priority to Urgent.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Roadmap Linkage',
      subtitle: 'Dependency Mapping',
      text: 'Automatically indexed under "Enterprise Compliance Sprint" with critical path milestone dependencies.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Capacity Routing',
      subtitle: 'Zero-Burnout Assignment',
      text: 'Ordis evaluates squad bandwidth and routes deliverable to Alex R. (currently at 35% utilization).',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      num: '05',
      title: 'Continuous Telemetry',
      subtitle: 'Deterministic Delivery',
      text: 'Real-time telemetry watches progress. Automatic nudge triggers if deliverable is within 4 hours of SLA.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
  ];

  return (
    <section className="lp-section" id="connected">
      <div className="lp-section-header">
        <div className="lp-section-label">Deterministic Flow</div>
        <h2 className="lp-section-title">Everything Connects. Nothing Slips.</h2>
        <p className="lp-section-subtitle">
          In Cursis, an informal conversation converts to a structured deliverable. The deliverable attaches to a milestone roadmap.
          Ordis balances team capacity, and telemetry tracks it through completion.
        </p>
      </div>

      <div className="lp-workflow-timeline">
        {steps.map((step, idx) => (
          <div key={step.num} className="lp-workflow-timeline-card">
            <div className="lp-timeline-step-top">
              <span className="lp-timeline-num">{step.num}</span>
              <div className="lp-timeline-icon">{step.icon}</div>
            </div>

            <div className="lp-timeline-meta">
              <span className="lp-timeline-sub">{step.subtitle}</span>
              <h3 className="lp-timeline-title">{step.title}</h3>
            </div>

            <p className="lp-timeline-text">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
