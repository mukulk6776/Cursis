'use client';

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { DocumentItem } from '@/lib/dashboard/types';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'json', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'contract', label: 'Contracts & Legal' },
  { id: 'proposal', label: 'Proposals & SOW' },
  { id: 'technical', label: 'Technical Specs' },
  { id: 'hr', label: 'HR & Policies' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'design', label: 'Design & Creative' },
];

export default function DocumentsPage() {
  const {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    user,
    showToast,
    addAuditEntry,
  } = useDashboard();

  // Navigation & Filter State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'updated_asc' | 'name_asc' | 'size_desc'>('updated_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);

  // Create Form State
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState<DocumentItem['type']>('contract');
  const [createDescription, setCreateDescription] = useState('');
  const [createTags, setCreateTags] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createFileName, setCreateFileName] = useState('');
  const [createFileType, setCreateFileType] = useState('');
  const [createFileSize, setCreateFileSize] = useState('');
  const [createFileError, setCreateFileError] = useState('');

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentItem['type']>('contract');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editContent, setEditContent] = useState('');

  // Role-Based Access Control (RBAC)
  const role = user.workspaceRole || 'member';
  const canManage = ['owner', 'admin', 'manager'].includes(role);
  const canDelete = ['owner', 'admin'].includes(role);

  // File Upload Handler with Validation Rules
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File Size Validation (<= 25MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setCreateFileError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 25MB.`);
      return;
    }

    // 2. File Extension Validation
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setCreateFileError(`.${ext} is not supported. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    const sizeFormatted = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setCreateFileName(file.name);
    setCreateFileType(ext);
    setCreateFileSize(sizeFormatted);
    if (!createTitle.trim()) {
      setCreateTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      showToast('Permission Denied: Only Admins and Managers can upload documents.');
      return;
    }

    if (!createTitle.trim()) {
      setCreateFileError('Document title is required.');
      return;
    }

    const parsedTags = createTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addDocument({
      name: createTitle.trim(),
      type: createCategory,
      size: createFileSize || '840 KB',
      author: user.name,
      project: 'p1',
      tags: parsedTags.length > 0 ? parsedTags : [createCategory, 'Workspace'],
      aiSummary: createDescription.trim() || 'Internal document uploaded to workspace repository.',
      keyClauses: createContent.trim() ? createContent.split('\n').filter(Boolean) : [
        'Governance & compliance verified',
        'Standard operational clauses active',
      ],
      esignStatus: createCategory === 'contract' ? 'pending' : null,
      fileType: createFileType || 'pdf',
      fileSize: createFileSize || '840 KB',
      category: createCategory,
      content: createContent,
    });

    showToast(`Document "${createTitle.trim()}" published successfully`);
    setShowCreateModal(false);
    setCreateTitle('');
    setCreateDescription('');
    setCreateTags('');
    setCreateContent('');
    setCreateFileName('');
    setCreateFileType('');
    setCreateFileSize('');
    setCreateFileError('');
  };

  const openEditModal = (doc: DocumentItem) => {
    if (!canManage) {
      showToast('Permission Denied: Only Admins and Managers can edit documents.');
      return;
    }
    setEditingDoc(doc);
    setEditTitle(doc.name);
    setEditCategory(doc.type);
    setEditDescription(doc.aiSummary || '');
    setEditTags(doc.tags?.join(', ') || '');
    setEditContent(doc.content || doc.keyClauses?.join('\n') || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    updateDocument(editingDoc.id, {
      name: editTitle.trim() || editingDoc.name,
      type: editCategory,
      aiSummary: editDescription.trim() || editingDoc.aiSummary,
      tags: parsedTags,
      keyClauses: editContent.trim() ? editContent.split('\n').filter(Boolean) : editingDoc.keyClauses,
      content: editContent,
      category: editCategory,
    });

    setEditingDoc(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDoc) return;
    if (!canDelete) {
      showToast('Permission Denied: Only Workspace Owners and Admins can delete documents.');
      return;
    }
    deleteDocument(deletingDoc.id);
    if (previewDoc?.id === deletingDoc.id) {
      setPreviewDoc(null);
    }
    setDeletingDoc(null);
  };

  // Filter & Sort Logic
  const filteredAndSortedDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchCategory = activeCategory === 'all' || doc.type === activeCategory || (doc.category && doc.category.toLowerCase() === activeCategory.toLowerCase());
        const matchSearch =
          !searchQuery.trim() ||
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.aiSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'updated_desc') return new Date(b.updated).getTime() - new Date(a.updated).getTime();
        if (sortBy === 'updated_asc') return new Date(a.updated).getTime() - new Date(b.updated).getTime();
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'size_desc') return (parseFloat(b.size) || 0) - (parseFloat(a.size) || 0);
        return 0;
      });
  }, [documents, activeCategory, searchQuery, sortBy]);

  const getDocBadgeClass = (type: string) => {
    switch (type) {
      case 'contract':
        return 'badge-brand';
      case 'proposal':
        return 'badge-info';
      case 'technical':
      case 'spec':
        return 'badge-warning';
      case 'hr':
        return 'badge-success';
      case 'design':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="page active" id="page-documents" style={{ display: 'block', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header with Title and RBAC Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
          gap: 'var(--sp-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-black)', letterSpacing: 'var(--ls-tight)', margin: 0 }}>
              Document Management
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: canManage ? '#0f4cff' : 'var(--c-surface)',
                color: canManage ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {canManage ? `Admin Mode · ${role}` : `Read-Only Mode · ${role}`}
            </span>
          </div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Full CRUD governance repository for legal contracts, engineering specifications, proposals, and team policies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          {canManage ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              style={{ fontWeight: 700, boxShadow: '2px 2px 0 0 var(--border-color)' }}
            >
              + Create / Upload Document
            </button>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', padding: '6px 12px', borderRadius: '6px' }}>
              🔒 Document creation requires Manager or Admin permissions
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Filters, Search, Sort & View Mode */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          background: 'var(--c-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {DOCUMENT_CATEGORIES.map((cat) => {
            const count = cat.id === 'all'
              ? documents.length
              : documents.filter((d) => d.type === cat.id || (d.category && d.category.toLowerCase() === cat.id)).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  background: isActive ? '#0f4cff' : 'var(--c-surface)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '1.5px 1.5px 0 0 #000' : 'none',
                }}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Right Search, Sort & View Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input"
              style={{
                width: '240px',
                padding: '6px 10px',
                fontSize: '12px',
                height: '34px',
              }}
              placeholder="Search title, tags, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="input select"
            style={{ width: '160px', height: '34px', fontSize: '11px', padding: '4px 8px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="updated_desc">Sort: Newest First</option>
            <option value="updated_asc">Sort: Oldest First</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="size_desc">Sort: File Size</option>
          </select>

          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'grid' ? '#0f4cff' : 'var(--c-surface)',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                background: viewMode === 'table' ? '#0f4cff' : 'var(--c-surface)',
                color: viewMode === 'table' ? '#fff' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedDocs.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 'var(--sp-8)',
            textAlign: 'center',
            background: 'var(--c-white)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: 'var(--sp-2)' }}>📄</div>
          <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 800, margin: '0 0 4px 0' }}>No documents found</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', maxWidth: '440px', margin: '0 auto var(--sp-4)' }}>
            {searchQuery || activeCategory !== 'all'
              ? `No document records match "${searchQuery || activeCategory}". Try clearing your search filters.`
              : 'No documents have been uploaded to this workspace yet. Create your first document specification or contract.'}
          </p>
          {(searchQuery || activeCategory !== 'all') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--sp-4)',
          }}
        >
          {filteredAndSortedDocs.map((doc) => (
            <div
              key={doc.id}
              className="card"
              style={{
                padding: 'var(--sp-4)',
                background: 'var(--c-white)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`badge ${getDocBadgeClass(doc.type)}`}>
                      {doc.type.toUpperCase()}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '9px', fontWeight: 800 }}>
                      v{doc.version || 1}
                    </span>
                    {doc.esignStatus === 'signed' && (
                      <span className="badge badge-success" style={{ fontSize: '9px' }}>
                        Signed
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {doc.fileSize || doc.size}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 800,
                    margin: '0 0 6px 0',
                    lineHeight: 1.4,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewDoc(doc)}
                >
                  {doc.name}
                </h3>

                <p
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    margin: '0 0 var(--sp-3) 0',
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {doc.aiSummary || 'No summary provided.'}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: 'var(--sp-3)' }}>
                    {doc.tags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          background: 'var(--c-surface)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: 'var(--text-tertiary)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 'var(--sp-3)',
                  marginTop: 'var(--sp-2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  {doc.author || 'Author'} · {doc.updated}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    View
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => openEditModal(doc)}
                      title="Edit Document"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px', color: '#dc2626' }}
                      onClick={() => setDeletingDoc(doc)}
                      title="Delete Document"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'var(--c-white)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Document Name</th>
                <th style={{ padding: '10px 14px' }}>Category / Type</th>
                <th style={{ padding: '10px 14px' }}>Version</th>
                <th style={{ padding: '10px 14px' }}>Author</th>
                <th style={{ padding: '10px 14px' }}>Size</th>
                <th style={{ padding: '10px 14px' }}>Last Updated</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDocs.map((doc) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                    <div
                      style={{ cursor: 'pointer', color: '#0f4cff' }}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {doc.name}
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {doc.tags.join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge ${getDocBadgeClass(doc.type)}`}>
                      {doc.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                      v{doc.version || 1}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>{doc.author || 'Member'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{doc.fileSize || doc.size}</td>
                  <td style={{ padding: '10px 14px' }}>{doc.updated}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                        onClick={() => setPreviewDoc(doc)}
                      >
                        Preview
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                          onClick={() => openEditModal(doc)}
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '11px', padding: '2px 8px', color: '#dc2626' }}
                          onClick={() => setDeletingDoc(doc)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DOCUMENT PREVIEW / DETAILS MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--sp-4) var(--sp-5)',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--c-surface)',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                  <span className={`badge ${getDocBadgeClass(previewDoc.type)}`}>
                    {previewDoc.type.toUpperCase()}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                    v{previewDoc.version || 1}
                  </span>
                  {previewDoc.esignStatus === 'signed' && (
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                      Signed & Executed
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-md)', fontWeight: 800 }}>
                  {previewDoc.name}
                </h3>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewDoc(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {/* Summary */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  DOCUMENT SUMMARY &amp; OBJECTIVE
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {previewDoc.aiSummary || 'No executive summary provided.'}
                </p>
              </div>

              {/* Key Clauses & Specifications */}
              {previewDoc.keyClauses && previewDoc.keyClauses.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    KEY SPECIFICATIONS &amp; CLAUSES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {previewDoc.keyClauses.map((clause, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--c-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          lineHeight: 1.4,
                        }}
                      >
                        • {clause}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version History Telemetry */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  REVISION HISTORY (AUDITED)
                </div>
                <div style={{ background: 'var(--c-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', fontSize: '11px' }}>
                  {previewDoc.versions && previewDoc.versions.length > 0 ? (
                    previewDoc.versions.map((v, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < previewDoc.versions.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                        <span style={{ fontWeight: 700 }}>Version {v.v}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{v.author} · {v.date}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>Version 1 (Initial Release)</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{previewDoc.author} · {previewDoc.updated}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Attributes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--sp-3)',
                  paddingTop: 'var(--sp-3)',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '11px',
                }}
              >
                <div>Author / Custodian: <strong>{previewDoc.author || 'Cursis Team'}</strong></div>
                <div>File Size: <strong>{previewDoc.fileSize || previewDoc.size}</strong></div>
                <div>Last Modified: <strong>{previewDoc.updated}</strong></div>
                <div>Tags: <strong>{previewDoc.tags?.join(', ') || 'None'}</strong></div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--sp-2)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {canManage && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        openEditModal(previewDoc);
                        setPreviewDoc(null);
                      }}
                    >
                      Edit Metadata
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#dc2626' }}
                      onClick={() => {
                        setDeletingDoc(previewDoc);
                        setPreviewDoc(null);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      showToast(`Downloaded "${previewDoc.name}" (${previewDoc.size})`);
                      addAuditEntry(user.name, 'document.downloaded', previewDoc.name, 'Downloaded file');
                    }}
                  >
                    Download Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE / UPLOAD DOCUMENT MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Upload &amp; Register Document</span>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Authorized formats: PDF, DOCX, TXT, MD, CSV, JSON, XLSX, PPTX, PNG (Max 25MB)
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createFileError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '6px', fontSize: '12px', marginBottom: 'var(--sp-3)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    ⚠️ {createFileError}
                  </div>
                )}

                {/* File Attachment Drag & Select */}
                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Select Document File (Simulated Attachment)
                  </label>
                  <input
                    type="file"
                    className="input"
                    onChange={handleFileSelection}
                    accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.pptx,.png,.jpg,.jpeg"
                    style={{ padding: '6px' }}
                  />
                  {createFileName && (
                    <div style={{ fontSize: '11px', color: '#0f4cff', marginTop: '4px', fontWeight: 700 }}>
                      ✓ Attached: {createFileName} ({createFileSize})
                    </div>
                  )}
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. Master Services Agreement — Enterprise 2026"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Category / Domain
                    </label>
                    <select
                      className="input select"
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value as any)}
                    >
                      <option value="contract">Contract &amp; Legal</option>
                      <option value="proposal">Proposal &amp; SOW</option>
                      <option value="technical">Technical Architecture</option>
                      <option value="hr">HR &amp; People Policy</option>
                      <option value="knowledge">Knowledge Base</option>
                      <option value="design">Design &amp; Brand Assets</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={createTags}
                      onChange={(e) => setCreateTags(e.target.value)}
                      placeholder="e.g. Legal, Q3, Confidential"
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Description &amp; Summary
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Brief description of the document contents and scope..."
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Key Clauses / Content Notes (1 per line)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
                    placeholder="• Net-30 payment schedule&#10;• Full IP assignment upon completion&#10;• Confidentiality binding for 3 years"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Publish Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT DOCUMENT MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {editingDoc && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingDoc(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Edit Document (Creates v{(editingDoc.version || 1) + 1})</span>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Updating will bump the version and record an audited revision stamp.
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditingDoc(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Category / Domain
                    </label>
                    <select
                      className="input select"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                    >
                      <option value="contract">Contract &amp; Legal</option>
                      <option value="proposal">Proposal &amp; SOW</option>
                      <option value="technical">Technical Architecture</option>
                      <option value="hr">HR &amp; People Policy</option>
                      <option value="knowledge">Knowledge Base</option>
                      <option value="design">Design &amp; Brand Assets</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Tags
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Description / Executive Summary
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Key Specifications &amp; Clauses (1 per line)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDoc(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Save Revisions (v{(editingDoc.version || 1) + 1})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL (RBAC Gated) */}
      {/* ========================================================================= */}
      {deletingDoc && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingDoc(null);
          }}
        >
          <div className="modal" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ padding: 'var(--sp-5)' }}>
              <div style={{ fontSize: '36px', marginBottom: 'var(--sp-2)' }}>🗑️</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--fs-md)', fontWeight: 800 }}>
                Delete Document?
              </h3>
              <p style={{ margin: '0 0 var(--sp-4) 0', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong>&quot;{deletingDoc.name}&quot;</strong>? This action will remove it from all project workspaces.
              </p>

              <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeletingDoc(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  onClick={handleDeleteConfirm}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
