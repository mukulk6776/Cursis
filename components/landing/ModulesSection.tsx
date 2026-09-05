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
            let start = 0;
            const end = 17;
            const duration = 1000;
            let startTime: number | null = null;

            const step = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * end));
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setCount(17);
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

  const modules = [
    { num: '01', name: 'Dashboard', desc: 'Your command center. Everything at a glance.' },
    { num: '02', name: 'Projects', desc: 'Organize work into clear, trackable projects.' },
    { num: '03', name: 'Tasks', desc: 'Create, assign, track. Board or list view.' },
    { num: '04', name: 'Messages', desc: 'Real-time team communication with context.' },
    { num: '05', name: 'Calendar', desc: 'Deadlines, meetings, milestones. All synced.' },
    { num: '06', name: 'Files', desc: 'Upload, organize, share. Every file has context.' },
    { num: '07', name: 'Docs', desc: 'Collaborative rich-text documents.' },
    { num: '08', name: 'Notes', desc: 'Quick captures, meeting notes, ideas.' },
    { num: '09', name: 'My Work', desc: 'Personal view of everything assigned to you.' },
    { num: '10', name: 'Team', desc: 'Directory, roles, permissions, invites.' },
    { num: '11', name: 'Reports', desc: 'Visual dashboards for project health.' },
    { num: '12', name: 'Time Log', desc: 'Track hours per task, project, or person.' },
    { num: '13', name: 'Invoices', desc: 'Bill clients based on tracked work.' },
    { num: '14', name: 'Clients', desc: 'Manage client contacts and projects.' },
    { num: '15', name: 'Notifications', desc: 'Smart alerts. Never miss what matters.' },
    { num: '16', name: 'Settings', desc: 'Workspace configuration and preferences.' },
    { num: '17', name: 'Ordis AI', desc: 'The intelligent layer that connects everything.', highlight: true },
  ];

  return (
    <section className="lp-section" id="modules" ref={sectionRef}>
      <div className="lp-section-label lp-reveal">
        <span>{count}</span> Core Modules
      </div>
      <h2 className="lp-section-title lp-reveal">One workspace. Seventeen integrated modules.</h2>
      <p className="lp-section-subtitle lp-reveal">
        Every module connects to every other module. Your data flows naturally. No integrations needed.
      </p>

      <div className="lp-modules-grid lp-stagger">
        {modules.map((m) => (
          <div
            key={m.num}
            className="lp-module-item"
            style={m.highlight ? { background: 'var(--c-accent)' } : undefined}
          >
            <div className="lp-module-num" style={m.highlight ? { color: 'var(--c-near-black)' } : undefined}>
              {m.num}
            </div>
            <div className="lp-module-name">{m.name}</div>
            <div className="lp-module-desc">{m.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
