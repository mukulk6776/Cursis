'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { DocumentItem } from '@/lib/dashboard/types';

export default function DocumentsPage() {
  const { user, documents, addDocument, showToast, addAuditEntry, openModal } = useDashboard();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatingPipeline, setIsSimulatingPipeline] = useState(false);
  const [pipelineCurrentStep, setPipelineCurrentStep] = useState(3);
  const [pipelineLiveMsg, setPipelineLiveMsg] = useState('STATUS: READY // 2 ACTIVE WORKFLOWS AUTOMATED');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [kbQuery, setKbQuery] = useState('');
  const [kbAnswer, setKbAnswer] = useState<string | null>(null);

  // Document Generator Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genType, setGenType] = useState<DocumentItem['type']>('contract');
  const [genClient, setGenClient] = useState('Apex Industries Ltd');
  const [genScope, setGenScope] = useState('Deployment of custom OCR intake pipeline, dedicated lead triage agent, and HubSpot bidirectional synchronization.');

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

  const handleKbQuery = () => {
    if (!kbQuery.trim()) return;
    if (documents.length === 0) {
      setKbAnswer(
        'No documents have been added to this workspace yet. Upload or generate contracts, proposals, and specifications to enable intelligent semantic search and clause extraction.'
      );
      return;
    }
    const match = documents.find((d) =>
      d.name.toLowerCase().includes(kbQuery.toLowerCase()) ||
      d.aiSummary.toLowerCase().includes(kbQuery.toLowerCase()) ||
      (d.tags && d.tags.some((t) => t.toLowerCase().includes(kbQuery.toLowerCase()))) ||
      (d.keyClauses && d.keyClauses.some((c) => c.toLowerCase().includes(kbQuery.toLowerCase())))
    ) || documents[0];

    const clauses = match.keyClauses?.length ? `Key extracted clauses: ${match.keyClauses.join(' · ')}` : match.aiSummary;
    setKbAnswer(
      `Based on indexed document "${match.name}":\n\n${clauses}`
    );
  };

  const handleGenerateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const newDocName = `${genType === 'contract' ? 'Master Services Agreement' : genType === 'proposal' ? 'AI Solution Proposal' : 'Specification Document'} — ${genClient}.pdf`;
    
    addDocument({
      name: newDocName,
      type: genType,
      size: '1.2 MB',
      project: 'p1',
      tags: [genType, 'generated', genClient.toLowerCase().replace(/\s+/g, '-')],
      aiSummary: `Auto-generated ${genType} for ${genClient}. Scope: ${genScope}`,
      keyClauses: [
        'Payment: Net 30 upon delivery of milestone 1',
        'IP Ownership: Dedicated client assignment upon clearance',
        'Support: 99.9% uptime SLA for custom AI inference'
      ],
      esignStatus: 'pending'
    });

    addAuditEntry('ordis', 'document.auto_generated', newDocName, `Generated for ${genClient}`);
    showToast(`Document "${newDocName}" generated & stored in repository *`);
    setShowGenModal(false);
  };

  const runPipelineSimulation = () => {
    if (isSimulatingPipeline) return;
    setIsSimulatingPipeline(true);

    const steps = [
      { step: 1, msg: 'STEP 1: Digital client intake form received from Horizon Digital...' },
      { step: 2, msg: 'STEP 2: Ordis AI extracting corporate entities, MSA scope, and SLA requirements...' },
      { step: 3, msg: 'STEP 3: Auto-generating Master Services Agreement & SLA contract PDF...' },
      { step: 4, msg: `STEP 4: Auto-routed to Legal & ${user.name} for one-click approval...` },
      { step: 5, msg: 'STEP 5: Document securely archived in workspace repository + Slack alert dispatched!' }
    ];

    let current = 0;
    const runNext = () => {
      if (current < steps.length) {
        setPipelineCurrentStep(steps[current].step);
        setPipelineLiveMsg(`RUNNING: ${steps[current].msg}`);
        current++;
        setTimeout(runNext, 750);
      } else {
        setPipelineCurrentStep(5);
        setPipelineLiveMsg('SUCCESS: PAPERWORK PIPELINE COMPLETE // 1 NEW MSA STORED & INDEXED');
        addDocument({
          name: 'Master Services Agreement — Horizon Digital (Auto-Generated).pdf',
          type: 'contract',
          size: '1.2 MB',
          project: 'p1',
          tags: ['contract', 'auto-generated', 'horizon'],
          aiSummary: 'Auto-generated Master Services Agreement from Horizon Digital digital intake form. Full terms compiled with zero manual data entry.',
          keyClauses: [
            'Payment Terms: Net 15 via automated invoice sync',
            'Scope: Full AI workspace deployment & bespoke ERP integrations'
          ],
          esignStatus: 'signed'
        });
        showToast('Paperwork workflow completed! New contract generated *');
        setIsSimulatingPipeline(false);
      }
    };
    runNext();
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="page active" id="page-documents" style={{ display: 'block' }}>
      {/* Paperwork Automation Studio Banner */}
      <div className="paperwork-studio-card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="paperwork-studio-header">
          <div>
            <div className="badge badge-brand" style={{ marginBottom: 'var(--sp-2)' }}>
              PAPERWORK AUTOMATION &amp; KNOWLEDGE ENGINE
            </div>
            <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-black)', letterSpacing: 'var(--ls-tight)' }}>
              Zero Manual Paperwork. Intelligent Workspace Repository.
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowGenModal(true)}>
              + Generate Document
            </button>
            <button
              className="btn btn-primary btn-sm"
              id="btn-run-pipeline"
              onClick={runPipelineSimulation}
              disabled={isSimulatingPipeline}
            >
              {isSimulatingPipeline ? 'Executing Workflow...' : 'Run Paperwork Pipeline'}
            </button>
          </div>
        </div>

        {/* Pipeline Visual Stepper */}
        <div className="pipeline-stepper" id="pipeline-stepper">
          {[
            { num: 1, title: 'Form Submitted', sub: 'Intake data received' },
            { num: 2, title: 'AI Extraction', sub: 'Extracts terms & legal clauses' },
            { num: 3, title: 'Doc Generation', sub: 'Compiles custom MSA & SLA' },
            { num: 4, title: 'Review & E-Sign', sub: 'Digital signature dispatch' },
            { num: 5, title: 'Knowledge Index', sub: 'Indexes for ORDIS AI search' },
          ].map((s, idx) => {
            const isCompleted = pipelineCurrentStep > s.num;
            const isActive = pipelineCurrentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                {idx > 0 && <div className="pipeline-connector" />}
                <div className={`pipeline-step ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                  <div className="pipeline-step-num">{isCompleted ? '✓' : s.num}</div>
                  <div className="pipeline-step-info">
                    <div className="pipeline-step-title">{s.title}</div>
                    <div className="pipeline-step-sub">{s.sub}</div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div
          id="pipeline-live-status"
          style={{
            marginTop: 'var(--sp-3)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 'var(--fw-bold)',
            color: isSimulatingPipeline ? 'var(--c-brand)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {pipelineLiveMsg}
        </div>
      </div>

      {/* Quick AI Knowledge Query Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-5)',
          background: 'var(--c-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontWeight: 'var(--fw-black)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-brand)',
            letterSpacing: 'var(--ls-wide)',
            flexShrink: 0,
          }}
        >
          ORDIS KNOWLEDGE QUERY
        </span>
        <input
          className="input"
          style={{ flex: 1, minWidth: '220px', fontSize: 'var(--fs-xs)', padding: 'var(--sp-2)' }}
          placeholder="Ask anything across all company documents (e.g., 'What are the payment and deliverable terms?')"
          value={kbQuery}
          onChange={(e) => setKbQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleKbQuery();
          }}
        />
        <button className="btn btn-primary btn-sm" style={{ fontSize: 'var(--fs-xs)' }} onClick={handleKbQuery}>
          Query AI
        </button>
      </div>

      {/* KB Answer Card */}
      {kbAnswer && (
        <div
          className="card"
          style={{
            padding: 'var(--sp-4)',
            background: 'var(--c-brand-bg)',
            border: 'var(--border-width) solid var(--c-brand)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
            <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', color: 'var(--c-brand)' }}>
              ORDIS KNOWLEDGE BASE ANSWER
            </span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '10px' }} onClick={() => setKbAnswer(null)}>
              Dismiss ✕
            </button>
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', marginBottom: '4px' }}>
            Query: &quot;{kbQuery}&quot;
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
            {kbAnswer}
          </div>
          <div style={{ marginTop: 'var(--sp-2)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
            Sources: {documents.length > 0 ? documents.slice(0, 3).map((d) => d.name).join(' · ') : 'Workspace Document Vault'}
          </div>
        </div>
      )}

      {/* Controls: Filters & Search */}
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
            { id: 'all', label: `All Documents (${documents.length})` },
            { id: 'contract', label: 'Contracts & MSAs' },
            { id: 'proposal', label: 'Proposals' },
            { id: 'hr', label: 'HR & Security' },
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
            style={{ maxWidth: '240px', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--fs-xs)' }}
            placeholder="Search documents or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={() => openModal('document-modal')}>
            + Upload Doc
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="documents-grid" id="documents-grid">
        {filteredDocs.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--sp-8)', textAlign: 'center', background: 'var(--c-white)' }}>
            <div style={{ fontSize: '36px', marginBottom: 'var(--sp-2)' }}>📄</div>
            <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-1)' }}>No documents in repository</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', maxWidth: '420px', margin: '0 auto var(--sp-4)' }}>
              Upload contracts, proposals, or specifications to index them in the workspace and enable ORDIS AI extraction.
            </p>
            <button className="btn btn-primary" onClick={() => openModal('document-modal')}>
              + Upload First Document
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
                Updated {doc.updated} by <strong>{doc.author}</strong>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDocId(doc.id);
                }}
              >
                Summary &amp; Actions →
              </button>
            </div>
          </div>
        ))
      )}
      </div>

      {/* AI Document Summary Drawer / Modal */}
      {selectedDoc && (
        <div
          className="modal-overlay active"
          id="doc-summary-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDocId(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' }}>
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
                    Version {selectedDoc.version || 1}
                  </span>
                  {selectedDoc.esignStatus && (
                    <span
                      className={`badge badge-${selectedDoc.esignStatus === 'signed' ? 'success' : 'warning'}`}
                      style={{ fontSize: '10px' }}
                    >
                      E-Signature: {selectedDoc.esignStatus.toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-black)', margin: 0 }}>{selectedDoc.name}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDocId(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {/* AI Summary */}
              <div style={{ background: 'var(--c-brand-bg)', border: 'var(--border-width) solid var(--c-brand)', padding: 'var(--sp-4)' }}>
                <div
                  style={{
                    fontWeight: 'var(--fw-bold)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--c-brand)',
                    letterSpacing: 'var(--ls-wide)',
                    marginBottom: 'var(--sp-1)',
                  }}
                >
                  ORDIS AI EXECUTIVE SUMMARY &amp; METADATA
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedDoc.aiSummary}
                </p>
              </div>

              {/* Key Clauses */}
              {selectedDoc.keyClauses && selectedDoc.keyClauses.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
                    EXTRACTED KEY CLAUSES &amp; ACTIONS
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                    {selectedDoc.keyClauses.map((clause, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--c-surface)',
                          border: 'var(--border-width) solid var(--border-color)',
                          padding: 'var(--sp-2) var(--sp-3)',
                          fontSize: 'var(--fs-xs)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        - {clause}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version History */}
              <div>
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
                  VERSION HISTORY &amp; AUDIT TRAIL
                </h4>
                <div style={{ border: '1px solid var(--c-gray-200)', background: 'var(--c-white)' }}>
                  {(selectedDoc.versions || [{ v: 1, date: selectedDoc.updated, author: selectedDoc.author }]).map((v, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderBottom: '1px solid var(--c-gray-100)',
                        fontSize: 'var(--fs-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'var(--fw-bold)' }}>v{v.v}</span>
                        <span>Updated by {v.author}</span>
                      </div>
                      <div style={{ color: 'var(--text-tertiary)' }}>{v.date}</div>
                    </div>
                  ))}
                </div>
              </div>

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
                  Author: <strong>{selectedDoc.author}</strong>
                </div>
                <div>
                  Size: <strong>{selectedDoc.size}</strong>
                </div>
                <div>
                  Last Updated: <strong>{selectedDoc.updated}</strong>
                </div>
                <div>
                  Project: <strong>{selectedDoc.project || 'Workspace Wide'}</strong>
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
          <div className="modal" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">AI Document Generator</span>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Generate clean, legally sound agreements, proposals, and SOPs in seconds
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowGenModal(false)}>
                ✕
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
                    <option value="proposal">Agency AI Solution Proposal</option>
                    <option value="hr">Employee Onboarding Checklist</option>
                    <option value="technical">API &amp; Integration Architecture Spec</option>
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
                  <label className="input-label">Custom Scope &amp; Terms</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={genScope}
                    onChange={(e) => setGenScope(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate &amp; Store in Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
