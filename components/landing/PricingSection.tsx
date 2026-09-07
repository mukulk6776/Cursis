'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingSection() {
  const basicPoints = [
    'Unlimited projects, tasks & Kanban boards',
    'Full team management & Creator Pipeline roles',
    'Real-time messages, Docs, Notes & Calendar',
    'Ordis Basic Chatbot: answers doubts on all features',
    'Instant summaries & lists on demand',
    'Zero-error resilience for all mysterious questions',
    '100% Free forever · No credit card required',
  ];

  const proPoints = [
    'Everything in Basic Plan, plus:',
    '1. Access to EVERY feature & workspace subsystem',
    'Deep ambient scanning & predictive bottleneck alerts',
    'Full CRM deal pipeline & automated client invoicing',
    'Developer API keys & webhook event dispatchers',
    '2. Dynamic Feature Builder: makes new features on the fly',
    'Auto-generates schemas, widgets & custom tools from prompts',
    'Priority AI compute & real-time telemetry audit logs',
  ];

  const agencyPoints = [
    'Bespoke AI agent development for your company',
    'End-to-end workflow automation & custom APIs',
    'Custom analytics dashboards & business intelligence',
    'Full-stack custom software development',
    'Dedicated engineering team & private Slack channel',
    'Enterprise SLA, SSO & vector database hosting',
  ];

  return (
    <section className="lp-section" id="pricing" style={{ background: '#f4f3ed' }}>
      <div className="lp-section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div className="lp-section-label" style={{ display: 'inline-block' }}>Transparent Pricing</div>
        <h2 className="lp-section-title">Transparent plans. Extreme capability.</h2>
        <p className="lp-section-subtitle" style={{ margin: '0 auto', maxWidth: '700px' }}>
          Start free forever with our complete workspace and Ordis Chatbot, or upgrade to Ordis Pro for autonomous feature creation.
        </p>
      </div>

      <div className="lp-pricing-tiers-grid">
        {/* Tier 1: Basic Plan (Free Forever) */}
        <div className="lp-pricing-card-brutal">
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: '#e5e7eb',
                color: '#111827',
                padding: '3px 8px',
                border: '1px solid #000',
                boxShadow: '2px 2px 0 #000',
                display: 'inline-block',
                marginBottom: '10px',
              }}
            >
              BASIC PLAN · FREE FOREVER
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Cursis Starter
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
              Complete workspace with Ordis Chatbot to answer doubts, summarize, and list.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>$</span>
            <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>0</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#666' }}>/ forever</span>
          </div>

          <div style={{ height: '2px', background: '#000', marginBottom: '20px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', flex: 1 }}>
            {basicPoints.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: '#0f4cff', fontWeight: 900 }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="btn btn-secondary"
            style={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 900,
              border: '2px solid #000',
              boxShadow: '3px 3px 0 #000',
              padding: '12px',
            }}
          >
            Start Free Workspace
          </Link>
        </div>

        {/* Tier 2: Paid Version (Ordis Pro / $1B Tier) */}
        <div className="lp-pricing-card-brutal featured">
          <div className="lp-pricing-featured-badge">
            ⚡ PRO ORDIS · 1B $ TIER
          </div>

          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: '#0f4cff',
                color: '#fff',
                padding: '3px 8px',
                border: '1px solid #000',
                boxShadow: '2px 2px 0 #000',
                display: 'inline-block',
                marginBottom: '10px',
              }}
            >
              PAID VERSION · AUTONOMOUS
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Ordis Pro
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
              Has access to every feature + makes brand new custom features according to your requests.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>$</span>
            <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>29</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#666' }}>/ month</span>
          </div>

          <div style={{ height: '2px', background: '#0f4cff', marginBottom: '20px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', flex: 1 }}>
            {proPoints.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: p.includes('1.') || p.includes('2.') ? 800 : 600,
                  color: p.includes('1.') || p.includes('2.') ? '#0f4cff' : '#000',
                }}
              >
                <span style={{ color: '#0f4cff', fontWeight: 900 }}>⚡</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <Link
            href="/signup?plan=pro"
            className="btn btn-primary"
            style={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 900,
              border: '2px solid #000',
              boxShadow: '3px 3px 0 #000',
              padding: '12px',
            }}
          >
            Upgrade to Ordis Pro ➔
          </Link>
        </div>

        {/* Tier 3: Cursis Agency Custom */}
        <div className="lp-pricing-card-brutal">
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: '#ff5710',
                color: '#fff',
                padding: '3px 8px',
                border: '1px solid #000',
                boxShadow: '2px 2px 0 #000',
                display: 'inline-block',
                marginBottom: '10px',
              }}
            >
              FULL-SERVICE AGENCY
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Cursis Agency
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
              Custom software, automations, and AI agents built exclusively for your company.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>Custom</span>
          </div>

          <div style={{ height: '2px', background: '#000', marginBottom: '20px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', flex: 1 }}>
            {agencyPoints.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ color: '#ff5710', fontWeight: 900 }}>✓</span>
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
              padding: '12px',
            }}
          >
            Inquire Agency Build
          </a>
        </div>
      </div>
    </section>
  );
}
