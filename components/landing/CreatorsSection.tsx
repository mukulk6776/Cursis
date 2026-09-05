import React from 'react';

export default function CreatorsSection() {
  const pipeline = [
    { num: '1', label: 'Idea / Script', done: false },
    { num: '2', label: 'Shoot / Record', done: false },
    { num: '3', label: 'Edit / Review', done: false },
    { num: '4', label: 'Thumbnail / Assets', done: false },
    { num: '5', label: 'Publish', done: true },
  ];

  const roles = [
    { code: 'SE', title: 'Script Editor', color: 'var(--c-brand)' },
    { code: 'VE', title: 'Video Editor', color: 'var(--c-purple)' },
    { code: 'TD', title: 'Thumbnail Designer', color: 'var(--c-warning)' },
    { code: 'SM', title: 'Social Manager', color: 'var(--c-success)' },
    { code: 'VO', title: 'Voiceover Artist', color: 'var(--c-error)' },
  ];

  return (
    <section className="lp-section" id="creators">
      <div className="lp-section-label lp-reveal">For Creators</div>
      <h2 className="lp-section-title lp-reveal">Run your content like a production house</h2>
      <p className="lp-section-subtitle lp-reveal">
        YouTubers, podcasters, writers, designers — Cursis gives you the same workflow tools that agencies use,
        without the agency price tag.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--sp-5)',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Pipeline Card */}
        <div className="card lp-reveal-left">
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--c-brand)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            Content Pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pipeline.map((item) => (
              <div key={item.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.done ? 'var(--c-success)' : 'var(--c-accent)',
                    border: '1px solid var(--c-near-black)',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: item.done ? '#fff' : 'var(--c-near-black)',
                  }}
                >
                  {item.num}
                </span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Card */}
        <div className="card lp-reveal-right">
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--c-brand)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            Team Roles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {roles.map((r) => (
              <div key={r.code} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="avatar avatar-sm" style={{ background: r.color, fontSize: '9px', color: '#fff' }}>
                  {r.code}
                </span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
