'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { ProjectStatus } from '@/lib/dashboard/types';

export default function ProjectModal() {
 const { activeModal, closeModal, addProject, employees } = useDashboard();

 const [name, setName] = useState('');
 const [desc, setDesc] = useState('');
 const [icon, setIcon] = useState('');
 const [color, setColor] = useState('#3b82f6');
 const [status, setStatus] = useState<ProjectStatus>('In Progress');
 const [deadline, setDeadline] = useState(
 new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
 );
 const [selectedMembers, setSelectedMembers] = useState<string[]>(['u1', 'u2']);

 if (activeModal !== 'project-modal') return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) return;

 addProject({
 name: name.trim(),
 desc: desc.trim(),
 icon,
 color,
 status,
 deadline,
 team: selectedMembers,
 });

 setName('');
 setDesc('');
 closeModal();
 };

 const icons = ['Work', 'Web', 'Mobile', 'Design', 'Marketing', 'Engineering', 'Operations', 'Client', 'Product', 'Launch'];
 const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ec4899', '#06b6d4', '#f97316'];

 return (
 <div
 className="modal-overlay active"
 id="project-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) closeModal();
 }}
 >
 <div className="modal" style={{ maxWidth: '520px' }}>
 <div className="modal-header">
 <span className="modal-title">Create New Project</span>
 <button className="modal-close" onClick={closeModal}>
 
 </button>
 </div>

 <form onSubmit={handleSubmit}>
 <div className="modal-body">
 {/* Project Name */}
 <div className="input-group">
 <label className="input-label">Project Name</label>
 <input
 className="input"
 placeholder="What's this project about?"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 autoFocus
 />
 </div>

 {/* Icon & Color */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Icon</label>
 <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
 {icons.map((ic) => (
 <button
 key={ic}
 type="button"
 className="btn btn-secondary btn-sm"
 style={{
 fontSize: '16px',
 padding: '4px 8px',
 borderColor: icon === ic ? 'var(--c-brand)' : undefined,
 background: icon === ic ? 'rgba(249,115,22,0.1)' : undefined,
 }}
 onClick={() => setIcon(ic)}
 >
 {ic}
 </button>
 ))}
 </div>
 </div>

 <div className="input-group">
 <label className="input-label">Color Theme</label>
 <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
 {colors.map((c) => (
 <div
 key={c}
 style={{
 width: '24px',
 height: '24px',
 borderRadius: '50%',
 background: c,
 cursor: 'pointer',
 boxShadow: color === c ? '0 0 0 3px var(--c-near-black)' : 'none',
 }}
 onClick={() => setColor(c)}
 />
 ))}
 </div>
 </div>
 </div>

 {/* Description */}
 <div className="input-group">
 <label className="input-label">Description</label>
 <textarea
 className="input textarea"
 placeholder="Describe project goals and scope..."
 rows={3}
 value={desc}
 onChange={(e) => setDesc(e.target.value)}
 />
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
 {/* Status */}
 <div className="input-group">
 <label className="input-label">Status</label>
 <select
 className="input select"
 value={status}
 onChange={(e) => setStatus(e.target.value as ProjectStatus)}
 >
 <option value="Planning">Planning</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </select>
 </div>

 {/* Deadline */}
 <div className="input-group">
 <label className="input-label">Target Deadline</label>
 <input
 className="input"
 type="date"
 value={deadline}
 onChange={(e) => setDeadline(e.target.value)}
 />
 </div>
 </div>

 {/* Team Members */}
 <div className="input-group">
 <label className="input-label">Assign Team Members</label>
 <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
 {employees.map((emp) => {
 const isSelected = selectedMembers.includes(emp.id);
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
 setSelectedMembers((prev) =>
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
 Create Project
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
