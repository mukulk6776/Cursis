'use client';

import React, { useState } from 'react';

export default function AgencySection() {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('AI Agents');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', details: '' });

  const services = [
    {
      title: 'AI AGENTS',
      desc: 'Custom autonomous agents built for your specific enterprise business workflows.',
      deliverable: 'Autonomous task orchestration, multi-agent systems, custom vector memories',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      ),
    },
    {
      title: 'AUTOMATION',
      desc: 'End-to-end workflow automation that eliminates repetitive manual operations.',
      deliverable: 'CRM syncing, webhook event handlers, automated document generation',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      title: 'DASHBOARDS',
      desc: 'Custom analytics dashboards delivering real-time business telemetry.',
      deliverable: 'KPI tracking, revenue metrics, team velocity, live database telemetry',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      title: 'INTEGRATIONS',
      desc: 'Connect your enterprise stack to Cursis or build specialized API connectors.',
      deliverable: 'Slack, Notion, Google Workspace, Stripe, Jira, custom REST/GraphQL APIs',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
    },
    {
      title: 'CUSTOM SOFTWARE',
      desc: 'Bespoke full-stack engineering tailored for specialized enterprise requirements.',
      deliverable: 'Next.js App Router platforms, internal systems, role-based workflows',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      title: 'STRATEGIC CONSULTING',
      desc: 'Operational audits to identify high-leverage AI deployment opportunities.',
      deliverable: 'Workflow audits, AI feasibility analysis, security & compliance reviews',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setInquiryModalOpen(false);
      setSubmitted(false);
      setFormData({ name: '', email: '', details: '' });
    }, 2500);
  };

  return (
    <section className="lp-section" id="agency">
      <div className="lp-agency-section">
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div className="lp-section-label">Cursis Solutions Studio</div>
          <h2 className="lp-section-title">Specialized Enterprise Engineering</h2>
          <p className="lp-section-subtitle" style={{ margin: '8px 0 0' }}>
            Cursis operates an in-house engineering and solutions practice. Need custom AI agents, automated data connectors, or bespoke enterprise features? We architect and deploy it directly into your workspace.
          </p>
        </div>

        <div className="lp-agency-grid">
          {services.map((item) => (
            <div
              key={item.title}
              className="tano-agency-card"
              onClick={() => {
                setSelectedService(item.title);
                setInquiryModalOpen(true);
              }}
              title={`Click to inquire about ${item.title}`}
            >
              <div className="tano-agency-icon">
                {item.icon}
              </div>
              <h3 className="tano-agency-title">{item.title}</h3>
              <p className="tano-agency-desc">{item.desc}</p>
              <div className="tano-agency-footer">
                <span>Request Custom Build →</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setInquiryModalOpen(true)}
          >
            Consult Our Engineering Studio
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* Interactive Agency Inquiry Modal (Authentic Tano Neo-Brutalist) */}
      {inquiryModalOpen && (
        <div
          className="tano-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInquiryModalOpen(false);
          }}
        >
          <div className="tano-modal-card">
            {/* Washi tape on modal */}
            <div className="tano-washi-tape" style={{ top: -11, left: '50%', transform: 'translateX(-50%) rotate(-1.5deg)' }} aria-hidden="true" />

            <button
              onClick={() => setInquiryModalOpen(false)}
              className="tano-modal-close"
              aria-label="Close modal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="tano-modal-eyebrow">
              CURSIS ENGINEERING STUDIO
            </div>
            <h3 className="tano-modal-title">
              Custom {selectedService} Project
            </h3>
            <p className="tano-modal-subtitle">
              Tell us what you want to build. Our senior architects will review your requirements and return with an architectural proposal within 24 hours.
            </p>

            {submitted ? (
              <div className="tano-modal-success">
                Inquiry Received. The Cursis Solutions Studio will contact you within 24 hours.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="tano-modal-form">
                <div>
                  <label className="tano-form-label">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="tano-form-input"
                  />
                </div>

                <div>
                  <label className="tano-form-label">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="tano-form-input"
                  />
                </div>

                <div>
                  <label className="tano-form-label">
                    Project Requirements / Architecture Brief
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder={`Describe the custom ${selectedService} solution you need...`}
                    className="tano-form-input tano-form-textarea"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: '8px' }}
                >
                  Submit Project Brief →
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
