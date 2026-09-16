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

  return (
    <div className="page active" id="page-projects" style={{ maxWidth: '1080px', margin: '0 auto' }}>
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
              Projects
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
              {projects.length} projects
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Coordinate project goals, milestones, and deliverable tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View Switcher */}
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', background: 'var(--c-surface)' }}>
            {(['grid', 'list', 'kanban'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`btn ${currentView === v ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{
                  textTransform: 'capitalize',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: 0,
                  height: '30px',
                  fontWeight: currentView === v ? 700 : 500,
                }}
                onClick={() => setCurrentView(v)}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('project-modal')}
            style={{ fontWeight: 700 }}
          >
            + New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
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
            No active projects
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Organize your deliverables into projects, track milestones, and assign team members.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openModal('project-modal')}
            style={{ fontWeight: 700 }}
          >
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '12px',
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
                      padding: '16px 18px',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'var(--c-white)',
                    }}
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#0f4cff', flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A' }}>{p.name}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginLeft: '16px' }}>
                          {p.desc.substring(0, 70)}
                          {p.desc.length > 70 ? '...' : ''}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--c-surface)',
                          border: '1px solid var(--border-color)',
                          color: p.status === 'In Progress' ? '#0f4cff' : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: '10px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginBottom: '4px',
                        }}
                      >
                        <span>
                          {p.completed}/{p.tasks} tasks
                        </span>
                        <span style={{ fontWeight: 700, color: '#0A0A0A' }}>{p.progress}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--c-surface)', border: '1px solid var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: p.color || '#0f4cff', width: `${p.progress}%`, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '11px' }}>
                      <span style={{ color: '#0f4cff', fontWeight: 600 }}>{activeTasks} active</span>
                      {overdueTasks > 0 && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{overdueTasks} overdue</span>
                      )}
                      <span style={{ color: 'var(--text-secondary)' }}>Due {p.deadline}</span>
                    </div>

                    {/* Next Milestone */}
                    {nextMilestone && (
                      <div
                        style={{
                          padding: '6px 10px',
                          background: 'var(--c-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          marginBottom: '10px',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>Next Milestone:</span> {nextMilestone.name} — {nextMilestone.date}
                      </div>
                    )}

                    {/* Team Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {teamMembers.slice(0, 5).map((m, i) => (
                          <div
                            key={i}
                            className="avatar avatar-xs"
                            style={{ background: m?.color || '#0f4cff', fontSize: '9px', width: '22px', height: '22px' }}
                            title={m?.name}
                          >
                            {m?.initials}
                          </div>
                        ))}
                        {teamMembers.length > 5 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                            +{teamMembers.length - 5}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>View Details →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: LIST */}
          {currentView === 'list' && (
            <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--c-white)', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: '12px' }}>Project</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: '12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: '12px' }}>Progress</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: '12px' }}>Tasks</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: '12px' }}>Deadline</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 700, fontSize: '12px' }}>Team</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const team = p.team.map((id) => getEmployee(id)).filter(Boolean);
                    return (
                      <tr
                        key={p.id}
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#0f4cff', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#0A0A0A' }}>{p.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {p.desc.substring(0, 45)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'var(--c-surface)',
                              border: '1px solid var(--border-color)',
                              color: p.status === 'In Progress' ? '#0f4cff' : 'var(--text-secondary)',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--c-surface)', border: '1px solid var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: p.color || '#0f4cff', width: `${p.progress}%` }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700 }}>{p.progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {p.completed}/{p.tasks}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {p.deadline}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            {team.slice(0, 3).map((m, i) => (
                              <div
                                key={i}
                                className="avatar avatar-xs"
                                style={{ background: m?.color || '#0f4cff', fontSize: '9px', width: '20px', height: '20px' }}
                              >
                                {m?.initials}
                              </div>
                            ))}
                            {team.length > 3 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>+{team.length - 3}</span>
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
            <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {['Planning', 'In Progress', 'Completed'].map((s) => {
                const colProjects = projects.filter((p) => p.status === s);
                return (
                  <div
                    key={s}
                    className="kanban-column"
                    style={{
                      background: 'var(--c-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{s}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--c-white)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {colProjects.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {colProjects.map((p) => (
                        <div
                          key={p.id}
                          className="card"
                          style={{ padding: '12px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--c-white)' }}
                          onClick={() => setSelectedProjectId(p.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#0f4cff' }} />
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0A0A0A' }}>{p.name}</span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--c-surface)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ height: '100%', background: p.color || '#0f4cff', width: `${p.progress}%` }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#0A0A0A' }}>Quick Project Templates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {[
            { name: 'Product Launch', desc: 'Lifecycle from ideation to market release', tasks: 28 },
            { name: 'Marketing Campaign', desc: 'Multi-channel campaign planning', tasks: 18 },
            { name: 'Client Onboarding', desc: 'Intake and technical setup workflow', tasks: 15 },
            { name: 'Software Sprint', desc: '2-week sprint with stories and reviews', tasks: 20 },
          ].map((t, idx) => (
            <div
              key={idx}
              className="card"
              style={{ padding: '10px 14px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--c-white)' }}
              onClick={() => showToast(`Template "${t.name}" loaded into project draft`)}
            >
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0A0A0A' }}>+ {t.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.desc}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
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
          <div className="modal" style={{ maxWidth: '720px', width: '100%', maxHeight: '85vh', overflowY: 'auto', background: 'var(--c-white)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedProject.color || '#0f4cff' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0A' }}>{selectedProject.name}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--c-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {selectedProject.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '18px' }}>
                  {selectedProject.desc}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedProjectId(null)}
                style={{ fontSize: '16px', padding: '0 4px', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: 0 }}>
              {/* Progress & Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ background: 'var(--c-surface)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A' }}>{selectedProject.progress}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Progress</div>
                </div>
                <div style={{ background: 'var(--c-surface)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A' }}>
                    {selectedProject.completed}/{selectedProject.tasks}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tasks Done</div>
                </div>
                <div style={{ background: 'var(--c-surface)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0A' }}>
                    {selectedProject.team.length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Members</div>
                </div>
                <div style={{ background: 'var(--c-surface)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, paddingTop: '4px', color: '#0A0A0A' }}>
                    {selectedProject.deadline}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Deadline</div>
                </div>
              </div>

              {/* Task List */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#0A0A0A' }}>
                  Project Tasks ({projectTasks.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {projectTasks.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '12px 0' }}>No tasks in this project yet.</div>
                  ) : (
                    projectTasks.map((t) => {
                      const assignee = getEmployee(t.assignee);
                      return (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            background: 'var(--c-white)',
                            fontSize: '12px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '9px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--c-surface)',
                              color: t.priority === 'urgent' || t.priority === 'high' ? '#dc2626' : 'var(--text-secondary)',
                            }}
                          >
                            {t.priority}
                          </span>
                          <span style={{ flex: 1, fontWeight: 600, color: '#0A0A0A' }}>{t.name}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'var(--c-surface)',
                              border: '1px solid var(--border-color)',
                              color: t.status === 'completed' ? '#16a34a' : 'var(--text-secondary)',
                            }}
                          >
                            {t.status}
                          </span>
                          {assignee && (
                            <div
                              className="avatar avatar-xs"
                              style={{ background: assignee.color || '#0f4cff', fontSize: '9px', width: '20px', height: '20px' }}
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
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedProjectId(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
