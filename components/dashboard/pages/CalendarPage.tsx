'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { Meeting } from '@/lib/dashboard/types';

export default function CalendarPage() {
  const {
    meetings,
    addMeeting,
    tasks,
    projects,
    employees,
    orgSettings,
    openModal,
    showToast,
    addAuditEntry,
  } = useDashboard();

  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'meetings' | 'tasks' | 'milestones'>('all');
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [schedTopic, setSchedTopic] = useState('Technical Architecture Sync');
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<Meeting | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateDate = (direction: number) => {
    const next = new Date(currentDate);
    if (currentView === 'month') {
      next.setMonth(next.getMonth() + direction);
    } else if (currentView === 'week') {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setDate(next.getDate() + direction);
    }
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHeadingTitle = () => {
    if (currentView === 'month') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'week') {
      const day = currentDate.getDay();
      const start = new Date(currentDate);
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    } else {
      return `${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  };

  // Compile Unified Events
  interface CalendarEvent {
    id: string;
    name: string;
    date: string;
    time?: string;
    type: 'meeting' | 'task' | 'milestone';
    color: string;
    raw?: any;
  }

  const allEvents: CalendarEvent[] = [];

  if (filterType === 'all' || filterType === 'meetings') {
    meetings.forEach((m) => {
      allEvents.push({
        id: m.id,
        name: m.name,
        date: m.date,
        time: m.time,
        type: 'meeting',
        color: 'var(--c-brand)',
        raw: m,
      });
    });
  }

  if (filterType === 'all' || filterType === 'tasks') {
    tasks.forEach((t) => {
      if (t.deadline) {
        allEvents.push({
          id: t.id,
          name: t.name,
          date: t.deadline,
          time: '23:59',
          type: 'task',
          color: 'var(--c-warning)',
          raw: t,
        });
      }
    });
  }

  if (filterType === 'all' || filterType === 'milestones') {
    projects.forEach((p) => {
      if (p.milestones) {
        p.milestones.forEach((ms, idx) => {
          allEvents.push({
            id: `ms_${p.id}_${idx}`,
            name: `${p.name}: ${ms.name}`,
            date: ms.date,
            type: 'milestone',
            color: 'var(--c-purple)',
            raw: ms,
          });
        });
      }
    });
  }

  const bookSlot = (slotLabel: string) => {
    const timeStr = slotLabel.includes('15:30') ? '15:30' : '11:00';
    const dateStr = slotLabel.includes('Tomorrow')
      ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const newM: Meeting = {
      id: 'm_' + Date.now(),
      name: schedTopic,
      date: dateStr,
      time: timeStr,
      duration: 45,
      participants: ['u1', 'u2', 'u3', 'u4', 'u5'],
      project: 'p1',
      status: 'scheduled',
      platform: 'google_meet',
      meetingUrl: 'https://meet.google.com/ordis-smart-' + Date.now().toString().slice(-6),
      agenda: `Optimal slot booked via ORDIS AI Smart Scheduler for "${schedTopic}". Zero participant conflicts.`,
      aiSummary: null,
      notes: '',
    };

    addMeeting(newM);
    addAuditEntry('ordis', 'meeting.auto_scheduled', schedTopic, `Scheduled for ${dateStr} at ${timeStr}`);
    showToast(`Slot booked! Meeting "${schedTopic}" scheduled for ${dateStr} at ${timeStr} *`);
    setShowSmartScheduler(false);
  };

  // Month View Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevDaysInMonth - i;
    const prevDate = new Date(year, month - 1, d);
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
      dateStr: prevDate.toISOString().split('T')[0],
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      dateStr,
    });
  }

  const remainingCells = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      dateStr: nextDate.toISOString().split('T')[0],
    });
  }

  return (
    <div className="page active" id="page-calendar" style={{ display: 'block' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <h1 className="page-title">Calendar &amp; Scheduling</h1>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSmartScheduler(true)}>
            ⚡ AI Smart Schedule
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('meeting-modal')}>
            + New Event
          </button>
        </div>
      </div>

      {/* Calendar Controls Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigateDate(-1)}>
            ‹
          </button>
          <button className="btn btn-secondary btn-sm" onClick={goToToday}>
            Today
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigateDate(1)}>
            ›
          </button>
          <span style={{ fontSize: 'var(--fs-md)', fontWeight: 'var(--fw-bold)', marginLeft: 'var(--sp-2)' }}>
            {getHeadingTitle()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          {/* Filter by Type */}
          <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
            {(['all', 'meetings', 'tasks', 'milestones'] as const).map((f) => (
              <button
                key={f}
                className={`btn ${filterType === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ fontSize: 'var(--fs-xs)', padding: '3px 8px', textTransform: 'capitalize' }}
                onClick={() => setFilterType(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div style={{ display: 'flex', gap: 'var(--sp-1)', borderLeft: '1px solid var(--c-gray-300)', paddingLeft: 'var(--sp-3)' }}>
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                className={`btn ${currentView === v ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                style={{
                  fontSize: 'var(--fs-xs)',
                  padding: '3px 10px',
                  fontWeight: currentView === v ? 'var(--fw-bold)' : 'normal',
                  textTransform: 'capitalize',
                }}
                onClick={() => setCurrentView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Status Pill & Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-3)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-tertiary)',
          flexWrap: 'wrap',
          gap: 'var(--sp-2)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--c-brand)', display: 'inline-block' }} /> Meeting
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--c-warning)', display: 'inline-block' }} /> Task Deadline
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--c-purple)', display: 'inline-block' }} /> Milestone
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="badge badge-neutral" style={{ fontSize: '9px', padding: '0 4px' }}>
              GC
            </span>{' '}
            Google Calendar Sync (Active)
          </span>
        </div>
        <div>All times in {orgSettings.timezone}</div>
      </div>

      {/* MONTH VIEW */}
      {currentView === 'month' && (
        <div
          className="calendar-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            border: 'var(--border-width) solid var(--border-color)',
            background: 'var(--c-border)',
            gap: '1px',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              style={{
                background: 'var(--c-surface)',
                padding: 'var(--sp-2)',
                textAlign: 'center',
                fontWeight: 'var(--fw-bold)',
                fontSize: 'var(--fs-xs)',
              }}
            >
              {d}
            </div>
          ))}

          {calendarDays.map((cd, idx) => {
            const dayEvents = allEvents.filter((ev) => ev.date === cd.dateStr);
            const isToday = cd.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={idx}
                style={{
                  background: cd.isCurrentMonth ? 'var(--c-white)' : 'var(--c-bg)',
                  minHeight: '105px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  opacity: cd.isCurrentMonth ? 1 : 0.45,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isToday ? 'var(--fw-black)' : 'normal',
                      color: isToday ? 'var(--c-brand)' : 'inherit',
                      background: isToday ? 'var(--c-brand-bg)' : 'transparent',
                      padding: isToday ? '1px 5px' : '0',
                    }}
                  >
                    {cd.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        fontSize: '9px',
                        fontWeight: 'var(--fw-bold)',
                        padding: '2px 4px',
                        background: `${ev.color}15`,
                        borderLeft: `2px solid ${ev.color}`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (ev.type === 'meeting') {
                          setSelectedMeetingDetail(ev.raw);
                        } else {
                          showToast(`${ev.type.toUpperCase()}: ${ev.name}`);
                        }
                      }}
                    >
                      {ev.time ? `${ev.time} ` : ''}
                      {ev.name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK & DAY VIEWS */}
      {(currentView === 'week' || currentView === 'day') && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--sp-4)' }}>
          {/* Timetable */}
          <div className="card" style={{ padding: 'var(--sp-4)' }}>
            <h4 style={{ marginBottom: 'var(--sp-3)' }}>Schedule Timetable</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {allEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-2) var(--sp-3)',
                    border: 'var(--border-width) solid var(--border-color)',
                    background: 'var(--c-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ width: '8px', height: '8px', background: ev.color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{ev.name}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '9px' }}>
                      {ev.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {ev.date} {ev.time || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Member Availability Panel */}
          <div className="card" style={{ padding: 'var(--sp-4)' }}>
            <h4 style={{ marginBottom: 'var(--sp-3)' }}>Team Live Availability</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {employees.slice(0, 6).map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-2)',
                    borderBottom: '1px solid var(--c-gray-100)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <div className="avatar avatar-xs" style={{ background: e.color, fontSize: '9px' }}>
                      {e.initials}
                    </div>
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)' }}>{e.name}</span>
                  </div>
                  <span
                    className={`badge badge-${
                      e.status === 'online' ? 'success' : e.status === 'busy' ? 'warning' : 'neutral'
                    }`}
                    style={{ fontSize: '9px' }}
                  >
                    {e.status === 'online' ? 'Free' : e.status === 'busy' ? 'In Meeting' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}
              onClick={() => setShowSmartScheduler(true)}
            >
              Find Common Free Slot
            </button>
          </div>
        </div>
      )}

      {/* AI Smart Scheduler Modal */}
      {showSmartScheduler && (
        <div
          className="modal-overlay active"
          id="smart-scheduler-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSmartScheduler(false);
          }}
        >
          <div className="modal" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">ORDIS AI Smart Scheduler</span>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Finds optimal collision-free slots across participant calendars
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowSmartScheduler(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Meeting Topic / Purpose</label>
                <input
                  className="input"
                  value={schedTopic}
                  onChange={(e) => setSchedTopic(e.target.value)}
                  placeholder="e.g. Technical Architecture Sync"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Selected Participants</label>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', marginTop: '4px' }}>
                  {employees.slice(0, 5).map((e) => (
                    <label
                      key={e.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--c-surface)',
                        border: '1px solid var(--border-color)',
                        padding: '2px 8px',
                        fontSize: 'var(--fs-xs)',
                        cursor: 'pointer',
                      }}
                    >
                      <input type="checkbox" defaultChecked style={{ width: '14px', height: '14px' }} />
                      <span>{e.name.split(' ')[0]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'var(--sp-4)' }}>
                <div
                  style={{
                    fontWeight: 'var(--fw-bold)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-tertiary)',
                    letterSpacing: 'var(--ls-wide)',
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  AI RECOMMENDED TIME SLOTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <div
                    className="card"
                    style={{
                      padding: 'var(--sp-3)',
                      background: 'var(--c-brand-bg)',
                      border: 'var(--border-width) solid var(--c-brand)',
                      cursor: 'pointer',
                    }}
                    onClick={() => bookSlot('Today at 15:30 (45 min)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', color: 'var(--c-brand)' }}>
                        Option 1: Today at 15:30 (45 min)
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>
                        100% Free
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      All 5 participants have zero schedule conflicts and optimal energy focus scores.
                    </div>
                  </div>

                  <div
                    className="card"
                    style={{
                      padding: 'var(--sp-3)',
                      background: 'var(--c-surface)',
                      border: 'var(--border-width) solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                    onClick={() => bookSlot('Tomorrow at 11:00 (30 min)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
                        Option 2: Tomorrow at 11:00 (30 min)
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        90% Free
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Minimal overlap with team focus coding blocks.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSmartScheduler(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeetingDetail && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMeetingDetail(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">{selectedMeetingDetail.name}</span>
              <button className="modal-close" onClick={() => setSelectedMeetingDetail(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', fontSize: 'var(--fs-sm)' }}>
                <div>
                  <strong>Time:</strong> {selectedMeetingDetail.date} at {selectedMeetingDetail.time} ({selectedMeetingDetail.duration} min)
                </div>
                <div>
                  <strong>Agenda:</strong> {selectedMeetingDetail.agenda || 'No agenda'}
                </div>
                <div>
                  <strong>Participants:</strong>{' '}
                  {selectedMeetingDetail.participants
                    .map((id) => employees.find((e) => e.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedMeetingDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
