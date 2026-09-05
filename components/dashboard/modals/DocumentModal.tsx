'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function DocumentModal() {
  const { activeModal, closeModal, addDocument, projects, showToast } = useDashboard();

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'contract' | 'proposal' | 'hr' | 'technical' | 'financial'>('contract');
  const [projectTag, setProjectTag] = useState(projects[0]?.id || '');

  if (activeModal !== 'document-modal') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const docName = title.trim() || 'Uploaded Document.pdf';

    addDocument({
      name: docName,
      type: docType as any,
      project: projectTag,
      size: '1.4 MB',
      tags: [docType, 'uploaded'],
      aiSummary: 'Document ingested. OCR extraction verified line items and terms.',
    });

    setTitle('');
    closeModal();
  };

  return (
    <div
      className="modal-overlay active"
      id="document-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <span className="modal-title">Upload Document</span>
          <button className="modal-close" onClick={closeModal}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Document Title</label>
              <input
                className="input"
                id="doc-upload-name"
                placeholder="e.g. Client Services Agreement.pdf"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Document Type</label>
                <select
                  className="input select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                >
                  <option value="contract">Contract / Agreement</option>
                  <option value="proposal">Proposal</option>
                  <option value="hr">HR & Policy</option>
                  <option value="technical">Technical Spec</option>
                  <option value="financial">Financial / Invoice</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Project Tag</label>
                <select
                  className="input select"
                  value={projectTag}
                  onChange={(e) => setProjectTag(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="">General Workspace</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Drop File or Choose</label>
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  padding: 'var(--sp-6)',
                  textAlign: 'center',
                  background: 'var(--c-surface)',
                  cursor: 'pointer',
                }}
                onClick={() => showToast('Sample file loaded for upload and OCR processing *')}
              >
                <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
                  Click to select document (PDF, DOCX, XLSX)
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--sp-1)' }}>
                  Automatic OCR extraction &amp; ORDIS summary will run on upload.
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Upload &amp; Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
