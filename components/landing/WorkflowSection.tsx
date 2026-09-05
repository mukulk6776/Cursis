import React from 'react';

export default function WorkflowSection() {
  const steps = [
    {
      icon: 'M',
      bg: 'var(--c-brand-bg)',
      label: 'Message',
      text: 'Someone says "we need to fix the nav"',
    },
    {
      icon: 'T',
      bg: 'var(--c-accent)',
      label: 'Becomes a Task',
      text: 'One click: "Fix navigation bar" task created',
    },
    {
      icon: 'P',
      bg: 'var(--c-brand-bg)',
      label: 'In a Project',
      text: 'Automatically linked to "Website Redesign"',
    },
    {
      icon: 'A',
      bg: 'var(--c-success-bg)',
      label: 'Assigned',
      text: 'Assigned to Sarah, shows in her My Work',
    },
    {
      icon: 'O',
      bg: 'var(--c-accent)',
      label: 'Ordis Watches',
      text: 'Ordis tracks progress and nudges if it stalls',
    },
  ];

  return (
    <section className="lp-section" id="connected">
      <div className="lp-section-label lp-reveal">How It Flows</div>
      <h2 className="lp-section-title lp-reveal">Everything connects. Nothing gets lost.</h2>
      <p className="lp-section-subtitle lp-reveal">
        In Cursis, a message can become a task. A task lives in a project. A project connects to your team.
        And Ordis watches all of it.
      </p>

      <div className="lp-workflow lp-stagger">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className="lp-workflow-step">
              <div className="lp-workflow-step-icon" style={{ background: step.bg }}>
                {step.icon}
              </div>
              <div className="lp-workflow-step-content">
                <div className="lp-workflow-step-label">{step.label}</div>
                <div className="lp-workflow-step-text">{step.text}</div>
              </div>
            </div>
            {idx < steps.length - 1 && <div className="lp-workflow-connector" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
