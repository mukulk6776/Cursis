'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Sparkles, Users, Zap, BarChart3, MessageSquare, FolderKanban, Target, Workflow, Clock, Shield } from 'lucide-react';
import LandingNav from './LandingNav';
import Footer from './Footer';
import ScrollObserver from './ScrollObserver';
import '@/styles/landing.css';

export default function LandingPageBalanced() {
  return (
    <div className="lp-body lp-balanced">
      <ScrollObserver />
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSectionBalanced />
        <TrustBarBalanced />
        <ProblemSolutionBalanced />
        <FeaturesShowcaseBalanced />
        <HowItWorksBalanced />
        <TestimonialBalanced />
        <CtaSectionBalanced />
      </main>
      <Footer />
    </div>
  );
}

function HeroSectionBalanced() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <section className="tano-hero lp-reveal">
      <div className="tano-container">
        <div className="tano-hero-badge lp-reveal" style={{ transitionDelay: '0.1s' }}>
          <Sparkles size={16} />
          <span>Powered by Ordis Autonomous AI</span>
        </div>

        <h1 className="tano-hero-title lp-reveal" style={{ transitionDelay: '0.2s' }}>
          Your workspace that works for you
        </h1>

        <p className="tano-hero-subtitle lp-reveal" style={{ transitionDelay: '0.3s' }}>
          Cursis is the autonomous AI workplace that detects bottlenecks, rebalances workloads, and takes real actions—so your team can focus on what matters.
        </p>

        <div className="tano-hero-cta lp-reveal" style={{ transitionDelay: '0.4s' }}>
          <a href="/signup" className="tano-btn tano-btn-primary tano-btn-lg">
            Start free trial
            <ArrowRight size={18} />
          </a>
          <a href="#features" className="tano-btn tano-btn-secondary tano-btn-lg">
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

function TrustBarBalanced() {
  return (
    <section className="tano-trust-bar lp-reveal">
      <div className="tano-container">
        <div className="tano-trust-stats">
          <div className="tano-trust-stat">
            <strong>1,250+</strong>
            <span>Teams worldwide</span>
          </div>
          <div className="tano-trust-divider" />
          <div className="tano-trust-stat">
            <strong>99.99%</strong>
            <span>Uptime SLA</span>
          </div>
          <div className="tano-trust-divider" />
          <div className="tano-trust-stat">
            <strong>SOC 2</strong>
            <span>Certified</span>
          </div>
          <div className="tano-trust-divider" />
          <div className="tano-trust-stat">
            <strong>40%</strong>
            <span>Avg. velocity increase</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSolutionBalanced() {
  return (
    <section className="tano-section tano-section-alt">
      <div className="tano-container">
        <div className="tano-split">
          <div className="tano-split-content lp-reveal-left">
            <h2 className="tano-section-title">The problem with traditional workspaces</h2>
            <div className="tano-problem-list">
              <div className="tano-problem-item">
                <div className="tano-problem-x">✕</div>
                <div>
                  <strong>Reactive management</strong>
                  <p>You only find out about bottlenecks after they've become fires</p>
                </div>
              </div>
              <div className="tano-problem-item">
                <div className="tano-problem-x">✕</div>
                <div>
                  <strong>Manual workload balancing</strong>
                  <p>Managers spend hours redistributing tasks and checking capacity</p>
                </div>
              </div>
              <div className="tano-problem-item">
                <div className="tano-problem-x">✕</div>
                <div>
                  <strong>Fragmented tools</strong>
                  <p>Data scattered across Slack, Jira, Notion, Asana, and spreadsheets</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tano-split-content lp-reveal-right">
            <h2 className="tano-section-title">How Cursis solves it</h2>
            <div className="tano-solution-list">
              <div className="tano-solution-item">
                <div className="tano-solution-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <strong>Proactive intelligence</strong>
                  <p>Ordis identifies bottlenecks and suggests optimizations before you ask</p>
                </div>
              </div>
              <div className="tano-solution-item">
                <div className="tano-solution-icon">
                  <Users size={20} />
                </div>
                <div>
                  <strong>Autonomous actions</strong>
                  <p>Automatically rebalances workloads, updates status, and delegates tasks</p>
                </div>
              </div>
              <div className="tano-solution-item">
                <div className="tano-solution-icon">
                  <Target size={20} />
                </div>
                <div>
                  <strong>Unified workspace</strong>
                  <p>Projects, tasks, docs, chat, and analytics in one place</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesShowcaseBalanced() {
  const features = [
    { icon: MessageSquare, name: 'Ordis AI Chat', desc: 'Natural language workspace commands and intelligent suggestions', color: '#FF5500' },
    { icon: FolderKanban, name: 'Projects & Tasks', desc: 'Kanban boards, Gantt charts, and workload views', color: '#FFC233' },
    { icon: Users, name: 'Team Management', desc: 'Roles, permissions, departments, and capacity planning', color: '#4ADE80' },
    { icon: BarChart3, name: 'Analytics', desc: 'Velocity tracking, burndown charts, and capacity insights', color: '#93C5FD' },
    { icon: Workflow, name: 'Automation', desc: 'Smart delegation, auto-rebalancing, and workflow triggers', color: '#C084FC' },
    { icon: Shield, name: 'Enterprise Ready', desc: 'SSO, RBAC, audit logs, and compliance', color: '#F472B6' },
  ];

  return (
    <section id="features" className="tano-section">
      <div className="tano-container">
        <div className="tano-section-header lp-reveal">
          <h2 className="tano-section-title tano-centered">Everything you need to run your team</h2>
          <p className="tano-section-subtitle tano-centered">
            A complete workspace platform with proactive AI that takes action
          </p>
        </div>

        <div className="tano-features-grid lp-stagger">
          {features.map((feat, idx) => (
            <div key={idx} className="tano-feature-card">
              <div className="tano-feature-icon" style={{ background: feat.color }}>
                <feat.icon size={24} />
              </div>
              <h3 className="tano-feature-title">{feat.name}</h3>
              <p className="tano-feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksBalanced() {
  const steps = [
    { number: '01', title: 'Connect your team', desc: 'Invite your team and set up projects in minutes', icon: Users },
    { number: '02', title: 'Ordis learns your workflow', desc: 'AI observes patterns and builds intelligence', icon: Sparkles },
    { number: '03', title: 'Autonomous optimization', desc: 'Ordis proactively balances work and removes blockers', icon: Zap },
  ];

  return (
    <section className="tano-section tano-section-alt">
      <div className="tano-container">
        <div className="tano-section-header lp-reveal">
          <h2 className="tano-section-title tano-centered">How it works</h2>
          <p className="tano-section-subtitle tano-centered">
            Get up and running in three simple steps
          </p>
        </div>

        <div className="tano-steps-grid lp-stagger">
          {steps.map((step, idx) => (
            <div key={idx} className="tano-step-card">
              <div className="tano-step-number">{step.number}</div>
              <div className="tano-step-icon">
                <step.icon size={28} />
              </div>
              <h3 className="tano-step-title">{step.title}</h3>
              <p className="tano-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialBalanced() {
  return (
    <section className="tano-section">
      <div className="tano-container tano-container-narrow">
        <div className="tano-testimonial-card lp-reveal-scale">
          <div className="tano-quote-mark">"</div>
          <blockquote className="tano-testimonial-quote">
            Cursis transformed how we work. Ordis catches bottlenecks before they become fires, and our team velocity increased 40% in the first quarter. It's like having a brilliant operations manager working 24/7.
          </blockquote>
          <div className="tano-testimonial-author">
            <div className="tano-author-avatar">SC</div>
            <div>
              <strong className="tano-author-name">Sarah Chen</strong>
              <p className="tano-author-title">VP Engineering, TechFlow</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSectionBalanced() {
  return (
    <section className="tano-cta-section">
      <div className="tano-container">
        <div className="tano-cta-card lp-reveal-scale">
          <h2 className="tano-cta-title">Ready to work smarter?</h2>
          <p className="tano-cta-subtitle">
            Join 1,250+ teams using Cursis to build better, faster.
          </p>
          <div className="tano-cta-actions">
            <a href="/signup" className="tano-btn tano-btn-cta tano-btn-xl">
              Start free trial
              <ArrowRight size={20} />
            </a>
          </div>
          <p className="tano-cta-note">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}
