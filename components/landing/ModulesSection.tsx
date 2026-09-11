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
      desc: 'Command center for your enterprise. Real-time velocity, KPIs, and executive telemetry at a glance.',
      featured: false,
    },
    {
      num: '02',
      name: 'Ordis Copilot',
      desc: 'Autonomous workspace intelligence that proactively rebalances workload, resolves bottlenecks, and unifies cross-functional data.',
      featured: true, // Prominent featured card in Tano Butter Yellow (#FFD66B) with washi tape
      badge: 'AUTONOMOUS CORE',
    },
    {
      num: '03',
      name: 'Tasks & Kanban',
      desc: 'Interactive Kanban boards and lists with priority matrices, SLA countdowns, and automated routing.',
      featured: false,
    },
    {
      num: '04',
      name: 'Projects',
      desc: 'Milestone roadmaps, critical-path dependency tracking, and deliverable phase trajectories.',
      featured: false,
    },
    {
      num: '05',
      name: 'Team',
      desc: 'Role-based directory, granular permissions, workload capacity distribution, and live presence.',
      featured: false,
    },
    {
      num: '06',
      name: 'Calendar',
      desc: 'Deliverable deadlines, team milestone schedules, and synchronized operational events.',
      featured: false,
    },
    {
      num: '07',
      name: 'Meetings',
      desc: 'Live video rooms, real-time collaboration, and automated discussion minutes.',
      featured: false,
    },
    {
      num: '08',
      name: 'Messages',
      desc: 'Threaded discussions, team channels, and direct contextual communication without tool bloat.',
      featured: false,
    },
    {
      num: '09',
      name: 'Analytics',
      desc: 'Visual velocity dashboards, sprint burnup trajectory, and delivery SLA adherence tracking.',
      featured: false,
    },
    {
      num: '10',
      name: 'Settings',
      desc: 'Deterministic RBAC, session security guard, audit logs, and workspace configuration.',
      featured: false,
    },
  ];

  return (
    <section className="lp-section" id="modules" ref={sectionRef}>
      <div className="lp-section-header">
        <div className="lp-section-label lp-reveal">
          <span>{count}</span> Real Workspace Modules
        </div>
        <h2 className="lp-section-title lp-reveal">One unified workspace. Ten integrated subsystems.</h2>
        <p className="lp-section-subtitle lp-reveal">
          Every module connects directly to your live workspace graph. Zero fake point tools, zero third-party glue code, and zero context switching.
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
