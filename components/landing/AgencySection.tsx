'use client';

import React, { useState } from 'react';

export default function AgencySection() {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('AI Agents');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', details: '' });

  const services = [
    {
      icon: 'A',
      title: 'AI AGENTS',
      desc: 'Custom AI agents built for your specific business workflows and processes.',
      deliverable: 'Autonomous task orchestration, multi-agent systems, custom vector memories',
    },
    {
      icon: 'B',
      title: 'AUTOMATION',
      desc: 'End-to-end workflow automation that eliminates repetitive manual work.',
      deliverable: 'CRM syncing, webhook event handlers, automated document generation',
    },
    {
      icon: 'D',
      title: 'DASHBOARDS',
      desc: 'Custom analytics dashboards that give you real-time business intelligence.',
      deliverable: 'KPI tracking, revenue metrics, team velocity, live MongoDB telemetry',
    },
    {
      icon: 'I',
      title: 'INTEGRATIONS',
      desc: 'Connect your existing tools to Cursis or build custom API integrations.',
      deliverable: 'Slack, Notion, Google Workspace, Stripe, Jira, custom REST/GraphQL APIs',
    },
    {
      icon: 'S',
      title: 'CUSTOM SOFTWARE',
      desc: 'Full custom software development for unique business requirements.',
      deliverable: 'Full-stack Next.js web applications, internal tools, mobile portals',
    },
    {
      icon: 'C',
      title: 'CONSULTING',
      desc: 'Strategic AI consulting to identify where AI can transform your operations.',
      deliverable: 'Workflow audits, AI feasibility analysis, security & compliance reviews',
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
    <section
      className="lp-section"
      id="agency"
      style={{
        background: '#f4f3ed',
        borderTop: '2px solid #000000',
        borderBottom: '2px solid #000000',
        paddingTop: '80px',
        paddingBottom: '90px',
      }}
    >
      <div className="lp-agency-section">
        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--c-brand, #0f4cff)',
              marginBottom: '8px',
            }}
          >
            CURSIS AGENCY
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#000000',
              marginBottom: '14px',
            }}
          >
            NEED MORE? WE BUILD IT FOR YOU.
          </h2>
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#333333',
              maxWidth: '850px',
              fontWeight: 500,
            }}
          >
            Cursis is also a full-service AI agency. If you need custom solutions, we
            build AI agents, automations, dashboards, and integrations — powered by
            the same team that builds this workspace.
          </p>
        </div>

        <div className="lp-agency-grid">
          {services.map((item) => (
            <div
              key={item.title}
              className="lp-agency-card"
              onClick={() => {
                setSelectedService(item.title);
                setInquiryModalOpen(true);
              }}
              style={{ cursor: 'pointer' }}
              title={`Click to inquire about ${item.title}`}
            >
              <div className="lp-agency-card-icon">{item.icon}</div>
              <div className="lp-agency-card-title">{item.title}</div>
              <div className="lp-agency-card-desc">{item.desc}</div>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px dashed rgba(0,0,0,0.15)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--c-brand, #0f4cff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Request build →</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setInquiryModalOpen(true)}
            style={{
              boxShadow: '4px 4px 0 #000',
              border: '2px solid #000',
              fontWeight: 900,
            }}
          >
            Talk to Our Agency
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* Interactive Agency Inquiry Modal */}
      {inquiryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInquiryModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#f4f3ed',
              border: '3px solid #000000',
              boxShadow: '8px 8px 0px #000000',
              width: '100%',
              maxWidth: '520px',
              padding: '30px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setInquiryModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ffffff',
                border: '1.5px solid #000000',
                width: '28px',
                height: '28px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f4cff', textTransform: 'uppercase', marginBottom: '4px' }}>
              CURSIS AGENCY INQUIRY
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
              Custom {selectedService} Project
            </h3>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>
              Tell us what you want to build. Our engineering team will review your requirements and respond within 24 hours with an architecture roadmap.
            </p>

            {submitted ? (
              <div
                style={{
                  padding: '24px',
                  background: '#dcfce7',
                  border: '2px solid #000',
                  boxShadow: '3px 3px 0 #000',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#15803d',
                }}
              >
                ✓ Inquiry Received! The Cursis Agency engineering team will be in touch shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1.5px solid #000',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1.5px solid #000',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Project Requirements / Vision
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder={`Describe the custom ${selectedService} solution you need...`}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1.5px solid #000',
                      background: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    fontWeight: 900,
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0 #000',
                  }}
                >
                  Submit Project Brief ➔
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
