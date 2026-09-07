'use client';

import React, { useState } from 'react';

export default function CreatorsSection() {
  const [pipeline, setPipeline] = useState([
    { num: '1', label: 'Idea / Script', done: false, desc: 'Hook draft, script outline, timestamp markers' },
    { num: '2', label: 'Shoot / Record', done: false, desc: 'A-roll camera sync, mic audio check, B-roll prompts' },
    { num: '3', label: 'Edit / Review', done: false, desc: 'Rough cut assembly, jump cut pacing, sound design' },
    { num: '4', label: 'Thumbnail / Assets', done: false, desc: 'A/B thumbnail testing, title hooks, end screens' },
    { num: '5', label: 'Publish', done: true, desc: 'Multi-platform scheduling, SEO tags, comment pin' },
  ]);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const toggleStep = (num: string) => {
    setPipeline((prev) =>
      prev.map((item) => (item.num === num ? { ...item, done: !item.done } : item))
    );
  };

  const roles = [
    { code: 'SE', title: 'Script Editor', color: '#0f4cff', duty: 'Refines video hooks, ensures narrative retention and pacing' },
    { code: 'VE', title: 'Video Editor', color: '#8b5cf6', duty: 'Cuts footage, motion graphics, audio sync and visual SFX' },
    { code: 'TD', title: 'Thumbnail Designer', color: '#f59e0b', duty: 'Generates high-CTR concepts, color grading, title typography' },
    { code: 'SM', title: 'Social Manager', color: '#10b981', duty: 'Shorts repurposing, TikTok clipping, community engagement' },
    { code: 'VO', title: 'Voiceover Artist', color: '#ef4444', duty: 'Narrations, localization, sponsor reads, audio master' },
  ];

  return (
    <section className="lp-section lp-technical-grid" id="creators" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
      <div className="lp-creators-container">
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--c-brand, #0f4cff)',
              marginBottom: '8px',
            }}
          >
            FOR CREATORS
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#000000',
              marginBottom: '14px',
            }}
          >
            RUN YOUR CONTENT LIKE A PRODUCTION HOUSE
          </h2>
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#333333',
              maxWidth: '750px',
              fontWeight: 500,
            }}
          >
            YouTubers, podcasters, writers, designers — Cursis gives you the same
            workflow tools that agencies use, without the agency price tag.
          </p>
        </div>

        <div className="lp-creators-cards-row">
          {/* Content Pipeline Card */}
          <div className="lp-brutalist-card">
            <div className="lp-card-subhead">
              <span>CONTENT PIPELINE</span>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: 700 }}>(Click step to toggle)</span>
            </div>
            <div className="lp-pipeline-list">
              {pipeline.map((item) => (
                <div
                  key={item.num}
                  onClick={() => toggleStep(item.num)}
                  className={`lp-pipeline-item ${item.done ? 'active' : ''}`}
                  title={`${item.label}: ${item.desc}`}
                >
                  <span className={`lp-pipeline-num ${item.done ? 'done' : 'pending'}`}>
                    {item.done ? '✓' : item.num}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="lp-pipeline-label">{item.label}</span>
                    <span style={{ fontSize: '10px', color: '#666', fontWeight: 500 }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Roles Card */}
          <div className="lp-brutalist-card">
            <div className="lp-card-subhead">
              <span>TEAM ROLES</span>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: 700 }}>Built for creator crews</span>
            </div>
            <div className="lp-roles-list">
              {roles.map((r) => (
                <div
                  key={r.code}
                  className="lp-role-item"
                  onClick={() => setSelectedRole(selectedRole === r.code ? null : r.code)}
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedRole === r.code ? '#000' : 'rgba(0,0,0,0.15)',
                    background: selectedRole === r.code ? '#ffffff' : '#fbfbf9',
                    boxShadow: selectedRole === r.code ? '2px 2px 0 #000' : 'none',
                  }}
                >
                  <span className="lp-role-badge" style={{ background: r.color }}>
                    {r.code}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span className="lp-role-title">{r.title}</span>
                    <span style={{ fontSize: '10px', color: '#666', fontWeight: 500 }}>{r.duty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
