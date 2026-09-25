'use client';

import React, { useState, useEffect, useRef } from 'react';

const STEPS = [
  { num: 1, text: 'You invite ', highlight: 'sarah@company.com', suffix: ' to the workspace' },
  { num: 2, text: 'Sarah joins as ', highlight: 'Lead Product Designer', suffix: ' with instant project access' },
  { num: 3, text: 'You create the ', highlight: '"Mobile App Redesign"', suffix: ' project' },
  { num: 4, text: 'Assign Sarah lead on ', highlight: '"Design System & Tokens"', suffix: ' with Friday deadline' },
  { num: 5, text: 'Sarah views her ', highlight: 'assigned tasks and roadmap', suffix: ' without waiting on meetings' },
  { num: 6, text: 'Ordis tracks sprint progress and ', highlight: 'flags blockers automatically', suffix: '' },
];

export default function TeamDemoSection() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            STEPS.forEach((_, i) => {
              setTimeout(() => {
                setActiveStep((prev) => Math.max(prev, i + 1));
              }, i * 500);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="lp-section" id="team">
      <div className="lp-section-label lp-reveal">Team Collaboration</div>
      <h2 className="lp-section-title lp-reveal">Simple onboarding, clear ownership.</h2>
      <p className="lp-section-subtitle lp-reveal">
        Invite team members, assign projects, and get straight to work without complicated configuration.
      </p>

      <div className="lp-demo-container lp-reveal-scale" ref={containerRef}>
        <div className="lp-demo-header">How teams collaborate on Cursis</div>
        <div className="lp-demo-body">
          {STEPS.map((step) => {
            const isActive = activeStep >= step.num;
            return (
              <div
                key={step.num}
                className={`lp-demo-step ${isActive ? 'lp-step-active' : ''}`}
                style={{
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: isActive ? 1 : 0.4,
                  transform: isActive ? 'translateX(0)' : 'translateX(-10px)',
                }}
              >
                <div className="lp-demo-step-num">{step.num}</div>
                <div className="lp-demo-step-text">
                  {step.text}
                  <span className="lp-demo-step-highlight">{step.highlight}</span>
                  {step.suffix}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
