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
 showToast('Meeting link copied to clipboard ');
 }
 };

 const toggleComplete = (m: Meeting) => {
 const nextStatus = m.status === 'completed' ? 'scheduled' : 'completed';
 updateMeeting(m.id, { status: nextStatus });
 showToast(nextStatus === 'completed' ? 'Meeting marked as completed ' : 'Meeting marked as scheduled');
 };

 const getPlatformMeta = (platform?: MeetingPlatform) => {
 switch (platform) {
 case 'zoom':
 return {
 label: 'Zoom',
 badgeClass: 'badge-brand',
 icon: '',
 };
 case 'teams':
 return {
 label: 'Teams',
 badgeClass: 'badge-neutral',
 icon: '',
 };
 case 'other':
 return {
 label: 'Conference',
 badgeClass: 'badge-neutral',
 icon: '',
 };
 case 'google_meet':
 default:
 return {
 label: 'Google Meet',
 badgeClass: 'badge-success',
 icon: '',
 };
 }
 };

 return (
 <div className="page active" id="page-meetings" style={{ display: 'block' }}>
 {/* Header */}
 <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
 <div>
 <h1 className="page-title">Meetings &amp; Video Conferences</h1>
 </div>
 <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
 <a
 href="https://meet.google.com/new"
 target="_blank"
 rel="noopener noreferrer"
 className="btn btn-secondary"
 style={{ textDecoration: 'none' }}
 >
 Open Google Meet ↗
 </a>
 <button className="btn btn-primary" onClick={() => openModal('meeting-modal')}>
 + Schedule Meeting
 </button>
 </div>
 </div>

 {/* Control Bar: Tabs, Search, and Platform Filter */}
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
 <div className="tabs" style={{ margin: 0 }}>
 <span
 className={`tab ${currentTab === 'upcoming' ? 'active' : ''}`}
 onClick={() => setCurrentTab('upcoming')}
 >
 Upcoming ({meetings.filter((m) => m.status !== 'completed').length})
 </span>
 <span
 className={`tab ${currentTab === 'completed' ? 'active' : ''}`}
 onClick={() => setCurrentTab('completed')}
 >
 Past &amp; Completed ({meetings.filter((m) => m.status === 'completed').length})
 </span>
 <span
 className={`tab ${currentTab === 'all' ? 'active' : ''}`}
 onClick={() => setCurrentTab('all')}
 >
 All Meetings ({meetings.length})
 </span>
 </div>

 <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
 <select
 className="input select"
 style={{ width: '160px', height: '36px', fontSize: 'var(--fs-xs)' }}
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
 style={{ width: '200px', height: '36px', fontSize: 'var(--fs-xs)' }}
 />
 </div>
 </div>

 {/* Meetings Grid / List */}
 {filteredMeetings.length === 0 ? (
 <div
 className="card"
 style={{
 padding: 'var(--sp-8) var(--sp-4)',
 textAlign: 'center',
 background: 'var(--c-white)',
 }}
 >
 <div style={{ fontSize: '40px', marginBottom: 'var(--sp-2)' }}></div>
 <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-1)' }}>
 No meetings found
 </h3>
 <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', maxWidth: '420px', margin: '0 auto var(--sp-4)' }}>
 {searchQuery
 ? 'No meetings match your search query. Try clearing filters.'
 : 'Schedule a conference call with your Google Meet or Zoom link to coordinate with team members and clients.'}
 </p>
 <button className="btn btn-primary" onClick={() => openModal('meeting-modal')}>
 + Schedule Meeting
 </button>
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--sp-4)' }}>
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
 padding: 'var(--sp-4)',
 display: 'flex',
 flexDirection: 'column',
 justifyContent: 'space-between',
 opacity: isCompleted ? 0.75 : 1,
 border: isCompleted ? '1px solid var(--border-color)' : '1px solid var(--border-color)',
 }}
 >
 {/* Top Row: Platform & Date/Time */}
 <div>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
 <span className={`badge ${platformMeta.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
 <span>{platformMeta.icon}</span>
 <span>{platformMeta.label}</span>
 </span>
 <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
 {formatDate(m.date)} · {m.time} ({m.duration} min)
 </span>
 </div>

 {/* Meeting Title */}
 <h3 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-md)', fontWeight: 700 }}>
 {m.name || m.title}
 </h3>

 {/* Project Tag */}
 {linkedProject && (
 <div style={{ marginBottom: 'var(--sp-2)' }}>
 <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
 {linkedProject.icon} {linkedProject.name}
 </span>
 </div>
 )}

 {/* Agenda snippet */}
 {m.agenda && (
 <p
 style={{
 fontSize: 'var(--fs-xs)',
 color: 'var(--text-secondary)',
 margin: '0 0 var(--sp-3) 0',
 display: '-webkit-box',
 WebkitLineClamp: 2,
 WebkitBoxOrient: 'vertical',
 overflow: 'hidden',
 }}
 >
 {m.agenda}
 </p>
 )}

 {/* Participants Avatars */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--sp-4)' }}>
 <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginRight: '4px' }}>
 Attendees:
 </span>
 {(m.participants || m.attendees || ['u1']).map((pId) => {
 const emp = getEmployee(pId);
 return (
 <div
 key={pId}
 className="avatar avatar-sm"
 style={{ background: emp?.color || '#0f4cff' }}
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
 borderTop: '1px solid var(--c-gray-200)',
 paddingTop: 'var(--sp-3)',
 display: 'flex',
 flexDirection: 'column',
 gap: 'var(--sp-2)',
 }}
 >
 {/* Join and Copy Buttons */}
 <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
 <a
 href={meetingUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="btn btn-brand btn-sm"
 style={{
 flex: 1,
 textDecoration: 'none',
 textAlign: 'center',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '6px',
 fontWeight: 700,
 }}
 >
 Join on {platformMeta.label} ↗
 </a>
 <button
 type="button"
 className="btn btn-secondary btn-sm"
 onClick={() => copyMeetingLink(meetingUrl)}
 title="Copy conference link"
 >
 Copy Link
 </button>
 </div>

 {/* Details, Status, and Delete */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)' }}>
 <button
 type="button"
 style={{
 background: 'none',
 border: 'none',
 color: 'var(--c-brand)',
 cursor: 'pointer',
 fontWeight: 600,
 padding: 0,
 }}
 onClick={() => openMeetingNotes(m)}
 >
 View Details &amp; Notes →
 </button>

 <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
 <button
 type="button"
 style={{
 background: 'none',
 border: 'none',
 color: isCompleted ? 'var(--c-brand)' : 'var(--c-success)',
 cursor: 'pointer',
 fontWeight: 600,
 padding: 0,
 }}
 onClick={() => toggleComplete(m)}
 >
 {isCompleted ? 'Mark Active' : 'Mark Completed'}
 </button>
 <button
 type="button"
 style={{
 background: 'none',
 border: 'none',
 color: 'var(--c-error, #ef4444)',
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
