import React from 'react';

export default function ProblemSection() {
  const apps = [
    { icon: 'T', name: 'Task App' },
    { icon: 'M', name: 'Messaging' },
    { icon: 'F', name: 'File Storage' },
    { icon: 'P', name: 'Project Mgmt' },
    { icon: 'C', name: 'Calendar' },
    { icon: 'D', name: 'Docs' },
  ];

  return (
    <section className="lp-section" id="problem">
      <div className="lp-section-label lp-reveal">The Problem</div>
      <h2 className="lp-section-title lp-reveal">Your work lives in 10 different apps</h2>
      <p className="lp-section-subtitle lp-reveal">
        Tasks in one app. Messages in another. Files somewhere else. Your team is scattered across tools
        that don't talk to each other.
      </p>

      <div className="lp-problem-grid lp-stagger">
        {apps.map((app) => (
          <div key={app.name} className="lp-problem-app">
            <div className="lp-problem-app-icon">{app.icon}</div>
            <div className="lp-problem-app-name">{app.name}</div>
          </div>
        ))}
      </div>

      <div className="lp-problem-chaos lp-reveal">
        <div className="lp-problem-chaos-text">= Chaos</div>
      </div>

      <div className="lp-problem-solution lp-reveal-scale">
        <div className="lp-problem-solution-text">Cursis = One Place</div>
      </div>
    </section>
  );
}
