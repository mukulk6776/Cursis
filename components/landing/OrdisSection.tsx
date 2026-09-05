'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function OrdisSection() {
  const [typedText, setTypedText] = useState('');
  const [nudged, setNudged] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fullText = 'Draft: Hi Alex, quick update — the redesign is 72% done, on track for Friday delivery.';

  useEffect(() => {
    let index = 0;
    let timer: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timer = setInterval(() => {
              if (index <= fullText.length) {
                setTypedText(fullText.slice(0, index));
                index++;
              } else {
                clearInterval(timer);
              }
            }, 30);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, []);

  const whatOrdisDoes = [
    'Watches your workspace for stalled tasks',
    'Suggests actions before deadlines hit',
    'Drafts messages based on real data',
    'Prepares meeting agendas automatically',
    'Summarizes project status on demand',
    'Tracks team velocity and patterns',
  ];

  const whatOrdisDoesNot = [
    'Make decisions for you',
    'Replace team members',
    'Send messages without approval',
    'Change deadlines or priorities',
    'Assign work without your say',
    'Share data outside your workspace',
  ];

  return (
    <section className="lp-ordis-section" id="ordis" ref={sectionRef}>
      <div className="lp-ordis-inner">
        <div className="lp-ordis-badge lp-reveal">Built-In AI</div>
        <div className="lp-section-label lp-reveal" style={{ color: 'var(--c-accent)' }}>
          Meet Ordis
        </div>
        <h2 className="lp-section-title lp-reveal" style={{ maxWidth: '700px', color: '#fff' }}>
          Your workspace has an AI that actually does useful work
        </h2>
        <p className="lp-section-subtitle lp-reveal" style={{ color: 'var(--c-gray-300)' }}>
          Ordis isn't a chatbot. Ordis watches your workspace — tasks, messages, deadlines, people — and
          proactively tells you what needs attention. It notices before you do.
        </p>

        {/* Ordis Demos Grid */}
        <div className="lp-ordis-demos lp-stagger">
          {/* Card 1: Stalled Work */}
          <div className="lp-ordis-demo-card">
            <div className="lp-ordis-demo-label">Notices</div>
            <div className="lp-ordis-demo-title">Detects stalled work</div>
            <div className="lp-ordis-demo-content">
              Ordis sees that a task hasn't been updated in 3 days and the deadline is tomorrow.
            </div>
            <div className="lp-ordis-notif" style={{ background: 'var(--c-dark)', marginBottom: 0 }}>
              <div className="lp-ordis-notif-icon">O</div>
              <div className="lp-ordis-notif-text">
                <strong>"Brand Guidelines"</strong> hasn't been touched in 3 days. Deadline is{' '}
                <strong style={{ color: 'var(--c-error)' }}>tomorrow</strong>.
                <div style={{ marginTop: '6px' }}>
                  <button
                    className="lp-ordis-btn"
                    onClick={() => setNudged(true)}
                    style={{ background: nudged ? 'var(--c-success)' : undefined, color: nudged ? '#fff' : undefined }}
                  >
                    {nudged ? '✓ Nudge Sent to Sarah' : 'Nudge Sarah'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: One-Click Actions */}
          <div className="lp-ordis-demo-card">
            <div className="lp-ordis-demo-label">Helps You Act</div>
            <div className="lp-ordis-demo-title">One-click actions</div>
            <div className="lp-ordis-demo-content">
              Ordis doesn't just tell you problems — it gives you a button to fix them instantly.
            </div>
            <div className="lp-ordis-notif" style={{ background: 'var(--c-dark)', marginBottom: 0 }}>
              <div className="lp-ordis-notif-icon">O</div>
              <div className="lp-ordis-notif-text">
                <strong>Meeting summary</strong> from the 2pm standup is ready.
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                  <button
                    className="lp-ordis-btn"
                    onClick={() => setActionDone('summary')}
                    style={{
                      background: actionDone === 'summary' ? 'var(--c-accent)' : undefined,
                      color: actionDone === 'summary' ? 'var(--c-near-black)' : undefined,
                    }}
                  >
                    {actionDone === 'summary' ? '✓ Summary Opened' : 'View Summary'}
                  </button>
                  <button
                    className="lp-ordis-btn"
                    onClick={() => setActionDone('tasks')}
                    style={{
                      background: actionDone === 'tasks' ? 'var(--c-accent)' : undefined,
                      color: actionDone === 'tasks' ? 'var(--c-near-black)' : undefined,
                    }}
                  >
                    {actionDone === 'tasks' ? '✓ 3 Tasks Created' : 'Create Tasks'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Drafts Messages */}
          <div className="lp-ordis-demo-card">
            <div className="lp-ordis-demo-label">Drafts</div>
            <div className="lp-ordis-demo-title">Writes messages for you</div>
            <div className="lp-ordis-demo-content">
              Need to update a client? Ordis drafts the message based on actual project progress.
            </div>
            <div className="lp-ordis-notif" style={{ background: 'var(--c-dark)', marginBottom: 0, minHeight: '60px' }}>
              <div className="lp-ordis-notif-icon">O</div>
              <div className="lp-ordis-notif-text" style={{ fontFamily: 'monospace' }}>
                {typedText}
                <span className="lp-typewriter-cursor">|</span>
              </div>
            </div>
          </div>

          {/* Card 4: Meeting Prep */}
          <div className="lp-ordis-demo-card">
            <div className="lp-ordis-demo-label">Meetings</div>
            <div className="lp-ordis-demo-title">Preps you before meetings</div>
            <div className="lp-ordis-demo-content">
              Before any meeting, Ordis pulls up related tasks, blockers, and recent updates.
            </div>
            <div className="lp-ordis-notif" style={{ background: 'var(--c-dark)', marginBottom: 0 }}>
              <div className="lp-ordis-notif-icon">O</div>
              <div className="lp-ordis-notif-text">
                <strong>Dev Standup</strong> in 30 min. Here's what happened since last meeting:
                <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--c-gray-300)' }}>
                  - 4 tasks completed
                  <br />
                  - 2 blockers flagged
                  <br />- 1 new bug reported
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 10: Philosophy in Dark Mode */}
        <div style={{ marginTop: 'var(--sp-12)', textAlign: 'center' }}>
          <div className="lp-section-label" style={{ color: 'var(--c-accent)' }}>
            Ordis Philosophy
          </div>
          <h2 className="lp-section-title" style={{ color: '#fff' }}>
            Ordis is free. And it's not coming for your job.
          </h2>
          <p className="lp-section-subtitle" style={{ color: 'var(--c-gray-300)' }}>
            Ordis helps your existing team work better. It doesn't replace anyone. It notices things humans miss and
            suggests — you decide.
          </p>

          <div className="lp-ordis-lists lp-stagger" style={{ marginTop: 'var(--sp-8)' }}>
            <div className="lp-ordis-list">
              <div className="lp-ordis-list-title green">What Ordis Does</div>
              {whatOrdisDoes.map((item) => (
                <div key={item} className="lp-ordis-list-item" style={{ color: '#fff' }}>
                  <span className="lp-ordis-list-check" style={{ color: 'var(--c-success)' }}>
                    +
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="lp-ordis-list">
              <div className="lp-ordis-list-title red">What Ordis Does Not Do</div>
              {whatOrdisDoesNot.map((item) => (
                <div key={item} className="lp-ordis-list-item" style={{ color: '#fff' }}>
                  <span className="lp-ordis-list-check" style={{ color: 'var(--c-error)' }}>
                    -
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
