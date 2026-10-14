'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatDate } from '@/lib/dashboard/data';

export default function MeetingNotesModal() {
  const { activeModal, closeModal, selectedMeetingNotes, getEmployee, addTask, showToast } = useDashboard();

  // All hooks MUST be declared unconditionally at top level
  const [converted, setConverted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Reset converted state when selected meeting changes
  useEffect(() => {
    setConverted(false);
    setIsConverting(false);
  }, [selectedMeetingNotes?.id]);

  if (activeModal !== 'meeting-notes-modal' || !selectedMeetingNotes) return null;

  const meeting = selectedMeetingNotes;
  const s = meeting.aiSummary;
  const actionItems: { task: string; assignee: string; deadline: string }[] =
    (s?.actionItems && s.actionItems.length > 0
      ? s.actionItems
      : (meeting as any).actionItems?.map((a: any) => ({
          task: a.text || a.title || a.task || 'Action item',
          assignee: a.assigneeId || a.assignee || '',
          deadline: a.dueDate || a.deadline || '',
        })) || []);
  const summaryText = s?.summary || meeting.summary || (meeting.notes && !meeting.agenda ? meeting.notes : null);
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

  const copyMeetingLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(meetingUrl);
        showToast('Meeting link copied to clipboard');
      } else {
        showToast('Clipboard not supported in this browser');
      }
    } catch {
      showToast('Failed to copy meeting link');
    }
  };

  const handleConvertActionItems = async () => {
    if (converted || isConverting || actionItems.length === 0) return;
    setIsConverting(true);

    try {
      for (const item of actionItems) {
        await addTask({
          name: item.task,
          assignee: item.assignee,
          deadline: item.deadline || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          priority: 'high',
          status: 'todo',
          project: meeting.project || undefined,
          tags: ['meeting-action'],
        });
      }
      setConverted(true);
      showToast(`${actionItems.length} tasks generated from notes`);
      closeModal();
    } catch {
      showToast('Failed to create tasks from meeting notes');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      id="meeting-notes-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-notes-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <span className="modal-title" id="meeting-notes-title">Meeting Details &amp; Notes</span>
          <button className="modal-close" onClick={closeModal} aria-label="Close meeting notes modal">
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
              background: 'var(--c-surface, #ffffff)',
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
                aria-label="Copy meeting link to clipboard"
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
                Agenda &amp; Discussion Points
              </h5>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: 'var(--c-gray-100, #f3f4f6)',
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
                Preparation Notes
              </h5>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: 'var(--c-gray-100, #f3f4f6)',
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

          {/* Executive Summary / Notes */}
          {summaryText && (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                {s ? 'AI Executive Summary' : 'Meeting Summary & Highlights'}
              </h5>
              <p
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: 'var(--c-gray-100, #f3f4f6)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {summaryText}
              </p>
            </div>
          )}

          {/* Key Decisions */}
          {s && s.decisions && s.decisions.length > 0 && (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                Key Decisions
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
                  <span style={{ color: 'var(--c-success)' }}>•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Items */}
          {actionItems && actionItems.length > 0 && (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h5 style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                Extracted Action Items
              </h5>
              {actionItems.map((a, i) => {
                const assignee = getEmployee(a.assignee);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-3)',
                      padding: 'var(--sp-2) var(--sp-3)',
                      background: 'var(--c-gray-100, #f3f4f6)',
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
                      {a.deadline ? formatDate(a.deadline) : 'No due date'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!summaryText && !meeting.agenda && !meeting.notes && actionItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
              No notes or agenda recorded for this meeting.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>
            Close
          </button>
          {actionItems.length > 0 && !converted && (
            <button
              className="btn btn-primary"
              onClick={handleConvertActionItems}
              disabled={isConverting}
            >
              {isConverting ? 'Creating Tasks...' : 'Create Tasks from Notes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
