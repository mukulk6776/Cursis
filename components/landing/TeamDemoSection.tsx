'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function TeamDemoSection() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    { num: 1, text: 'You invite ', highlight: 'sarah@design.co', suffix: ' to join your workspace' },
    { num: 2, text: 'Sarah accepts. She\'s now a ', highlight: 'Designer', suffix: ' on your team' },
    { num: 3, text: 'You create the ', highlight: '"Brand Refresh"', suffix: ' project' },
    { num: 4, text: 'You assign Sarah to ', highlight: '"Design new logo"', suffix: '' },
    { num: 5, text: 'Sarah opens ', highlight: 'My Work', suffix: ' and sees her task waiting' },
    { num: 6, text: 'Ordis tracks progress and ', highlight: 'nudges if it stalls', suffix: '' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            steps.forEach((_, i) => {
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
  }, [steps.length]);

  return (
    <section className="lp-section" id="team">
      <div className="lp-section-label lp-reveal">Team Management</div>
      <h2 className="lp-section-title lp-reveal">Build your team in minutes</h2>
      <p className="lp-section-subtitle lp-reveal">
        Invite by email. Assign roles. Create projects. Give work. Everyone sees exactly what they need —
        nothing they don't.
      </p>

      <div className="lp-demo-container lp-reveal-scale" ref={containerRef}>
        <div className="lp-demo-header">Team Setup Demo</div>
        <div className="lp-demo-body">
          {steps.map((step) => {
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
