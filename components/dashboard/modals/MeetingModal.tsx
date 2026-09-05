'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { MeetingPlatform } from '@/lib/dashboard/types';

export default function MeetingModal() {
  const { activeModal, closeModal, addMeeting, projects, employees, showToast } = useDashboard();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<MeetingPlatform>('google_meet');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/new');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00');
  const [duration, setDuration] = useState<number>(30);
  const [project, setProject] = useState(projects[0]?.id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['u1']);
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');

  if (activeModal !== 'meeting-modal') return null;

  const handlePlatformChange = (newPlatform: MeetingPlatform) => {
    setPlatform(newPlatform);
    if (newPlatform === 'google_meet') {
      const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      setMeetingUrl(`https://meet.google.com/${code}`);
    } else if (newPlatform === 'zoom') {
      const num = Math.floor(1000000000 + Math.random() * 9000000000);
      setMeetingUrl(`https://zoom.us/j/${num}`);
    } else if (newPlatform === 'teams') {
      setMeetingUrl('https://teams.microsoft.com/l/meetup-join/instant');
    } else {
      setMeetingUrl('');
    }
  };

  const generateGoogleMeetLink = () => {
    const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const url = `https://meet.google.com/${code}`;
    setPlatform('google_meet');
    setMeetingUrl(url);
    showToast('Generated Google Meet link');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addMeeting({
      name: name.trim(),
      platform,
      meetingUrl: meetingUrl.trim() || 'https://meet.google.com/new',
      date,
      time,
      duration: Number(duration),
      durationMinutes: Number(duration),
      project: project || null,
      participants: selectedParticipants,
      agenda: agenda.trim(),
      notes: notes.trim(),
    });

    setName('');
    setAgenda('');
    setNotes('');
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="meeting-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <span className="modal-title">Schedule Meeting (Google Meet / Zoom)</span>
          <button className="modal-close" onClick={closeModal}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Meeting Title */}
            <div className="input-group">
              <label className="input-label">Meeting Title</label>
              <input
                className="input"
                placeholder="e.g. Sprint Architecture Sync"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Platform & Meeting Link */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 'var(--sp-3)' }}>
              <div className="input-group">
                <label className="input-label">Platform</label>
                <select
                  className="input select"
                  value={platform}
                  onChange={(e) => handlePlatformChange(e.target.value as MeetingPlatform)}
                >
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other / Custom</option>
                </select>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label">Meeting Link</label>
                  <button
                    type="button"
                    onClick={generateGoogleMeetLink}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--c-brand)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    + Gen Meet Link
                  </button>
                </div>
                <input
                  className="input"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              {/* Date */}
              <div className="input-group">
                <label className="input-label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Time */}
              <div className="input-group">
                <label className="input-label">Time</label>
                <input
                  className="input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              {/* Duration */}
              <div className="input-group">
                <label className="input-label">Duration</label>
                <select
                  className="input select"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              {/* Project */}
              <div className="input-group">
                <label className="input-label">Linked Project</label>
                <select
                  className="input select"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participants */}
            <div className="input-group">
              <label className="input-label">Participants &amp; Attendees</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {employees.map((emp) => {
                  const isSelected = selectedParticipants.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      className="tag"
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'var(--c-near-black)' : 'var(--c-gray-200)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                      }}
                      onClick={() => {
                        setSelectedParticipants((prev) =>
                          isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                        );
                      }}
                    >
                      {emp.name} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agenda */}
            <div className="input-group">
              <label className="input-label">Agenda &amp; Discussion Points</label>
              <textarea
                className="input textarea"
                placeholder="Key items to discuss and align on..."
                rows={2}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              />
            </div>

            {/* Preparation Notes */}
            <div className="input-group">
              <label className="input-label">Preparation Notes / Documents Link (Optional)</label>
              <textarea
                className="input textarea"
                placeholder="Add links to specs, tickets, or reference docs..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
