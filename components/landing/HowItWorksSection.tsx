import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    { circle: '1', label: <>Create<br />Workspace</> },
    { circle: '2', label: <>Add Your<br />Team</> },
    { circle: '3', label: <>Create<br />Projects</> },
    { circle: '4', label: <>Assign<br />Work</> },
    { circle: '5', label: <>Connect<br />Everything</> },
    { circle: 'O', label: <>Ordis<br />Takes Over</>, highlight: true },
  ];

  return (
    <section className="lp-section" id="how-it-works">
      <div className="lp-section-label lp-reveal">Getting Started</div>
      <h2 className="lp-section-title lp-reveal">Up and running in 6 steps</h2>
      <p className="lp-section-subtitle lp-reveal">
        No complex setup. No onboarding calls. Create your workspace and start working.
      </p>

      <div className="lp-steps-flow lp-stagger">
        {steps.map((s, idx) => (
          <div key={idx} className="lp-step-item">
            <div
              className="lp-step-circle"
              style={s.highlight ? { background: 'var(--c-accent)', fontWeight: 900 } : undefined}
            >
              {s.circle}
            </div>
            <div className="lp-step-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
