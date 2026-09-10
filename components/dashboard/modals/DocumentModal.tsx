'use client';

import React, { useState, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';

export default function DocumentModal() {
  const { activeModal, closeModal, addDocument, projects, showToast } = useDashboard();

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'contract' | 'proposal' | 'hr' | 'technical' | 'financial'>('contract');
  const [projectTag, setProjectTag] = useState(projects[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (activeModal !== 'document-modal') return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name);
      }
      showToast(`Selected ${file.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const docName = title.trim() || selectedFile?.name || 'Document.pdf';
    const fileSizeFormatted = selectedFile
      ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB'
      : '1.2 MB';

    addDocument({
      name: docName,
      type: docType as any,
      project: projectTag,
      size: fileSizeFormatted,
      tags: [docType, 'uploaded'],
      aiSummary: 'Document ingested into secure workspace storage. Ready for team collaboration.',
    });

    setTitle('');
    setSelectedFile(null);
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
          <button className="modal-close" onClick={closeModal}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Document Title</label>
              <input
                className="input"
                id="doc-upload-name"
                placeholder="e.g. Master Services Agreement.pdf"
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
                  <option value="hr">HR &amp; Policy</option>
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
              <label className="input-label">Choose File</label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
              />
              <div
                style={{
                  border: selectedFile ? '2px solid var(--c-brand)' : '2px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: 'var(--sp-5)',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(15, 76, 255, 0.04)' : 'var(--c-surface)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div>
                    <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', color: 'var(--c-brand)' }}>
                      📄 {selectedFile.name}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {(selectedFile.size / 1024).toFixed(0)} KB • Click to choose a different file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
                      Click to select file from your device
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--sp-1)' }}>
                      Supports PDF, DOCX, XLSX, CSV, and images
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
