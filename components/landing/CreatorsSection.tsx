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
    { code: 'SE', title: 'Script Editor', color: '#2965ff', duty: 'Refines video hooks, ensures narrative retention and pacing' },
    { code: 'VE', title: 'Video Editor', color: '#8b5cf6', duty: 'Cuts footage, motion graphics, audio sync and visual SFX' },
    { code: 'TD', title: 'Thumbnail Designer', color: '#f59e0b', duty: 'Generates high-CTR concepts, color grading, title typography' },
    { code: 'SM', title: 'Social Manager', color: '#10b981', duty: 'Shorts repurposing, TikTok clipping, community engagement' },
    { code: 'VO', title: 'Voiceover Artist', color: '#ef4444', duty: 'Narrations, localization, sponsor reads, audio master' },
  ];

  return (
    <section className="lp-section" id="creators">
      <div className="lp-creators-container">
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div className="lp-section-label">For Media &amp; Creators</div>
          <h2 className="lp-section-title">Run Content Workflows Like a Studio</h2>
          <p className="lp-section-subtitle" style={{ margin: '8px 0 0' }}>
            YouTubers, podcasters, writers, designers — Cursis gives you the same high-velocity production pipelines that top agencies use.
          </p>
        </div>

        <div className="lp-creators-cards-row">
          {/* Content Pipeline Card */}
          <div className="lp-bento-card">
            <div className="lp-card-subhead" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: '#1A1612' }}>Content Pipeline</span>
              <span style={{ fontSize: '11px', color: '#8C8477', fontWeight: 600 }}>(Click step to toggle)</span>
            </div>
            <div className="lp-pipeline-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pipeline.map((item) => (
                <div
                  key={item.num}
                  onClick={() => toggleStep(item.num)}
                  className={`lp-pipeline-item ${item.done ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: item.done ? '#FAF8F5' : '#FFFFFF',
                    border: item.done ? '1px solid #E8E4DE' : '1px solid #E8E4DE',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${item.label}: ${item.desc}`}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      background: item.done ? '#10b981' : '#FAF8F5',
                      color: item.done ? '#FFFFFF' : '#8C8477',
                      border: item.done ? 'none' : '1px solid #E8E4DE',
                      flexShrink: 0,
                    }}
                  >
                    {item.done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      item.num
                    )}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.done ? '#8C8477' : '#1A1612', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8C8477' }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Roles Card */}
          <div className="lp-bento-card">
            <div className="lp-card-subhead" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: '#1A1612' }}>Creator Crew Roles</span>
              <span style={{ fontSize: '11px', color: '#8C8477', fontWeight: 600 }}>Modular team roles</span>
            </div>
            <div className="lp-roles-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roles.map((r) => (
                <div
                  key={r.code}
                  className="lp-role-item"
                  onClick={() => setSelectedRole(selectedRole === r.code ? null : r.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: selectedRole === r.code ? '1px solid #2965ff' : '1px solid #E8E4DE',
                    background: selectedRole === r.code ? '#F4F7FF' : '#FFFFFF',
                    boxShadow: selectedRole === r.code ? '0 2px 8px rgba(41,101,255,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: r.color,
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {r.code}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1612' }}>{r.title}</span>
                    <span style={{ fontSize: '11px', color: '#8C8477' }}>{r.duty}</span>
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
