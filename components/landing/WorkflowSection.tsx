import React from 'react';

export default function WorkflowSection() {
  const steps = [
    {
      num: '01',
      title: 'Share the idea',
      subtitle: 'Discussion',
      text: 'A client request or feature idea is discussed in a project channel.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Create the task',
      subtitle: 'One-Click Action',
      text: 'Convert any message into an actionable task with an assignee and due date.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Link to roadmap',
      subtitle: 'Sprint Milestones',
      text: 'Attach the task to the current sprint with clear milestone deadlines.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Assign & balance',
      subtitle: 'Team Bandwidth',
      text: 'Distribute work based on team availability to prevent burnout.',
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
      title: 'Deliver on time',
      subtitle: 'Progress Updates',
      text: 'Track real-time progress without needing manual weekly status decks.',
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
        <div className="lp-section-label">Workflow</div>
        <h2 className="lp-section-title">From idea to delivery in five steps.</h2>
        <p className="lp-section-subtitle">
          A simple, connected flow where discussion, planning, and execution stay together.
        </p>
      </div>

      <div className="lp-workflow-timeline">
        {steps.map((step) => (
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
