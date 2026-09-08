'use client';

import React, { useState, useEffect, useRef } from 'react';

const STEPS = [
  { num: 1, text: 'You invite ', highlight: 'sarah@organization.com', suffix: ' to the enterprise workspace' },
  { num: 2, text: 'Sarah authenticates. Provisioned as ', highlight: 'Lead Product Designer', suffix: ' with tailored RBAC' },
  { num: 3, text: 'You initialize the ', highlight: '"Global Architecture Refresh"', suffix: ' initiative' },
  { num: 4, text: 'You route ownership to Sarah for ', highlight: '"Core Design System"', suffix: ' with target SLA' },
  { num: 5, text: 'Sarah accesses ', highlight: 'Unified Work Cockpit', suffix: ' with pre-configured milestone dependencies' },
  { num: 6, text: 'Ordis monitors telemetry and ', highlight: 'proactively resolves delivery bottlenecks', suffix: '' },
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
      <div className="lp-section-label lp-reveal">Workforce Architecture</div>
      <h2 className="lp-section-title lp-reveal">Orchestrate Enterprise Teams with Zero Friction</h2>
      <p className="lp-section-subtitle lp-reveal">
        Assign granular role-based permissions, deploy cross-functional initiatives, and maintain complete
        organizational visibility across every business unit.
      </p>

      <div className="lp-demo-container lp-reveal-scale" ref={containerRef}>
        <div className="lp-demo-header">Automated Enterprise Team Orchestration</div>
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
