'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { MeetingPlatform } from '@/lib/dashboard/types';

export default function MeetingModal() {
  const { activeModal, closeModal, addMeeting, projects, employees, meetingCalendarSettings, user, showToast } = useDashboard();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<MeetingPlatform>(meetingCalendarSettings?.defaultPlatform || 'google_meet');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/new');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00');
  const [duration, setDuration] = useState<number>(meetingCalendarSettings?.defaultDuration || 30);
  const [project, setProject] = useState(projects[0]?.id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(user?.id ? [user.id] : []);
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');

  if (activeModal !== 'meeting-modal') return null;

  const handlePlatformChange = (newPlatform: MeetingPlatform) => {
    setPlatform(newPlatform);
    if (newPlatform === 'google_meet' && (!meetingUrl || meetingUrl.includes('zoom.us') || meetingUrl.includes('teams.microsoft'))) {
      setMeetingUrl('https://meet.google.com/new');
    } else if (newPlatform === 'zoom' && (!meetingUrl || meetingUrl.includes('meet.google') || meetingUrl.includes('teams.microsoft'))) {
      setMeetingUrl('https://zoom.us/start/videomeeting');
    } else if (newPlatform === 'teams' && (!meetingUrl || meetingUrl.includes('meet.google') || meetingUrl.includes('zoom.us'))) {
      setMeetingUrl('https://teams.microsoft.com/l/meetup-join/instant');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!meetingUrl.trim()) {
      showToast('Please provide a meeting link');
      return;
    }

    addMeeting({
      name: name.trim(),
      platform,
      meetingUrl: meetingUrl.trim(),
      date,
      time,
      duration: Number(duration),
      durationMinutes: Number(duration),
      project: project || null,
      participants: selectedParticipants.length > 0 ? selectedParticipants : (user?.id ? [user.id] : []),
      hostId: user?.id,
      hostName: user?.name,
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <span className="modal-title" id="meeting-modal-title">Schedule Meeting (Google Meet / Zoom)</span>
          <button className="modal-close" onClick={closeModal} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Meeting Title */}
            <div className="input-group">
              <label className="input-label" htmlFor="meeting-title">Meeting Title</label>
              <input
                id="meeting-title"
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
                <label className="input-label" htmlFor="meeting-platform">Platform</label>
                <select
                  id="meeting-platform"
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
                <label className="input-label" htmlFor="meeting-url">Meeting Link</label>
                <input
                  id="meeting-url"
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
                <label className="input-label" htmlFor="meeting-date">Date</label>
                <input
                  id="meeting-date"
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Time */}
              <div className="input-group">
                <label className="input-label" htmlFor="meeting-time">Time</label>
                <input
                  id="meeting-time"
                  className="input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              {/* Duration */}
              <div className="input-group">
                <label className="input-label" htmlFor="meeting-duration">Duration</label>
                <select
                  id="meeting-duration"
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
 {emp.name} {isSelected ? '' : '+'}
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
