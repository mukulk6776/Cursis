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
          <div className="lp-bento-card lp-creators-card">
            <div className="tano-washi-tape" style={{ top: -11, right: 32, transform: 'rotate(-2deg)' }} aria-hidden="true" />
            <div className="lp-card-subhead">
              <span className="lp-card-tag-tano">Content Pipeline</span>
              <span className="lp-card-hint">(Click step to toggle)</span>
            </div>
            <div className="lp-pipeline-list">
              {pipeline.map((item) => (
                <div
                  key={item.num}
                  onClick={() => toggleStep(item.num)}
                  className={`lp-pipeline-tano-item ${item.done ? 'completed' : ''}`}
                  title={`${item.label}: ${item.desc}`}
                >
                  <span className="lp-pipeline-tano-badge">
                    {item.done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      item.num
                    )}
                  </span>
                  <div className="lp-pipeline-tano-info">
                    <span className="lp-pipeline-tano-label">
                      {item.label}
                    </span>
                    <span className="lp-pipeline-tano-desc">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Roles Card */}
          <div className="lp-bento-card lp-creators-card">
            <div className="tano-washi-tape" style={{ top: -11, left: 32, transform: 'rotate(2.5deg)' }} aria-hidden="true" />
            <div className="lp-card-subhead">
              <span className="lp-card-tag-tano">Creator Crew Roles</span>
              <span className="lp-card-hint">Modular team roles</span>
            </div>
            <div className="lp-roles-list">
              {roles.map((r) => (
                <div
                  key={r.code}
                  className={`lp-role-tano-item ${selectedRole === r.code ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(selectedRole === r.code ? null : r.code)}
                >
                  <span
                    className="lp-role-tano-avatar"
                    style={{ background: r.color }}
                  >
                    {r.code}
                  </span>
                  <div className="lp-role-tano-info">
                    <span className="lp-role-tano-title">{r.title}</span>
                    <span className="lp-role-tano-duty">{r.duty}</span>
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
