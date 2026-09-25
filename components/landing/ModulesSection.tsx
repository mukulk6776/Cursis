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
      name: 'Dashboard',
      desc: 'Track projects, active tasks, and team updates in a single view.',
      featured: false,
    },
    {
      num: '02',
      name: 'Ordis AI',
      desc: 'Your AI partner for sprint summaries, task creation, and workload balancing.',
      featured: true, // Prominent featured card in Tano Butter Yellow (#FFD66B) with washi tape
      badge: 'BUILT-IN AI',
    },
    {
      num: '03',
      name: 'Tasks & Kanban',
      desc: 'Organize work with clean boards, filters, and priority tags.',
      featured: false,
    },
    {
      num: '04',
      name: 'Projects',
      desc: 'Plan roadmaps, milestones, and project goals with clear deadlines.',
      featured: false,
    },
    {
      num: '05',
      name: 'Team',
      desc: 'Manage member roles, permissions, and team bandwidth.',
      featured: false,
    },
    {
      num: '06',
      name: 'Calendar',
      desc: 'Schedule deadlines, sprint dates, and team events.',
      featured: false,
    },
    {
      num: '07',
      name: 'Meetings',
      desc: 'Host video syncs and turn discussions directly into tasks.',
      featured: false,
    },
    {
      num: '08',
      name: 'Messages',
      desc: 'Chat in organized channels and direct messages right next to your work.',
      featured: false,
    },
    {
      num: '09',
      name: 'Analytics',
      desc: 'View sprint velocity, cycle times, and completion rates.',
      featured: false,
    },
    {
      num: '10',
      name: 'Settings',
      desc: 'Customize workspace settings, integrations, and access controls.',
      featured: false,
    },
  ];

  return (
    <section className="lp-section" id="modules" ref={sectionRef}>
      <div className="lp-section-header">
        <div className="lp-section-label lp-reveal">
          <span>{count}</span> Workspace Modules
        </div>
        <h2 className="lp-section-title lp-reveal">One workspace. Ten integrated tools.</h2>
        <p className="lp-section-subtitle lp-reveal">
          Everything your team needs, built into one fast and reliable platform.
        </p>
      </div>

      <div className="tano-modules-grid lp-stagger">
        {modules.map((m) => (
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
            <p className="tano-module-desc">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
