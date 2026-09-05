import React from 'react';

export default function FeaturesSection() {
  const features = [
    {
      icon: 'P',
      bg: 'var(--c-brand-bg)',
      name: 'Projects',
      desc: 'Organize work into projects with timelines, milestones, and team assignments.',
    },
    {
      icon: 'T',
      bg: 'var(--c-accent)',
      name: 'Tasks',
      desc: 'Create, assign, prioritize, and track tasks. Board, list, or calendar view.',
    },
    {
      icon: 'M',
      bg: 'var(--c-brand-bg)',
      name: 'Messages',
      desc: 'Real-time team messaging with channels, threads, and file sharing built in.',
    },
    {
      icon: 'D',
      bg: 'var(--c-success-bg)',
      name: 'Docs',
      desc: 'Collaborative documents with rich editing, linked to projects and tasks.',
    },
    {
      icon: 'F',
      bg: 'var(--c-warning-bg)',
      name: 'Files',
      desc: 'Central file storage. Upload, organize, preview. Every file has context.',
    },
    {
      icon: 'C',
      bg: 'var(--c-purple-bg)',
      name: 'Calendar',
      desc: 'Unified calendar with deadlines, meetings, milestones. Syncs with your tasks.',
    },
    {
      icon: 'N',
      bg: 'var(--c-brand-bg)',
      name: 'Notes',
      desc: 'Quick notes, meeting minutes, and personal docs. All searchable.',
    },
    {
      icon: 'W',
      bg: 'var(--c-accent)',
      name: 'My Work',
      desc: 'Your personal command center. See everything assigned to you across all projects.',
    },
    {
      icon: 'R',
      bg: 'var(--c-error-bg)',
      name: 'Reports',
      desc: 'Team velocity, project health, task completion. Real-time dashboards.',
    },
    {
      icon: 'L',
      bg: 'var(--c-success-bg)',
      name: 'Time Log',
      desc: "Track time on tasks. See where your team's hours go. Built-in timers.",
    },
    {
      icon: 'I',
      bg: 'var(--c-info-bg)',
      name: 'Invoices',
      desc: 'Create invoices from tracked time and projects. Send directly to clients.',
    },
    {
      icon: 'O',
      bg: 'var(--c-accent)',
      name: 'Ordis AI',
      desc: 'Your intelligent assistant that watches, suggests, and keeps work moving.',
    },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="lp-section-label lp-reveal">Core Features</div>
      <h2 className="lp-section-title lp-reveal">Everything you need. Nothing you don't.</h2>
      <p className="lp-section-subtitle lp-reveal">
        12 integrated tools that work together as one system. No plugins. No add-ons. No extra cost.
      </p>

      <div className="lp-features-grid lp-stagger">
        {features.map((item) => (
          <div key={item.name} className="lp-feature-card">
            <div className="lp-feature-icon" style={{ background: item.bg }}>
              {item.icon}
            </div>
            <div className="lp-feature-name">{item.name}</div>
            <div className="lp-feature-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
