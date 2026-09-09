'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { DocumentItem } from '@/lib/dashboard/types';

export default function DocumentsPage() {
 const { documents, addDocument, showToast, addAuditEntry, openModal } = useDashboard();
 const [activeTab, setActiveTab] = useState<string>('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

 // Document Generator Modal State
 const [showGenModal, setShowGenModal] = useState(false);
 const [genType, setGenType] = useState<DocumentItem['type']>('contract');
 const [genClient, setGenClient] = useState('');
 const [genScope, setGenScope] = useState('');

 const filteredDocs = documents.filter((d) => {
 const matchTab = activeTab === 'all' || d.type === activeTab;
 const matchSearch =
 !searchQuery ||
 d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 d.aiSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (d.tags && d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
 return matchTab && matchSearch;
 });

 const getDocBadgeClass = (type: string) => {
 switch (type) {
 case 'contract':
 return 'badge-brand';
 case 'proposal':
 return 'badge-info';
 case 'design':
 return 'badge-neutral';
 case 'spec':
 return 'badge-warning';
 case 'technical':
 return 'badge-neutral';
 default:
 return 'badge-neutral';
 }
 };

 const handleGenerateDoc = (e: React.FormEvent) => {
 e.preventDefault();
 if (!genClient.trim()) return;

 const newDocName = `${
 genType === 'contract'
 ? 'Master Services Agreement'
 : genType === 'proposal'
 ? 'AI Solution Proposal'
 : 'Specification Document'
 } — ${genClient.trim()}.pdf`;

 addDocument({
 name: newDocName,
 type: genType,
 size: '1.2 MB',
 project: 'p1',
 tags: [genType, 'generated', genClient.toLowerCase().replace(/\s+/g, '-')],
 aiSummary: `Generated ${genType} for ${genClient.trim()}.${genScope ? ` Scope: ${genScope}` : ''}`,
 keyClauses: [
 'Payment: Net 30 upon milestone approval',
 'IP Ownership: Full transfer upon payment completion',
 'Support SLA: Dedicated workspace response within 4 hours',
 ],
 esignStatus: 'pending',
 });

 addAuditEntry('ordis', 'document.auto_generated', newDocName, `Generated for ${genClient}`);
 showToast(`Document "${newDocName}" created successfully *`);
 setShowGenModal(false);
 setGenClient('');
 setGenScope('');
 };

 const selectedDoc = documents.find((d) => d.id === selectedDocId);

 return (
 <div className="page active" id="page-documents" style={{ display: 'block' }}>
 {/* Streamlined Header */}
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 marginBottom: 'var(--sp-5)',
 gap: 'var(--sp-4)',
 flexWrap: 'wrap',
 }}
 >
 <div>
 <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', letterSpacing: 'var(--ls-tight)', margin: 0 }}>
 Documents
 </h2>
 <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
 Store, search, and manage contracts, proposals, and workspace documentation.
 </div>
 </div>

 <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
 <button className="btn btn-secondary btn-sm" onClick={() => setShowGenModal(true)}>
 + Generate Document
 </button>
 <button className="btn btn-primary btn-sm" onClick={() => openModal('document-modal')}>
 + Upload Document
 </button>
 </div>
 </div>

 {/* Filter Tabs and Search Bar */}
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 marginBottom: 'var(--sp-4)',
 gap: 'var(--sp-4)',
 flexWrap: 'wrap',
 }}
 >
 <div className="tabs-pill" style={{ borderBottom: 'none' }}>
 {[
 { id: 'all', label: `All (${documents.length})` },
 { id: 'contract', label: 'Contracts & MSAs' },
 { id: 'proposal', label: 'Proposals' },
 { id: 'hr', label: 'HR & Policies' },
 { id: 'technical', label: 'Technical Specs' },
 ].map((tab) => (
 <span
 key={tab.id}
 className={`tab ${activeTab === tab.id ? 'active' : ''}`}
 onClick={() => setActiveTab(tab.id)}
 style={{ cursor: 'pointer' }}
 >
 {tab.label}
 </span>
 ))}
 </div>

 <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
 <input
 className="input"
 style={{ minWidth: '240px', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--fs-xs)' }}
 placeholder="Search documents by name or tag..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>

 {/* Document Grid */}
 <div className="documents-grid" id="documents-grid">
 {filteredDocs.length === 0 ? (
 <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--sp-8)', textAlign: 'center', background: 'var(--c-white)' }}>
 <div style={{ fontSize: '36px', marginBottom: 'var(--sp-2)' }}></div>
 <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-1)' }}>
 No documents found
 </h3>
 <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', maxWidth: '420px', margin: '0 auto var(--sp-4)' }}>
 {searchQuery
 ? `No documents match your search query "${searchQuery}".`
 : 'Upload or generate your first workspace document to get started.'}
 </p>
 <button className="btn btn-primary btn-sm" onClick={() => openModal('document-modal')}>
 + Upload Document
 </button>
 </div>
 ) : (
 filteredDocs.map((doc) => (
 <div
 key={doc.id}
 className="doc-card card-stagger"
 onClick={() => setSelectedDocId(doc.id)}
 style={{ cursor: 'pointer' }}
 >
 <div className="doc-card-header">
 <div style={{ display: 'flex', gap: 'var(--sp-1)', alignItems: 'center' }}>
 <span className={`badge ${getDocBadgeClass(doc.type)}`}>{doc.type.toUpperCase()}</span>
 {doc.version && <span className="badge badge-neutral" style={{ fontSize: '9px' }}>v{doc.version}</span>}
 {doc.esignStatus === 'signed' && (
 <span className="badge badge-success" style={{ fontSize: '9px' }}>
 Signed
 </span>
 )}
 </div>
 <span style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
 {doc.size}
 </span>
 </div>
 <div className="doc-card-title">{doc.name}</div>
 <div className="doc-card-summary">{doc.aiSummary}</div>
 <div className="doc-card-footer">
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
 Updated {doc.updated} {doc.author ? `by ${doc.author}` : ''}
 </div>
 <button
 className="btn btn-secondary btn-sm"
 style={{ padding: '2px 8px', fontSize: '11px' }}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedDocId(doc.id);
 }}
 >
 View Details →
 </button>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Clean Document Preview Modal */}
 {selectedDoc && (
 <div
 className="modal-overlay active"
 id="doc-summary-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) setSelectedDocId(null);
 }}
 >
 <div className="modal" style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 borderBottom: 'var(--border-width) solid var(--border-color)',
 padding: 'var(--sp-4) var(--sp-5)',
 }}
 >
 <div>
 <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-1)' }}>
 <span className={`badge ${getDocBadgeClass(selectedDoc.type)}`}>{selectedDoc.type.toUpperCase()}</span>
 <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
 v{selectedDoc.version || 1}
 </span>
 {selectedDoc.esignStatus && (
 <span
 className={`badge badge-${selectedDoc.esignStatus === 'signed' ? 'success' : 'warning'}`}
 style={{ fontSize: '10px' }}
 >
 {selectedDoc.esignStatus === 'signed' ? 'Signed' : 'Signature Pending'}
 </span>
 )}
 </div>
 <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-black)', margin: 0 }}>{selectedDoc.name}</h3>
 </div>
 <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDocId(null)}>
 
 </button>
 </div>

 <div style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
 {/* Summary */}
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
 DESCRIPTION &amp; SUMMARY
 </div>
 <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-primary)', margin: 0 }}>
 {selectedDoc.aiSummary}
 </p>
 </div>

 {/* Key Clauses */}
 {selectedDoc.keyClauses && selectedDoc.keyClauses.length > 0 && (
 <div>
 <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
 KEY CLAUSES &amp; HIGHLIGHTS
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
 {selectedDoc.keyClauses.map((clause, idx) => (
 <div
 key={idx}
 style={{
 background: 'var(--c-surface)',
 border: 'var(--border-width) solid var(--border-color)',
 padding: 'var(--sp-2) var(--sp-3)',
 fontSize: 'var(--fs-xs)',
 borderRadius: '4px',
 }}
 >
 • {clause}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Metadata Grid */}
 <div
 style={{
 display: 'grid',
 gridTemplateColumns: '1fr 1fr',
 gap: 'var(--sp-3)',
 fontSize: 'var(--fs-xs)',
 borderTop: 'var(--border-width) solid var(--border-color)',
 paddingTop: 'var(--sp-3)',
 }}
 >
 <div>
 Author: <strong>{selectedDoc.author || 'Workspace Member'}</strong>
 </div>
 <div>
 File Size: <strong>{selectedDoc.size}</strong>
 </div>
 <div>
 Last Updated: <strong>{selectedDoc.updated}</strong>
 </div>
 <div>
 Project: <strong>{selectedDoc.project || 'General'}</strong>
 </div>
 </div>

 {/* Action Buttons */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
 <button
 className="btn btn-primary btn-sm"
 onClick={() => showToast(`Document "${selectedDoc.name}" downloaded *`)}
 >
 Download PDF
 </button>
 <button
 className="btn btn-secondary btn-sm"
 onClick={() => {
 addAuditEntry('u1', 'document.esign_requested', selectedDoc.name, 'Dispatched signature envelope to client');
 showToast(`E-signature envelope dispatched for "${selectedDoc.name}" *`);
 }}
 >
 Request E-Sign
 </button>
 <button
 className="btn btn-secondary btn-sm"
 onClick={() => showToast('Secure link generated & copied to clipboard *')}
 >
 Share Link
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* AI Document Generator Modal */}
 {showGenModal && (
 <div
 className="modal-overlay active"
 id="doc-generator-modal"
 onClick={(e) => {
 if (e.target === e.currentTarget) setShowGenModal(false);
 }}
 >
 <div className="modal" style={{ maxWidth: '540px' }}>
 <div className="modal-header">
 <div>
 <span className="modal-title">Generate Document</span>
 <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
 Create contracts, proposals, or specifications
 </div>
 </div>
 <button className="modal-close" onClick={() => setShowGenModal(false)}>
 
 </button>
 </div>
 <form onSubmit={handleGenerateDoc}>
 <div className="modal-body">
 <div className="input-group">
 <label className="input-label">Document Type</label>
 <select
 className="input select"
 value={genType}
 onChange={(e) => setGenType(e.target.value as DocumentItem['type'])}
 >
 <option value="contract">Client Master Services Agreement (MSA)</option>
 <option value="proposal">AI Solution Proposal</option>
 <option value="hr">Employee Onboarding Checklist</option>
 <option value="technical">Technical Specification</option>
 </select>
 </div>
 <div className="input-group">
 <label className="input-label">Client / Target Entity</label>
 <input
 className="input"
 value={genClient}
 onChange={(e) => setGenClient(e.target.value)}
 placeholder="e.g. Apex Industries Ltd"
 required
 />
 </div>
 <div className="input-group">
 <label className="input-label">Scope / Description</label>
 <textarea
 className="input"
 rows={3}
 value={genScope}
 onChange={(e) => setGenScope(e.target.value)}
 placeholder="Brief description of deliverables and scope..."
 />
 </div>
 </div>
 <div className="modal-footer">
 <button type="button" className="btn btn-secondary" onClick={() => setShowGenModal(false)}>
 Cancel
 </button>
 <button type="submit" className="btn btn-primary">
 Generate Document
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
