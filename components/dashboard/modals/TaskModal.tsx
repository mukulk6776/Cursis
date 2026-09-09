'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { PriorityLevel } from '@/lib/dashboard/types';

export default function TaskModal() {
 const { activeModal, closeModal, addTask, projects, employees } = useDashboard();

 const [name, setName] = useState('');
 const [description, setDescription] = useState('');
 const [project, setProject] = useState(projects[0]?.id || '');
 const [assignee, setAssignee] = useState(employees[0]?.id || 'u1');
 const [priority, setPriority] = useState<PriorityLevel>('medium');
 const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
 const [tags, setTags] = useState('');

 if (activeModal !== 'task-modal') return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) return;

 const parsedTags = tags
 .split(',')
 .map((t) => t.trim())
 .filter(Boolean);

 addTask({
 name: name.trim(),
 description: description.trim(),
 project,
 assignee,
 priority,
 status: 'todo',
 deadline,
 tags: parsedTags,
 });

 setName('');
 setDescription('');
 closeModal();
 };

 return (
 <div
 className="modal-overlay active"
 id="task-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) closeModal();
 }}
 >
 <div className="modal" style={{ maxWidth: '520px' }}>
 <div className="modal-header">
 <span className="modal-title">Create New Task</span>
 <button className="modal-close" onClick={closeModal}>
 
 </button>
 </div>

 <form onSubmit={handleSubmit}>
 <div className="modal-body">
 {/* Task Name */}
 <div className="input-group">
 <label className="input-label">Task Name</label>
 <input
 className="input"
 placeholder="What needs to be done?"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 autoFocus
 />
 </div>

 {/* Description */}
 <div className="input-group">
 <label className="input-label">Description</label>
 <textarea
 className="input textarea"
 placeholder="Add details about this task..."
 rows={3}
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 />
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
 {/* Project */}
 <div className="input-group">
 <label className="input-label">Project</label>
 <select
 className="input select"
 value={project}
 onChange={(e) => setProject(e.target.value)}
 >
 <option value="">(No Project / General)</option>
 {projects.map((p) => (
 <option key={p.id} value={p.id}>
 {p.name}
 </option>
 ))}
 </select>
 </div>

 {/* Assignee */}
 <div className="input-group">
 <label className="input-label">Assignee</label>
 <select
 className="input select"
 value={assignee}
 onChange={(e) => setAssignee(e.target.value)}
 >
 {employees.map((emp) => (
 <option key={emp.id} value={emp.id}>
 {emp.name} ({emp.role})
 </option>
 ))}
 </select>
 </div>

 {/* Priority */}
 <div className="input-group">
 <label className="input-label">Priority</label>
 <select
 className="input select"
 value={priority}
 onChange={(e) => setPriority(e.target.value as PriorityLevel)}
 >
 <option value="medium">Medium</option>
 <option value="urgent">Urgent</option>
 <option value="high">High</option>
 <option value="low">Low</option>
 </select>
 </div>

 {/* Deadline */}
 <div className="input-group">
 <label className="input-label">Deadline</label>
 <input
 className="input"
 type="date"
 value={deadline}
 onChange={(e) => setDeadline(e.target.value)}
 />
 </div>
 </div>

 {/* Tags */}
 <div className="input-group">
 <label className="input-label">Tags (comma separated)</label>
 <input
 className="input"
 placeholder="frontend, design, bug..."
 value={tags}
 onChange={(e) => setTags(e.target.value)}
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
 Create Task
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
