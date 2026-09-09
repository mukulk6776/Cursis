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

 const proPoints = [
 'Everything in Standard Tier, plus:',
 '1. Complete access to all 17 unified subsystems & telemetry',
 'Deep ambient scanning & predictive bottleneck alerts',
 'Enterprise CRM pipeline & automated client invoicing',
 'Production API keys & webhook event dispatchers',
 '2. Dynamic Feature Synthesis: Compiles custom schemas & tools',
 'Auto-generates schemas, custom tools, and database collections',
 'Dedicated compute priority & real-time telemetry audit logs',
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
 Deploy the complimentary Standard Tier for your core workforce, or upgrade to Autonomous Pro for real-time telemetry and generative feature compilation.
 </p>
 </div>

 <div className="lp-pricing-tiers-grid">
 {/* Tier 1: Standard Tier */}
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
 STANDARD TIER · COMPLIMENTARY CORE
 </span>
 <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
 Cursis Standard
 </h3>
 <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
 Complete unified workspace with Ordis conversational guidance, sprint synthesis, and workflow tracking.
 </p>
 </div>

 <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
 <span style={{ fontSize: '28px', fontWeight: 900 }}>$</span>
 <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>0</span>
 <span style={{ fontSize: '14px', fontWeight: 700, color: '#666' }}>/ seat (Complimentary)</span>
 </div>

 <div style={{ height: '2px', background: '#000', marginBottom: '20px' }} />

 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', flex: 1 }}>
 {basicPoints.map((p, idx) => (
 <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
 <span style={{ color: '#0f4cff', fontWeight: 900 }}></span>
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
 Deploy Standard Workspace
 </Link>
 </div>

 {/* Tier 2: Autonomous Pro */}
 <div className="lp-pricing-card-brutal featured">
 <div className="lp-pricing-featured-badge">
 AUTONOMOUS ORDIS · ENTERPRISE VELOCITY
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
 AUTONOMOUS PRO · HIGH VELOCITY
 </span>
 <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
 Cursis Autonomous Pro
 </h3>
 <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
 Full system omniscience, continuous ambient bottleneck scanning, and autonomous dynamic feature synthesis.
 </p>
 </div>

 <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
 <span style={{ fontSize: '28px', fontWeight: 900 }}>$</span>
 <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>29</span>
 <span style={{ fontSize: '14px', fontWeight: 700, color: '#666' }}>/ seat / month</span>
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
 <span style={{ color: '#0f4cff', fontWeight: 900 }}></span>
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
 Deploy Autonomous Pro 
 </Link>
 </div>

 {/* Tier 3: Enterprise Sovereign */}
 <div className="lp-pricing-card-brutal">
 <div style={{ marginBottom: '18px' }}>
 <span
 style={{
 fontSize: '11px',
 fontWeight: 900,
 textTransform: 'uppercase',
 background: '#0f172a',
 color: '#fff',
 padding: '3px 8px',
 border: '1px solid #000',
 boxShadow: '2px 2px 0 #000',
 display: 'inline-block',
 marginBottom: '10px',
 }}
 >
 ENTERPRISE SOVEREIGN · BESPOKE
 </span>
 <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
 Cursis Sovereign
 </h3>
 <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
 Dedicated engineering, custom agent architecture, private infrastructure, and guaranteed SLAs.
 </p>
 </div>

 <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
 <span style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1 }}>Custom Enterprise</span>
 </div>

 <div style={{ height: '2px', background: '#000', marginBottom: '20px' }} />

 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', flex: 1 }}>
 {agencyPoints.map((p, idx) => (
 <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
 <span style={{ color: '#0f4cff', fontWeight: 900 }}></span>
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
 Contact Enterprise Solutions
 </a>
 </div>
 </div>
 </section>
 );
}
