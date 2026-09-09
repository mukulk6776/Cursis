'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function AutomationModal() {
 const { activeModal, closeModal, addAutomation } = useDashboard();

 const [name, setName] = useState('');
 const [whenTrigger, setWhenTrigger] = useState('Task deadline is tomorrow');
 const [ifCondition, setIfCondition] = useState('Task is not completed');
 const [thenAction, setThenAction] = useState('Notify assigned employee');

 if (activeModal !== 'automation-modal') return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) return;

 addAutomation({
 name: name.trim(),
 when: whenTrigger,
 condition: ifCondition || null,
 then: thenAction,
 icon: '',
 color: '#f59e0b',
 });

 setName('');
 closeModal();
 };

 return (
 <div
 className="modal-overlay active"
 id="automation-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) closeModal();
 }}
 >
 <div className="modal" style={{ maxWidth: '560px' }}>
 <div className="modal-header">
 <span className="modal-title">Create Automation</span>
 <button className="modal-close" onClick={closeModal}>
 
 </button>
 </div>

 <form onSubmit={handleSubmit}>
 <div className="modal-body">
 {/* Automation Name */}
 <div className="input-group">
 <label className="input-label">Automation Name</label>
 <input
 className="input"
 placeholder="e.g. Deadline Reminder, Escalation Rule..."
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 autoFocus
 />
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
 {/* WHEN Block */}
 <div
 style={{
 background: 'var(--c-info-bg)',
 padding: 'var(--sp-3) var(--sp-4)',
 borderRadius: 'var(--border-radius-md)',
 borderLeft: '3px solid var(--c-info)',
 }}
 >
 <div
 style={{
 fontSize: 'var(--fs-xs)',
 fontWeight: 'var(--fw-semibold)',
 color: '#2563eb',
 marginBottom: 'var(--sp-2)',
 }}
 >
 WHEN (Trigger)
 </div>
 <select
 className="input select"
 style={{ background: 'white' }}
 value={whenTrigger}
 onChange={(e) => setWhenTrigger(e.target.value)}
 >
 <option value="Task deadline is tomorrow">Task deadline is tomorrow</option>
 <option value="New task is created">New task is created</option>
 <option value="Task is completed">Task is completed</option>
 <option value="New employee is added">New employee is added</option>
 <option value="Meeting ends">Meeting ends</option>
 <option value="Task becomes overdue">Task becomes overdue</option>
 </select>
 </div>

 {/* IF Block */}
 <div
 style={{
 background: 'var(--c-warning-bg)',
 padding: 'var(--sp-3) var(--sp-4)',
 borderRadius: 'var(--border-radius-md)',
 borderLeft: '3px solid var(--c-warning)',
 }}
 >
 <div
 style={{
 fontSize: 'var(--fs-xs)',
 fontWeight: 'var(--fw-semibold)',
 color: '#b45309',
 marginBottom: 'var(--sp-2)',
 }}
 >
 IF (Condition) — Optional
 </div>
 <select
 className="input select"
 style={{ background: 'white' }}
 value={ifCondition}
 onChange={(e) => setIfCondition(e.target.value)}
 >
 <option value="">No condition</option>
 <option value="Task is not completed">Task is not completed</option>
 <option value="Priority is High or Urgent">Priority is High or Urgent</option>
 <option value="Assignee has more than 5 tasks">Assignee has more than 5 tasks</option>
 <option value="ORDIS notes are generated">ORDIS notes are generated</option>
 </select>
 </div>

 {/* THEN Block */}
 <div
 style={{
 background: 'var(--c-success-bg)',
 padding: 'var(--sp-3) var(--sp-4)',
 borderRadius: 'var(--border-radius-md)',
 borderLeft: '3px solid var(--c-success)',
 }}
 >
 <div
 style={{
 fontSize: 'var(--fs-xs)',
 fontWeight: 'var(--fw-semibold)',
 color: '#15803d',
 marginBottom: 'var(--sp-2)',
 }}
 >
 THEN (Action)
 </div>
 <select
 className="input select"
 style={{ background: 'white' }}
 value={thenAction}
 onChange={(e) => setThenAction(e.target.value)}
 >
 <option value="Notify assigned employee">Notify assigned employee</option>
 <option value="Notify project manager">Notify project manager</option>
 <option value="Create onboarding tasks">Create onboarding tasks</option>
 <option value="Send notes to participants">Send notes to participants</option>
 <option value="Escalate to team lead">Escalate to team lead</option>
 <option value="Update task status">Update task status</option>
 </select>
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
 Create Automation
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
