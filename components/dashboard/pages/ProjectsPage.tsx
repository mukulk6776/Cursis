'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function ProjectsPage() {
 const {
 projects,
 employees,
 tasks,
 documents,
 meetings,
 openModal,
 showToast,
 } = useDashboard();

 const [currentView, setCurrentView] = useState<'grid' | 'list' | 'kanban'>('grid');
 const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

 const getEmployee = (id: string) => employees.find((e) => e.id === id);
 const getTasksForProject = (projectId: string) => tasks.filter((t) => t.project === projectId);

 const selectedProject = projects.find((p) => p.id === selectedProjectId);
 const projectTasks = selectedProjectId ? getTasksForProject(selectedProjectId) : [];
 const projectDocs = selectedProjectId ? documents.filter((d) => d.project === selectedProjectId) : [];
 const projectMeetings = selectedProjectId ? meetings.filter((m) => m.project === selectedProjectId) : [];

 return (
 <div className="page active" id="page-projects" style={{ display: 'block' }}>
 {/* Header */}
 <div className="page-header" style={{ marginBottom: 'var(--sp-4)' }}>
 <div>
 <h1 className="page-title">Projects</h1>
 </div>
 <div className="page-actions" style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
 {/* View Switcher */}
 <div className="view-switcher" style={{ display: 'flex', gap: '4px' }}>
 <button
 className={`view-switcher-btn ${currentView === 'grid' ? 'active' : ''}`}
 onClick={() => setCurrentView('grid')}
 >
 ▦ Grid
 </button>
 <button
 className={`view-switcher-btn ${currentView === 'list' ? 'active' : ''}`}
 onClick={() => setCurrentView('list')}
 >
 List
 </button>
 <button
 className={`view-switcher-btn ${currentView === 'kanban' ? 'active' : ''}`}
 onClick={() => setCurrentView('kanban')}
 >
 Kanban
 </button>
 </div>

 <button className="btn btn-primary" onClick={() => openModal('project-modal')}>
 + New Project
 </button>
 </div>
 </div>

 {projects.length === 0 ? (
 <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center', background: 'var(--c-white)', marginTop: 'var(--sp-4)' }}>
 <div style={{ fontSize: '36px', marginBottom: 'var(--sp-2)' }}></div>
 <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-1)' }}>No active projects</h3>
 <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', maxWidth: '420px', margin: '0 auto var(--sp-4)' }}>
 Organize your deliverables into projects, track milestones, assign team members, and link live communication channels.
 </p>
 <button className="btn btn-primary" onClick={() => openModal('project-modal')}>
 + Create Your First Project
 </button>
 </div>
 ) : (
 <>
 {/* VIEW: GRID */}
 {currentView === 'grid' && (
 <div
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
 gap: 'var(--sp-4)',
 }}
 >
 {projects.map((p) => {
 const teamMembers = p.team.map((id) => getEmployee(id)).filter(Boolean);
 const pTasks = getTasksForProject(p.id);
 const activeTasks = pTasks.filter((t) => t.status === 'in-progress').length;
 const overdueTasks = pTasks.filter(
 (t) => t.status !== 'completed' && new Date(t.deadline).getTime() < Date.now()
 ).length;
 const nextMilestone = p.milestones ? p.milestones.find((m) => !m.completed) : null;

 return (
 <div
 key={p.id}
 className="card"
 style={{
 padding: 'var(--sp-5)',
 cursor: 'pointer',
 transition: 'all var(--dur-fast)',
 }}
 onClick={() => setSelectedProjectId(p.id)}
 >
 <div
 style={{
 display: 'flex',
 alignItems: 'flex-start',
 justifyContent: 'space-between',
 marginBottom: 'var(--sp-3)',
 }}
 >
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div style={{ width: '8px', height: '8px', background: p.color, flexShrink: 0 }} />
 <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-md)' }}>{p.name}</span>
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px', marginLeft: '16px' }}>
 {p.desc.substring(0, 80)}
 {p.desc.length > 80 ? '...' : ''}
 </div>
 </div>
 <span
 className={`badge badge-${
 p.status === 'In Progress' ? 'brand' : p.status === 'Planning' ? 'neutral' : 'success'
 }`}
 style={{ fontSize: '10px', flexShrink: 0 }}
 >
 {p.status}
 </span>
 </div>

 {/* Progress bar */}
 <div style={{ marginBottom: 'var(--sp-3)' }}>
 <div
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 fontSize: '10px',
 color: 'var(--text-tertiary)',
 marginBottom: '4px',
 }}
 >
 <span>
 {p.completed}/{p.tasks} tasks
 </span>
 <span style={{ fontWeight: 'var(--fw-bold)' }}>{p.progress}%</span>
 </div>
 <div style={{ height: '6px', background: 'var(--c-gray-200)' }}>
 <div style={{ height: '100%', background: p.color, width: `${p.progress}%`, transition: 'width 0.3s ease' }} />
 </div>
 </div>

 {/* Stats Row */}
 <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)', fontSize: '10px' }}>
 <span style={{ color: 'var(--c-brand)', fontWeight: 'var(--fw-bold)' }}>{activeTasks} active</span>
 {overdueTasks > 0 && (
 <span style={{ color: 'var(--c-error)', fontWeight: 'var(--fw-bold)' }}>{overdueTasks} overdue</span>
 )}
 <span style={{ color: 'var(--text-tertiary)' }}>Due {p.deadline}</span>
 </div>

 {/* Next Milestone */}
 {nextMilestone && (
 <div
 style={{
 padding: 'var(--sp-2)',
 background: 'var(--c-surface)',
 border: '1px solid var(--c-gray-200)',
 marginBottom: 'var(--sp-3)',
 fontSize: '10px',
 }}
 >
 <span style={{ fontWeight: 'var(--fw-bold)' }}>Next Milestone:</span> {nextMilestone.name} —{' '}
 {nextMilestone.date}
 </div>
 )}

 {/* Team Avatars & Channel */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div style={{ display: 'flex', gap: '-4px' }}>
 {teamMembers.slice(0, 5).map((m, i) => (
 <div
 key={i}
 className="avatar avatar-xs"
 style={{ background: m?.color, fontSize: '9px', width: '24px', height: '24px' }}
 title={m?.name}
 >
 {m?.initials}
 </div>
 ))}
 {teamMembers.length > 5 && (
 <div
 className="avatar avatar-xs"
 style={{ background: 'var(--c-gray-300)', fontSize: '9px', width: '24px', height: '24px' }}
 >
 +{teamMembers.length - 5}
 </div>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* VIEW: LIST */}
 {currentView === 'list' && (
 <div className="card" style={{ overflow: 'hidden' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
 <thead>
 <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>PROJECT</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>STATUS</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>PROGRESS</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>TASKS</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>DEADLINE</th>
 <th style={{ textAlign: 'left', padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>TEAM</th>
 </tr>
 </thead>
 <tbody>
 {projects.map((p) => {
 const team = p.team.map((id) => getEmployee(id)).filter(Boolean);
 return (
 <tr
 key={p.id}
 style={{ borderBottom: '1px solid var(--c-gray-200)', cursor: 'pointer' }}
 onClick={() => setSelectedProjectId(p.id)}
 >
 <td style={{ padding: 'var(--sp-3)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div style={{ width: '8px', height: '8px', background: p.color, flexShrink: 0 }} />
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)' }}>{p.name}</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
 {p.desc.substring(0, 50)}...
 </div>
 </div>
 </div>
 </td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <span className={`badge badge-${p.status === 'In Progress' ? 'brand' : 'neutral'}`} style={{ fontSize: '10px' }}>
 {p.status}
 </span>
 </td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
 <div style={{ width: '80px', height: '4px', background: 'var(--c-gray-200)' }}>
 <div style={{ height: '100%', background: p.color, width: `${p.progress}%` }} />
 </div>
 <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)' }}>{p.progress}%</span>
 </div>
 </td>
 <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>
 {p.completed}/{p.tasks}
 </td>
 <td style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)' }}>
 {p.deadline}
 </td>
 <td style={{ padding: 'var(--sp-3)' }}>
 <div style={{ display: 'flex', gap: '2px' }}>
 {team.slice(0, 3).map((m, i) => (
 <div
 key={i}
 className="avatar avatar-xs"
 style={{ background: m?.color, fontSize: '9px', width: '20px', height: '20px' }}
 >
 {m?.initials}
 </div>
 ))}
 {team.length > 3 && (
 <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>+{team.length - 3}</span>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* VIEW: KANBAN */}
 {currentView === 'kanban' && (
 <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-4)' }}>
 {['Planning', 'In Progress', 'Completed'].map((s) => {
 const colProjects = projects.filter((p) => p.status === s);
 return (
 <div
 key={s}
 className="kanban-column"
 style={{
 background: 'var(--c-surface)',
 border: 'var(--border-width) solid var(--border-color)',
 padding: 'var(--sp-3)',
 }}
 >
 <div
 className="kanban-column-header"
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 marginBottom: 'var(--sp-3)',
 fontWeight: 'var(--fw-black)',
 fontSize: 'var(--fs-sm)',
 }}
 >
 <span>{s}</span>
 <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
 {colProjects.length}
 </span>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
 {colProjects.map((p) => (
 <div
 key={p.id}
 className="card"
 style={{ padding: 'var(--sp-3)', cursor: 'pointer' }}
 onClick={() => setSelectedProjectId(p.id)}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
 <div style={{ width: '8px', height: '8px', background: p.color }} />
 <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{p.name}</span>
 </div>
 <div style={{ height: '4px', background: 'var(--c-gray-200)', marginBottom: 'var(--sp-2)' }}>
 <div style={{ height: '100%', background: p.color, width: `${p.progress}%` }} />
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
 {p.completed}/{p.tasks} tasks — Due {p.deadline}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </>
 )}

 {/* Project Templates */}
 <div style={{ marginTop: 'var(--sp-6)' }}>
 <h3 style={{ marginBottom: 'var(--sp-3)' }}>Project Templates</h3>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--sp-3)' }}>
 {[
 { name: 'Product Launch', desc: 'Full lifecycle from ideation to market release', tasks: 28 },
 { name: 'Marketing Campaign', desc: 'Multi-channel campaign planning and execution', tasks: 18 },
 { name: 'Client Onboarding', desc: 'Structured client intake and setup workflow', tasks: 15 },
 { name: 'Software Sprint', desc: '2-week agile sprint with stories and reviews', tasks: 20 },
 ].map((t, idx) => (
 <div
 key={idx}
 className="card"
 style={{ padding: 'var(--sp-3)', cursor: 'pointer', transition: 'all var(--dur-fast)' }}
 onClick={() => showToast(`Template "${t.name}" loaded into project draft *`)}
 >
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>{t.name}</div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{t.desc}</div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: 'var(--sp-2)' }}>
 {t.tasks} pre-built tasks
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Project Detail Modal */}
 {selectedProject && (
 <div
 className="modal-overlay active"
 id="project-detail-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) setSelectedProjectId(null);
 }}
 >
 <div className="modal" style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
 <div className="modal-header">
 <div style={{ flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
 <div style={{ width: '12px', height: '12px', background: selectedProject.color }} />
 <span className="modal-title">{selectedProject.name}</span>
 <span
 className={`badge badge-${selectedProject.status === 'In Progress' ? 'brand' : 'neutral'}`}
 style={{ fontSize: '10px' }}
 >
 {selectedProject.status}
 </span>
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginLeft: '20px' }}>
 {selectedProject.desc}
 </div>
 </div>
 <button className="modal-close" onClick={() => setSelectedProjectId(null)}>
 
 </button>
 </div>

 <div className="modal-body">
 {/* Progress & Stats */}
 <div
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(4, 1fr)',
 gap: 'var(--sp-3)',
 marginBottom: 'var(--sp-5)',
 }}
 >
 <div
 style={{
 background: 'var(--c-surface)',
 padding: 'var(--sp-3)',
 border: 'var(--border-width) solid var(--border-color)',
 textAlign: 'center',
 }}
 >
 <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)' }}>{selectedProject.progress}%</div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Progress</div>
 </div>
 <div
 style={{
 background: 'var(--c-surface)',
 padding: 'var(--sp-3)',
 border: 'var(--border-width) solid var(--border-color)',
 textAlign: 'center',
 }}
 >
 <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)' }}>
 {selectedProject.completed}/{selectedProject.tasks}
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Tasks Done</div>
 </div>
 <div
 style={{
 background: 'var(--c-surface)',
 padding: 'var(--sp-3)',
 border: 'var(--border-width) solid var(--border-color)',
 textAlign: 'center',
 }}
 >
 <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)' }}>
 {selectedProject.team.length}
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Members</div>
 </div>
 <div
 style={{
 background: 'var(--c-surface)',
 padding: 'var(--sp-3)',
 border: 'var(--border-width) solid var(--border-color)',
 textAlign: 'center',
 }}
 >
 <div style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-black)', paddingTop: '6px' }}>
 {selectedProject.deadline}
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Deadline</div>
 </div>
 </div>

 {/* Milestones */}
 {selectedProject.milestones && selectedProject.milestones.length > 0 && (
 <div style={{ marginBottom: 'var(--sp-5)' }}>
 <h4 style={{ marginBottom: 'var(--sp-3)' }}>Milestones</h4>
 <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
 <div
 style={{
 position: 'absolute',
 top: '12px',
 left: '12px',
 right: '12px',
 height: '2px',
 background: 'var(--c-gray-200)',
 }}
 />
 {selectedProject.milestones.map((ms, i) => (
 <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
 <div
 style={{
 width: '24px',
 height: '24px',
 border: `var(--border-width) solid ${ms.completed ? 'var(--c-success)' : 'var(--c-gray-400)'}`,
 background: ms.completed ? 'var(--c-success)' : 'var(--c-white)',
 margin: '0 auto',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 >
 {ms.completed ? (
 <span style={{ color: 'white', fontWeight: 'var(--fw-bold)', fontSize: '10px' }}></span>
 ) : (
 <span style={{ fontSize: '10px' }}>{i + 1}</span>
 )}
 </div>
 <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', marginTop: 'var(--sp-2)' }}>
 {ms.name}
 </div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{ms.date}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Linked Resources Pills */}
 <div
 style={{
 display: 'flex',
 gap: 'var(--sp-3)',
 borderBottom: 'var(--border-width) solid var(--border-color)',
 marginBottom: 'var(--sp-4)',
 }}
 >
 <span
 style={{
 padding: 'var(--sp-2) 0',
 fontWeight: 'var(--fw-bold)',
 fontSize: 'var(--fs-sm)',
 borderBottom: '2px solid var(--c-near-black)',
 }}
 >
 Tasks ({projectTasks.length})
 </span>
 <span style={{ padding: 'var(--sp-2) 0', fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
 Documents ({projectDocs.length})
 </span>
 <span style={{ padding: 'var(--sp-2) 0', fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
 Meetings ({projectMeetings.length})
 </span>
 </div>

 {/* Task List */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
 {projectTasks.length === 0 ? (
 <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>No tasks in this project</div>
 ) : (
 projectTasks.map((t) => {
 const assignee = getEmployee(t.assignee);
 return (
 <div
 key={t.id}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 'var(--sp-3)',
 padding: 'var(--sp-2) var(--sp-3)',
 border: '1px solid var(--c-gray-200)',
 fontSize: 'var(--fs-sm)',
 }}
 >
 <span
 className={`badge priority-${t.priority}`}
 style={{ fontSize: '9px', width: '60px', textAlign: 'center' }}
 >
 {t.priority}
 </span>
 <span style={{ flex: 1, fontWeight: 'var(--fw-medium)' }}>{t.name}</span>
 <span
 className={`badge badge-${
 t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'brand' : 'neutral'
 }`}
 style={{ fontSize: '9px' }}
 >
 {t.status}
 </span>
 {assignee && (
 <div
 className="avatar avatar-xs"
 style={{ background: assignee.color, fontSize: '9px', width: '20px', height: '20px' }}
 title={assignee.name}
 >
 {assignee.initials}
 </div>
 )}
 </div>
 );
 })
 )}
 </div>

 {/* Team Members List */}
 <div>
 <h4 style={{ marginBottom: 'var(--sp-3)' }}>Team Members Assigned</h4>
 <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
 {selectedProject.team.map((id) => {
 const m = getEmployee(id);
 if (!m) return null;
 return (
 <div
 key={id}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 'var(--sp-2)',
 padding: 'var(--sp-2) var(--sp-3)',
 background: 'var(--c-surface)',
 border: '1px solid var(--c-gray-200)',
 }}
 >
 <div
 className="avatar avatar-xs"
 style={{ background: m.color, fontSize: '9px', width: '24px', height: '24px' }}
 >
 {m.initials}
 </div>
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>{m.name}</div>
 <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{m.role}</div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 <div className="modal-footer">
 <button className="btn btn-secondary" onClick={() => setSelectedProjectId(null)}>
 Close
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
