'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function ModulesSection() {
  const [count, setCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const end = 10;
            const duration = 900;
            let startTime: number | null = null;

            const step = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * end));
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setCount(10);
              }
            };
            requestAnimationFrame(step);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Real, verified modules that exist in Cursis codebase
  const modules = [
    {
      num: '01',
      name: 'Team Overview',
      desc: 'See what needs your attention without checking every project.',
      featured: false,
    },
    {
      num: '02',
      name: 'Ordis AI',
      desc: 'Spot delayed tasks, get quick updates, and share work more fairly.',
      featured: true, // Prominent featured card in Tano Butter Yellow (#FFD66B) with washi tape
      badge: 'BUILT-IN AI',
    },
    {
      num: '03',
      name: 'Tasks',
      desc: 'Keep track of what needs doing, who owns it, and when it is due.',
      featured: false,
    },
    {
      num: '04',
      name: 'Projects',
      desc: 'Keep every project’s tasks and deadlines together.',
      featured: false,
    },
    {
      num: '05',
      name: 'Team',
      desc: 'See who does what, who can help, and who can access your work.',
      featured: false,
    },
    {
      num: '06',
      name: 'Calendar',
      desc: 'Keep deadlines, meetings, and team events in one calendar.',
      featured: false,
    },
    {
      num: '07',
      name: 'Meetings',
      desc: 'Meet on video and turn what you agree on into tasks.',
      featured: false,
    },
    {
      num: '08',
      name: 'Automatic Actions',
      desc: 'Set up simple rules to handle repeat jobs, like sending task reminders.',
      featured: false,
    },
    {
      num: '09',
      name: 'Progress Reports',
      desc: 'See how much work is finished and where things are slowing down.',
      featured: false,
    },
    {
      num: '10',
      name: 'Settings',
      desc: 'Choose how your workspace works and who can use it.',
      featured: false,
    },
    {
      num: '→',
      name: 'Start Your Workspace',
      desc: 'Bring your team and their work into one place.',
      featured: false,
      cta: true,
    },
  ];

  return (
    <section className="lp-section" id="modules" ref={sectionRef}>
      <div className="lp-section-header">
        <div className="lp-section-label lp-reveal">
          <span>{count}</span> Team Tools
        </div>
        <h2 className="lp-section-title lp-reveal">Your team’s tools, together at last.</h2>
        <p className="lp-section-subtitle lp-reveal">
          Spend less time switching apps and more time getting work done.
        </p>
      </div>

      <div className="tano-modules-grid lp-stagger">
        {modules.map((m) => {
          if (m.cta) {
            return (
              <a
                key={m.num}
                href="/signup"
                className="tano-module-card tano-module-cta"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="tano-module-top">
                  <span className="tano-module-num tano-module-cta-icon">{m.num}</span>
                </div>
                <h3 className="tano-module-name">{m.name}</h3>
                <p className="tano-module-desc">{m.desc}</p>
                <div className="tano-module-cta-footer">
                  <span className="tano-cta-arrow">→</span>
                  <span className="tano-cta-text">Get Started</span>
                </div>
              </a>
            );
          }
          return (
            <div
              key={m.num}
              className={`tano-module-card ${m.featured ? 'tano-module-featured' : ''}`}
            >
              {m.featured && (
                <div
                  className="tano-washi-tape"
                  style={{ top: -11, right: 28, transform: 'rotate(2deg)' }}
                  aria-hidden="true"
                />
              )}

              <div className="tano-module-top">
                <span className="tano-module-num">{m.num}</span>
                {m.badge && <span className="tano-module-badge">{m.badge}</span>}
              </div>

              <h3 className="tano-module-name">{m.name}</h3>
              <p className="tano-module-desc">{m.desc}</p><a className="marketing-learn" href={m.name === "Ordis AI" ? "/#ordis" : "/faq#included-tools"}>Learn more about {m.name} →</a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
