import React from 'react';

export default function FeaturesSection() {
  const corePillars = [
    {
      number: '01',
      tag: 'PRIMARY FEATURE',
      tagClass: 'badge-brand',
      name: 'Ordis Workspace Intelligence',
      desc: 'An AI engine that operates your workspace. Detects stalled projects, creates and assigns tasks, prepares agendas, and answers questions using your live workspace data.',
      highlights: ['Proactive bottleneck detection', 'Natural language task creation', 'Automated meeting agendas'],
    },
    {
      number: '02',
      tag: 'COLLABORATION',
      tagClass: 'badge-neutral',
      name: 'Team & Workload Management',
      desc: 'See who is working on what, track real-time active statuses, manage roles and permissions, and maintain balanced workloads across every department.',
      highlights: ['Live online/busy presence', 'Capacity & workload balancing', 'Role-based access control'],
    },
    {
      number: '03',
      tag: 'EXECUTION',
      tagClass: 'badge-neutral',
      name: 'Projects & Tasks',
      desc: 'Move seamlessly between Kanban boards, list views, and milestone roadmaps. Assign tasks, track subtasks, set urgency priorities, and never miss a delivery.',
      highlights: ['Interactive Kanban & list views', 'Milestone & deadline tracking', 'Selective assignment & subtasks'],
    },
    {
      number: '04',
      tag: 'SCHEDULES',
      tagClass: 'badge-neutral',
      name: 'Meetings & Calendar',
      desc: 'Keep schedules, client syncs, and team standups connected directly to your tasks. Generate agendas automatically and convert meeting summaries into actionable items.',
      highlights: ['Google Meet & Zoom launch', 'AI-generated meeting agendas', 'Unified schedule & milestones'],
    },
    {
      number: '05',
      tag: 'CLARITY',
      tagClass: 'badge-neutral',
      name: 'Overview & Productivity Analytics',
      desc: 'A high-level command view of company velocity, completed deliverables, upcoming deadlines, and team output without drowning in complex reporting menus.',
      highlights: ['Sprint velocity tracking', 'Real-time completion metrics', 'Burnout & risk warnings'],
    },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="lp-section-header">
        <div className="lp-section-label">Core System</div>
        <h2 className="lp-section-title">The 5 Core Pillars of Cursis</h2>
        <p className="lp-section-subtitle">
          Everything your team needs to plan, execute, and deliver — built as one cohesive system without feature bloat or complicated configuration.
        </p>
      </div>

      <div className="lp-pillars-showcase-grid">
        {corePillars.map((pillar) => (
          <div key={pillar.number} className={`lp-pillar-showcase-card ${pillar.number === '01' ? 'featured' : ''}`}>
            <div className="lp-card-topbar">
              <span className="lp-card-num">{pillar.number}</span>
              <span className={`badge ${pillar.tagClass}`}>{pillar.tag}</span>
            </div>

            <h3 className="lp-pillar-name">{pillar.name}</h3>
            <p className="lp-pillar-text">{pillar.desc}</p>

            <div className="lp-pillar-highlights">
              {pillar.highlights.map((h, i) => (
                <div key={i} className="lp-highlight-item">
                  <span className="lp-highlight-dot" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

