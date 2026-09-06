'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/DashboardContext';
import { formatCurrency, formatDate, INITIAL_AGENCY_SERVICES, INITIAL_CASE_STUDIES } from '@/lib/dashboard/data';

type WorkspaceTab = 'crm' | 'contacts' | 'followups' | 'agency-store';

export default function WorkspacePage() {
  const {
    user,
    crm,
    openModal,
    addDeal,
    updateDealStage,
    addContact,
    showToast,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('crm');

  // New Deal dialog state
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealClient, setDealClient] = useState('');
  const [dealValue, setDealValue] = useState('$50,000');
  const [dealStage, setDealStage] = useState('stage_qual');
  const [dealEmail, setDealEmail] = useState('');

  // New Contact dialog state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+1-555-0199');
  const [contactRole, setContactRole] = useState('Decision Maker');



  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim() || !dealClient.trim()) return;

    addDeal({
      title: dealTitle.trim(),
      client: dealClient.trim(),
      value: dealValue.trim(),
      stage: dealStage,
      owner: user.name,
      probability: dealStage === 'stage_won' ? 100 : 50,
      notes: 'Added via Workspace CRM',
      contactEmail: dealEmail.trim(),
    });

    setDealTitle('');
    setDealClient('');
    setDealModalOpen(false);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactCompany.trim()) return;

    addContact({
      name: contactName.trim(),
      company: contactCompany.trim(),
      email: contactEmail.trim(),
      phone: contactPhone.trim(),
      role: contactRole.trim(),
      status: 'Active',
      notes: 'Added via Workspace Contacts',
    });

    setContactName('');
    setContactCompany('');
    setContactEmail('');
    setContactModalOpen(false);
  };

  const totalPipelineValue = crm.deals.reduce((sum, d) => {
    const num = parseInt(String(d?.value || '0').replace(/[^0-9]/g, '') || '0', 10);
    return sum + num;
  }, 0);

  return (
    <div className="page active" id="page-workspace">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace, CRM &amp; Client Systems</h1>
        </div>
      </div>

      {/* Workspace Navigation Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div className="tabs" style={{ margin: 0 }}>
          <span
            className={`tab ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            Client Deals Pipeline
          </span>
          <span
            className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Contacts &amp; Accounts ({crm.contacts.length})
          </span>
          <span
            className={`tab ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => setActiveTab('followups')}
          >
            AI Follow-Up Queue ({crm.followUps.length})
          </span>
          <span
            className={`tab ${activeTab === 'agency-store' ? 'active' : ''}`}
            onClick={() => setActiveTab('agency-store')}
          >
            Cursis Agency Solutions
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {activeTab === 'crm' && (
            <button className="btn btn-primary btn-sm" onClick={() => setDealModalOpen(true)}>
              + New Deal
            </button>
          )}
          {activeTab === 'contacts' && (
            <button className="btn btn-primary btn-sm" onClick={() => setContactModalOpen(true)}>
              + New Contact
            </button>
          )}
          {activeTab === 'agency-store' && (
            <button className="btn btn-primary btn-sm" onClick={() => openModal('agency-modal')}>
              Request Custom Build →
            </button>
          )}
        </div>
      </div>

      {/* Deals Pipeline Tab */}
      {activeTab === 'crm' && (
        <div>
          {/* Pipeline Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
              <div className="stat-label">TOTAL PIPELINE VALUE</div>
              <div className="stat-value">{formatCurrency(totalPipelineValue)}</div>
              <div className="stat-change positive">{crm.deals.length} active opportunities</div>
            </div>
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
              <div className="stat-label">WON DEALS</div>
              <div className="stat-value">
                {formatCurrency(
                  crm.deals
                    .filter((d) => d.stage === 'stage_won')
                    .reduce((sum, d) => sum + parseInt(d.value.replace(/[^0-9]/g, '') || '0', 10), 0)
                )}
              </div>
              <div className="stat-change positive">100% committed</div>
            </div>
            <div className="card" style={{ padding: 'var(--sp-3)', background: 'var(--c-surface)' }}>
              <div className="stat-label">AVG DEAL SIZE</div>
              <div className="stat-value">
                {formatCurrency(crm.deals.length ? Math.round(totalPipelineValue / crm.deals.length) : 0)}
              </div>
              <div className="stat-change">Across enterprise accounts</div>
            </div>
          </div>

          {/* Pipeline Stages Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${crm.pipeline.length}, 1fr)`, gap: 'var(--sp-3)', alignItems: 'start' }}>
            {crm.pipeline.map((stage) => {
              const stageDeals = crm.deals.filter((d) => d.stage === stage.id);
              return (
                <div
                  key={stage.id}
                  className="kanban-column"
                  style={{
                    background: 'var(--c-surface)',
                    border: 'var(--border-width) solid var(--border-color)',
                    padding: 'var(--sp-3)',
                    minHeight: '440px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--sp-2)', borderBottom: 'var(--border-width) solid var(--border-color)', marginBottom: 'var(--sp-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', background: stage.color, display: 'inline-block' }} />
                      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)' }}>{stage.name}</span>
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{stageDeals.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                    {stageDeals.length === 0 ? (
                      <div style={{ padding: 'var(--sp-4)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '11px', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-xs)' }}>
                        No deals
                      </div>
                    ) : (
                      stageDeals.map((d) => (
                      <div
                        key={d.id}
                        className="card"
                        style={{
                          background: 'white',
                          padding: 'var(--sp-3)',
                          border: 'var(--border-width) solid var(--border-color)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', marginBottom: '2px' }}>{d.title}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-brand)', fontWeight: 'bold', marginBottom: 'var(--sp-2)' }}>
                          {d.client}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                          <span style={{ fontSize: 'var(--fs-md)', fontWeight: 'var(--fw-black)' }}>{d.value}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderTop: '1px solid var(--c-gray-200)', paddingTop: 'var(--sp-2)' }}>
                          {crm.pipeline.map((p) => (
                            <button
                              key={p.id}
                              className={`btn ${d.stage === p.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                              style={{ fontSize: '9px', padding: '1px 4px' }}
                              onClick={() => updateDealStage(d.id, p.id)}
                            >
                              {p.name.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Contacts Table Tab */}
      {activeTab === 'contacts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Contact Name</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Company</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Role</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {crm.contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
                    No contacts recorded yet. Click &quot;+ New Contact&quot; to add your client directory.
                  </td>
                </tr>
              ) : (
                crm.contacts.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--c-gray-200)' }}>
                    <td style={{ padding: 'var(--sp-3)', fontWeight: 'var(--fw-bold)' }}>{c.name}</td>
                    <td style={{ padding: 'var(--sp-3)' }}>{c.company}</td>
                    <td style={{ padding: 'var(--sp-3)' }}>{c.role}</td>
                    <td style={{ padding: 'var(--sp-3)' }}>{c.email}</td>
                    <td style={{ padding: 'var(--sp-3)', fontFamily: 'var(--font-mono)' }}>{c.phone}</td>
                    <td style={{ padding: 'var(--sp-3)' }}>
                      <span className="badge badge-brand">{c.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. AI Follow-Up Queue Tab */}
      {activeTab === 'followups' && (
        <div className="card" style={{ padding: 'var(--sp-4)' }}>
          <h3 style={{ marginBottom: 'var(--sp-3)' }}>Automated Follow-Up Queue</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {crm.followUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
                No pending follow-ups in the queue. ORDIS AI generates automated follow-up reminders as deal stages change.
              </div>
            ) : (
              crm.followUps.map((fu) => {
              const contact = crm.contacts.find((c) => c.id === fu.contactId);
              return (
                <div
                  key={fu.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-3)',
                    background: 'var(--c-surface)',
                    border: 'var(--border-width) solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)' }}>
                      {contact ? `${contact.name} (${contact.company})` : 'Contact'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {fu.note}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--c-brand)' }}>
                      Due {formatDate(fu.dueDate)}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => showToast(`Sent follow-up reminder for ${contact?.name}`)}
                    >
                      Trigger Reminder
                    </button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* Cursis Agency Storefront */}
      {activeTab === 'agency-store' && (
        <div>
          <div className="card" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)', background: 'var(--c-white)', borderLeft: '6px solid var(--c-brand)' }}>
            <span className="badge badge-brand" style={{ marginBottom: 'var(--sp-2)' }}>CURSIS AI SOLUTIONS AGENCY</span>
            <h2 style={{ margin: '0 0 var(--sp-2) 0', fontSize: 'var(--fs-2xl)' }}>Custom AI Engineering &amp; Client Workspaces</h2>
            <p style={{ margin: '0 0 var(--sp-4) 0', color: 'var(--text-secondary)', maxWidth: '720px' }}>
              We design and engineer bespoke AI platforms, paperwork automation engines, custom CRM pipelines, and enterprise integrations.
            </p>
            <button className="btn btn-primary" onClick={() => openModal('agency-modal')}>
              Request a Custom Client Solution →
            </button>
          </div>

          <h3 style={{ marginBottom: 'var(--sp-3)' }}>Bespoke Solution Offerings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
            {INITIAL_AGENCY_SERVICES.map((s) => (
              <div key={s.id} className="card" style={{ padding: 'var(--sp-4)' }}>
                <div className="badge badge-neutral" style={{ marginBottom: 'var(--sp-2)', fontSize: '10px' }}>{s.category}</div>
                <h4 style={{ margin: '0 0 var(--sp-1) 0', fontSize: 'var(--fs-md)' }}>{s.name}</h4>
                <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: 'var(--sp-3)' }}>Client Case Studies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
            {INITIAL_CASE_STUDIES.map((cs) => (
              <div key={cs.id} className="card" style={{ padding: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
                  <span style={{ fontWeight: 'var(--fw-bold)' }}>{cs.client}</span>
                  <span className="badge badge-brand">{cs.value}</span>
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-brand)', fontWeight: 'bold', marginBottom: '4px' }}>
                  {cs.solution}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{cs.outcome}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      {dealModalOpen && (
        <div className="modal-overlay active" onClick={() => setDealModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New CRM Deal</span>
              <button className="modal-close" onClick={() => setDealModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDeal}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Deal Title</label>
                  <input
                    className="input"
                    placeholder="e.g. Enterprise Paperwork Engine"
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Client / Account</label>
                    <input
                      className="input"
                      placeholder="e.g. Acme Corp"
                      value={dealClient}
                      onChange={(e) => setDealClient(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Value</label>
                    <input
                      className="input"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Stage</label>
                  <select
                    className="input select"
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                  >
                    {crm.pipeline.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Contact Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="lead@company.com"
                    value={dealEmail}
                    onChange={(e) => setDealEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDealModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {contactModalOpen && (
        <div className="modal-overlay active" onClick={() => setContactModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New Contact</span>
              <button className="modal-close" onClick={() => setContactModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateContact}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    className="input"
                    placeholder="e.g. John Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Company</label>
                    <input
                      className="input"
                      placeholder="e.g. Acme Corp"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Role</label>
                    <input
                      className="input"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="john@company.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="+1-555-0199"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setContactModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
