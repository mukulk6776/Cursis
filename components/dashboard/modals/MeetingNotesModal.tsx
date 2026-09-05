'use client';

import React from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate } from '@/lib/dashboard/data';

export default function MeetingNotesModal() {
  const { activeModal, closeModal, selectedMeetingNotes, getEmployee, addTask, showToast } = useDashboard();

  if (activeModal !== 'meeting-notes-modal' || !selectedMeetingNotes) return null;

  const meeting = selectedMeetingNotes;
  const s = meeting.aiSummary;
  const platform = meeting.platform || 'google_meet';
  const meetingUrl = meeting.meetingUrl || 'https://meet.google.com/new';

  const platformLabel =
    platform === 'google_meet'
      ? 'Google Meet'
      : platform === 'zoom'
      ? 'Zoom'
      : platform === 'teams'
      ? 'Microsoft Teams'
      : 'External Link';

  const platformBadgeClass =
    platform === 'google_meet'
      ? 'badge-success'
      : platform === 'zoom'
      ? 'badge-brand'
      : 'badge-neutral';

  const copyMeetingLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(meetingUrl);
      showToast('Meeting link copied to clipboard ✓');
    }
  };

  const handleConvertActionItems = () => {
    if (!s || !s.actionItems) return;
    s.actionItems.forEach((item) => {
      addTask({
        name: item.task,
        assignee: item.assignee,
        deadline: item.deadline,
        priority: 'high',
        status: 'todo',
        project: meeting.project || undefined,
        tags: ['meeting-action'],
      });
    });
    showToast(`${s.actionItems.length} tasks generated from AI notes ✓`);
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="meeting-notes-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <span className="modal-title">Meeting Details &amp; Notes</span>
          <button className="modal-close" onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Header info */}
          <div style={{ marginBottom: 'var(--sp-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--sp-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-1)' }}>
              <span className={`badge ${platformBadgeClass}`}>{platformLabel}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                {formatDate(meeting.date)} · {meeting.time} · {meeting.duration} min
              </span>
            </div>
            <h3 style={{ margin: 'var(--sp-2) 0', fontSize: 'var(--fs-xl)' }}>{meeting.name || meeting.title}</h3>
          </div>

          {/* Conference Link Card */}
          <div
            className="card"
            style={{
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'var(--c-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--sp-3)',
              marginBottom: 'var(--sp-4)',
            }}
          >
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                Conference Link
              </div>
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  color: 'var(--c-brand)',
                  textDecoration: 'none',
                }}
              >
                {meetingUrl}
              </a>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={copyMeetingLink}
                title="Copy Link"
              >
                Copy
              </button>
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-brand btn-sm"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Join Call ↗
              </a>
            </div>
          </div>

          {/* Agenda */}
          {meeting.agenda && (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                📋 Agenda &amp; Discussion Points
              </h5>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: 'var(--c-gray-100)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {meeting.agenda}
              </p>
            </div>
          )}

          {/* Notes */}
          {meeting.notes && (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                📝 Preparation Notes
              </h5>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: 'var(--c-gray-100)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {meeting.notes}
              </p>
            </div>
          )}

          {/* AI Summary / Transcript */}
          {s ? (
            <>
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                  🤖 AI Executive Summary
                </h5>
                <p
                  style={{
                    fontSize: 'var(--fs-sm)',
                    background: 'var(--c-gray-100)',
                    padding: 'var(--sp-3)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {s.summary}
                </p>
              </div>

              {/* Key Decisions */}
              {s.decisions && s.decisions.length > 0 && (
                <div style={{ marginBottom: 'var(--sp-4)' }}>
                  <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                    ✅ Key Decisions
                  </h5>
                  {s.decisions.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 'var(--sp-2)',
                        alignItems: 'flex-start',
                        marginBottom: 'var(--sp-2)',
                        fontSize: 'var(--fs-sm)',
                      }}
                    >
                      <span style={{ color: 'var(--c-success)' }}>✓</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Items */}
              {s.actionItems && s.actionItems.length > 0 && (
                <div style={{ marginBottom: 'var(--sp-4)' }}>
                  <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                    📌 Extracted Action Items
                  </h5>
                  {s.actionItems.map((a, i) => {
                    const assignee = getEmployee(a.assignee);
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--sp-3)',
                          padding: 'var(--sp-2) var(--sp-3)',
                          background: 'var(--c-gray-100)',
                          borderRadius: 'var(--border-radius-md)',
                          marginBottom: 'var(--sp-2)',
                          fontSize: 'var(--fs-sm)',
                        }}
                      >
                        <span style={{ flex: 1, fontWeight: 'var(--fw-medium)' }}>{a.task}</span>
                        {assignee && (
                          <div
                            className="avatar avatar-sm"
                            style={{ background: assignee.color }}
                            title={assignee.name}
                          >
                            {assignee.initials}
                          </div>
                        )}
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)' }}>
                          {formatDate(a.deadline)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            !meeting.agenda && !meeting.notes && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
                No notes or agenda recorded for this meeting.
              </div>
            )
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>
            Close
          </button>
          {s && s.actionItems && s.actionItems.length > 0 && (
            <button className="btn btn-primary" onClick={handleConvertActionItems}>
              Create Tasks from Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
