'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingSection() {
  const basicPoints = [
    'Unlimited projects, tasks & Kanban hierarchy',
    'Full team directory & granular RBAC permissions',
    'Real-time messages, collaborative Docs & Calendar sync',
    'Ordis Intelligence: Conversational guidance & workflow orchestration',
    'Instant executive sprint summaries & deliverable matrices',
    'Deterministic execution with zero-hallucination guardrails',
    'Standard Enterprise Tier · Zero licensing seat tax',
  ];

  const agencyPoints = [
    'Bespoke AI agent development for your organization',
    'End-to-end workflow automation & dedicated custom APIs',
    'Custom executive dashboards & enterprise business intelligence',
    'Full-stack custom software engineering by core architects',
    'Dedicated engineering team & private enterprise Slack/Teams bridge',
    'Enterprise 99.99% SLA, Okta/SAML SSO & dedicated vector hosting',
  ];

  return (
    <section className="lp-section" id="pricing" style={{ background: '#f8f8f6', padding: '90px 24px' }}>
      <div className="lp-section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div className="lp-section-label" style={{ display: 'inline-block' }}>Predictable Architecture</div>
        <h2 className="lp-section-title">Predictable Pricing. Enterprise Capability.</h2>
        <p className="lp-section-subtitle" style={{ margin: '0 auto', maxWidth: '720px' }}>
          Deploy the complimentary Standard Tier for your entire workforce with complete Ordis intelligence and execution, or engage our core architects for bespoke Enterprise Sovereign deployments.
        </p>
      </div>

      <div className="lp-pricing-tiers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', maxWidth: '980px', margin: '0 auto' }}>
        {/* Tier 1: Standard Tier */}
        <div className="lp-pricing-card-brutal featured" style={{ background: '#fff', border: '2px solid #000', boxShadow: '6px 6px 0 #000', padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: '#FF5500',
                color: '#fff',
                padding: '4px 10px',
                border: '1px solid #000',
                boxShadow: '2px 2px 0 #000',
                display: 'inline-block',
                marginBottom: '12px',
              }}
            >
              STANDARD WORKSPACE · FULL CAPABILITY
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Cursis Standard
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
              Complete unified workspace with Ordis AI copilot, sprint synthesis, full task &amp; document pipelines, and zero licensing seat tax.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>$</span>
            <span style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1 }}>0</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#666' }}>/ seat (Complimentary)</span>
          </div>

          <div style={{ height: '2px', background: '#000', marginBottom: '24px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
            {basicPoints.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: '#FF5500', fontWeight: 900 }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="btn btn-primary"
            style={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 900,
              border: '2px solid #000',
              boxShadow: '3px 3px 0 #000',
              padding: '14px',
              background: '#FF5500',
              color: '#fff',
            }}
          >
            Deploy Standard Workspace →
          </Link>
        </div>

        {/* Tier 2: Enterprise Sovereign */}
        <div className="lp-pricing-card-brutal" style={{ background: '#fff', border: '2px solid #000', boxShadow: '6px 6px 0 #000', padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: '#0f172a',
                color: '#fff',
                padding: '4px 10px',
                border: '1px solid #000',
                boxShadow: '2px 2px 0 #000',
                display: 'inline-block',
                marginBottom: '12px',
              }}
            >
              ENTERPRISE SOVEREIGN · BESPOKE
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Cursis Sovereign
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
              Dedicated engineering, custom agent architecture, private infrastructure, and guaranteed SLAs for large-scale organizations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>Custom Enterprise</span>
          </div>

          <div style={{ height: '2px', background: '#000', marginBottom: '24px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
            {agencyPoints.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: '#000', fontWeight: 900 }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <a
            href="#agency"
            className="btn btn-secondary"
            style={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 900,
              border: '2px solid #000',
              boxShadow: '3px 3px 0 #000',
              padding: '14px',
              background: '#0A0A0A',
              color: '#fff',
            }}
          >
            Contact Enterprise Solutions →
          </a>
        </div>
      </div>
    </section>
  );
}
