'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Sparkles, Users, Zap, BarChart3, MessageSquare, FolderKanban } from 'lucide-react';
import LandingNav from './LandingNav';
import Footer from './Footer';
import '@/styles/landing.css';

export default function LandingPageCondensed() {
  return (
    <div className="lp-body lp-condensed">
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSectionCondensed />
        <ValuePropsCondensed />
        <FeaturesGridCondensed />
        <SocialProofCondensed />
        <CtaSectionCondensed />
      </main>
      <Footer />
    </div>
  );
}

function HeroSectionCondensed() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <section className="hero-condensed" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="hero-condensed-container">
        <div className="hero-badge" style={{ transitionDelay: '0.1s', opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.9)' }}>
          <Sparkles size={14} />
          <span>Powered by Ordis Autonomous AI</span>
        </div>

        <h1 style={{ transitionDelay: '0.2s', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}>
          Your workspace that works for you
        </h1>

        <p className="hero-subtitle" style={{ transitionDelay: '0.3s', opacity: isVisible ? 1 : 0 }}>
          Cursis is an autonomous AI workplace that detects bottlenecks, rebalances workloads, and takes real actions—so your team can focus on what matters.
        </p>

        <div className="hero-cta-group" style={{ transitionDelay: '0.4s', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}>
          <a href="/signup" className="btn-primary-hero">
            Start free trial
            <ArrowRight size={16} />
          </a>
          <a href="#features" className="btn-secondary-hero">
            See how it works
          </a>
        </div>

        <div className="hero-trust" style={{ transitionDelay: '0.5s', opacity: isVisible ? 1 : 0 }}>
          <div className="trust-stat">
            <strong>1,250+</strong>
            <span>teams</span>
          </div>
          <div className="trust-stat">
            <strong>99.99%</strong>
            <span>uptime SLA</span>
          </div>
          <div className="trust-stat">
            <strong>SOC 2</strong>
            <span>certified</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuePropsCondensed() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            [0, 1, 2].forEach((i) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, i]);
              }, i * 150);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const props = [
    {
      icon: Zap,
      title: 'Proactive intelligence',
      desc: 'Ordis identifies bottlenecks and optimizes workflows before you ask.',
    },
    {
      icon: Users,
      title: 'Real collaboration',
      desc: 'Teams, projects, tasks, and docs in one unified workspace.',
    },
    {
      icon: CheckCircle,
      title: 'Autonomous actions',
      desc: 'Not just suggestions—Ordis rebalances workloads and updates status automatically.',
    },
  ];

  return (
    <section ref={sectionRef} className="value-props-condensed">
      <div className="vp-container">
        {props.map((prop, idx) => (
          <div
            key={idx}
            className="vp-card"
            style={{
              opacity: visibleCards.includes(idx) ? 1 : 0,
              transform: visibleCards.includes(idx) ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="vp-icon">
              <prop.icon size={22} />
            </div>
            <h3>{prop.title}</h3>
            <p>{prop.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesGridCondensed() {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            [0, 1, 2, 3, 4, 5].forEach((i) => {
              setTimeout(() => {
                setVisibleFeatures((prev) => [...prev, i]);
              }, i * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: MessageSquare, name: 'Ordis AI Chat', desc: 'Natural language workspace commands' },
    { icon: FolderKanban, name: 'Projects & Tasks', desc: 'Kanban, Gantt, workload views' },
    { icon: Users, name: 'Team Management', desc: 'Roles, permissions, departments' },
    { icon: BarChart3, name: 'Analytics', desc: 'Velocity, burndown, capacity insights' },
    { icon: Sparkles, name: 'Autonomous Actions', desc: 'Auto-rebalance, smart delegation' },
    { icon: CheckCircle, name: 'Enterprise Ready', desc: 'SSO, audit logs, compliance' },
  ];

  return (
    <section ref={sectionRef} id="features" className="features-grid-condensed">
      <div className="fg-container">
        <h2 style={{ opacity: visibleFeatures.length > 0 ? 1 : 0, transform: visibleFeatures.length > 0 ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          Everything you need to run your team
        </h2>
        <div className="fg-grid">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="fg-item"
              style={{
                opacity: visibleFeatures.includes(idx) ? 1 : 0,
                transform: visibleFeatures.includes(idx) ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="fg-icon">
                <feat.icon size={20} />
              </div>
              <h4>{feat.name}</h4>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofCondensed() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="social-proof-condensed">
      <div className="sp-container" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <blockquote>
          "Cursis transformed how we work. Ordis catches bottlenecks before they become fires, and our team velocity increased 40% in the first quarter."
        </blockquote>
        <cite>
          <strong>Sarah Chen</strong>
          <span>VP Engineering, TechFlow</span>
        </cite>
      </div>
    </section>
  );
}

function CtaSectionCondensed() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="cta-condensed">
      <div className="cta-container" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.97)', transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <h2>Ready to work smarter?</h2>
        <p>Join 1,250+ teams using Cursis to build better, faster.</p>
        <a href="/signup" className="cta-btn">
          Start free trial
          <ArrowRight size={18} />
        </a>
        <p className="cta-note">No credit card required · 14-day free trial</p>
      </div>
    </section>
  );
}
