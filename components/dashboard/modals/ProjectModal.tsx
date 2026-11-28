'use client';

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { ProjectStatus } from '@/lib/dashboard/types';

export default function ProjectModal() {
 const { activeModal, closeModal, addProject, employees, projects, planLimits } = useDashboard();
 const atProjectLimit = planLimits.maxProjects !== null && projects.length >= planLimits.maxProjects;

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
 if (!name.trim() || atProjectLimit) return;

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
 <button type="button" className="modal-close" onClick={closeModal} aria-label="Close modal">
 <X size={16} aria-hidden="true" />
 </button>
 </div>

 <form onSubmit={handleSubmit}>
 <div className="modal-body">
 {atProjectLimit && (
 <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'var(--c-error-bg, #FEF2F2)', border: '1px solid var(--c-error, #FCA5A5)', color: 'var(--c-error-text, #DC2626)', fontSize: '12px', fontWeight: 600 }}>
 Project limit reached ({planLimits.maxProjects} projects max).{' '}
 <a href="/pay?plan=pro" style={{ color: '#FF5500', fontWeight: 700 }}>Upgrade to Pro for unlimited projects →</a>
 </div>
 )}
 {/* Project Name */}
 <div className="input-group">
 <Label className="input-label">Project Name</Label>
 <Input
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
 <Label className="input-label">Category Tag</Label>
 <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
 {icons.map((ic) => (
 <Button
 key={ic}
 type="button"
 variant={icon === ic ? 'default' : 'outline'}
 size="sm"
 style={{ fontSize: '12px', padding: '0 9px', height: '28px' }}
 onClick={() => setIcon(ic)}
 >
 {ic}
 </Button>
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
 <Label className="input-label">Description</Label>
 <Textarea
 placeholder="Describe project goals and scope..."
 rows={3}
 value={desc}
 onChange={(e) => setDesc(e.target.value)}
 />
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
 {/* Status */}
 <div className="input-group">
 <Label className="input-label">Status</Label>
 <Select
 value={status}
 onChange={(e) => setStatus(e.target.value as ProjectStatus)}
 >
 <option value="Planning">Planning</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </Select>
 </div>

 {/* Deadline */}
 <div className="input-group">
 <Label className="input-label">Target Deadline</Label>
 <Input
 type="date"
 value={deadline}
 onChange={(e) => setDeadline(e.target.value)}
 />
 </div>
 </div>

 {/* Team Members */}
 <div className="input-group">
 <Label className="input-label">Assign Team Members</Label>
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
 display: 'inline-flex',
 alignItems: 'center',
 gap: '4px',
 background: isSelected ? 'var(--c-brand)' : 'var(--c-gray-200)',
 color: isSelected ? 'white' : 'var(--text-secondary)',
 }}
 onClick={() => {
 setSelectedMembers((prev) =>
 isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
 );
 }}
 >
 {emp.name} {isSelected ? <Check size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 <div className="modal-footer">
 <Button
 type="button"
 variant="outline"
 onClick={closeModal}
 >
 Cancel
 </Button>
 <Button type="submit" disabled={atProjectLimit}>
 {atProjectLimit ? `Limit Reached (${planLimits.maxProjects} max)` : 'Create Project'}
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
}
