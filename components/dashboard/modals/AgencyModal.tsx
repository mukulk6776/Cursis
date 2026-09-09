'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function AgencyModal() {
 const { activeModal, closeModal, submitAgencyRequest, user } = useDashboard();

 const [company, setCompany] = useState('');
 const [email, setEmail] = useState(user.email || '');
 const [solutionType, setSolutionType] = useState('Dedicated Operational AI Agents');
 const [requirements, setRequirements] = useState('');

 if (activeModal !== 'agency-modal') return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!company.trim() || !email.trim()) return;

 submitAgencyRequest({
 company: company.trim(),
 email: email.trim(),
 solutionType,
 requirements: requirements.trim(),
 });

 setCompany('');
 setRequirements('');
 closeModal();
 };

 return (
 <div
 className="modal-overlay active"
 id="agency-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) closeModal();
 }}
 >
 <div className="modal" style={{ maxWidth: '620px' }}>
 <div className="modal-header">
 <div>
 <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-1)' }}>
 CURSIS AI AGENCY
 </div>
 <span className="modal-title">Request a Custom Client Solution</span>
 </div>
 <button className="modal-close" onClick={closeModal}></button>
 </div>

 <form onSubmit={handleSubmit}>
 <div className="modal-body">
 <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)' }}>
 Need something more specific? Cursis builds custom AI agents, automated paperwork pipelines, bespoke CRM systems, and internal enterprise software for businesses.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
 <div className="input-group">
 <label className="input-label">Company / Organization</label>
 <input
 className="input"
 placeholder="e.g. Acme Corp"
 value={company}
 onChange={(e) => setCompany(e.target.value)}
 required
 />
 </div>
 <div className="input-group">
 <label className="input-label">Work Email</label>
 <input
 className="input"
 type="email"
 placeholder="contact@company.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 />
 </div>
 </div>

 <div className="input-group">
 <label className="input-label">Solution Type</label>
 <select
 className="input select"
 value={solutionType}
 onChange={(e) => setSolutionType(e.target.value)}
 >
 <option>Dedicated Operational AI Agents</option>
 <option>Zero-Touch Paperwork Automation Engine</option>
 <option>Custom CRM & Sales Pipeline</option>
 <option>Custom Business Dashboards & Data Tables</option>
 <option>Enterprise ERP / API Software Integrations</option>
 <option>Complete Custom Client Workspace</option>
 </select>
 </div>

 <div className="input-group">
 <label className="input-label">Describe Your Requirements</label>
 <textarea
 className="input textarea"
 placeholder="Tell us about the workflows, systems, or paperwork bottlenecks you want automated..."
 rows={3}
 value={requirements}
 onChange={(e) => setRequirements(e.target.value)}
 />
 </div>

 <div style={{ background: 'var(--c-surface)', border: 'var(--border-width) solid var(--border-color)', padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
 <strong>Cursis Agency Guarantee:</strong> Custom implementations include isolated data security, dedicated SLA uptime, and full model customization.
 </div>
 </div>

 <div className="modal-footer">
 <button type="button" className="btn btn-secondary" onClick={closeModal}>
 Cancel
 </button>
 <button type="submit" className="btn btn-primary">
 Submit Solution Request
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
