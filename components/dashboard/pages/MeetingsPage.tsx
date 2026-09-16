'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { Meeting, MeetingPlatform } from '@/lib/dashboard/types';
import { formatDate } from '@/lib/dashboard/data';

export default function MeetingsPage() {
  const {
    meetings,
    employees,
    projects,
    openModal,
    openMeetingNotes,
    updateMeeting,
    deleteMeeting,
    showToast,
  } = useDashboard();

  const [currentTab, setCurrentTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeetings = meetings.filter((m) => {
    const isCompleted = m.status === 'completed';
    if (currentTab === 'upcoming' && isCompleted) return false;
    if (currentTab === 'completed' && !isCompleted) return false;

    if (platformFilter !== 'all' && (m.platform || 'google_meet') !== platformFilter) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (m.name || m.title || '').toLowerCase();
    const agenda = (m.agenda || '').toLowerCase();
    const notes = (m.notes || '').toLowerCase();
    return title.includes(q) || agenda.includes(q) || notes.includes(q);
  });

  const getEmployee = (id: string) => employees.find((e) => e.id === id);
  const getProject = (id?: string | null) => (id ? projects.find((p) => p.id === id) : null);

  const copyMeetingLink = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Meeting link copied to clipboard');
    }
  };

  const toggleComplete = (m: Meeting) => {
    const nextStatus = m.status === 'completed' ? 'scheduled' : 'completed';
    updateMeeting(m.id, { status: nextStatus });
    showToast(nextStatus === 'completed' ? 'Meeting marked as completed' : 'Meeting marked as scheduled');
  };

  const getPlatformMeta = (platform?: MeetingPlatform) => {
    switch (platform) {
      case 'zoom':
        return { label: 'Zoom' };
      case 'teams':
        return { label: 'Teams' };
      case 'other':
        return { label: 'Conference' };
      case 'google_meet':
      default:
        return { label: 'Google Meet' };
    }
  };

  return (
    <div className="page active" id="page-meetings" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0A0A0A' }}>
              Meetings
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--c-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                textTransform: 'uppercase',
              }}
            >
              {meetings.length} syncs
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Coordinate video conferences, 1:1 syncs, and team planning sessions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href="https://meet.google.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600, textDecoration: 'none' }}
          >
            Open Meet ↗
          </a>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('meeting-modal')}
            style={{ fontWeight: 700 }}
          >
            + Schedule Meeting
          </button>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, and Platform Filter */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: 'var(--c-white)',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${currentTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: currentTab === 'upcoming' ? 700 : 500 }}
            onClick={() => setCurrentTab('upcoming')}
          >
            Upcoming ({meetings.filter((m) => m.status !== 'completed').length})
          </button>
          <button
            type="button"
            className={`btn ${currentTab === 'completed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: currentTab === 'completed' ? 700 : 500 }}
            onClick={() => setCurrentTab('completed')}
          >
            Past ({meetings.filter((m) => m.status === 'completed').length})
          </button>
          <button
            type="button"
            className={`btn ${currentTab === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ fontSize: '12px', padding: '3px 10px', height: '30px', fontWeight: currentTab === 'all' ? 700 : 500 }}
            onClick={() => setCurrentTab('all')}
          >
            All ({meetings.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input select"
            style={{ height: '32px', fontSize: '12px', padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="google_meet">Google Meet</option>
            <option value="zoom">Zoom</option>
            <option value="teams">Microsoft Teams</option>
            <option value="other">Other Link</option>
          </select>

          <input
            type="text"
            className="input"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '180px', height: '32px', fontSize: '12px', padding: '0 10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* Meetings Grid / List */}
      {filteredMeetings.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--c-white)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#0A0A0A' }}>
            No meetings found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px' }}>
            {searchQuery
              ? 'No meetings match your search query. Try clearing filters.'
              : 'Schedule a conference call with your Google Meet link to coordinate with team members.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('meeting-modal')}
            style={{ fontWeight: 700 }}
          >
            + Schedule Meeting
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {filteredMeetings.map((m) => {
            const platformMeta = getPlatformMeta(m.platform);
            const linkedProject = getProject(m.project || m.projectId);
            const meetingUrl = m.meetingUrl || 'https://meet.google.com/new';
            const isCompleted = m.status === 'completed';

            return (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isCompleted ? 0.75 : 1,
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--c-white)',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(15, 76, 255, 0.08)',
                        color: '#0f4cff',
                        border: '1px solid rgba(15, 76, 255, 0.2)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {platformMeta.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatDate(m.date)} · {m.time} ({m.duration} min)
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#0A0A0A' }}>
                    {m.name || m.title}
                  </h3>

                  {linkedProject && (
                    <div style={{ marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-secondary)',
                          background: 'var(--c-surface)',
                          border: '1px solid var(--border-color)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {linkedProject.name}
                      </span>
                    </div>
                  )}

                  {m.agenda && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        margin: '0 0 10px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {m.agenda}
                    </p>
                  )}

                  {/* Attendees */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {(m.participants || m.attendees || ['u1']).map((pId) => {
                      const emp = getEmployee(pId);
                      return (
                        <div
                          key={pId}
                          className="avatar avatar-xs"
                          style={{ background: emp?.color || '#0f4cff', fontSize: '9px', width: '20px', height: '20px' }}
                          title={emp?.name || pId}
                        >
                          {emp?.initials || 'U'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{
                        flex: 1,
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Join Meeting ↗
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '0 8px', height: '30px' }}
                      onClick={() => copyMeetingLink(meetingUrl)}
                    >
                      Copy Link
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0f4cff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: 0,
                      }}
                      onClick={() => openMeetingNotes(m)}
                    >
                      Notes &amp; Details →
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isCompleted ? '#0f4cff' : '#16a34a',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: 0,
                        }}
                        onClick={() => toggleComplete(m)}
                      >
                        {isCompleted ? 'Reopen' : 'Done'}
                      </button>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: 0,
                        }}
                        onClick={() => {
                          if (confirm(`Delete meeting "${m.name || m.title}"?`)) {
                            deleteMeeting(m.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
