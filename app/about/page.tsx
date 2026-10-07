'use client';

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

const teamMembers = [
  {
    name: 'Saransh Vashistha',
    role: 'CEO',
    badge: 'CHIEF EXECUTIVE',
    initial: 'SV',
    color: '#FF5500',
    description:
      'Visionary leader driving Cursis strategic direction and growth. Saransh brings deep expertise in enterprise software and AI innovation, steering the company toward building the future of autonomous workplaces.',
    focus: ['Strategic Vision', 'Enterprise Growth', 'AI Innovation'],
  },
  {
    name: 'Mukul Kumar',
    role: 'CTO',
    badge: 'CHIEF TECHNOLOGY',
    initial: 'MK',
    color: '#1A1612',
    description:
      'Technical architect behind Cursis cutting-edge AI infrastructure. Mukul leads the engineering team in developing Ordis AI and the sophisticated systems that power autonomous workplace operations.',
    focus: ['AI Infrastructure', 'Distributed Systems', 'Engineering Leadership'],
  },
  {
    name: 'Lakhan',
    role: 'CGO',
    badge: 'CHIEF GROWTH',
    initial: 'LK',
    color: '#2965ff',
    description:
      'Growth strategist orchestrating Cursis market expansion and customer success initiatives. Lakhan champions product-market fit through data-driven strategies, building meaningful relationships with enterprise clients.',
    focus: ['Market Expansion', 'Customer Success', 'Data Strategy'],
  },
];

const stats = [
  { label: 'Team Members', value: '12+', desc: 'Distributed globally' },
  { label: 'Active Users', value: '1,250+', desc: 'Teams worldwide' },
  { label: 'Uptime SLA', value: '99.99%', desc: 'Enterprise-grade' },
  { label: 'Founded', value: '2024', desc: 'Bengaluru, India' },
];

export default function AboutPage() {
  return (
    <div className="lp-body">
      <style>{`
        .about-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: #FFFFFF;
          border: 3px solid #0A0A0A;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #0A0A0A;
          margin-bottom: 32px;
          box-shadow: 4px 4px 0 #0A0A0A;
        }

        .about-hero-marker {
          background: linear-gradient(180deg, transparent 50%, #FFE5D9 50%);
          padding: 0 4px;
        }

        .about-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin: 80px 0;
        }

        .about-stat-card {
          padding: 32px;
          background: #FFFFFF;
          border: 3px solid #0A0A0A;
          border-radius: 12px;
          box-shadow: 6px 6px 0 #0A0A0A;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .about-stat-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0 #0A0A0A;
        }

        .about-stat-value {
          display: block;
          font-size: 3rem;
          font-weight: 900;
          line-height: 1;
          color: #FF5500;
          margin-bottom: 8px;
        }

        .about-stat-label {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 4px;
        }

        .about-stat-desc {
          font-size: 0.875rem;
          color: #666;
        }

        .about-team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 32px;
          margin-top: 60px;
        }

        .about-team-card {
          position: relative;
          padding: 40px;
          background: #FFFFFF;
          border: 3px solid #0A0A0A;
          border-radius: 16px;
          box-shadow: 8px 8px 0 #0A0A0A;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .about-team-card:hover {
          transform: translate(-3px, -3px);
          box-shadow: 11px 11px 0 #0A0A0A;
        }

        .about-team-card::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 24px;
          width: 80px;
          height: 24px;
          background: repeating-linear-gradient(
            45deg,
            #FFE5D9,
            #FFE5D9 10px,
            #FFD1BD 10px,
            #FFD1BD 20px
          );
          border: 2px solid #0A0A0A;
          border-radius: 4px;
          transform: rotate(-2deg);
          z-index: 1;
        }

        .about-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 4px solid #0A0A0A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.25rem;
          font-weight: 900;
          color: #FFFFFF;
          margin-bottom: 24px;
          box-shadow: 4px 4px 0 #0A0A0A;
        }

        .about-member-badge {
          display: inline-block;
          padding: 6px 14px;
          background: #0A0A0A;
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .about-member-name {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0A0A0A;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .about-member-role {
          font-size: 1rem;
          font-weight: 600;
          color: #FF5500;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .about-member-desc {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #444;
          margin-bottom: 24px;
        }

        .about-focus-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .about-focus-tag {
          padding: 6px 12px;
          background: #FAF6EE;
          border: 2px solid #0A0A0A;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0A0A0A;
        }

        .about-mission-box {
          position: relative;
          padding: 60px 50px;
          background: #FFFFFF;
          border: 4px solid #0A0A0A;
          border-radius: 20px;
          box-shadow: 12px 12px 0 #0A0A0A;
          max-width: 900px;
          margin: 100px auto 0;
        }

        .about-mission-icon {
          position: absolute;
          top: -32px;
          left: 50%;
          transform: translateX(-50%);
          width: 64px;
          height: 64px;
          background: #FF5500;
          border: 4px solid #0A0A0A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 6px 6px 0 #0A0A0A;
        }

        .about-mission-label {
          display: inline-block;
          padding: 8px 18px;
          background: #0A0A0A;
          color: #FFFFFF;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .about-mission-title {
          font-size: 2.5rem;
          font-weight: 900;
          color: #0A0A0A;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .about-mission-text {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #333;
        }

        .about-values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin: 80px 0;
        }

        .about-value-card {
          padding: 32px;
          background: #FFFFFF;
          border: 3px solid #0A0A0A;
          border-radius: 12px;
          box-shadow: 6px 6px 0 #0A0A0A;
        }

        .about-value-icon {
          width: 48px;
          height: 48px;
          background: #FFE5D9;
          border: 3px solid #0A0A0A;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 20px;
        }

        .about-value-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0A0A0A;
          margin-bottom: 12px;
        }

        .about-value-desc {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #555;
        }

        @media (max-width: 768px) {
          .about-stat-value {
            font-size: 2.5rem;
          }
          .about-team-grid {
            grid-template-columns: 1fr;
          }
          .about-mission-box {
            padding: 50px 30px;
          }
          .about-mission-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <LandingNav />

      <main id="main-content">
        <section className="lp-section" style={{ paddingTop: '60px' }}>
          <div className="lp-container">
            {/* Hero Header */}
            <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
              <div className="about-hero-badge">
                <span>ABOUT CURSIS</span>
              </div>

              <h1 className="lp-hero-title" style={{ marginBottom: '32px' }}>
                Building the future of <br />
                <span className="about-hero-marker">autonomous work.</span>
              </h1>

              <p className="lp-hero-text" style={{ fontSize: '1.25rem', maxWidth: '750px', margin: '0 auto' }}>
                We're creating an AI workplace where intelligent systems don't just assist—they take action, optimize workflows, and empower teams to achieve more.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="about-stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="about-stat-card">
                  <span className="about-stat-value">{stat.value}</span>
                  <span className="about-stat-label">{stat.label}</span>
                  <span className="about-stat-desc">{stat.desc}</span>
                </div>
              ))}
            </div>

            {/* Core Values */}
            <div style={{ marginTop: '120px' }}>
              <div className="lp-section-header" style={{ textAlign: 'center' }}>
                <div className="lp-section-label">Our Values</div>
                <h2 className="lp-section-title">What drives us forward.</h2>
              </div>

              <div className="about-values-grid">
                <div className="about-value-card">
                  <div className="about-value-icon">A</div>
                  <h3 className="about-value-title">Autonomous by Design</h3>
                  <p className="about-value-desc">
                    We build systems that take intelligent action, not just wait for commands. Real autonomy means real impact.
                  </p>
                </div>

                <div className="about-value-card">
                  <div className="about-value-icon">C</div>
                  <h3 className="about-value-title">Clarity Over Complexity</h3>
                  <p className="about-value-desc">
                    Simple interfaces, powerful results. We eliminate noise so teams can focus on what matters.
                  </p>
                </div>

                <div className="about-value-card">
                  <div className="about-value-icon">S</div>
                  <h3 className="about-value-title">Built for Scale</h3>
                  <p className="about-value-desc">
                    From startups to enterprises, our infrastructure is designed to grow with your team's ambitions.
                  </p>
                </div>
              </div>
            </div>

            {/* Leadership Team */}
            <div style={{ marginTop: '120px' }}>
              <div className="lp-section-header" style={{ textAlign: 'center' }}>
                <div className="lp-section-label">Leadership</div>
                <h2 className="lp-section-title">Meet the team behind Cursis.</h2>
              </div>

              <div className="about-team-grid">
                {teamMembers.map((member) => (
                  <div key={member.name} className="about-team-card">
                    <div className="about-avatar" style={{ background: member.color }}>
                      {member.initial}
                    </div>
                    <div className="about-member-badge">{member.badge}</div>
                    <h3 className="about-member-name">{member.name}</h3>
                    <div className="about-member-role">{member.role}</div>
                    <p className="about-member-desc">{member.description}</p>
                    <div className="about-focus-tags">
                      {member.focus.map((f) => (
                        <span key={f} className="about-focus-tag">{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mission Statement */}
            <div className="about-mission-box">
              <div className="about-mission-icon">M</div>
              <div style={{ textAlign: 'center' }}>
                <div className="about-mission-label">OUR MISSION</div>
                <h2 className="about-mission-title">Intelligent work, not just digital work.</h2>
                <p className="about-mission-text">
                  At Cursis, we believe the future of work isn't about more tools—it's about smarter systems. Ordis AI proactively identifies bottlenecks, rebalances workloads, and takes meaningful actions so teams can focus on innovation and impact instead of operational overhead.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
