'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function EventModal() {
  const { activeModal, closeModal, projects, activeWorkspaceId, showToast } = useDashboard();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'event' | 'milestone' | 'deadline' | 'sync' | 'workshop'>('event');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'event-modal') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const startTime = `${date}T${time}:00.000Z`;
      const endTimestamp = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
      const endTime = endTimestamp.toISOString();

      const token = typeof window !== 'undefined' ? localStorage.getItem('cursis_token') : null;
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          type: eventType,
          startTime,
          endTime,
          location: location.trim() || 'General Event',
          linkedProjectId: projectId || undefined,
          description: description.trim(),
          workspaceId: activeWorkspaceId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create event');
      }

      showToast(`Event "${title.trim()}" created successfully`);
      setTitle('');
      setDescription('');
      setLocation('');
      setProjectId('');
      closeModal();
    } catch (err: any) {
      showToast(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      id="event-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #E5E7EB)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#111827' }}>
              Create Calendar Event
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>
              Schedule milestones, company events, release deadlines, or team syncs.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={closeModal}
            style={{ fontSize: '16px', padding: '2px 8px', color: '#6B7280' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                Event Title *
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Q4 Strategy Review / All-Hands / Product Launch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                }}
              />
            </div>

            {/* Type & Project */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Category
                </label>
                <select
                  className="input select"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: '13px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                  }}
                >
                  <option value="event">General Event</option>
                  <option value="milestone">Milestone</option>
                  <option value="deadline">Project Deadline</option>
                  <option value="sync">Team Sync</option>
                  <option value="workshop">Workshop / Training</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Linked Project (Optional)
                </label>
                <select
                  className="input select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: '13px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">None / General Workspace</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  className="input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Duration
                </label>
                <select
                  className="input select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                  }}
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>Half day</option>
                  <option value={480}>Full day</option>
                </select>
              </div>
            </div>

            {/* Location / Venue */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                Location / Venue
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Main Conference Room, Online Link, or Headquarters"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                Description &amp; Agenda
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Add notes, briefing agenda, or preparation materials..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color, #E5E7EB)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting || !title.trim()}
              style={{ fontWeight: 600 }}
            >
              {isSubmitting ? 'Creating...' : '+ Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
