'use client';

import React, { useState } from 'react';

export default function CreatorsSection() {
  const [pipeline, setPipeline] = useState([
    { num: '1', label: 'Idea / Script', done: false, desc: 'Write the idea, outline, and script' },
    { num: '2', label: 'Shoot / Record', done: false, desc: 'Record video, check the sound, and gather extra shots' },
    { num: '3', label: 'Edit / Review', done: false, desc: 'Edit the video and collect team feedback' },
    { num: '4', label: 'Cover Image / Title', done: false, desc: 'Choose the cover image, title, and end screen' },
    { num: '5', label: 'Publish', done: true, desc: 'Check the final video and plan when to share it' },
  ]);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const toggleStep = (num: string) => {
    setPipeline((prev) =>
      prev.map((item) => (item.num === num ? { ...item, done: !item.done } : item))
    );
  };

  const roles = [
    { code: 'SE', title: 'Script Editor', color: '#2965ff', duty: 'Makes the script clear and keeps the story interesting' },
    { code: 'VE', title: 'Video Editor', color: '#8b5cf6', duty: 'Edits the video and adds sound and effects' },
    { code: 'TD', title: 'Cover Image Designer', color: '#f59e0b', duty: 'Creates cover images that help viewers notice your videos' },
    { code: 'SM', title: 'Social Manager', color: '#10b981', duty: 'Shares clips and replies to your audience' },
    { code: 'VO', title: 'Voiceover Artist', color: '#ef4444', duty: 'Records clear voiceovers for your videos' },
  ];

  return (
    <section className="lp-section" id="creators">
      <div className="lp-creators-container">
        <div className="lp-section-header" style={{ marginBottom: '40px' }}>
          <div className="lp-section-label">Media & Creators</div>
          <h2 className="lp-section-title">Get every video ready to share.</h2>
          <p className="lp-section-subtitle">
            Keep scripts, files, feedback, and deadlines together, so your next video does not get stuck in review.
          </p>
        </div>

        <div className="lp-creators-cards-row">
          {/* Video Checklist Card */}
          <div className="lp-bento-card lp-creators-card">
            <div className="tano-washi-tape" style={{ top: -11, right: 32, transform: 'rotate(-2deg)' }} aria-hidden="true" />
            <div className="lp-card-subhead">
              <span className="lp-card-tag-tano">Video Checklist</span>
              <span className="lp-card-hint">(Click a step to mark it done)</span>
            </div>
            <div className="lp-pipeline-list">
              {pipeline.map((item) => (
                <div
                  key={item.num}
                  role="button" tabIndex={0} aria-pressed={item.done} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleStep(item.num); } }} onClick={() => toggleStep(item.num)}
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
              <span className="lp-card-tag-tano">Your Creative Team</span>
              <span className="lp-card-hint">Who does what</span>
            </div>
            <div className="lp-roles-list">
              {roles.map((r) => (
                <div
                  key={r.code}
                  className={`lp-role-tano-item ${selectedRole === r.code ? 'selected' : ''}`}
                  role="button" tabIndex={0} aria-pressed={selectedRole === r.code} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedRole(selectedRole === r.code ? null : r.code); } }} onClick={() => setSelectedRole(selectedRole === r.code ? null : r.code)}
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
